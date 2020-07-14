import uuid

from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.fields import JSONField as JSONBField
from django.db import models


class Cart(models.Model):
    """Model definition for Cart."""

    user = models.OneToOneField("users.User", on_delete=models.CASCADE)
    items = JSONBField(default=list)

    class Meta:
        """Meta definition for Cart."""

        verbose_name = "Cart"
        verbose_name_plural = "Cart"

    def __str__(self):
        """Unicode representation of Cart."""
        return str(self.items)


class Search(models.Model):
    """Model definition for Search."""

    uuid = models.UUIDField(default=uuid.uuid4)
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE)
    default_facets = JSONBField(default=dict)
    active_facets = JSONBField(default=dict)
    text_inputs = ArrayField(
        models.CharField(max_length=255, blank=True),
        blank=True,
        null=True,
        default=list,
        size=1,
    )
    url = models.URLField(max_length=2000)

    class Meta:
        """Meta definition for Search."""

        verbose_name = "Search"
        verbose_name_plural = "Searches"

    def __str__(self):
        """Unicode representation of Search."""
        return self
