"""
Base settings to build other settings files upon.
"""

from datetime import timedelta
from typing import List  # noqa

import environ

ROOT_DIR = (
    environ.Path(__file__) - 3
)  # (config/settings/base.py - 3 = metagrid/)

env = environ.Env()

READ_DOT_ENV_FILE = env.bool("DJANGO_READ_DOT_ENV_FILE", default=False)
if READ_DOT_ENV_FILE:
    # OS environment variables take precedence over variables from .env
    env.read_env(str(ROOT_DIR.path(".env")))

# GENERAL
# ------------------------------------------------------------------------------
# Set DEBUG to False as a default for safety
# https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = env.bool("DJANGO_DEBUG", default=True)
APPEND_SLASH = False
TIME_ZONE = "UTC"
LANGUAGE_CODE = "en-us"

# Remove default auto field warnings from migration to 3.2
# https://dev.to/weplayinternet/upgrading-to-django-3-2-and-fixing-defaultautofield-warnings-518n
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# If you set USE_I18N to False, Django will make some optimizations so
# as not to load the internationalization machinery.
USE_I18N = False
USE_L10N = True
USE_TZ = True
LOGIN_REDIRECT_URL = "/"

DOMAIN_NAME = env("DOMAIN_NAME", default="example.com")
DOMAIN_SUBDIRECTORY = env("DOMAIN_SUBDIRECTORY", default=None)
SITE_ID = 1

# APPS
# ------------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sites",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "whitenoise.runserver_nostatic",
    "django_extensions",
    # Third party apps
    "rest_framework",  # utilities for rest apis
    "rest_framework.authtoken",
    "django_filters",  # for filtering rest endpoints
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.keycloak",
    "dj_rest_auth",
    "drf_yasg",
    "social_django",
    "gunicorn",
    # Your apps
    "metagrid.api_proxy",
    "metagrid.users",
    "metagrid.projects",
    "metagrid.cart",
    "metagrid.mysites",
]

# https://docs.djangoproject.com/en/2.0/topics/http/middleware/
MIDDLEWARE = (
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "social_django.middleware.SocialAuthExceptionMiddleware",
)

SESSION_SAVE_EVERY_REQUEST = True

# Authentication backends setup OAuth2 handling and where user data should be
# stored
AUTHENTICATION_BACKENDS = [
    "globus_portal_framework.auth.GlobusOpenIdConnect",
    "django.contrib.auth.backends.ModelBackend",
]

# https://docs.djangoproject.com/en/dev/ref/settings/#allowed-hosts
ALLOWED_HOSTS = ["django", "localhost", "0.0.0.0", "127.0.0.1"]
ROOT_URLCONF = "config.urls"

# https://docs.djangoproject.com/en/dev/ref/settings/#secret-key
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="7LynCTKfcjH6p2Nz77YM9XzSnTSvpPVUNz4bHEScGJ6flWcOslxGNMdAhsDioJFJ",
)

WSGI_APPLICATION = "config.wsgi.application"

# EMAIL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
EMAIL_BACKEND = env(
    "DJANGO_EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
# https://docs.djangoproject.com/en/2.2/ref/settings/#email-timeout
EMAIL_TIMEOUT = 5

# ADMIN
# ------------------------------------------------------------------------------
# Django Admin URL.
ADMIN_URL = "admin/"
# https://docs.djangoproject.com/en/dev/ref/settings/#admins
ADMINS = [("Author", "downie4@llnl.gov"), ("Author", "ames4@llnl.gov")]
# https://docs.djangoproject.com/en/dev/ref/settings/#managers
MANAGERS = ADMINS

CORS_ORIGIN_ALLOW_ALL = True

# DATABASES
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#databases
# Default to allowing the standard Postgres variables to configure the default database
# https://www.postgresql.org/docs/current/libpq-envars.html

DATABASES = {
    "default": {
        "ATOMIC_REQUESTS": True,
        **env.db("DATABASE_URL", default="pgsql:///postgres"),
    }
}

# STATIC
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#static-root
STATIC_ROOT = str(ROOT_DIR("staticfiles"))
# https://docs.djangoproject.com/en/dev/ref/settings/#static-url
STATIC_URL = "/static/"
if DOMAIN_SUBDIRECTORY:
    STATIC_URL = f"/{DOMAIN_SUBDIRECTORY}{STATIC_URL}"
# https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#std:setting-STATICFILES_DIRS
STATICFILES_DIRS = []  # type: List[str]
# https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#staticfiles-finders
STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
]

