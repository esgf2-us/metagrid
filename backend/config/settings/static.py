from datetime import timedelta
from typing import Any, Optional, Sequence

import environ
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = (
    environ.Path(__file__) - 3
)  # (config/settings/django.py - 3 = metagrid/)


class DjangoStaticSettings(BaseSettings):
    """Django settings that do not vary by site"""

    model_config = SettingsConfigDict(
        env_prefix="DJANGO_",
        case_sensitive=True,
    )

    DEBUG: bool = Field(default=True)
    APPEND_SLASH: bool = False
    TIME_ZONE: str = "UTC"
    LANGUAGE_CODE: str = "en-us"
    DEFAULT_AUTO_FIELD: str = "django.db.models.AutoField"
    USE_I18N: bool = False
    USE_L10N: bool = True
    USE_TZ: bool = True
    SITE_ID: int = 1
    INSTALLED_APPS: Sequence[str] = [
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
    MIDDLEWARE: Sequence[str] = [
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
    ]

    SESSION_SAVE_EVERY_REQUEST: bool = True

    AUTHENTICATION_BACKENDS: Sequence[str] = [
        "globus_portal_framework.auth.GlobusOpenIdConnect",
        "django.contrib.auth.backends.ModelBackend",
    ]
    ALLOWED_HOSTS: Sequence[str] = [
        "django",
        "localhost",
        "0.0.0.0",
        "127.0.0.1",
    ]
    ROOT_URLCONF: str = "config.urls"
    SECRET_KEY: str = "CHANGE_ME_IM_NOT_SAFE_FOR_PRODUCTION"
    WSGI_APPLICATION: str = "config.wsgi.application"
    EMAIL_TIMEOUT: int = 5

    CORS_ORIGIN_ALLOW_ALL: bool = True
    DATABASES: dict[str, dict[str, Any]] = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": "postgres",
            "ATOMIC_REQUESTS": True,
            "DATABASE_URL": "pgsql:///postgres",
        }
    }
    STATIC_ROOT: str = ROOT_DIR("staticfiles")
    # https://docs.djangoproject.com/en/dev/ref/settings/#static-url
    STATIC_URL: str = "/static/"
    # https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#std:setting-STATICFILES_DIRS
    STATICFILES_DIRS: Sequence[str] = []
    # https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#staticfiles-finders
    STATICFILES_FINDERS: Sequence[str] = [
        "django.contrib.staticfiles.finders.FileSystemFinder",
        "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    ]

    # MEDIA
    # ------------------------------------------------------------------------------
    # https://docs.djangoproject.com/en/dev/ref/settings/#media-root
    MEDIA_ROOT: str = ROOT_DIR()
    # https://docs.djangoproject.com/en/dev/ref/settings/#media-url
    MEDIA_URL: str = "/media/"
    DOMAIN_NAME: str = ""
    # TEMPLATES
    # ------------------------------------------------------------------------------
    # https://docs.djangoproject.com/en/dev/ref/settings/#templates
    TEMPLATES: Sequence[dict[str, Any]] = [
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
    AUTH_USER_MODEL: str = "users.User"

    # PASSWORDS
    # ------------------------------------------------------------------------------
    # https://docs.djangoproject.com/en/dev/ref/settings/#password-hashers
    PASSWORD_HASHERS: Sequence[str] = [
        # https://docs.djangoproject.com/en/dev/topics/auth/passwords/#using-argon2-with-django
        "django.contrib.auth.hashers.Argon2PasswordHasher",
        "django.contrib.auth.hashers.PBKDF2PasswordHasher",
        "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
        "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    ]
    # https://docs.djangoproject.com/en/dev/ref/settings/#auth-password-validators
    AUTH_PASSWORD_VALIDATORS: Sequence[dict[str, str]] = [
        {
            "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
        },
        {
            "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"
        },
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
    LOGGING: dict[str, Any] = {
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
    REST_FRAMEWORK: dict[str, Any] = {
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
        "PAGE_SIZE": 10,
        "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
        "DEFAULT_RENDERER_CLASSES": [
            "rest_framework.renderers.JSONRenderer",
            "rest_framework.renderers.BrowsableAPIRenderer",
        ],
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
    SIMPLE_JWT: dict[str, Any] = {
        "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
        "ROTATE_REFRESH_TOKENS": True,
    }

    # django-allauth
    # -------------------------------------------------------------------------------
    # https://django-allauth.readthedocs.io/en/latest/configuration.html
    # https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak
    SOCIALACCOUNT_PROVIDERS: dict[str, dict[str, str]] = {
        "keycloak": {
            "KEYCLOAK_URL": "https://esgf-login.ceda.ac.uk/",
            "KEYCLOAK_REALM": "esgf",
        },
    }

    ACCOUNT_EMAIL_REQUIRED: bool = True
    ACCOUNT_USER_MODEL_USERNAME_FIELD: Optional[str] = None
    ACCOUNT_USERNAME_REQUIRED: bool = False
    ACCOUNT_AUTHENTICATION_METHOD: str = "email"
    ACCOUNT_UNIQUE_EMAIL: bool = True
    # Access tokens are used to validate a user
    ACCOUNT_EMAIL_VERIFICATION: str = "none"

    # social_django
    # -------------------------------------------------------------------------------
    # This is a general Django setting if views need to redirect to login
    # https://docs.djangoproject.com/en/3.2/ref/settings/#login-url
    LOGIN_URL: str = "/login/globus/"

    LOGIN_REDIRECT_URL: str = "http://localhost:8080/search"
    LOGOUT_REDIRECT_URL: str = "http://localhost:8080/search"

    SOCIAL_AUTH_GLOBUS_SCOPE: list[str] = [
        "openid",
        "profile",
        "email",
        "urn:globus:auth:scope:search.api.globus.org:all",
        "urn:globus:auth:scope:transfer.api.globus.org:all",
    ]

    SOCIAL_AUTH_GLOBUS_AUTH_EXTRA_ARGUMENTS: dict[str, Any] = {
        "prompt": None,
        "requested_scopes": [
            "openid",
            "profile",
            "email",
            "urn:globus:auth:scope:search.api.globus.org:all",
            "urn:globus:auth:scope:transfer.api.globus.org:all",
        ],
    }
    SOCIAL_AUTH_JSONFIELD_ENABLED: bool = True

    # https://python-social-auth.readthedocs.io/en/latest/configuration/settings.html#processing-requests-and-redirects
    SOCIAL_AUTH_REDIRECT_IS_HTTPS: bool = False

    # dj-rest-auth
    # -------------------------------------------------------------------------------
    # https://dj-rest-auth.readthedocs.io/en/latest/index.html
    REST_USE_JWT: bool = True
    JWT_AUTH_COOKIE: str = "jwt-auth"

    # django-cors-headers
    # -------------------------------------------------------------------------------
    # https://github.com/adamchainz/django-cors-headers#setup
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOWED_ORIGINS: Sequence[str] = ["http://localhost:8080"]
    CSRF_TRUSTED_ORIGINS: Sequence[str] = ["http://localhost:8080"]

    # EMAIL
    # ------------------------------------------------------------------------------
    # https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
    EMAIL_BACKEND: str = "django.core.mail.backends.console.EmailBackend"

    # SECURITY
    # ------------------------------------------------------------------------------
    # https://docs.djangoproject.com/en/dev/ref/settings/#secure-proxy-ssl-header
    SECURE_PROXY_SSL_HEADER: Optional[tuple[str, str]] = None

    # https://docs.djangoproject.com/en/dev/ref/settings/#secure-ssl-redirect
    SECURE_SSL_REDIRECT: bool = False

    # https://docs.djangoproject.com/en/dev/ref/settings/#session-cookie-secure
    SESSION_COOKIE_SECURE: bool = False

    # https://docs.djangoproject.com/en/dev/ref/settings/#csrf-cookie-secure
    CSRF_COOKIE_SECURE: bool = False

    # https://docs.djangoproject.com/en/dev/topics/security/#ssl-https
    # https://docs.djangoproject.com/en/dev/ref/settings/#secure-hsts-seconds
    SECURE_HSTS_SECONDS: int = 0

    # https://docs.djangoproject.com/en/dev/ref/settings/#secure-hsts-include-subdomains
    SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = False

    # https://docs.djangoproject.com/en/dev/ref/settings/#secure-hsts-preload
    SECURE_HSTS_PRELOAD: bool = True

    # STATIC
    # ------------------------
    STATICFILES_STORAGE: str = (
        "whitenoise.storage.CompressedManifestStaticFilesStorage"
    )
