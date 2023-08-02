import json
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.contrib.auth import logout
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


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
    homepage_url = getattr(
        settings, "HOMEPAGE_URL", "http://localhost:3000/search/"
    )
    return redirect(homepage_url)


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_search(request):
    esgf_host = getattr(
        settings,
        "REACT_APP_SEARCH_URL",
        "https://esgf-node.llnl.gov/esg-search/search",
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
    #    httpresp.headers = resp.headers
    #    httpresp.encoding = resp.encoding
    return httpresp


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_status(request):
    status_url = getattr(
        settings,
        "REACT_APP_ESGF_NODE_STATUS_URL",
        "https://aims4.llnl.gov/prometheus/api/v1/query?query=probe_success%7Bjob%3D%22http_2xx%22%2C+target%3D~%22.%2Athredds.%2A%22%7D",
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
            "REACT_APP_WGET_API_URL",
            "https://esgf-node.llnl.gov/esg-search/wget",
        ),
    )


def do_request(request, urlbase):
    resp = None

    if request:
        if request.method == "POST":
            url_params = request.POST.copy()
        elif request.method == "GET":
            url_params = request.GET.copy()
        else:  # pragma: no cover
            return HttpResponseBadRequest(
                "Request method must be POST or GET."
            )

        resp = requests.get(urlbase, params=url_params)
    else:  # pragma: no cover
        resp = requests.get(urlbase)

    httpresp = HttpResponse(resp.text)
    httpresp.status_code = resp.status_code

    return httpresp
