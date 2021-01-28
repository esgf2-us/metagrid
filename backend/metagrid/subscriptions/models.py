from django.db import models
from django.db.models import JSONField as JSONBField


class Subscriptions(models.Model):
    """Model definition for Subscriptions."""

    user = models.OneToOneField("users.User", on_delete=models.CASCADE)

    subscriptions = JSONBField(default=list)

    class Meta:
        """Meta definition for Subscriptions."""

        verbose_name = "Subscriptions"
        verbose_name_plural = "Subscriptions"

    def __str__(self):
        """Unicode representation of Subscriptions."""
        return str(self.subscriptions)
