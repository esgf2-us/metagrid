import pytest
from django.forms.models import model_to_dict
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from metagrid.cart.models import Cart, Search
from metagrid.cart.tests.factories import SearchFactory
from metagrid.projects.tests.factories import ProjectFactory
from metagrid.users.tests.factories import UserFactory, raw_password

pytestmark = pytest.mark.django_db


class TestCartDetail(APITestCase):
    """
    Tests /carts detail operations.
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

        # URL for cart detail
        self.url = reverse("cart-detail", kwargs={"user": self.user.pk})

    def test_get_request_returns_user_cart(self):
        response = self.client.get(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_patch_request_updates_user_cart(self):
        # Add item to the user's cart
        payload = {"items": [{"title": "dataset"}]}
        response = self.client.patch(
            self.url,
            payload,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        user_cart = Cart.objects.get(user=self.user)
        assert user_cart.items == payload.get("items")


class TestSearchViewSet(APITestCase):
    """
    Tests /searches operations.
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

        # URL for GET (list), POST (create)
        self.list_url = reverse("search-list")

        # URL for GET, PUT, PATCH, DELETE
        self.search_obj = SearchFactory(user=self.user)
        self.detail_url = reverse(
            "search-detail", kwargs={"uuid": self.search_obj.uuid}
        )

    def test_get_request_returns_list_of_objects(self):
        response = self.client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK

    def test_get_request_returns_object(self):
        response = self.client.get(self.detail_url)
        assert response.status_code == status.HTTP_200_OK

    def test_post_request_creates_object(self):
        project = ProjectFactory()
        payload = model_to_dict(
            SearchFactory.build(user=self.user, project=project)
        )
        payload["project_id"] = project.pk

        response = self.client.post(self.list_url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_put_request_updates_object(self):
        project = ProjectFactory()
        payload = model_to_dict(
            SearchFactory.build(user=self.user, project=project)
        )
        payload["project_id"] = project.pk

        response = self.client.put(
            self.detail_url,
            payload,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        user_search = Search.objects.get(pk=self.search_obj.pk)
        assert user_search.text_inputs == payload.get("text_inputs")

    def test_patch_request_partially_updates_object(self):
        # Add item to the user's cart
        payload = {"text_inputs": ["new_text"]}
        response = self.client.patch(
            self.detail_url,
            payload,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        user_search = Search.objects.get(pk=self.search_obj.pk)
        assert user_search.text_inputs == payload.get("text_inputs")

    def test_destroy_request_deletes_object(self):
        response = self.client.delete(self.detail_url)
        assert response.status_code == status.HTTP_200_OK

        search_exists = Search.objects.filter(pk=self.search_obj.pk).exists()
        assert not search_exists