# MEDIA
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#media-root
MEDIA_ROOT = str(ROOT_DIR)
# https://docs.djangoproject.com/en/dev/ref/settings/#media-url
MEDIA_URL = "/media/"
if DOMAIN_SUBDIRECTORY:
    MEDIA_URL = f"/{DOMAIN_SUBDIRECTORY}{MEDIA_URL}"

# TEMPLATES
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#templates
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": STATICFILES_DIRS,
        "APP_DIRS": False,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# AUTHENTICATION
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#authentication-backends
AUTH_USER_MODEL = "users.User"

# PASSWORDS
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#password-hashers
PASSWORD_HASHERS = [
    # https://docs.djangoproject.com/en/dev/topics/auth/passwords/#using-argon2-with-django
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]
# https://docs.djangoproject.com/en/dev/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]

# LOGGING
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#logging
# See https://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "django.server": {
            "()": "django.utils.log.ServerFormatter",
            "format": "[%(server_time)s] %(message)s",
        },
        "verbose": {
            "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"
        },
        "simple": {"format": "%(levelname)s %(message)s"},
    },
    "filters": {
        "require_debug_true": {"()": "django.utils.log.RequireDebugTrue"}
    },
    "handlers": {
        "django.server": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "django.server",
        },
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "mail_admins": {
            "level": "ERROR",
            "class": "django.utils.log.AdminEmailHandler",
        },
    },
    "loggers": {
        "django": {"handlers": ["console"], "propagate": True},
        "django.server": {
            "handlers": ["django.server"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["mail_admins", "console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.db.backends": {"handlers": ["console"], "level": "INFO"},
    },
}

# django-rest-framework - https://www.django-rest-framework.org/api-guide/settings/
# -------------------------------------------------------------------------------
DEFAULT_RENDERER_CLASSES = [
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
]
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": int(env("DJANGO_PAGINATION_LIMIT", default=10)),
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
    "DEFAULT_RENDERER_CLASSES": DEFAULT_RENDERER_CLASSES,
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated"
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.BasicAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
    ),
}

# django-rest-framework-simplejwt
# -------------------------------------------------------------------------------
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/settings.html
SIMPLE_JWT = {
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
}

# django-allauth
# -------------------------------------------------------------------------------
# https://django-allauth.readthedocs.io/en/latest/configuration.html
# https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak
SOCIALACCOUNT_PROVIDERS = {
    "keycloak": {
        "KEYCLOAK_URL": env("KEYCLOAK_URL", default="http://localhost:1337"),
        "KEYCLOAK_REALM": env("KEYCLOAK_REALM", default="metagrid"),
    },
}
# Used in data migration to register Keycloak social app
KEYCLOAK_CLIENT_ID = env("KEYCLOAK_CLIENT_ID", default="metagrid-localhost")

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_UNIQUE_EMAIL = True
# Access tokens are used to validate a user
ACCOUNT_EMAIL_VERIFICATION = "none"

# social_django
# -------------------------------------------------------------------------------
# This is a general Django setting if views need to redirect to login
# https://docs.djangoproject.com/en/3.2/ref/settings/#login-url
LOGIN_URL = "/login/globus/"

LOGIN_REDIRECT_URL = env(
    "DJANGO_LOGIN_REDIRECT_URL", default="http://localhost:9443/search"
)
LOGOUT_REDIRECT_URL = env(
    "DJANGO_LOGOUT_REDIRECT_URL", default="http://localhost:9443/search"
)

# This dictates which scopes will be requested on each user login
SOCIAL_AUTH_GLOBUS_SCOPE = [
    "openid",
    "profile",
    "email",
    "urn:globus:auth:scope:search.api.globus.org:all",
    "urn:globus:auth:scope:transfer.api.globus.org:all",
]

SOCIAL_AUTH_GLOBUS_KEY = env("GLOBUS_CLIENT_KEY", default="unset")
SOCIAL_AUTH_GLOBUS_SECRET = env("GLOBUS_CLIENT_SECRET", default="unset")
SOCIAL_AUTH_GLOBUS_AUTH_EXTRA_ARGUMENTS = {
    "requested_scopes": SOCIAL_AUTH_GLOBUS_SCOPE,
    "prompt": None,
}
SOCIAL_AUTH_JSONFIELD_ENABLED = True
SOCIAL_AUTH_REDIRECT_IS_HTTPS = False

# dj-rest-auth
# -------------------------------------------------------------------------------
# https://dj-rest-auth.readthedocs.io/en/latest/index.html
REST_USE_JWT = True
JWT_AUTH_COOKIE = "jwt-auth"

