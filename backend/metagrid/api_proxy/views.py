import json
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.contrib.auth import logout
from django.http import (
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseServerError,
)
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


INDEX_ID = ""


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

def create_search_response(request):

    res = globus_search(request)

    return   { "response": { "docs" : } }

def globus_search(search):

    if "project" in search:
        project = search.pop("project")
        if project != "CMIP6":
            raise SearchError(f"{self} only contains project=CMIP6 data.")
    search["type"] = "Dataset"
    if "latest" not in search:
        search["latest"] = True

    facets = search.pop("facets")
    limit = 10
    offset = 0
    if "limit" in search:
        limit = search.pop("limit")
    if "offset" in search:
        offset = search.pop("offset")

    if "from" in search:
        from_field = search.pop("from")

    if "to" in search:
        to_field = search.pop("to")

    del search["format"]

    facet_arr = [ {"name" : ff, "field_name" : ff } for ff in facets ]

    # booleans need to be strings in the Globus sdk
    for key, val in search.items():
        if isinstance(val, bool):
            search[key] = str(val)

    # build up the query and search
    query_data = {
        "q": "",
        "filters": [
            {
                "type": "match_any",
                "field_name": key,
                "values": [val] if isinstance(val, str) else val,
            }
            for key, val in search.items()
        ],
        "facets": facet_arr,
        "sort": [],
    }
    sc = SearchClient()

    res = sc.post_search(INDEX_ID, query_data, limit=limit, offset=offset)


    res = []
    for response in paginator:
        if not response["total"]:
            break

        # parse out the CMIP facets from the dataset_id
        for g in response["gmeta"]:
            res.append(g["subject"])


@csrf_exempt
def do_globus_logout(request):
    logout(request)
    homepage_url = getattr(settings, "LOGOUT_REDIRECT_URL", "")
    return redirect(homepage_url)


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_search(request):
    esgf_host = getattr(
        settings,
        "SEARCH_URL",
        "",
    )
    return do_request(request, esgf_host)


@require_http_methods(["POST"])
@csrf_exempt
def do_citation(request):
    jo = {}
    try:
        jo = json.loads(request.body)
    except Exception:  # pragma: no cover
        return HttpResponseBadRequest()

    if "citurl" not in jo:  # pragma: no cover
        return HttpResponseBadRequest()

    url = jo["citurl"]

    parsed_url = urlparse(url)

    if not parsed_url.hostname == "cera-www.dkrz.de":
        return HttpResponseBadRequest()

    try:
        resp = requests.get(url)
    except Exception:  # pragma: no cover
        return HttpResponseBadRequest()

    httpresp = HttpResponse(resp.text)
    httpresp.status_code = resp.status_code
    return httpresp


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_status(request):
    status_url = getattr(
        settings,
        "STATUS_URL",
        "",
    )
    resp = requests.get(status_url)
    if resp.status_code == 200:  # pragma: no cover
        return HttpResponse(resp.text)
    else:  # pragma: no cover
        return HttpResponseBadRequest(resp.text)


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_wget(request):
    return do_request(
        request,
        getattr(
            settings,
            "WGET_URL",
            "",
        ),
    )


def do_request(request, urlbase):
    resp = None

    if len(urlbase) < 1:  # pragma: no cover
        print(
            "ERROR:  urlbase string empty, ensure you have the settings loaded"
        )
        return HttpResponseServerError(
            "ERROR: missing url configuration for request"
        )
    if request:
        if request.method == "POST":  # pragma: no cover
            jo = {}
            try:
                jo = json.loads(request.body)
            except Exception:
                return HttpResponseBadRequest()
            if "query" in jo:
                query = jo["query"]
                #   print(query)
                if type(query) is list and len(query) > 0:
                    jo["query"] = query[0]
            if "dataset_id" in jo:
                jo["dataset_id"] = ",".join(jo["dataset_id"])
            #            print(f"DEBUG: {jo}")
            resp = requests.post(urlbase, data=jo)

        elif request.method == "GET":
            url_params = request.GET.copy()
            resp = requests.get(urlbase, params=url_params)
        else:  # pragma: no cover
            return HttpResponseBadRequest(
                "Request method must be POST or GET."
            )

    else:  # pragma: no cover
        resp = requests.get(urlbase)

    #    print(resp.text)
    httpresp = HttpResponse(resp.text)
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
            print({"msg": "Temporary storage empty.", data_key: "None"})
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
