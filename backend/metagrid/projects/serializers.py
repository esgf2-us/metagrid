from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    facets = serializers.StringRelatedField(many=True)

    class Meta:
        model = Project
        fields = ("name", "facets")
