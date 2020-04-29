from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    facets = serializers.StringRelatedField(many=True)
    facets_url = serializers.ReadOnlyField

    class Meta:
        model = Project
        fields = ("name", "full_name", "description", "facets", "facets_url")
