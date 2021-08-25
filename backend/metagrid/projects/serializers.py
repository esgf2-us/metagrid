from collections import defaultdict

from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    facets_by_group = serializers.SerializerMethodField(read_only=True)
    facets_url = serializers.ReadOnlyField()

    def get_facets_by_group(self, project):
        facets_by_group = defaultdict(list)

        for result in project.facets.values(
            "group__name", "facet__name"
        ).order_by(
            "group__pk",
        ):
            facets_by_group[result["group__name"]].append(
                result["facet__name"]
            )
        return facets_by_group

    class Meta:
        model = Project
        fields = (
            "pk",
            "name",
            "full_name",
            "description",
            "project_url",
            "facets_by_group",
            "facets_url",
        )
