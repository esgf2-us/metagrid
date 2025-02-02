from django.db import connection
from django.http import HttpResponse, HttpResponseServerError
from rest_framework.views import csrf_exempt


@csrf_exempt
def liveness(request) -> HttpResponse:
    return HttpResponse()


@csrf_exempt
def readiness(request) -> HttpResponse:
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        row = cursor.fetchone()
        return HttpResponse({"db": row})
    except Exception as e:
        return HttpResponseServerError(e)
