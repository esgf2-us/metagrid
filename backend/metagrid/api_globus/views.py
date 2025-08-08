import json
import os
import re

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Generator, Sequence, TypedDict
from globus_portal_framework import load_transfer_client

import requests
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from globus_sdk import (
    AccessTokenAuthorizer,
    ConfidentialAppAuthClient,
    GlobusHTTPResponse,
    TransferAPIError,
    TransferClient,
    TransferData,
    scopes,
)
from rest_framework import status

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


class GlobusMultiTransfer:
    def __init__(
        self,
        client: TransferClient,
        target_endpoint: str,
        target_directory: Path,
    ):
        self.transfer_map: dict[str, list] = defaultdict(list)
        self.target_endpoint: str = target_endpoint
        self.target_directory: Path = target_directory
        self.client = client

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
                results["successes"].append(submission.data)
            except Exception as e:
                results["failures"].append(repr(e))

        if not results["failures"]:
            # No failures, give it the happy code
            results["status"] = status.HTTP_200_OK
        return results


# class GlobusTransferFlowController:
#     """
#     A controller to manage the Globus transfer flow, including login and transfer client retrieval.
#     """

#     def __init__(
#         self,
#         clientId: str,
#         clientSecret: str,
#     ):
#         self.auth_client: dict[str, list] = ConfidentialAppAuthClient(
#             clientId, clientSecret
#         )
#         self.scopes = scopes.TransferScopes.all
#         self.transfer_client: TransferClient | None = None
#         self.transfer_tokens: dict[str, Any] | None = None
#         self.consent_required_scopes: list[str] = []

#     def update_controller(
#         self,
#         user: Any = None,
#         auth_redirect_url: str = "http://localhost:8080/cart/items",
#     ) -> None:
#         self.user = user
#         self.auth_redirect_url: str = auth_redirect_url

#     @csrf_exempt
#     def login_and_get_transfer_client(
#         self, auth_code
#     ) -> TransferClient | None:

#         print("Auth code: ", auth_code)

#         # If auth code is provided, use it to get a transfer client
#         if auth_code is not None:
#             print("You have already started a login flow. Using auth code.")
#             return self.get_transfer_client_from_auth_code(auth_code)

#         print("Starting a new login flow.")
#         self.auth_client.oauth2_start_flow(
#             requested_scopes=self.scopes,
#             redirect_uri=(self.auth_redirect_url),
#         )
#         self.auth_url = self.auth_client.oauth2_get_authorize_url()
#         print("Go to this URL and login: {0}".format(self.auth_url))

#         return None

#     def get_transfer_client_from_auth_code(
#         self, auth_code: str
#     ) -> TransferClient | None:
#         self.auth_client.oauth2_start_flow(
#             requested_scopes=self.scopes,
#             redirect_uri=(self.auth_redirect_url),
#         )
#         tokens = self.auth_client.oauth2_exchange_code_for_tokens(auth_code)
#         self.transfer_tokens = tokens.by_resource_server[
#             "transfer.api.globus.org"
#         ]

#         print("Setting a new transfer client.")

#         # If successful, return the transfer client
#         return TransferClient(
#             authorizer=AccessTokenAuthorizer(
#                 self.transfer_tokens["access_token"]
#             )
#         )

#     def check_for_consent_required(self, target):
#         # Try to print the contents of the target endpoint
#         try:
#             self.transfer_client.operation_ls(target, path="/")
#         except TransferAPIError as e:
#             if e.info.consent_required:
#                 self.consent_required_scopes.extend(
#                     e.info.consent_required.required_scopes
#                 )
#                 print(
#                     "Updated consents required: ", self.consent_required_scopes
#                 )

#     def create_transfer_client(self, target, scopes, auth_code) -> None:
#         self.scopes = scopes

#         print("Getting transfer client for target: ", target)

#         # If transfer client is not set, try to load it from the user or login
#         if self.transfer_client is None:
#             print("No transfer client set, trying to load or login.")
#             if self.user.is_authenticated:
#                 print("User is authenticated, loading transfer client.")
#                 self.transfer_client = load_transfer_client(self.user)
#             else:

