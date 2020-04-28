from django.db import models


class Project(models.Model):
    """Model definition for Project."""

    name = models.CharField(max_length=255, unique=True)

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

    def fetch_facets(self):
        """Fetches facets from Search API."""
        pass


class Facet(models.Model):
    """Model definition for Facet."""

    name = models.CharField(max_length=255, unique=True)
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
