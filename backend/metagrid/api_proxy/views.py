from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings

import requests


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def do_search(request):

    return do_request(request, "https://esgf-node.llnl.gov/esg-search/search")

@require_http_methods(['GET', 'POST'])
@csrf_exempt
def do_citation(request):
    return do_request(request, "")

@require_http_methods(['GET', 'POST'])
@csrf_exempt
def do_status(request):
    return do_request(request, "")

@require_http_methods(['GET', 'POST'])
@csrf_exempt
def do_wget(request):
    return do_request(request, "")



def do_request(request, urlbase):
    if request.method == 'POST':
        url_params = request.POST.copy()
    elif request.method == 'GET':
        url_params = request.GET.copy()
    else:
        return HttpResponseBadRequest('Request method must be POST or GET.')

    resp = requests.get(urlbase, params=url_params)
    if resp.status_code == 200:
        return HttpResponse(resp.text)
    else:
        return HttpResponseBadRequest(resp.text)


