import json
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from globus_sdk import AccessTokenAuthorizer, TransferClient, TransferData

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
TOKEN = "bearer_token"

FIELD_DATASET_ID = "dataset_id"

KEYWORDS = [OFFSET, LIMIT, QUERY, DISTRIB, SHARDS, FROM, TO, SORT, SIMPLE, TOKEN]

SOLR_URL = 'https://esgf-fedtest.llnl.gov/solr'


def truncate_urls(lst):
    for x in lst:
        for y in x["url"]:
            parts = y.split('|')
            if(parts[1] == "Globus"):
                yield(parts[0].split(':')[1])


def split_value(value):
    """
        Utility method to split an HTTP parameter value into comma-separated
        values but keep intact patterns such as "CESM1(CAM5.1,FV2)
    """

    # first split by comma
    values = [v.strip() for v in value.split(',')]
    values_length = len(values)

    if len(values) == 1:  # no splitting occurred
        return values
    else:  # possibly re-assemble broken pieces
        _values = []
        i = 0
        while i < values_length:
            if i < values_length - 1:
                if values[i].find('(') >= 0 \
                        and values[i].find(')') < 0 \
                        and values[i + 1].find(')') >= 0 \
                        and values[i + 1].find('(') < 0:
                    _values.append(values[i] + ',' + values[i + 1])  # re-assemble
                    i += 1  # skip next value
                elif values[i].find('[') >= 0 \
                        and values[i].find(']') < 0 \
                        and values[i + 1].find(']') >= 0 \
                        and values[i + 1].find('[') < 0:
                    _values.append(values[i] + ',' + values[i + 1])  # re-assemble
                    i += 1  # skip next value
                elif values[i].find('{') >= 0 \
                        and values[i].find('}') < 0 \
                        and values[i + 1].find('}') >= 0 \
                        and values[i + 1].find('{') < 0:
                    _values.append(values[i] + ',' + values[i + 1])  # re-assemble
                    i += 1  # skip next value
                else:
                    _values.append(values[i])
            else:
                _values.append(values[i])
            i += 1

        # convert listo into array
        return _values


def get_files(url_params):
    query_url = SOLR_URL + '/files/select'
    file_limit = 10000
    file_offset = 0
    use_distrib = True

#    xml_shards = get_solr_shards_from_xml()
    xml_shards = ["esgf-node.llnl.gov:80/solr"]
    querys = []
    file_query = ['type:File']

    # If no parameters were passed to the API,
    # then default to limit=1 and distrib=false
    if len(url_params.keys()) == 0:
        url_params.update(dict(limit=1, distrib='false'))

    # Catch invalid parameters
    for param in url_params.keys():
        if param[-1] == '!':
            param = param[:-1]

    # Create list of parameters to be saved in the script
    url_params_list = []
    for param, value_list in url_params.lists():
        for v in value_list:
            url_params_list.append('{}={}'.format(param, v))

    # Set a Solr query string
    if url_params.get(QUERY):
        _query = url_params.pop(QUERY)[0]
        querys.append(_query)

    # Set range for timestamps to query

    # Set datetime start and stop

    if len(querys) == 0:
        querys.append('*:*')
    query_string = ' AND '.join(querys)

    # Enable distributed search
    use_distrib = True
    # Use Solr shards requested from GET/POST

    # Set boolean constraints

    # Get directory structure for downloaded files

    # Collect remaining constraints
    for param, value_list in url_params.lists():
        # Check for negative constraints
        if param[-1] == '!':
            param = '-' + param[:-1]

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
            id_pat = r'^[-\w]+(\.[-\w]+)*\.v\d{8}\|[-\w]+(\.[-\w]+)*$'
            id_regex = re.compile(id_pat)
            msg = 'The dataset_id, {id}, does not follow the format of ' \
                  '<facet1>.<facet2>...<facetn>.v<version>|<data_node>'
            for v in split_value_list:
                if not id_regex.match(v):
                    return HttpResponseBadRequest(msg.format(id=v))

        # If the list of allowed projects is not empty,
        # then check if the query is accessing projects not in the list

        if len(split_value_list) == 1:
            fq = '{}:{}'.format(param, split_value_list[0])
        else:
            fq = '{}:({})'.format(param, ' || '.join(split_value_list))
        file_query.append(fq)

    # If the projects were not passed and the allowed projects list exists,
    # then use the allowed projects as the project query

    # Get facets for the file name, URL, checksum
    file_attributes = ['url']

    # Solr query parameters
    query_params = dict(q=query_string,
                        wt='json',
                        facet='true',
                        fl=file_attributes,
                        fq=file_query,
                        start=file_offset,
                        limit=file_limit,
                        rows=file_limit)

    # Sort by timestamp descending if enabled, otherwise sort by id ascending
    # Use shards for distributed search if 'distrib' is true,
    # otherwise use only local search
    if use_distrib:
        if len(xml_shards) > 0:
            shards = ','.join([s + '/files' for s in xml_shards])
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


def submit_transfer(transfer_client, source_endpoint, source_files, target_endpoint, target_directory):
    '''
    Method to submit a data transfer request to Globus.
    '''

    # maximum time for completing the transfer
    deadline = datetime.utcnow() + timedelta(days=10)

    # create a transfer request
    if "%23" in target_endpoint:
        target_endpoint = target_endpoint.replace("%23", "#")
    transfer_task = TransferData(transfer_client, source_endpoint, target_endpoint, deadline=deadline)
    print("Obtained transfer submission id: %s" % transfer_task["submission_id"])

    for source_file in source_files:
        source_directory, filename = os.path.split(source_file)
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
def do_transfer(request):

    if request.method == 'POST':
        url_params = request.POST.copy()
    elif request.method == 'GET':
        url_params = request.GET.copy()
    else:  # pragma: no cover
        return HttpResponseBadRequest('Request method must be POST or GET.')

    # check for bearer token and set if present
    bearer_token = None
    target_endpoint = None
    target_folder = None
    if TOKEN in url_params:
        bearer_token = url_params.pop(TOKEN)[0]
    if "target_endpoint" in url_params:
        target_endpoint = url_params.pop("endpoint")
    if "target_folder" in url_params:
        target_folder = url_params.pop("path")

    if (not target_endpoint) or (not bearer_token) or (not target_folder):
        return HttpResponseBadRequest("missing required params")
    resp = get_files(url_params)
    files_list = resp

    task_ids = []  # list of submitted task ids

    urls = []
    endpoint_id = ""
    download_map = {}
    print(files_list)
    for file in files_list:
        parts = file.split('/')
        if endpoint_id == "":
            endpoint_id = parts[0]
        urls.append('/' + '/'.join(parts[1:]))        
    download_map[endpoint_id] = urls

    token_authorizer = AccessTokenAuthorizer(bearer_token)
    transfer_client = TransferClient(authorizer=token_authorizer)

    for source_endpoint, source_files in list(download_map.items()):
        # submit transfer request
        task_id = submit_transfer(
            transfer_client, source_endpoint, source_files,
            target_endpoint, target_folder)
        task_ids.append(task_id)

    return HttpResponse("{'status' : 'OK'}")
