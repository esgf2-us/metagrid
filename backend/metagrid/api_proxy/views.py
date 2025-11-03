import datetime
import json
import os
from urllib.parse import urlparse

import globus_sdk
import requests
from django.conf import settings
from django.contrib.auth import logout
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from esgcet.globus_query import ESGGlobusQuery
from globus_portal_framework.gclients import load_transfer_client
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from config.settings.site_specific import MetagridFrontendSettings

from .wget.query_utils import (  # get_allowed_projects_from_json,
    CORE_QUERY_FIELDS,
    FIELD_WGET_EMPTYPATH,
    FIELD_WGET_PATH,
    KEYWORDS,
    SIMPLE,
    UNSUPPORTED_FIELDS,
)


@api_view()
@permission_classes([])
def do_globus_auth(request):
    additional_info = {}
    if request.user.is_authenticated:
        refresh = RefreshToken.for_user(request.user)
        additional_info["access_token"] = str(refresh.access_token)
        additional_info["email"] = request.user.email
        additional_info["globus_access_token"] = request.user.social_auth.get(
            provider="globus"
        ).extra_data["access_token"]
        additional_info["pk"] = request.user.pk
        additional_info["refresh_token"] = str(refresh)
        additional_info["social_auth_info"] = {
            **request.user.social_auth.get(provider="globus").extra_data
        }
        additional_info["username"] = request.user.username
    return Response(
        {
            "is_authenticated": request.user.is_authenticated,
            **additional_info,
        }
    )


@csrf_exempt
def do_globus_logout(request):
    logout(request)
    return redirect(request.GET.get("next", settings.LOGOUT_REDIRECT_URL))


@api_view()
@permission_classes([])
def do_globus_search_endpoints(request):
    search_text = request.GET.get("search_text", None)

    if (
        request.user.is_authenticated
        and settings.AUTHENTICATION_METHOD == "globus"
    ):
        tc = load_transfer_client(request.user)  # pragma: no cover
    else:
        client = globus_sdk.ConfidentialAppAuthClient(
            settings.SOCIAL_AUTH_GLOBUS_KEY,
            settings.SOCIAL_AUTH_GLOBUS_SECRET,
        )
        token_response = client.oauth2_client_credentials_tokens()
        globus_transfer_data = token_response.by_resource_server[
            "transfer.api.globus.org"
        ]
        globus_transfer_token = globus_transfer_data["access_token"]
        authorizer = globus_sdk.AccessTokenAuthorizer(globus_transfer_token)
        tc = globus_sdk.TransferClient(authorizer=authorizer)
    endpoints = tc.endpoint_search(filter_fulltext=search_text)
    return Response(endpoints["DATA"])


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_search(request):
    return do_request(request, settings.SEARCH_URL)


@require_http_methods(["POST"])
@csrf_exempt
def do_stac_search(request):
    print("STAC Search Request:", request.method, request.body)

    if settings.STAC_URL is None:
        return HttpResponseBadRequest("STAC URL not configured.")

    return do_post(request, settings.STAC_URL + "/search")


@require_http_methods(["POST"])
@csrf_exempt
def fetch_stac_aggregations(request):
    if settings.STAC_URL is None:
        return HttpResponseBadRequest("STAC URL not configured.")

    try:
        summaries = do_post(request, settings.STAC_URL + "/aggregate")
    except Exception as e:  # pragma: no cover
        print("Error fetching STAC aggregations:\n", e)

    print("STAC Aggregations:", summaries)

    return summaries


