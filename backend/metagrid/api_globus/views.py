import json
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Generator, Sequence, TypedDict

import requests
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from globus_sdk import (
    AccessTokenAuthorizer,
    GlobusHTTPResponse,
    TransferClient,
    TransferData,
)
from rest_framework import status

from metagrid.api_proxy.views import do_request

ENDPOINT_MAP: dict[str, str] = {
    "415a6320-e49c-11e5-9798-22000b9da45e": "1889ea03-25ad-4f9f-8110-1ce8833a9d7e",
}

DATANODE_MAP: dict[str, str] = {
    "esgf-node.ornl.gov": "dea29ae8-bb92-4c63-bdbc-260522c92fe8",
}


class GlobusSubmissionResult(TypedDict):
    status: int  # HTTP status code
    successes: list[GlobusHTTPResponse]
    failures: list[str]


class SolrResultDoc(TypedDict):
    data_node: str
    url: Sequence[str]
    score: float


class SolrResult(TypedDict):
    numFound: int
    start: int
    maxScore: float
    docs: Sequence[SolrResultDoc]


class ESGSearchResponse(TypedDict):
    responseHeader: dict
    response: SolrResult
    facet_counts: dict


def globus_info_from_doc(doc: SolrResultDoc) -> tuple[str, str]:
    """
    Extract Globus endpoint_id and file path from an ESGSearch result doc.

    Parameters:
    - doc (SolrResultDoc): A dictionary containing the result document from the ESGSearch API.

    Returns:
    - tuple[str, str]: A tuple containing the Globus endpoint_id and file path extracted from the doc's URL.

    Raises:
    - ValueError: If the function is unable to find the Globus info from the doc's URLs.

    The function iterates through the URLs in the doc and uses a regular expression to match the pattern "globus:<endpoint_id>/<file_path>|Globus|Globus". If a match is found, the function extracts the endpoint_id and file_path and applies any necessary overrides using the DATANODE_MAP and ENDPOINT_MAP dictionaries. If no match is found, the function raises a ValueError.

    Example:
    >>> doc = {"url": ["globus:dead-beef-cafe/path/to/file|Globus|Globus"]}
    >>> endpoint_id, file_path = globus_info_from_doc(doc)
    >>> print(endpoint_id, file_path)
    dead-beef-cafe path/to/file
    """

    for entry in doc["url"]:
        # ex: globus:dead-beef-cafe/path/to/file|Globus|Globus
        match = re.match(
            r"globus:([a-f0-9-]+)(\/[^|]+)\|Globus\|Globus", entry
        )
        if match:
            endpoint_id, path = match.groups()

            # Apply overrides
            endpoint_id = DATANODE_MAP.get(doc["data_node"], endpoint_id)
            endpoint_id = ENDPOINT_MAP.get(endpoint_id, endpoint_id)

            return (endpoint_id, path)
    raise ValueError(f"Unable to find Globus info from doc urls: {doc['url']}")


def search_files(
    url_params: dict[str, str]
) -> Generator[tuple[str, str], Any, None]:
    """
    This function searches for files in the Earth System Grid Federation (ESGF) repository using the ESGF search API.

    Parameters:
    - url_params (dict[str, str]): A dictionary containing the parameters to be passed to the ESGF search API.

    Returns:
    - Generator[tuple[str, str], Any, None]: A generator that yields tuples containing the Globus endpoint_id and file path extracted from the search results.

    The function first constructs a set of default query parameters for the ESGF search API. If no parameters are provided in `url_params`, it defaults to searching for a single file with a limit of 1 and disabling distribution. It then sends a GET request to the ESGF search API with the combined query parameters and processes the JSON response to extract the necessary information.

    Example:
    >>> url_params = {"type": "File", "format": "application%2Fsolr%2Bjson", "fields": "url,data_node", "limit": "10000"}
    >>> for endpoint_id, file_path in search_files(url_params):
    ...     print(endpoint_id, file_path)
    """
    query_defaults: dict[str, str] = {
        # https://esgf-node.ornl.gov/esg-search/search?type=File&format=application%2Fsolr%2Bjson&fields=url,data_node&limit=10000
        "type": "File",
        "format": "application/solr+json",  # NB: the %2F can be decoded to / but the %2B must remain as the esg_search api will not tolerate the + character that the underlying Solr expects
        "fields": "url,data_node",
        "limit": "10000",
    }

    # If no parameters were passed to the API, then assume they want a single
    # file and default to limit=1 and distrib=false
    if not url_params:
        query_defaults |= {"limit": "1", "distrib": "false"}

    results: ESGSearchResponse = requests.get(
        url=settings.SEARCH_URL,
        params=query_defaults | url_params,
    ).json()

    # Warning message about the number of files retrieved
    # being smaller than the total number found for the query
    #    values = {"files": results["response"]["docs"], "wget_info": [wget_empty_path, url_params_list],            "file_info": [num_files_found, file_limit]}

    for doc in results["response"]["docs"]:
        yield globus_info_from_doc(doc)


