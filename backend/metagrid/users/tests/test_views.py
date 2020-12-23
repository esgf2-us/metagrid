import factory
import pytest
from django.contrib.auth.hashers import check_password
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APITestCase

from metagrid.users.models import User
from metagrid.users.tests.factories import UserFactory, raw_password

fake = Faker()

pytestmark = pytest.mark.django_db


class TestUserListTestCase(APITestCase):
    """
    Tests /users list operations.
    """

    def setUp(self):
        self.url = reverse("user-list")
        self.user_data = factory.build(dict, FACTORY_CLASS=UserFactory)

    def test_post_request_with_no_data_fails(self):
        response = self.client.post(self.url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_post_request_with_valid_data_succeeds(self):
        response = self.client.post(self.url, self.user_data)
        assert response.status_code == status.HTTP_201_CREATED

        user = User.objects.get(pk=response.data.get("id"))
        assert user.email == self.user_data.get("email")
        assert check_password(self.user_data.get("password"), user.password)


class TestUserDetailTestCase(APITestCase):
    """
    Tests /users detail operations.
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

        # URL for user's detail
        self.url = reverse("user-detail", kwargs={"pk": self.user.pk})

    def test_get_request_returns_a_given_user(self):
        response = self.client.get(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_put_request_updates_a_user(self):
        new_first_name = fake.first_name()
        payload = {"first_name": new_first_name}
        response = self.client.put(self.url, payload)
        assert response.status_code == status.HTTP_200_OK

        user = User.objects.get(pk=self.user.id)
        assert user.first_name == new_first_name
