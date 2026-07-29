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
    # reference an existing project's id (optional for dynamic projects)
    # https://www.vhinandrich.com/blog/saving-foreign-key-id-django-rest-framework-serializer
    project_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Search
        fields = (
            "uuid",
            "user",
            "project",
            "project_id",
            "project_name",
            "version_type",
            "result_type",
            "min_version_date",
            "max_version_date",
            "min_created_date",
            "max_created_date",
            "filename_vars",
            "active_facets",
            "text_inputs",
            "url",
            "is_subscribed",
            "last_checked_time",
            "filter_created_since",
        )

    def validate(self, data):
        """Ensure either project_id or project_name is provided."""
        project_id = data.get("project_id")
        project_name = data.get("project_name")

        # At least one must be provided
        if not project_id and not project_name:
            raise serializers.ValidationError(
                "Either project_id or project_name must be provided"
            )

        return data
