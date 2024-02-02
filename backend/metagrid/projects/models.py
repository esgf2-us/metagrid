import logging
import urllib.parse
from typing import Dict, List, Union

from django.db import models

# Get an instance of a logger
logger = logging.getLogger(__name__)


class Project(models.Model):
    """Model definition for Project."""

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The acronym of the project",
    )
    full_name = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        help_text="The spelled out name of the project.",
    )
    project_url = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        help_text="The url associated with this project.",
    )
    display_order = models.IntegerField(
        help_text="The value used to order the project results list. 0 indicates show at the top, 1 show under 0 etc.",
        null=True,
        blank=True,
    )
    description = models.TextField(null=True)

    class Meta:
        """Meta definition for Project."""

        verbose_name = "Project"
        verbose_name_plural = "Projects"

    def __str__(self) -> str:
        """Unicode representation of Project."""
        return self.name

    def get_absolute_url(self) -> str:
        """Return absolute url for Project."""
        return self.name

    @property
    def facets_url(self) -> Union[None, str]:
        """Generates a URL query string for the ESGF Search API."""
        facets = self.facets.order_by("id").values_list("facet__name", flat=True)  # type: ignore

        if not facets:
            logger.warning(f"No facets found for project: {self.name}")
            return None

        params = {
            "offset": 0,
            "limit": 0,
            "type": "Dataset",
            "format": "application/solr+json",
            "facets": ", ".join(facets),
        }  # type: Dict[str, Union[int, str, List[str]]]
        params = {**self.project_param, **params}
        query_string = urllib.parse.urlencode(params, True)

        return query_string

    @property
    def project_param(self) -> Dict[str, str]:
        """Generates the respective url param based on the project.

        For example, input4MIPs uses 'activity_id' instead of 'project'
        """
        project_params = {
            "E3SM": {"project": self.name.lower()},
            "All (except CMIP6)": {"project!": "CMIP6"},
            "input4MIPs": {"activity_id": self.name},
            "obs4MIPs": {"activity_id": self.name},
            "CMIP5": {"project": "CMIP5,TAMIP,EUCLIPSE,LUCID,GeoMIP,PMIP3"},
        }
        return project_params.get(self.name, {"project": self.name})


class Facet(models.Model):
    """Model definition for Facet."""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True)

    class Meta:
        """Meta definition for Facet."""

        verbose_name = "Facet"
        verbose_name_plural = "Facets"

    def __str__(self) -> str:
        """Unicode representation of Facet."""
        return self.name

    def get_absolute_url(self) -> str:
        """Return absolute url for Facet."""
        return self.name


class ProjectFacet(models.Model):
    """Model definition for ProjectFacet."""

    project = models.ForeignKey(
        Project, related_name="facets", on_delete=models.CASCADE
    )
    facet = models.ForeignKey(Facet, on_delete=models.CASCADE)
    group = models.ForeignKey(
        "projects.facetgroup",
        on_delete=models.CASCADE,
    )

    class Meta:
        """Meta definition for ProjectFacet."""

        unique_together = ["project", "facet"]
        verbose_name = "ProjectFacet"
        verbose_name_plural = "ProjectFacets"

    def __str__(self) -> str:
        """Unicode representation of ProjectFacet."""
        return self.facet.name

    def get_absolute_url(self) -> str:
        """Return absolute url for ProjectFacet."""
        return self.facet.name


class FacetGroup(models.Model):
    """Model definition for FacetGroup."""

    name = models.CharField(max_length=255)
    description = models.TextField(null=True)

    class Meta:
        """Meta definition for FacetGroup."""

        verbose_name = "FacetGroup"
        verbose_name_plural = "FacetGroups"

    def __str__(self):
        """Unicode representation of FacetGroup."""
        return self.name
