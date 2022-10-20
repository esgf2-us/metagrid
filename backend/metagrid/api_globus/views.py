import json

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from metagrid.api_proxy.views import do_request

mock_endpoint = {
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


@require_http_methods(["POST"])
@csrf_exempt
def get_endpoint_list(request):

    resp = json.dumps(
        {
            "DATA_TYPE": "endpoint_list",
            "offset": 0,
            "limit": 100,
            "has_next_page": False,
            "DATA": [mock_endpoint],
        }
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
