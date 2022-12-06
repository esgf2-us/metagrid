import json

import requests
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

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


@require_http_methods(["GET", "POST"])
@csrf_exempt
def do_globus_transfer(request):

    resp = json.dumps({"request_received": request.GET})

    httpresp = HttpResponse(resp)
    httpresp.status_code = 200

    return httpresp
