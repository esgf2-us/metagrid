from django.db import models  # noqa


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


class Facet(models.Model):
    """Model definition for Facet."""

    name = models.CharField(max_length=255, unique=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    class Meta:
        """Meta definition for Facet."""

        verbose_name = "Facet"
        verbose_name_plural = "Facets"

    def __str__(self):
        """Unicode representation of Facet."""
        pass

    def save(self):
        """Save method for Facet."""
        return self.name

    def get_absolute_url(self):
        """Return absolute url for Facet."""
        return self.name
