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

from esgcet.globus_query import ESGGlobusQuery
UUID = "5cc79324-1b74-4a77-abc3-838aba2fc734"
GLOBUS = "Globus"
HTTP = "HTTPServer"

ENDPOINT_MAP = {
    "415a6320-e49c-11e5-9798-22000b9da45e": "1889ea03-25ad-4f9f-8110-1ce8833a9d7e"
}

DATANODE_MAP = {"esgf-node.ornl.gov": "dea29ae8-bb92-4c63-bdbc-260522c92fe8"}

TEST_SHARDS_MAP = {"esgf-fedtest.llnl.gov": "esgf-node.llnl.gov"}

def truncate_urls(lst, match):
    for x in lst:
        for y in x["url"]:
            parts = y.split("|")
            if parts[2] == match:
                if match == "Globus":
                    yield (parts[0].split(":")[1])
                elif match == "HTTPServer":
                    yield (parts[0])
                    
def check_dataset_id(dsid):
    
    id_pat = r"^[-\w]+(\.[-\w]+)*\.v\d{8}\|[-\w]+(\.[-\w]+)*$"
    id_regex = re.compile(id_pat)
    msg = (
        "The dataset_id, {id}, does not follow the format of "
        "<facet1>.<facet2>...<facetn>.v<version>|<data_node>"
    )
    for v in split_value_list:
        if not id_regex.match(v):
            return msg.format(v) 
    return ""
            
def get_files(url_params):
    dsid = None
    if "id" in url_params:
        # TODO check dataset_id
        
        #if type(url_params["id"]) is list:
        dsid = url_params["id"]
        # else:
        #     dsid = [url_params["id"]]
    
    qo = ESGGlobusQuery(UUID, "" )
    res = qo.query_file_records(dsid, crit=url_params)
    return list([x for x in truncate_urls(res, HTTP)])


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
    deadline = datetime.now(datetime.timezone.utc) + timedelta(days=10)

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
