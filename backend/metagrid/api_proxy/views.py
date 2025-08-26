import json
from urllib.parse import urlparse

import globus_sdk
import requests
from django.conf import settings
from django.contrib.auth import logout
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from globus_portal_framework.gclients import load_transfer_client
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from config.settings.site_specific import MetagridFrontendSettings


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

    if request.user.is_authenticated:
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
        resp = requests.get(url, verify=False)
    except Exception:  # pragma: no cover
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
def do_wget(request):
    return do_request(request, settings.WGET_URL, True)


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
        resp = requests.post(urlbase, data=jo)

    elif request.method == "GET":
        url_params = request.GET.copy()
        resp = requests.get(urlbase, params=url_params)
    else:  # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST or GET.")

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
