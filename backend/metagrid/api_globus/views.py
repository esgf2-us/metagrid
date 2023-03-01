import json
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

import requests
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from globus_sdk import AccessTokenAuthorizer, TransferClient, TransferData

from metagrid.api_proxy.views import do_request

mock_endpoint_full = {
    "DATA_TYPE": "endpoint",
    "id": "096a65b1-3e90-44e6-9cb4-550b2d5401c0",
    "display_name": "myserver",
    "organization": "My Org",
    "username": "auser",
    "description": "Example gridftp endpoint.",
    "public": False,
    "french_english_bilingual": False,
    "is_globus_connect": False,
    "globus_connect_setup_key": None,
    "gcp_connected": None,
    "gcp_paused": None,
    "gcs_manager_url": None,
    "s3_url": None,
    "s3_owner_activated": False,
    "host_endpoint_id": None,
    "host_path": None,
    "disable_verify": False,
    "disable_anonymous_writes": False,
    "force_verify": False,
    "force_encryption": False,
    "mfa_required": False,
    "myproxy_server": None,
    "myproxy_dn": None,
    "non_functional": False,
    "non_functional_endpoint_display_name": None,
    "non_functional_endpoint_id": None,
    "oauth_server": None,
    "default_directory": None,
    "activated": False,
    "expires_in": 0,
    "expire_time": "2000-01-02 03:45:06+00:00",
    "shareable": True,
    "acl_available": False,
    "acl_editable": False,
    "in_use": False,
    "DATA": [
        {
            "DATA_TYPE": "server",
            "hostname": "gridftp.example.org",
            "uri": "gsiftp://gridftp.example.org:2811",
            "port": 2811,
            "scheme": "gsiftp",
            "id": 985,
            "subject": "/O=Grid/OU=Example/CN=host/gridftp.example.org",
        }
    ],
}


mock_endpoint1 = {
    "id": "096a65b1-3e90-44e6-9cb4-550b2d5401c0",
    "display_name": "endpoint_a",
    "organization": "My Org1",
    "username": "auser1",
    "description": "Example gridftp endpoint a.",
}

mock_endpoint2 = {
    "id": "096a65b1-3e90-44e6-9cb4-543252d5401c0",
    "display_name": "endpoint_b",
    "organization": "My Org2",
    "username": "auser2",
    "description": "Example gridftp endpoint b.",
}

mock_endpoint3 = {
    "id": "096a65b1-3e90-44e6-9cb4-45b2d5401c0",
    "display_name": "endpoint_c",
    "organization": "My Org3",
    "username": "auser3",
    "description": "Example gridftp endpoint c.",
}

mock_endpoint4 = {
    "id": "0sdfa65b1-3e90-44e6-9cb4-45b2d5401c0",
    "display_name": "endpoint_d",
    "organization": "My Org 4",
    "username": "auser4",
    "description": "Example gridftp endpoint. d",
}

mock_endpoint_list_full = {
    "DATA_TYPE": "endpoint_list",
    "offset": 0,
    "limit": 100,
    "has_next_page": False,
    "DATA": [mock_endpoint1, mock_endpoint2, mock_endpoint3, mock_endpoint4],
}

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

SOLR_URL = "https://esgf-fedtest.llnl.gov/solr"


def truncate_urls(lst):
    for x in lst:
        for y in x["url"]:
            parts = y.split("|")
            if parts[1] == "Globus":
                yield (parts[0].split(":")[1])


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


