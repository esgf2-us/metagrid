from django.contrib import admin

from metagrid.projects.models import Facet, Project, ProjectFacet


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    pass


@admin.register(Facet)
class FacetAdmin(admin.ModelAdmin):
    pass


@admin.register(ProjectFacet)
class ProjectFacetAdmin(admin.ModelAdmin):
    pass