@require_http_methods(["POST"])
@csrf_exempt
def do_citation(request):
    jo = {}
    try:
        jo = json.loads(request.body)
    except Exception:  # pragma: no cover
        print(f"ERROR could not load request: {request.body}")
        return HttpResponseBadRequest()

    if "citurl" not in jo:  # pragma: no cover
        print(f"ERROR no citurl in jo {jo}")
        return HttpResponseBadRequest()

    url = jo["citurl"]
    parsed_url = urlparse(url)

    if not (
        parsed_url.hostname
        in ["cera-www.dkrz.de", "raw.githubusercontent.com"]
    ):
        print(f"ERROR hostname {parsed_url.hostname} not in whitelist")
        return HttpResponseBadRequest()

    try:
        resp = requests.get(url, verify=False)
    except Exception as e:  # pragma: no cover
        print(f"ERROR cound not fetch {url} {e}")
        return HttpResponseBadRequest()

    httpresp = HttpResponse(resp.text)
    httpresp.status_code = resp.status_code
    return httpresp


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_status(request):
    resp = requests.get(settings.STATUS_URL)  # pragma: no cover
    if resp.status_code == 200:  # pragma: no cover
        return HttpResponse(resp.text)
    else:  # pragma: no cover
        return HttpResponseBadRequest(resp.text)


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_wget(request):  # noqa: C901

    file_limit = settings.WGET_SCRIPT_FILE_DEFAULT_LIMIT
    # file_offset = 0
    # use_sort = False
    # use_distrib = True
    # requested_shards = []
    wget_path_facets = []
    wget_empty_path = ""
    script_template_file = "wget-template.sh"

    # allowed_projects = get_allowed_projects_from_json()

    # querys = []
    # file_query = ["type:File"]

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

    print("PART 1")

    # Catch invalid parameters
    for param in url_params.keys():
        if param[-1] == "!":
            param = param[:-1]
        if param not in KEYWORDS and param not in CORE_QUERY_FIELDS:
            msg = "Invalid HTTP query parameter=%s" % param
            return HttpResponseBadRequest(msg)

    print("PART 2")

    # Catch unsupported fields
    for uf in UNSUPPORTED_FIELDS:
        if url_params.get(uf):
            msg = "Unsupported parameter: %s" % uf
            return HttpResponseBadRequest(msg)

    print("PART 3")

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

    print("PART 4")

    # Get directory structure for downloaded files
    if url_params.get(FIELD_WGET_PATH):
        wget_path_facets = url_params.pop(FIELD_WGET_PATH)[0].split(",")

    if url_params.get(FIELD_WGET_EMPTYPATH):
        wget_empty_path = url_params.pop(FIELD_WGET_EMPTYPATH)[0]

    # Get facets for the file name, URL, checksum
    # file_attribute_set = set(["title", "url", "checksum_type", "checksum"])

    # Get facets for the download directory structure,
    # and remove duplicate facets
    # file_attributes = list(file_attribute_set)

    print("Requested URL params:", url_params)

    # Fetch files for the query
    file_list = {}
    dsid = url_params.get("dataset_id", "")
    if "," in dsid:
        dsid = dsid.split(",")

    print("PART 5")

    print(f"DEBUG: {dsid} ")
    try:
        qo = ESGGlobusQuery(settings.SOCIAL_AUTH_GLOBUS_KEY, "")
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

    print("Part 6")

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

    print("PART 7")

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

    print("PART 8")

    # Build wget script
    current_datetime = datetime.datetime.now()
    timestamp = current_datetime.strftime("%Y/%m/%d %H:%M:%S")

    context = dict(
        timestamp=timestamp,
        url_params=[dsid],
        files=file_list,
        warning_message=warning_message,
    )

    print("PART 9")
    wget_script = render(request, script_template_file, context)

    script_filename = current_datetime.strftime("wget-%Y%m%d%H%M%S.sh")
    response_content = "attachment; filename={}".format(script_filename)

    response = HttpResponse(wget_script, content_type="text/x-sh")
    response["Content-Disposition"] = response_content
    return response


def do_post(request, urlbase):
    """Helper function to handle POST requests."""
    if request.method != "POST":  # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST.")

    try:
        jo = json.loads(request.body)
    except json.JSONDecodeError:  # pragma: no cover
        return HttpResponseBadRequest("Invalid JSON in request body.")

    try:
        resp = requests.post(urlbase, json=jo)
    except Exception as e:  # pragma: no cover
        return HttpResponseBadRequest(f"Error during POST request: {e}")

    if resp.status_code != 200:  # pragma: no cover
        return HttpResponseBadRequest(
            f"Request failed with status {resp.status_code}: {resp.text}"
        )

    httpresp = HttpResponse(resp.text, content_type="text/json")
    httpresp.status_code = resp.status_code

    return httpresp


