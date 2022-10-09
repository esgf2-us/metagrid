import logging

from django.http import HttpResponse, HttpResponseServerError

logger = logging.getLogger("healthz")

def healthz(request):
    """
    Returns that the server is alive.
    """
    return HttpResponse("OK")

def readiness(request):
    # Connect to each database and do a generic standard SQL query
    # that doesn't write any data and doesn't depend on any tables
    # being present.
    try:
        from django.db import connections
        for name in connections:
            cursor = connections[name].cursor()
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
            if row is None:
                return HttpResponseServerError("db: invalid response")
    except Exception as e:
        logger.exception(e)
        return HttpResponseServerError("db: cannot connect to database.")
    return HttpResponse("OK")