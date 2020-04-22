from .base import *  # noqa
from .base import env

# GENERAL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = True
# https://docs.djangoproject.com/en/dev/ref/settings/#secret-key
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="7LynCTKfcjH6p2Nz77YM9XzSnTSvpPVUNz4bHEScGJ6flWcOslxGNMdAhsDioJFJ",
)

# https://docs.djangoproject.com/en/dev/ref/settings/#allowed-hosts
ALLOWED_HOSTS = ["localhost", "0.0.0.0", "127.0.0.1"]

# EMAIL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
EMAIL_BACKEND = env(
    "DJANGO_EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)

# django-cors-headers
# -------------------------------------------------------------------------------
CORS_ORIGIN_ALLOW_ALL = False
CORS_ORIGIN_WHITELIST = ("http://localhost:8000",)
