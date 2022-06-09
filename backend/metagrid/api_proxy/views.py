from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings

import requests,json


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def do_search(request):

    return do_request(request, "https://esgf-node.llnl.gov/esg-search/search")

@require_http_methods(['POST'])
@csrf_exempt
def do_citation(request):

    jo = {}
    try:
        jo = json.loads(request.body)
    except:
        return HttpResponseBadRequest()

    if not "citurl" in jo: # pragma: no cover
        return HttpResponseBadRequest()

    url = jo["citurl"]    
    try:
        resp = requests.get(url)
    except: # pragma: no cover
        return HttpResponseBadRequest()

    httpresp = HttpResponse(resp.text)
    httpresp.status_code = resp.status_code
    httpresp.headers = resp.headers
    httpresp.encoding = resp.encoding
    return httpresp



@require_http_methods(['GET', 'POST'])
@csrf_exempt
def do_status(request):
    resp = requests.get("https://aims4.llnl.gov/prometheus/api/v1/query?query=probe_success%7Bjob%3D%22http_2xx%22%2C+target%3D~%22.%2Athredds.%2A%22%7D")
    if resp.status_code == 200: # pragma: no cover
        return HttpResponse(resp.text)
    else: # pragma: no cover
        return HttpResponseBadRequest(resp.text)

@require_http_methods(['GET', 'POST'])
@csrf_exempt
def do_wget(request):
    return do_request(request, "https://esgf-node.llnl.gov/esg-search/wget")

def do_request(request, urlbase):
    resp = None

    if (request):
        if request.method == 'POST':
            url_params = request.POST.copy()
        elif request.method == 'GET':
            url_params = request.GET.copy()
        else: # pragma: no cover
            return HttpResponseBadRequest('Request method must be POST or GET.')

         
        resp = requests.get(urlbase, params=url_params)
    else: # pragma: no cover
        resp = requests.get(urlbase)


    httpresp = HttpResponse(resp.text)
    httpresp.status_code = resp.status_code
    httpresp.headers = resp.headers
    httpresp.encoding = resp.encoding
    return httpresp
