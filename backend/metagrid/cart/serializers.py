from rest_framework import serializers

from metagrid.cart.models import Cart


class CartSerializer(serializers.ModelSerializer):
    lookup_field = "user"
    read_only_fields = ("user",)

    class Meta:
        model = Cart
        fields = ("user", "items")
