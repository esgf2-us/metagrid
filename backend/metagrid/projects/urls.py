from django.urls import path

from .views import ProjectFacetsList, ProjectsList

app_name = "projects"
urlpatterns = [
    path("", view=ProjectsList.as_view(), name="list"),
    path("facets", view=ProjectFacetsList.as_view(), name="list_facets"),
]
