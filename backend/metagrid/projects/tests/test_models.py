from typing import TYPE_CHECKING

import pytest

from metagrid.projects.models import Facet
from metagrid.projects.tests.factories import (
    FacetFactory,
    FacetGroupFactory,
    ProjectFactory,
)

pytestmark = pytest.mark.django_db

if TYPE_CHECKING:
    from metagrid.projects.models import FacetGroup, Project


class TestProjectModel:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.project = ProjectFactory.create(name="CMIP6")  # type: Project

    def test__str__(self):
        assert self.project.__str__() == self.project.name

    def test_get_absolute_url(self):
        assert self.project.get_absolute_url() == self.project.name

    def test_facets_url_property_success(self):
        facet = FacetFactory.create(
            name="test_facet", project=self.project
        )  # type: Facet

        # Check that the project has a list of facets
        assert self.project.facets

        # Check that the facet name is in the facets url
        assert facet.name in self.project.facets_url

    def test_facets_url_property_fail(self):
        # Delete the facets that were automatically created
        Facet.objects.filter(project=self.project).delete()

        # Check that an exception was raised when there are no facets
        # associated with the project
        assert self.project.facets_url is None

    def test_facets_url_cross_project_search(self):
        cross_project = ProjectFactory.create(
            name="All (except CMIP6)"
        )  # type: Project

        assert "project!=CMIP6" in cross_project.facets_url

    def test_project_url_param_success(self):
        assert self.project.project_url_param == "CMIP6"


class TestFacetModel:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.project = ProjectFactory.create(name="CMIP6")  # type: Project
        self.facet = FacetFactory.create(
            name="test_facet", project=self.project
        )  # type: Facet

    def test_get_absolute_url(self):
        assert self.facet.get_absolute_url() == self.facet.name

    def test__str__(self):
        assert self.facet.__str__() == "test_facet"


class TestFacetGroupModel:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.facet_group = FacetGroupFactory.create(
            name="test_group",
        )  # type: FacetGroup

    def test__str__(self):
        assert self.facet_group.__str__() == "test_group"