# django-cors-headers
# -------------------------------------------------------------------------------
# https://github.com/adamchainz/django-cors-headers#setup
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ORIGIN_WHITELIST = env.list(
    "CORS_ORIGIN_WHITELIST", default="http://localhost:8080"
)
CSRF_TRUSTED_ORIGINS = ["http://localhost:8080"]

SEARCH_URL = env(
    "REACT_APP_SEARCH_URL",
    default="https://esgf-node.llnl.gov/esg-search/search",
)
WGET_URL = env(
    "REACT_APP_WGET_API_URL",
    default="https://esgf-node.llnl.gov/esg-search/wget",
)
STATUS_URL = env(
    "REACT_APP_ESGF_NODE_STATUS_URL",
    default="https://esgf-node.llnl.gov/proxy/status",
)
SOLR_URL = env(
    "REACT_APP_ESGF_SOLR_URL", default="https://esgf-node.llnl.gov/esg-search"
)

FRONTEND_SETTINGS = {
    "REACT_APP_PREVIOUS_URL": env("REACT_APP_PREVIOUS_URL", default=""),
    "REACT_APP_AUTHENTICATION_METHOD": env(
        "REACT_APP_AUTHENTICATION_METHOD", default="keycloak"
    ),
    "REACT_APP_GLOBUS_CLIENT_ID": env(
        "REACT_APP_GLOBUS_CLIENT_ID", default="frontend"
    ),
    "REACT_APP_GLOBUS_NODES": env.list(
        "REACT_APP_GLOBUS_NODES",
        default=[
            "aims3.llnl.gov",
            "esgf-data1.llnl.gov",
            "esgf-data2.llnl.gov",
            "esgf-node.ornl.gov",
        ],
    ),
    "REACT_APP_FOOTER_TEXT": env("REACT_APP_FOOTER_TEXT", default=""),
    "REACT_APP_ESGF_SOLR_URL": env(
        "REACT_APP_ESGF_SOLR_URL", default="https://esgf-node.llnl.gov/solr"
    ),
    "REACT_APP_KEYCLOAK_REALM": env(
        "REACT_APP_KEYCLOAK_REALM", default="esgf"
    ),
    "REACT_APP_KEYCLOAK_URL": env(
        "REACT_APP_KEYCLOAK_URL", default="http://localhost:1337"
    ),
    "REACT_APP_KEYCLOAK_CLIENT_ID": env(
        "REACT_APP_KEYCLOAK_CLIENT_ID", default="frontend"
    ),
    "REACT_APP_HOTJAR_ID": env("REACT_APP_HOTJAR_ID", default="1234"),
    "REACT_APP_HOTJAR_SV": env("REACT_APP_HOTJAR_SV", default="1234"),
    "REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID": env(
        "REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID", default="GA-XXXXXX"
    ),
}

# Custom settings validation
# -------------------------------------------------------------------------------

if not isinstance(FRONTEND_SETTINGS["REACT_APP_GLOBUS_NODES"], list):
    raise environ.ImproperlyConfigured(
        f"REACT_APP_GLOBUS_NODES must be of type list, not "
        f"{FRONTEND_SETTINGS['REACT_APP_GLOBUS_NODES']} of type "
        f"{type(FRONTEND_SETTINGS['REACT_APP_GLOBUS_NODES'])}"
    )

if FRONTEND_SETTINGS["REACT_APP_AUTHENTICATION_METHOD"] not in (
    "keycloak",
    "globus",
):
    raise environ.ImproperlyConfigured(
        f"REACT_APP_AUTHENTICATION_METHOD must be one of keycloak or globus, "
        f"not {FRONTEND_SETTINGS['REACT_APP_AUTHENTICATION_METHOD']}"
    )

if FRONTEND_SETTINGS["REACT_APP_AUTHENTICATION_METHOD"] == "globus" and (
    SOCIAL_AUTH_GLOBUS_KEY == "unset" or SOCIAL_AUTH_GLOBUS_SECRET == "unset"
):
    raise environ.ImproperlyConfigured(
        "When REACT_APP_AUTHENTICATION_METHOD is 'globus', both SOCIAL_AUTH_GLOBUS_KEY and SOCIAL_AUTH_GLOBUS_SECRET must be set via the environment variables GLOBUS_CLIENT_KEY and GLOBUS_CLIENT_SECRET respectively. You must obtain these credentials by registering a Portal at https://app.globus.org/settings/developers"
    )