#                 print("User is not authenticated, logging in.")
#                 print("Auth code: ", auth_code)
#                 self.transfer_client = self.login_and_get_transfer_client(
#                     auth_code
#                 )

#         # If transfer client is still not set, we need an auth code, return None
#         print("Transfer client is still not set, returning None.")
#         if self.transfer_client is None:
#             return None

#         # Attempt an ls operation to see if we have access to the target endpoint
#         self.check_for_consent_required(target)

#         # If consents are required, we need to login again to get them
#         if self.consent_required_scopes:
#             print(
#                 "One of your endpoints requires consent in order to be used.\n"
#                 "You must login a second time to grant consents.\n\n"
#             )
#             print("Auth code: ", auth_code)
#             self.transfer_client = self.login_and_get_transfer_client(
#                 auth_code
#             )


# globus_controller = GlobusTransferFlowController(
#     clientId=settings.SOCIAL_AUTH_GLOBUS_KEY,
#     clientSecret=settings.SOCIAL_AUTH_GLOBUS_SECRET,
# )


class GlobusTransferAuthFlow:
    """
    A controller to manage the Globus transfer flow, including login and transfer client retrieval.
    """

    def __init__(
        self,
        clientId: str,
        clientSecret: str,
        auth_redirect_url: str = "http://localhost:8080/cart/items",
        request: Any = None,
        target_endpoint: str = "",
        target_scopes: str = scopes.TransferScopes.all,
    ):
        # Create the confidential app auth client
        self.auth_client: dict[str, list] = ConfidentialAppAuthClient(
            clientId, clientSecret
        )
        self.auth_redirect_url: str = auth_redirect_url
        self.consent_required_scopes: list[str] = []
        self.key_name = "globus_transfer_token"
        self.request = request
        self.target_endpoint = target_endpoint
        self.target_scopes = target_scopes
        self.scopes = target_scopes
        self.auth_url = None

    # Get transfer token from session
    def get_saved_transfer_token(self) -> str | None:
        if (
            self.request is not None
            and self.request.session is not None
            and self.request.session.get(self.key_name) is not None
        ):
            print("Found saved transfer token in session.")
            return self.request.session.get(self.key_name)

        return None

    # Set transfer token to session
    def save_transfer_token(self, transfer_token: str) -> None:
        if self.request is not None and self.request.session is not None:
            self.request.session[self.key_name] = transfer_token

    def get_existing_transfer_client(self) -> TransferClient | None:
        # Based on user, obtain a transfer client
        if self.request is not None and self.request.user.is_authenticated:
            return load_transfer_client(self.request.user)
        else:
            transfer_token = self.get_saved_transfer_token()
            if transfer_token is not None:
                return TransferClient(
                    authorizer=AccessTokenAuthorizer(transfer_token)
                )
            else:
                return None

    # Attempt an ls operation to see if we have access to the target endpoint
    def check_for_consent_required(self, transfer_client):
        try:
            transfer_client.operation_ls(self.target_endpoint, path="/")
        except TransferAPIError as e:
            if e.info.consent_required:
                print(
                    "Updated consents required: ", self.consent_required_scopes
                )
                self.consent_required_scopes.extend(
                    e.info.consent_required.required_scopes
                )

    def start_oauth_flow(self, auth_redirect_url: str) -> None:
        self.auth_redirect_url = auth_redirect_url

        print("Starting a new login flow.")
        self.auth_client.oauth2_start_flow(
            requested_scopes=self.target_scopes,
            redirect_uri=self.auth_redirect_url,
        )
        self.auth_url = self.auth_client.oauth2_get_authorize_url()
        print("The auth URL is: {0}".format(self.auth_url))

    def get_transfer_client_from_auth_code(
        self, auth_code: str
    ) -> TransferClient | None:
        print("Restarting the login flow.")
        self.auth_client.oauth2_start_flow(
            requested_scopes=self.scopes,
            redirect_uri=(self.auth_redirect_url),
        )

        print("Exchanging auth code for transfer token.")
        tokens = self.auth_client.oauth2_exchange_code_for_tokens(auth_code)
        if tokens is not None:
            transfer_tokens = tokens.by_resource_server[
                "transfer.api.globus.org"
            ]
            transfer_token = transfer_tokens["access_token"]

            print("Saving transfer token to session.")
            self.save_transfer_token(transfer_token)

            print("Creating a new transfer client.")
            # If successful, return the transfer client
            return TransferClient(
                authorizer=AccessTokenAuthorizer(transfer_token)
            )

        print("Failed to get tokens from auth code.")
        return None

    def get_transfer_client_first_try(self) -> TransferClient | None:
        # Attempt to get an existing transfer client
        transfer_client = self.get_existing_transfer_client()

        if transfer_client is None:
            print("No existing client found, need to login.")
            return None

        # Existing client found, check if we have access to the target endpoint
        self.check_for_consent_required(transfer_client)

        if self.consent_required_scopes:
            print(
                "Consent required for scopes: ", self.consent_required_scopes
            )
            return None

        return transfer_client

    def get_transfer_client_second_try(
        self, auth_code: str
    ) -> TransferClient | None:
        # If we have an auth code, try to get a new transfer client with it
        if auth_code is not None:
            print("Auth code provided, trying to get new transfer client.")
            print("Auth code: ", auth_code)
            transfer_client = self.get_transfer_client_from_auth_code(
                auth_code
            )

            if transfer_client is None:
                print("Failed to get transfer client from auth code.")
                return None

            # Check if we have access to the target endpoint
            self.check_for_consent_required(transfer_client)

            if self.consent_required_scopes:
                print(
                    "Consent required for scopes: ",
                    self.consent_required_scopes,
                )
                return None

            return transfer_client

        print("No auth code provided, cannot get new transfer client.")
        self.start_oauth_flow(self.auth_redirect_url)
        return None

    def get_transfer_client(
        self, auth_code: str = None
    ) -> TransferClient | None:

        # First try to get an existing transfer client
        transfer_client = self.get_transfer_client_first_try()

        if transfer_client is not None:
            print("Successfully obtained existing transfer client.")
            return transfer_client

        # If that failed, try to get a new transfer client with the auth code
        transfer_client = self.get_transfer_client_second_try(auth_code)

        if transfer_client is not None:
            print("Successfully obtained new transfer client with auth code.")
            return transfer_client

        print("Failed to obtain a transfer client.")
        return None


