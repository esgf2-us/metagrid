from django.contrib import admin

from .models import Facet, Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    pass


@admin.register(Facet)
class FacetAdmin(admin.ModelAdmin):
    pass
