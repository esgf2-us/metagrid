import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from metagrid.projects.tests import factories

pytestmark = pytest.mark.django_db


class TestProjectsViewSet(APITestCase):
    def test_list(self):
        list_url = reverse("project-list")

        factories.ProjectFactory.create_batch(20)
        response = self.client.get(list_url)

        assert response.status_code == status.HTTP_200_OK

        # Check a list of Project objects are being returned
        assert len(response.data) > 0

    def test_detail(self):
        post = factories.ProjectFactory(name="CMIP6")
        detail_url = reverse("project-detail", kwargs={"name": post.name})

        response = self.client.get(detail_url)
        assert response.json().get("name") == post.name