# @require_http_methods(["POST"])
# @csrf_exempt
# def create_globus_transfer(request) -> HttpResponse:

#     url_params: dict[str, Any] = json.loads(request.body)

#     access_token: str = url_params.pop("access_token", None)
#     refresh_token: str = url_params.pop("refresh_token", None)
#     target_endpoint: str = url_params.pop("endpointId", None)
#     target_folder: Path = url_params.pop("path", None)

#     if not all(
#         (
#             target_endpoint,
#             access_token,
#             refresh_token,
#             target_folder,
#         )
#     ):
#         return HttpResponseBadRequest(
#             "Request is missing one or more of the following: target_endpoint, target_folder, access_token, or refresh_token."
#         )

#     try:
#         authorizer = AccessTokenAuthorizer(access_token)
#         tc = TransferClient(authorizer=authorizer)
#         client = GlobusMultiTransfer(tc, target_endpoint, target_folder)
#         for endpoint, path in search_files(url_params):
#             client.add_transfer(endpoint, path)

#         result = client.submit_transfers()
#         return JsonResponse(result, status=result["status"])
#     except Exception as e:
#         return HttpResponse(repr(e), status=status.HTTP_502_BAD_GATEWAY)


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
    url_params: dict[str, str],
) -> Generator[tuple[str, str], Any, None]:
    """
    This function searches for files in the Earth System Grid Federation (ESGF) repository using the ESGF search API.

    Parameters:
    - url_params (dict[str, str]): A dictionary containing the parameters to be passed to the ESGF search API.

    Returns:
    - Generator[tuple[str, str], Any, None]: A generator that yields tuples containing the Globus endpoint_id and file path extracted from the search results.

    The function first constructs a set of default query parameters for the ESGF search API. If no parameters are provided in `url_params`, it defaults to searching for a single file with a limit of 1 and disabling distribution. It then sends a GET request to the ESGF search API with the combined query parameters and processes the JSON response to extract the necessary information.

    Example:
    >>> url_params = {"type": "File", "format": "application/solr+json", "fields": "url,data_node", "limit": "10000"}
    >>> for endpoint_id, file_path in search_files(url_params):
    ...     print(endpoint_id, file_path)
    """
    query_defaults: dict[str, str] = {
        # https://esgf-node.ornl.gov/esg-search/search?type=File&format=application%2Fsolr%2Bjson&fields=url,data_node&limit=10000
        "type": "File",
        "format": "application/solr+json",
        # "fields": "url,data_node",
        "limit": "10000",
    }

    # If no parameters were passed to the API, then assume they want a single
    # file and default to limit=1 and distrib=false
    if not url_params:
        query_defaults |= {"limit": "1", "distrib": "false"}

    if url_params.get("dataset_id") is not None:
        url_params["dataset_id"] = ",".join(url_params["dataset_id"])

    results = requests.get(
        url=settings.SEARCH_URL,
        params=query_defaults | url_params,
    )
    resultsText = results.text

    try:
        resultsJson = results.json()
    except json.JSONDecodeError:
        print("ESGF search did not return JSON")
        print("Results Text:", resultsText)
        resultsJson = {}

    # Warning message about the number of files retrieved
    # being smaller than the total number found for the query
    #    values = {"files": results["response"]["docs"], "wget_info": [wget_empty_path, url_params_list],            "file_info": [num_files_found, file_limit]}

    if "response" not in resultsJson or "docs" not in resultsJson.get(
        "response", {}
    ):
        print("ESGF search did not return expected values!")
        print("Results Text:", resultsText)
        raise ValueError(f"ESGF search did not return results: {resultsText}")

    for doc in resultsJson["response"]["docs"]:
        yield globus_info_from_doc(doc)


