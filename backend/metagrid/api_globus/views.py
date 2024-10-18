import json
import os
import re
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timedelta

from django.conf import settings
from django.http import (
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseServerError,
)
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from globus_sdk import AccessTokenAuthorizer, TransferClient, TransferData

from metagrid.api_proxy.views import do_request

ENDPOINT_MAP = {
    "415a6320-e49c-11e5-9798-22000b9da45e": "1889ea03-25ad-4f9f-8110-1ce8833a9d7e"
}

DATANODE_MAP = {"esgf-node.ornl.gov": "dea29ae8-bb92-4c63-bdbc-260522c92fe8"}

TEST_SHARDS_MAP = {"esgf-fedtest.llnl.gov": "esgf-node.llnl.gov"}


# reserved query keywords
OFFSET = "offset"
LIMIT = "limit"
QUERY = "query"
DISTRIB = "distrib"
SHARDS = "shards"
FROM = "from"
TO = "to"
SORT = "sort"
SIMPLE = "simple"
A_TOKEN = "access_token"
R_TOKEN = "refresh_token"

FIELD_DATASET_ID = "dataset_id"

KEYWORDS = [
    OFFSET,
    LIMIT,
    QUERY,
    DISTRIB,
    SHARDS,
    FROM,
    TO,
    SORT,
    SIMPLE,
    A_TOKEN,
    R_TOKEN,
]


def truncate_urls(lst):
    for x in lst:
        z = x["data_node"]
        for y in x["url"]:
            parts = y.split("|")
            if parts[1] == "Globus":
                yield (parts[0].split(":")[1], z)


def split_value(value):
    """
    Utility method to split an HTTP parameter value into comma-separated
    values but keep intact patterns such as "CESM1(CAM5.1,FV2)
    """

    if type(value) == int or type(value) == float:
        return value

    # first split by comma
    values = [v.strip() for v in value.split(",")]
    values_length = len(values)

    if len(values) == 1:  # no splitting occurred
        return values
    else:  # possibly re-assemble broken pieces
        _values = []
        i = 0
        while i < values_length:
            if i < values_length - 1:
                if (
                    values[i].find("(") >= 0
                    and values[i].find(")") < 0
                    and values[i + 1].find(")") >= 0
                    and values[i + 1].find("(") < 0
                ):
                    _values.append(
                        values[i] + "," + values[i + 1]
                    )  # re-assemble
                    i += 1  # skip next value
                elif (
                    values[i].find("[") >= 0
                    and values[i].find("]") < 0
                    and values[i + 1].find("]") >= 0
                    and values[i + 1].find("[") < 0
                ):
                    _values.append(
                        values[i] + "," + values[i + 1]
                    )  # re-assemble
                    i += 1  # skip next value
                elif (
                    values[i].find("{") >= 0
                    and values[i].find("}") < 0
                    and values[i + 1].find("}") >= 0
                    and values[i + 1].find("{") < 0
                ):
                    _values.append(
                        values[i] + "," + values[i + 1]
                    )  # re-assemble
                    i += 1  # skip next value
                else:
                    _values.append(values[i])
            else:
                _values.append(values[i])
            i += 1

        # convert listo into array
        return _values


# flake8: noqa
def get_files(url_params):  # pragma: no cover
    solr_url = getattr(
        settings,
        "SOLR_URL",
        "",
    )
    query_url = solr_url + "/files/select"
    file_limit = 10000
    file_offset = 0
    use_distrib = True

    port = "80"

    try:
        res = urllib.parse.urlparse(query_url)
        hostname = (
            res.hostname
        )  # TODO need to populate the shards based on the Solr URL
        if res.port:
            port = res.port
    except RuntimeError as e:
        return HttpResponseServerError(f"Malformed URL in search results {e}")
    if hostname in TEST_SHARDS_MAP:
        hostname = TEST_SHARDS_MAP[hostname]
    xml_shards = [f"{hostname}:{port}/solr"]
    querys = []
    file_query = ["type:File"]

    # If no parameters were passed to the API,
    # then default to limit=1 and distrib=false
    if len(url_params.keys()) == 0:
        url_params.update(dict(limit=1, distrib="false"))

    # Catch invalid parameters
    for param in url_params.keys():
        if param[-1] == "!":
            param = param[:-1]

    # Set a Solr query string
    if url_params.get(QUERY):
        _query = url_params.pop(QUERY)[0]
        querys.append(_query)

    if len(querys) == 0:
        querys.append("*:*")
    query_string = " AND ".join(querys)

    # Enable distributed search
    use_distrib = True
    # Use Solr shards requested from GET/POST

    # Set boolean constraints

    # Get directory structure for downloaded files

    # Collect remaining constraints

    for param in url_params:
        value_list = url_params[param]
        # Split values separated by commas
        # but don't split at commas inside parentheses
        # (i.e. cases such as "CESM1(CAM5.1,FV2)")

        split_value_list = []

        for v in value_list:
            for sv in split_value(v):
                split_value_list.append(sv)

        # If dataset_id values were passed
        # then check if they follow the expected pattern
        # (i.e. <facet1>.<facet2>...<facetn>.v<version>|<data_node>)
        if param == FIELD_DATASET_ID:
            id_pat = r"^[-\w]+(\.[-\w]+)*\.v\d{8}\|[-\w]+(\.[-\w]+)*$"
            id_regex = re.compile(id_pat)
            msg = (
                "The dataset_id, {id}, does not follow the format of "
                "<facet1>.<facet2>...<facetn>.v<version>|<data_node>"
            )
            for v in split_value_list:
                if not id_regex.match(v):
                    return HttpResponseBadRequest(msg.format(id=v))

        # If the list of allowed projects is not empty,
        # then check if the query is accessing projects not in the list

        if len(split_value_list) == 1:
            fq = "{}:{}".format(param, split_value_list[0])
        else:
            fq = "{}:({})".format(param, " || ".join(split_value_list))
        file_query.append(fq)

    # If the projects were not passed and the allowed projects list exists,
    # then use the allowed projects as the project query

    # Get facets for the file name, URL, checksum
    file_attributes = ["url", "data_node"]

    # Solr query parameters
    query_params = dict(
        q=query_string,
        wt="json",
        facet="true",
        fl=file_attributes,
        fq=file_query,
        start=file_offset,
        limit=file_limit,
        rows=file_limit,
    )

    # Sort by timestamp descending if enabled, otherwise sort by id ascending
    # Use shards for distributed search if 'distrib' is true,
    # otherwise use only local search
    if use_distrib:
        if len(xml_shards) > 0:
            shards = ",".join([s + "/files" for s in xml_shards])
            query_params.update(dict(shards=shards))

    # Fetch files for the query
    query_encoded = urllib.parse.urlencode(query_params, doseq=True).encode()
    req = urllib.request.Request(query_url, query_encoded)
    print(f"QUERY_URL: {query_url}  QUERY: {query_encoded}")
    with urllib.request.urlopen(req) as response:
        results = json.loads(response.read().decode())

    # Warning message about the number of files retrieved
    # being smaller than the total number found for the query
    #    values = {"files": results["response"]["docs"], "wget_info": [wget_empty_path, url_params_list],            "file_info": [num_files_found, file_limit]}

    return truncate_urls(results["response"]["docs"])


