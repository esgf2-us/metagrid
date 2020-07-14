from rest_framework import serializers

from metagrid.cart.models import Cart, Search
from metagrid.projects.serializers import ProjectSerializer


class CartSerializer(serializers.ModelSerializer):
    lookup_field = "user"
    read_only_fields = ("user",)

    class Meta:
        model = Cart
        fields = ("user", "items")


class SearchSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)

    # To avoid creating a new foreign key object, create this field to
    # reference an existing project's id
    # https://www.vhinandrich.com/blog/saving-foreign-key-id-django-rest-framework-serializer
    project_id = serializers.IntegerField()

    class Meta:
        model = Search
        fields = (
            "uuid",
            "user",
            "project",
            "project_id",
            "default_facets",
            "active_facets",
            "text_inputs",
            "url",
        )