def submit_transfer(
    request_body,
    transfer_client,
    target_endpoint,
    target_folder,
):

    client = GlobusMultiTransfer(
        transfer_client, target_endpoint, target_folder
    )

    try:
        for endpoint, path in search_files(request_body):
            client.add_transfer(endpoint, path)

        result = client.submit_transfers()

        return JsonResponse(result, status=result["status"])
    except Exception as e:
        print("Error occurred: ", e)
        return HttpResponse(repr(e), status=status.HTTP_502_BAD_GATEWAY)


@require_http_methods(["POST"])
@csrf_exempt
def globus_download_request(request):
    if not request.method == "POST":  # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST.")

    request_body = json.loads(request.body)
    target_auth_scope: str = request_body.pop("authScope", None)
    target_endpoint: str = request_body.pop("endpointId", None)
    target_folder: Path = request_body.pop("path", None)
    auth_code: str = request_body.pop("authCode", None)
    auth_redirect_url: str = request_body.pop("authRedirectUrl", None)

    if request_body is None:
        return HttpResponseBadRequest("Request method must be POST.")

    print("Auth Code: ", auth_code)
    print("Auth Redirect URL: ", auth_redirect_url)

    # Create globus auth flow controller
    globus_auth_flow = GlobusTransferAuthFlow(
        auth_redirect_url=auth_redirect_url,
        clientId=settings.SOCIAL_AUTH_GLOBUS_KEY,
        clientSecret=settings.SOCIAL_AUTH_GLOBUS_SECRET,
        request=request,
        target_endpoint=target_endpoint,
        target_scopes=target_auth_scope,
    )

    # Get or create a transfer client
    transfer_client = globus_auth_flow.get_transfer_client(auth_code)

    # If transfer_client is None, we need to redirect the user to login
    if transfer_client is None:
        results = GlobusSubmissionResult(
            status=status.HTTP_207_MULTI_STATUS,  # Multiple status codes in case of failures
            successes=[],
            failures=[],
            auth_url=globus_auth_flow.auth_url,
        )

        return JsonResponse(
            results,
            status=results["status"],
        )

    response = submit_transfer(
        request_body,
        transfer_client,
        target_endpoint,
        target_folder,
    )

    return response
