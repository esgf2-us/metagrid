import requests
from django.conf import settings
from django.http import (
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseServerError,
)

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

MAPPING = {
  "CMIP6" : "https://raw.githubusercontent.com/PCMDI/cmip6-cmor-tables/main/Tables/CMIP6_CV.json"

}



URL_TEMPLATE = "https://raw.githubusercontent.com/WCRP-CMIP/{}_CVs/main/CVs/{}"
FN_TEMPLATE = "{}_CV.json"

@require_http_methods(["GET"])
@csrf_exempt
def do_cv_req(request):
    qd = dict(request.GET).copy()
    proj = qd.get("project", ["CMIP6"])[0]
    if proj in MAPPING:
        url_in = MAPPING[proj]
    else:
        fn = FN_TEMPLATE.format(proj)
        url_in = URL_TEMPLATE.format(proj,fn)
    print("DEBUG: ", url_in)
    res = requests.get(url_in)
    return HttpResponse(res)