def get_files(url_params):

    query_url = SOLR_URL + "/files/select"
    file_limit = 10000
    file_offset = 0
    use_distrib = True

    #    xml_shards = get_solr_shards_from_xml()
    xml_shards = ["esgf-node.llnl.gov:80/solr"]
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

    # Create list of parameters to be saved in the script
    url_params_list = []
    for param, value_list in url_params.lists():
        for v in value_list:
            url_params_list.append("{}={}".format(param, v))

    # Set a Solr query string
    if url_params.get(QUERY):
        _query = url_params.pop(QUERY)[0]
        querys.append(_query)

    # Set range for timestamps to query

    # Set datetime start and stop

    if len(querys) == 0:
        querys.append("*:*")
    query_string = " AND ".join(querys)

    # Enable distributed search
    use_distrib = True
    # Use Solr shards requested from GET/POST

    # Set boolean constraints

    # Get directory structure for downloaded files

    # Collect remaining constraints
    for param, value_list in url_params.lists():
        # Check for negative constraints
        if param[-1] == "!":
            param = "-" + param[:-1]

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
    file_attributes = ["url"]

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
    print(f"{query_url}  {query_encoded}")
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
):
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
    try:
        data = transfer_client.submit_transfer(transfer_task)
        task_id = data["task_id"]
        print("Submitted transfer task with id: %s" % task_id)
    except Exception as e:
        print("Could not submit the transfer. Error: %s" % str(e))
        task_id = "Could not submit the transfer. Please contact the ESGF node admin to investigate the issue."
    return task_id


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_globus_transfer(request):

    if request.method == "POST":
        url_params = request.POST.copy()
    elif request.method == "GET":
        url_params = request.GET.copy()
    else:  # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST or GET.")

    # check for bearer token and set if present
    access_token = None
    refresh_token = None
    target_endpoint = None
    target_folder = None
    if A_TOKEN in url_params:
        access_token = url_params.pop(A_TOKEN)[0]
    if R_TOKEN in url_params:
        refresh_token = url_params.pop(R_TOKEN)[0]
    if "endpointId" in url_params:
        target_endpoint = url_params.pop("endpointId")[0]
    if "path" in url_params:
        target_folder = url_params.pop("path")[0]

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

    urls = []
    endpoint_id = ""
    download_map = {}
    for file in files_list:
        parts = file.split("/")
        if endpoint_id == "":
            endpoint_id = parts[0]
        urls.append("/" + "/".join(parts[1:]))
    download_map[endpoint_id] = urls

    token_authorizer = AccessTokenAuthorizer(access_token)
    transfer_client = TransferClient(authorizer=token_authorizer)

    for source_endpoint, source_files in list(download_map.items()):
        test_endpoint = "1889ea03-25ad-4f9f-8110-1ce8833a9d7e"
        # submit transfer request
        task_id = submit_transfer(
            transfer_client,
            test_endpoint,
            source_files,
            target_endpoint,
            target_folder,
        )
        task_ids.append(task_id)

    return HttpResponse("{'status' : 'OK'}")


@require_http_methods(["GET"])
@csrf_exempt
def get_endpoint_list_test(request):

    resp = json.dumps(
        {
            "offset": 0,
            "limit": 100,
            "has_next_page": False,
            "DATA": [
                mock_endpoint1,
                mock_endpoint2,
                mock_endpoint3,
                mock_endpoint4,
            ],
        }
    )

    httpresp = HttpResponse(resp)
    httpresp.status_code = 200
    #    httpresp.headers = resp.headers
    #    httpresp.encoding = resp.encoding
    return httpresp


@require_http_methods(["GET"])
@csrf_exempt
def get_endpoint_list(request):

    transfer_api_root = "https://transfer.api.globusonline.org/v0.10"
    endpoint_search_url = "/endpoint_search?"
    url = transfer_api_root + endpoint_search_url

    filterText = request.GET.get("filterText")
    refreshToken = request.GET.get("refreshToken")

    params = {
        "filter_scope": "all",
        "filter_fulltext": filterText or "test_backend",
    }
    # req = PreparedRequest()
    # req.prepare_url(url, params)
    resp = requests.get(
        url,
        params=params,
        verify=False,
        headers={"refresh_token": refreshToken or ""},
    )

    httpresp = HttpResponse(resp)
    httpresp.status_code = 200
    #    httpresp.headers = resp.headers
    #    httpresp.encoding = resp.encoding
    return httpresp


@require_http_methods(["POST"])
@csrf_exempt
def get_access_token(request):

    url = "https://auth.globus.org/v2/oauth2/token"

    return do_request(request, url)


@require_http_methods(["POST"])
@csrf_exempt
def get_endpoint(request):

    resp = json.dumps({"value": request.POST})

    httpresp = HttpResponse(resp)
    httpresp.status_code = 200
    #    httpresp.headers = resp.headers
    #    httpresp.encoding = resp.encoding
    return httpresp
