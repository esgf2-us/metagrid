import requests
from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from .models import Project
from .serializers import ProjectSerializer


class ProjectsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]
    lookup_field = "name"


class ProjectFacetsList(APIView):
    permission_classes = [AllowAny]

    def get(self, request, format=None):
        facets = requests.get(
            "https://esgf-node.llnl.gov/esg-search/search/?offset=0&limit=0&type=Dataset&latest=true&project=CMIP6&facets=mip_era%2Cactivity_id%2Cmodel_cohort%2Cproduct%2Csource_id%2Cinstitution_id%2Csource_type%2Cnominal_resolution%2Cexperiment_id%2Csub_experiment_id%2Cvariant_label%2Cgrid_label%2Ctable_id%2Cfrequency%2Crealm%2Cvariable_id%2Ccf_standard_name%2Cdata_node&format=application%2Fsolr%2Bjson"
        )
        return JsonResponse(facets.json())
