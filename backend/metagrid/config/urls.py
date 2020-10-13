from allauth.socialaccount.providers.keycloak.views import (
    KeycloakOAuth2Adapter,
)
from dj_rest_auth.registration.views import SocialLoginView, VerifyEmailView
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path, reverse_lazy
from django.views.generic.base import RedirectView
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from rest_framework.routers import DefaultRouter

from metagrid.cart.views import CartViewSet, SearchViewSet
from metagrid.projects.views import ProjectsViewSet
from metagrid.users.views import UserCreateViewSet, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"users", UserCreateViewSet)
router.register(r"projects", ProjectsViewSet)
router.register(r"carts/datasets", CartViewSet)
router.register(r"carts/searches", SearchViewSet)


class KeycloakLogin(SocialLoginView):
    """Keycloak social authentication view for dj-rest-auth
    https://dj-rest-auth.readthedocs.io/en/latest/installation.html#social-authentication-optional
    """

    adapter_class = KeycloakOAuth2Adapter


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(router.urls)),
    # the 'api-root' from django rest-frameworks default router
    # http://www.django-rest-framework.org/api-guide/routers/#defaultrouter
    re_path(
        r"^$",
        RedirectView.as_view(url=reverse_lazy("api-root"), permanent=False),
    ),
    # all-auth
    path("accounts/", include("allauth.urls"), name="socialaccount_signup"),
    # dj-rest-auth
    re_path(r"^dj-rest-auth/", include("dj_rest_auth.urls")),
    path(
        "dj-rest-auth/keycloak", KeycloakLogin.as_view(), name="keycloak_login"
    ),
    re_path(
        r"^account-confirm-email/",
        VerifyEmailView.as_view(),
        name="account_email_verification_sent",
    ),
    re_path(
        r"^account-confirm-email/(?P<key>[-:\w]+)/$",
        VerifyEmailView.as_view(),
        name="account_confirm_email",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# drf-yasg configuration
# https://drf-yasg.readthedocs.io/en/stable/readme.html#quickstart
schema_view = get_schema_view(
    openapi.Info(
        title="Snippets API",
        default_version="v1",
        description="Test description",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@snippets.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns += [
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    re_path(
        r"^redoc/$",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
]

# In a production environment, the site may be hosted in a subdirectory
# of a domain. The subdirectory must be prepended to each of the urls
# for the routes to be valid.
if settings.DOMAIN_SUBDIRECTORY:
    urlpatterns = [
        path(f"{settings.DOMAIN_SUBDIRECTORY}/", include(urlpatterns))
    ]
