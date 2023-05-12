import json
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


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


@require_http_methods(["POST"])
@csrf_exempt
def get_temp_storage(request):
    if not request.method == "POST":
        # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST.")

    requestBody = json.loads(request.body)

    if requestBody is not None and "dataKey" in requestBody:

        dataKey = requestBody["dataKey"]

        if "temp_storage" not in request.session:
            print({"msg": "Temporary storage empty.", dataKey: "None"})
            return HttpResponse(
                json.dumps(
                    {"msg": "Temporary storage empty.", dataKey: "None"}
                )
            )

        tempStorage = request.session.get("temp_storage")

        if dataKey == "tempStorage":
            print(
                {
                    "msg": "Full temp storage dict returned.",
                    "tempStorage": tempStorage,
                }
            )
            return HttpResponse(
                json.dumps(
                    {
                        "msg": "Full temp storage dict returned.",
                        "tempStorage": tempStorage,
                    }
                )
            )

        if dataKey in tempStorage:
            response = {
                "msg": "Key found!",
                dataKey: tempStorage.get(dataKey),
            }
        else:
            response = {
                "msg": "Key not found.",
                dataKey: "None",
            }
    else:
        return HttpResponseBadRequest(
            json.dumps(
                {"msg": "Invalid request.", "request body": requestBody}
            )
        )

    print(response)
    return HttpResponse(json.dumps(response))


@require_http_methods(["POST"])
@csrf_exempt
def set_temp_storage(request):
    if not request.method == "POST":
        # pragma: no cover
        return HttpResponseBadRequest("Request method must be POST.")

    requestBody = json.loads(request.body)

    if (
        requestBody is not None
        and "dataKey" in requestBody
        and "dataValue" in requestBody
    ):
        dataKey = requestBody["dataKey"]
        dataValue = requestBody["dataValue"]

        # Replace all of temp storage if temp storage key is used
        if dataKey == "tempStorage":
            request.session["temp_storage"] = dataValue
            response = {
                "msg": "All temp storage was set to incoming value.",
                "temp_storage": request.session["temp_storage"],
            }
        else:
            # Otherwise, just set specific value in temp storage
            if "temp_storage" not in request.session:

                if dataValue == "None":
                    response = {
                        "msg": "Data was none, so no change made.",
                        dataKey: dataValue,
                    }
                else:
                    request.session["temp_storage"] = {dataKey: dataValue}
                    response = {
                        "msg": "Created temporary storage.",
                        dataKey: dataValue,
                    }
            else:
                temp_storage = request.session["temp_storage"]
                if dataValue == "None":
                    temp_storage.pop(dataKey, None)
                    response = {
                        "msg": "Data was none, so removed it from storage.",
                        dataKey: dataValue,
                    }
                else:
                    temp_storage[dataKey] = dataValue
                    response = {
                        "msg": "Updated temporary storage.",
                        dataKey: dataValue,
                    }
    else:
        return HttpResponseBadRequest(
            json.dumps(
                {
                    "msg": "Invalid request.",
                    "request body": requestBody,
                }
            )
        )

    print(response)

    return HttpResponse(json.dumps(response))
