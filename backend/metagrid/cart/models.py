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
