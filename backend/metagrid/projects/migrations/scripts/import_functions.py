from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from metagrid.projects.models import (
        Facet,
        FacetGroup,
        Project,
        ProjectFacet,
    )

from metagrid.projects.migrations.scripts.inital_data import (
    projects,
    group_descriptions,
)


def insert_data(apps, schema_editor):
    """Inserts all project data"""
    ProjectModel = apps.get_model("projects", "Project")  # type: Project
    ProjectFacetModel = apps.get_model(
        "projects", "ProjectFacet"
    )  # type: ProjectFacet
    FacetGroupModel = apps.get_model(
        "projects", "FacetGroup"
    )  # type: FacetGroup
    FacetModel = apps.get_model("projects", "Facet")  # type: Facet

    for project in projects:
        new_project = ProjectModel(
            name=project.get("name"),
            full_name=project.get("full_name"),
            project_url=project.get("project_url"),
            description=project.get("description"),
        )  # type: Project
        new_project.save()

        for (
            group,
            facets,
        ) in project.get("facets_by_group").items():

            """Creates all groups"""
            group_obj = FacetGroupModel.objects.get_or_create(
                name=group, description=group_descriptions.get(group)
            )

            for facet in facets:
                """Creates all facets"""
                facet_obj = FacetModel.objects.get_or_create(name=facet)
                """Creates all project facets"""
                ProjectFacetModel.objects.get_or_create(
                    project=new_project,
                    facet=facet_obj[0],
                    group=group_obj[0],
                )


def reverse_insert_data(apps, schema_editor):
    """Deletes all existing projects."""
    ProjectModel = apps.get_model("projects", "Project")  # type: Project
    ProjectModel.objects.all().delete()

    """Deletes all existing groups."""
    FacetGroupModel = apps.get_model(
        "projects", "FacetGroup"
    )  # type: FacetGroup
    FacetGroupModel.objects.all().delete()

    """Delets all existing facets."""
    FacetModel = apps.get_model("projects", "Facet")  # type: Facet
    FacetModel.objects.all().delete()