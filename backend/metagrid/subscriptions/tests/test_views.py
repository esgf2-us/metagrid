import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from metagrid.subscriptions.models import Subscriptions
from metagrid.users.tests.factories import UserFactory, raw_password

pytestmark = pytest.mark.django_db


class TestSubscriptionDetail(APITestCase):
    """
    Tests saved subscriptions detail operations.
    """

    def setUp(self):
        self.user = UserFactory()

        # Login user to fetch access token
        rest_login_url = reverse("rest_login")
        payload = {
            "email": self.user.email,
            "password": raw_password,
        }
        response = self.client.post(
            rest_login_url,
            payload,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        # Add access token to authorization header
        access_token = response.data["access_token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # URL for subscription detail
        self.url = reverse(
            "subscriptions-detail", kwargs={"user": self.user.pk}
        )

    def test_get_request_returns_user_subscriptions(self):
        response = self.client.get(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_patch_request_updates_user_subscriptions(self):
        subscription = {
            "activity_id": ["CFMIP"],
            "experiment_id": [],
            "frequency": [],
            "id": "akjhsgjkhdfkjhasjdhj",
            "name": "",
            "period": "weekly",
            "realm": [],
            "source_id": [],
            "timestamp": 1613001785195,
            "variable_id": [],
        }
        # Add subscription to the user's saved subscriptions
        payload = {"subscriptions": [subscription]}
        response = self.client.patch(
            self.url,
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        user_subscriptions = Subscriptions.objects.get(user=self.user)
        assert user_subscriptions.subscriptions == payload.get("subscriptions")
