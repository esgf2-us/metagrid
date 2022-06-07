from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Project
from .serializers import ProjectSerializer


class ProjectsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Project.objects.all().order_by("display_order").prefetch_related()
    )
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]
    lookup_field = "name"