def do_request(request, urlbase, useBody=False):
    resp = None

    if request.method == "POST":  # pragma: no cover
        if useBody:
            jo = json.loads(request.body)
        else:
            jo = request.POST.dict()

        if "query" in jo:
            query = jo["query"]
            if type(query) is list and len(query) > 0:
                jo["query"] = query[0]
        if "dataset_id" in jo:
            jo["dataset_id"] = ",".join(jo["dataset_id"])
        try:
            resp = requests.post(urlbase, data=jo)
            print("resp", resp)
        except Exception as e:
            print(f"Error during POST request: {e}")
            return HttpResponseBadRequest(f"Error during POST request: {e}")

    elif request.method == "GET":
        url_params = request.GET.copy()
        try:
            resp = requests.get(urlbase, params=url_params)
        except Exception as e:
            print(f"Error during GET request: {e}")
            return HttpResponseBadRequest(f"Error during GET request: {e}")
    else:  # pragma: no cover
        print("Request method must be POST or GET.")
        return HttpResponseBadRequest("Request method must be POST or GET.")

    if resp.status_code != 200:
        print(f"Request failed with status {resp.status_code}: {resp.text}")

    httpresp = HttpResponse(resp.text, content_type="text/json")
    httpresp.status_code = resp.status_code

    return httpresp


@require_http_methods(["POST"])
@csrf_exempt
def get_temp_storage(request):
    if not request.method == "POST":  # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST.")

    request_body = json.loads(request.body)

    if request_body is not None and "dataKey" in request_body:
        data_key = request_body["dataKey"]

        if "temp_storage" not in request.session:
            return HttpResponse(
                json.dumps(
                    {"msg": "Temporary storage empty.", data_key: "None"}
                )
            )

        temp_storage = request.session.get("temp_storage")

        if data_key == "temp_storage":
            return HttpResponse(
                json.dumps(
                    {
                        "msg": "Full temp storage dict returned.",
                        "tempStorage": temp_storage,
                    }
                )
            )

        if data_key in temp_storage:
            response = {
                "msg": "Key found!",
                data_key: temp_storage.get(data_key),
            }
        else:
            response = {
                "msg": "Key not found.",
                data_key: "None",
            }
    else:
        return HttpResponseBadRequest(
            json.dumps(
                {"msg": "Invalid request.", "request body": request_body}
            )
        )

    return HttpResponse(json.dumps(response))


@require_http_methods(["POST"])
@csrf_exempt
def set_temp_storage(request):
    if not request.method == "POST":  # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST.")

    request_body = json.loads(request.body)

    if (
        request_body is not None
        and "dataKey" in request_body
        and "dataValue" in request_body
    ):
        data_key = request_body["dataKey"]
        data_value = request_body["dataValue"]

        if data_value is None:
            data_value = "None"

        # Replace all of temp storage if temp storage key is used
        if data_key == "temp_storage":
            request.session["temp_storage"] = data_value
            response = {
                "msg": "All temp storage was set to incoming value.",
                "temp_storage": request.session["temp_storage"],
            }
        else:
            # Otherwise, just set specific value in temp storage
            if "temp_storage" not in request.session:
                if data_value == "None":
                    response = {
                        "msg": "Data was none, so no change made.",
                        data_key: data_value,
                    }
                else:
                    request.session["temp_storage"] = {data_key: data_value}
                    response = {
                        "msg": "Created temporary storage.",
                        data_key: data_value,
                    }
            else:
                temp_storage = request.session["temp_storage"]

                if data_value == "None":
                    temp_storage.pop(data_key, None)
                    response = {
                        "msg": "Data was none, so removed it from storage.",
                        data_key: data_value,
                    }
                else:
                    temp_storage[data_key] = data_value
                    response = {
                        "msg": "Updated temporary storage.",
                        data_key: data_value,
                    }
    else:
        return HttpResponseBadRequest(
            json.dumps(
                {
                    "msg": "Invalid request.",
                    "request body": request_body,
                }
            )
        )

    return HttpResponse(json.dumps(response))


def get_frontend_config(_) -> JsonResponse:
    return JsonResponse(MetagridFrontendSettings().model_dump())
