import pytest

from metagrid.projects.models import Facet, FacetGroup, Project, ProjectFacet
from metagrid.projects.tests.factories import (
    FacetFactory,
    FacetGroupFactory,
    ProjectFacetFactory,
    ProjectFactory,
)

pytestmark = pytest.mark.django_db


class TestProjectModel:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.project = ProjectFactory.create(name="CMIP6")  # type: Project
        self.facet = FacetFactory.create(name="test_facet")  # type: Facet

    def test__str__(self):
        assert self.project.__str__() == self.project.name

    def test_get_absolute_url(self):
        assert self.project.get_absolute_url() == self.project.name

    def test_facets_url_property_success(self):
        project_facet = ProjectFacetFactory.create(
            facet=self.facet, project=self.project
        )  # type: ProjectFacet

        # Check that the project has a list of facets
        assert self.project.facets

        # Check that the facet name is in the facets url
        assert project_facet.facet.name in self.project.facets_url

    def test_facets_url_property_fail(self):
        # Delete the facets that were automatically created
        ProjectFacet.objects.filter(project=self.project).delete()

        # Check that an exception was raised when there are no facets
        # associated with the project
        assert self.project.facets_url is None

    def test_facets_url_cross_project_search(self):
        cross_project = ProjectFactory.create(
            name="All (except CMIP6)"
        )  # type: Project

        # The HTML URL encoding for ! (NOT) is %21
        assert "project%21=CMIP6" in cross_project.facets_url

    def test_facets_url_input4MIPS(self):
        project = ProjectFactory.create(name="input4MIPs")  # type: Project

        assert "activity_id=input4MIPs" in project.facets_url

    def test_project_param_success(self):
        assert self.project.project_param == {"project": "CMIP6"}


class TestProjectFacetModel:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.project = ProjectFactory.create(name="CMIP6")  # type: Project
        self.facet = FacetFactory.create(name="test_facet")  # type: Project
        self.project_facet = ProjectFacetFactory.create(
            facet=self.facet, project=self.project
        )  # type: ProjectFacet

    def test_get_absolute_url(self):
        assert (
            self.project_facet.get_absolute_url()
            == self.project_facet.facet.name
        )

    def test__str__(self):
        assert self.project_facet.__str__() == self.facet.name


class TestFacetModel:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.facet = FacetFactory.create(
            name="test_group",
        )  # type: Facet

    def test__str__(self):
        assert self.facet.__str__() == self.facet.name

    def test_get_absolute_url(self):
        assert self.facet.get_absolute_url() == self.facet.name


class TestFacetGroupModel:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.facet_group = FacetGroupFactory.create(
            name="test_group",
        )  # type: FacetGroup

    def test__str__(self):
        assert self.facet_group.__str__() == self.facet_group.name
