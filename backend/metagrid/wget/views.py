import datetime
import json
import os

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from esgcet.globus_query import ESGGlobusQuery

from .query_utils import (  # get_allowed_projects_from_json,
    CORE_QUERY_FIELDS,
    FIELD_WGET_EMPTYPATH,
    FIELD_WGET_PATH,
    KEYWORDS,
    SIMPLE,
    UNSUPPORTED_FIELDS,
)


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_wget(request):  # noqa: C901

    file_limit = settings.WGET_SCRIPT_FILE_DEFAULT_LIMIT
    wget_path_facets = []
    wget_empty_path = ""
    script_template_file = "wget-template.sh"

    # Gather dataset_ids and other parameters
    if request.method == "POST":
        url_params = json.loads(request.body)
        print("POST url_params:", url_params)
    elif request.method == "GET":
        url_params = request.GET.copy()
        print("GET url_params:", url_params)
    else:
        return HttpResponseBadRequest("Request method must be POST or GET.")

    # If no parameters were passed to the API,
    # then default to limit=1 and distrib=false
    if len(url_params.keys()) == 0:
        url_params.update(dict(limit=1, distrib="false"))

    # Catch invalid parameters
    for param in url_params.keys():
        if param[-1] == "!":
            param = param[:-1]
        if param not in KEYWORDS and param not in CORE_QUERY_FIELDS:
            msg = "Invalid HTTP query parameter=%s" % param
            return HttpResponseBadRequest(msg)

    # Catch unsupported fields
    for uf in UNSUPPORTED_FIELDS:
        if url_params.get(uf):
            msg = "Unsupported parameter: %s" % uf
            return HttpResponseBadRequest(msg)

    # Create a simplified script that only runs wget on a list of files
    if url_params.get(SIMPLE):
        use_simple_param = url_params.pop(SIMPLE)[0].lower()
        if use_simple_param == "false":
            script_template_file = "wget-template.sh"
        elif use_simple_param == "true":
            script_template_file = "wget-simple-template.sh"
        else:
            msg = 'Parameter "%s" must be set to true or false.' % SIMPLE
            return HttpResponseBadRequest(msg)

    # Get directory structure for downloaded files
    if url_params.get(FIELD_WGET_PATH):
        wget_path_facets = url_params.pop(FIELD_WGET_PATH)[0].split(",")

    if url_params.get(FIELD_WGET_EMPTYPATH):
        wget_empty_path = url_params.pop(FIELD_WGET_EMPTYPATH)[0]

    # Fetch files for the query
    file_list = {}
    dsid = url_params.get("dataset_id", "")
    if "," in dsid:
        dsid = dsid.split(",")

    print(f"DEBUG: {dsid} ")
    try:
        qo = ESGGlobusQuery(settings.GLOBUS_PUBLIC_INDEX_ENDPOINT_ID, "")
        res = qo.query_file_records(dsid, wget=True)  # , crit=url_params)
        print("res:", res)
    except PermissionError as e:
        # Configuration or filesystem permission issue (e.g. missing shards/allowed-projects files)
        print("PermissionError while accessing ESGGlobusQuery files:", e)
        return HttpResponseBadRequest(
            "Server configuration error: unable to access required ESGF helper files."
        )
    except Exception as e:
        # Generic fallback to avoid unhandled exceptions bubbling up
        print("Error while querying ESGF metadata via ESGGlobusQuery:", e)
        return HttpResponseBadRequest(f"Error querying ESGF metadata: {e}")
    num_files = len(res)

    print(f"DEBUG: Number of files found: {num_files}")

    for file_info in res:
        filename = file_info["title"]
        checksum_type = file_info["checksum_type"][0]
        checksum = file_info["checksum"][0]
        # Create directory structure from facet values
        # If the facet is not found, then use the empty path value
        dir_struct = []
        for facet in wget_path_facets:
            facet_value = wget_empty_path
            if facet in file_info:
                if isinstance(file_info[facet], list):
                    facet_value = file_info[facet][0]
                else:
                    facet_value = file_info[facet]
            # Prevent strange values while generating names
            facet_value = facet_value.replace("['<>?*\"\n\t\r\0]", "")
            facet_value = facet_value.replace("[ /\\\\|:;]+", "_")
            # Limit length of value to WGET_MAX_DIR_LENGTH
            if len(facet_value) > settings.WGET_MAX_DIR_LENGTH:
                facet_value = facet_value[: settings.WGET_MAX_DIR_LENGTH]
            dir_struct.append(facet_value)
        dir_struct.append(filename)
        file_path = os.path.join(*dir_struct)
        # Only add a file to the list if its file path is not already present
        if file_path not in file_list:
            for url in file_info["url"]:
                url_split = url.split("|")
                if url_split[2] == "HTTPServer":
                    file_entry = dict(
                        url=url_split[0],
                        checksum_type=checksum_type,
                        checksum=checksum,
                    )
                    file_list[file_path] = file_entry
                    break

    # Limit the number of files to the maximum
    warning_message = None
    if num_files == 0:
        return HttpResponse("No files found for datasets.")
    elif num_files > file_limit:
        warning_message = (
            "Warning! The total number of files was {} "
            "but this script will only process {}.".format(
                num_files, file_limit
            )
        )

    # Warning message about files that were skipped
    # to prevent overwriting similarly-named files.
    skip_msg = (
        "There were files with the same name which were requested "
        "to be download to the same directory. To avoid overwriting "
        "the previous downloaded one they were skipped.\n"
        "Please use the parameter 'download_structure' "
        "to set up unique directories for them."
    )
    if min(num_files, file_limit) > len(file_list):
        if warning_message:
            warning_message = "{}\n{}".format(warning_message, skip_msg)
        else:
            warning_message = skip_msg

    # Build wget script
    current_datetime = datetime.datetime.now()
    timestamp = current_datetime.strftime("%Y/%m/%d %H:%M:%S")

    context = dict(
        timestamp=timestamp,
        url_params=[dsid],
        files=file_list,
        warning_message=warning_message,
    )

    wget_script = render(request, script_template_file, context)

    script_filename = current_datetime.strftime("wget-%Y%m%d%H%M%S.sh")
    response_content = "attachment; filename={}".format(script_filename)

    response = HttpResponse(wget_script, content_type="text/x-sh")
    response["Content-Disposition"] = response_content
    return response