def submit_transfer(
    transfer_client,
    source_endpoint,
    source_files,
    target_endpoint,
    target_directory,
):  # pragma: no cover
    """
    Method to submit a data transfer request to Globus.
    """

    # maximum time for completing the transfer
    deadline = datetime.utcnow() + timedelta(days=10)

    # create a transfer request
    if "%23" in target_endpoint:
        target_endpoint = target_endpoint.replace("%23", "#")

    transfer_task = TransferData(
        transfer_client, source_endpoint, target_endpoint, deadline=deadline
    )
    print(
        "Obtained transfer submission id: %s" % transfer_task["submission_id"]
    )

    for source_file in source_files:
        filename = os.path.basename(source_file)
        target_file = os.path.join(target_directory, filename)
        transfer_task.add_item(source_file, target_file)

    # submit the transfer request
    response = {}
    try:
        data = transfer_client.submit_transfer(transfer_task)
        response["success"] = True
        response["task_id"] = data["task_id"]
        print("Submitted transfer task with id: %s" % response["task_id"])
    except Exception as e:
        response["success"] = False
        error_uuid = uuid.uuid4()
        print(f"Could not submit the transfer. Error: {e} - ID {error_uuid}")
        response["error_uuid"] = error_uuid
    return response


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_globus_transfer(request):  # pragma: no cover
    print(request.body)

    if request.method == "POST":
        url_params = json.loads(request.body)
    elif request.method == "GET":
        url_params = request.GET.copy()
    else:  # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST or GET.")

    print(url_params)

    # check for bearer token and set if present
    access_token = None
    refresh_token = None
    target_endpoint = None
    target_folder = None
    if A_TOKEN in url_params:
        access_token = url_params.pop(A_TOKEN)
    if R_TOKEN in url_params:
        refresh_token = url_params.pop(R_TOKEN)
    if "endpointId" in url_params:
        target_endpoint = url_params.pop("endpointId")
    if "path" in url_params:
        target_folder = url_params.pop("path")

    if (
        (not target_endpoint)
        or (not access_token)
        or (not refresh_token)
        or (not target_folder)
    ):
        return HttpResponseBadRequest("missing required params")

    resp = get_files(url_params)
    files_list = resp

    task_ids = []  # list of submitted task ids

    endpoint_id = ""
    download_map = {}
    for file, data_node in files_list:
        parts = file.split("/")
        if data_node in DATANODE_MAP:
            endpoint_id = DATANODE_MAP[data_node]
            print("Data node mapping.....")
        else:
            endpoint_id = parts[0]
            if endpoint_id in ENDPOINT_MAP:
                endpoint_id = ENDPOINT_MAP[endpoint_id]
        if endpoint_id not in download_map:
            download_map[endpoint_id] = []

        download_map[endpoint_id].append("/" + "/".join(parts[1:]))

    token_authorizer = AccessTokenAuthorizer(access_token)
    transfer_client = TransferClient(authorizer=token_authorizer)
    print()
    print("   ---  DEBUG  ---")
    print(download_map)
    print()

    for source_endpoint, source_files in list(download_map.items()):
        # submit transfer request
        task_response = submit_transfer(
            transfer_client,
            source_endpoint,
            source_files,
            target_endpoint,
            target_folder,
        )
        if not task_response["success"]:
            return HttpResponseBadRequest(task_response["error_uuid"])

        task_ids.append(task_response["task_id"])

    return HttpResponse(json.dumps({"status": "OK", "taskid": task_ids}))


@require_http_methods(["POST"])
@csrf_exempt
def get_access_token(request):
    url = "https://auth.globus.org/v2/oauth2/token"

    return do_request(request, url)