class GlobusMultiTransfer:
    def __init__(
        self, access_token: str, target_endpoint: str, target_directory: Path
    ):
        self.transfer_map: dict[str, list] = defaultdict(list)
        self.target_endpoint: str = target_endpoint
        self.target_directory: Path = target_directory
        self.client = TransferClient(
            authorizer=AccessTokenAuthorizer(access_token)
        )

    def add_transfer(self, endpoint, path):
        """
        Store transfers to be submitted (via submit_transfers()), organized by source endpoint.

        Parameters:
        - endpoint (str): The Globus endpoint_id of the source data.
        - path (str): The path of the file to be transferred within the source data.
        """
        self.transfer_map[endpoint].append(path)

    def submit_transfers(self) -> GlobusSubmissionResult:
        """
        Submits the previously stored transfers, one per source endpoint, to the specified target_endpoint.


        Returns:
        - GlobusSubmissionResult: A dictionary containing the status code, successes, and failures of the transfer submission process.

        The status code is set to HTTP_207_MULTI_STATUS by default, indicating that there may be multiple status codes due to potential failures. The successes list contains the successful transfer submissions, while the failures list contains any exceptions that occurred during the submission process. If there are no failures, the status code is updated to HTTP_200_OK.
        """

        # TODO: Let user specify deadline in their request
        endpoint_tasks = []
        for endpoint, source_files in self.transfer_map.items():
            task = TransferData(
                self.client,
                endpoint,
                self.target_endpoint,
                deadline=datetime.now(timezone.utc) + timedelta(days=10),
            )
            endpoint_tasks.append(task)
            for source_file in source_files:
                task.add_item(
                    source_path=source_file,
                    destination_path=os.path.join(
                        self.target_directory, os.path.basename(source_file)
                    ),
                )

        # Container for the final jsonable response
        results: GlobusSubmissionResult = {
            "status": status.HTTP_207_MULTI_STATUS,  # Multiple status codes in case of failures
            "successes": [],
            "failures": [],
        }

        # Submit the transfers and fill the container with results.
        for task in endpoint_tasks:
            try:
                submission: GlobusHTTPResponse = self.client.submit_transfer(
                    task
                )
                results["successes"].append(submission)
            except Exception as e:
                results["failures"].append(repr(e))

        if not results["failures"]:
            # No failures, give it the happy code
            results["status"] = status.HTTP_200_OK
        return results


@require_http_methods(["POST"])
@csrf_exempt
def create_globus_transfer(request) -> HttpResponse:

    url_params: dict[str, Any] = json.loads(request.body)

    access_token: str = url_params.pop("access_token", None)
    refresh_token: str = url_params.pop("refresh_token", None)
    target_endpoint: str = url_params.pop("endpointId", None)
    target_folder: Path = url_params.pop("path", None)

    if not all(
        (
            target_endpoint,
            access_token,
            refresh_token,
            target_folder,
        )
    ):
        return HttpResponseBadRequest(
            "Request is missing one or more of the following: target_endpoint, target_folder, access_token, or refresh_token."
        )

    try:
        client = GlobusMultiTransfer(
            access_token, target_endpoint, target_folder
        )
        for endpoint, path in search_files(url_params):
            client.add_transfer(endpoint, path)

        result = client.submit_transfers()
        return JsonResponse(result, status=result["status"])
    except Exception as e:
        return HttpResponse(repr(e), status=status.HTTP_502_BAD_GATEWAY)


@require_http_methods(["POST"])
@csrf_exempt
def get_access_token(request) -> HttpResponseBadRequest | HttpResponse:
    url = "https://auth.globus.org/v2/oauth2/token"

    return do_request(request, url)
