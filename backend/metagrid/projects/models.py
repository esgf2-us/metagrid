import urllib.parse
from typing import Dict, List, Union

from django.core.exceptions import EmptyResultSet
from django.db import models


class Project(models.Model):
    """Model definition for Project."""

    name = models.CharField(
        max_length=255, unique=True, help_text="The acronym of the project",
    )
    full_name = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        help_text="The spelled out name of the project.",
    )
    description = models.TextField(null=True)

    class Meta:
        """Meta definition for Project."""

        verbose_name = "Project"
        verbose_name_plural = "Projects"

    def __str__(self):
        """Unicode representation of Project."""
        return self.name

    def get_absolute_url(self):
        """Return absolute url for Project."""
        return self.name

    @property
    def facets_url(self):
        """Generates a URL query for the ESG-Search API."""
        facets = self.facets.values_list("name", flat=True)  # type: ignore

        if not facets:
            raise EmptyResultSet(f"No facets found for project: {self.name}")

        # TODO: Configure base_url to be a dynamic Django setting using .env
        base_url = "https://esgf-node.llnl.gov/esg-search/search/?"
        params = {
            "offset": 0,
            "limit": 0,
            "type": "Dataset",
            "replica": False,
            "latest": True,
            "format": "application/solr+json",
            "project": [self.name, self.name.upper(), self.name.lower()],
            "facets": ", ".join(facets),
        }  # type: Dict[str, Union[int, str, List[str]]]

        query_string = urllib.parse.urlencode(params, True)
        return base_url + query_string

    def update_facet_counts(self):
        """Updates the facet counts for the project."""
        pass


class Facet(models.Model):
    """Model definition for Facet."""

    name = models.CharField(max_length=255)
    project = models.ForeignKey(
        Project, related_name="facets", on_delete=models.CASCADE
    )

    class Meta:
        """Meta definition for Facet."""

        unique_together = ["name", "project"]
        verbose_name = "Facet"
        verbose_name_plural = "Facets"

    def __str__(self):
        """Unicode representation of Facet."""
        return self.name

    def get_absolute_url(self):
        """Return absolute url for Facet."""
        return self.name


class FacetVariable(models.Model):
    """Model definition for FacetVariable."""

    name = models.CharField(max_length=255)
    count = models.IntegerField()
    facet = models.ForeignKey(
        Facet, related_name="facet_variables", on_delete=models.CASCADE
    )

    class Meta:
        """Meta definition for FacetVariable."""

        unique_together = ["name", "facet"]
        verbose_name = "Facet Variable"
        verbose_name_plural = "Facet Variables"

    def __str__(self):
        """Unicode representation of FacetVariable."""
        return (self.name, self.count)
