from rest_framework import serializers

from metagrid.subscriptions.models import Subscriptions


class SubscriptionsSerializer(serializers.ModelSerializer):
    lookup_field = "user"
    read_only_fields = ("user",)

    class Meta:
        model = Subscriptions
        fields = ("user", "subscriptions")
