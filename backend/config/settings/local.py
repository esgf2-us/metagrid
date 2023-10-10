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
    "DJANGO_EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)

# django-rest-framework - https://www.django-rest-framework.org/api-guide/settings/

# -------------------------------------------------------------------------------
DEFAULT_RENDERER_CLASSES.append(  # noqa F405
    "rest_framework.renderers.BrowsableAPIRenderer",
)
REST_FRAMEWORK[  # noqa F405
    "DEFAULT_RENDERER_CLASSES"
] = DEFAULT_RENDERER_CLASSES  # noqa F405

# WhiteNoise
# ------------------------------------------------------------------------------
# http://whitenoise.evans.io/en/latest/django.html#using-whitenoise-in-development
INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",
    "django_extensions",
] + INSTALLED_APPS  # noqa F405

CORS_ALLOW_CREDENTIALS = True

SOCIAL_AUTH_REDIRECT_IS_HTTPS = False
