from allauth.socialaccount.providers.keycloak.views import (
    KeycloakOAuth2Adapter,
)
from dj_rest_auth.registration.views import SocialLoginView, VerifyEmailView
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path, reverse_lazy
from django.views.generic.base import RedirectView
from rest_framework.routers import DefaultRouter

from metagrid.cart.views import CartViewSet
from metagrid.projects.views import ProjectsViewSet
from metagrid.users.views import UserCreateViewSet, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"users", UserCreateViewSet)
router.register(r"projects", ProjectsViewSet)
router.register(r"carts", CartViewSet)


class KeycloakLogin(SocialLoginView):
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
