import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from metagrid.cart.models import Cart
from metagrid.users.tests.factories import UserFactory, raw_password

pytestmark = pytest.mark.django_db


class TestCartDetail(APITestCase):
    """
    Tests /cart detail operations.
    """

    def setUp(self):
        self.user = UserFactory()

        # Login user to fetch access token
        rest_login_url = reverse("rest_login")
        payload = {
            "email": self.user.email,
            "password": raw_password,
        }
        response = self.client.post(rest_login_url, payload, format="json",)
        assert response.status_code == status.HTTP_200_OK

        # Add access token to authorization header
        access_token = response.data["access_token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # URL for cart detail
        self.url = reverse("cart-detail", kwargs={"user": self.user.pk})

    def test_get_request_returns_user_cart(self):
        response = self.client.get(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_put_request_updates_user_cart(self):
        # Add item to the user's cart
        payload = {"items": [{"title": "dataset"}]}
        response = self.client.patch(self.url, payload, format="json",)
        assert response.status_code == status.HTTP_200_OK

        user_cart = Cart.objects.get(user=self.user)
        assert user_cart.items == payload.get("items")
