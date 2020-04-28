from typing import TYPE_CHECKING

import pytest
from django.core.exceptions import EmptyResultSet

from .factories import FacetFactory, ProjectFactory

pytestmark = pytest.mark.django_db

if TYPE_CHECKING:
    from metagrid.projects.models import Facet, Project


class TestProjectModel:
    def test_facets_url_property_success(self):
        project = ProjectFactory.create(name="CMIP6")  # type: Project
        facet = FacetFactory.create(name="mip_era", project=project)  # type: Facet

        # Check that the project has a list of facets
        assert project.facets

        # Check that the facet name is in the facets url
        assert facet.name in project.facets_url

    def test_facets_url_property_fail(self):
        project = ProjectFactory.create(name="e3sm")  # type: Project

        # Check that an exception was raised when there are no facets
        # associated with the project
        with pytest.raises(EmptyResultSet):
            project.facets_url
