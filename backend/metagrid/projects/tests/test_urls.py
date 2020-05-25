import pytest
from django.urls import reverse

from metagrid.projects.tests import factories

pytestmark = pytest.mark.django_db


def test_list():
    assert reverse("project-list") == "/api/v1/projects/"


def test_detail():
    post = factories.ProjectFactory(name="CMIP6")
    result = reverse("project-detail", kwargs={"name": post.name})
    assert result == f"/api/v1/projects/{post.name}/"
