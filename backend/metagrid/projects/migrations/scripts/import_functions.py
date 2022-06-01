from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from metagrid.projects.models import (
        Facet,
        FacetGroup,
        Project,
        ProjectFacet,
    )


from metagrid.initial_projects_data import (
    projects,
    group_descriptions,
)


def insert_data(apps, schema_editor):

    # Get the project models
    ProjectModel = apps.get_model("projects", "Project")  # type: Project
    ProjectFacetModel = apps.get_model(
        "projects", "ProjectFacet"
    )  # type: ProjectFacet

    """Delete projects that are not present in the projects file"""
    projectTableIds = ProjectModel.objects.all().values_list("id", flat=True)
    projectFileIds = []

    for project in projects:
        projectFileIds.append(project.get("id"))
    projectsToDelete = list(set(projectTableIds) - set(projectFileIds))

    for projId in projectsToDelete:
        ProjectModel.objects.filter(
            id=projId
        ).delete()  # Then remove the project

    """Clear Facet groups and data so it can be recreated"""
    FacetGroupModel = apps.get_model(
        "projects", "FacetGroup"
    )  # type: FacetGroup
    FacetGroupModel.objects.all().delete()
    FacetModel = apps.get_model("projects", "Facet")  # type: Facet
    FacetModel.objects.all().delete()

    """Deletes all existing projectfacets."""
    ProjectFacetModel = apps.get_model(
        "projects", "ProjectFacet"
    )  # type: Facet
    ProjectFacetModel.objects.all().delete()

    """Inserts all project data or updates existing projects"""
    for project in projects:
        new_project = ProjectModel.objects.update_or_create(
            id=project.get("id"),
            defaults={
                "name": project.get("name"),
                "full_name": project.get("full_name"),
                "project_url": project.get("project_url"),
                "description": project.get("description"),
            },
        )  # type: Project
        new_project[0].save()

        for (
            group,
            facets,
        ) in project.get("facets_by_group").items():

            """Creates all groups"""
            group_obj = FacetGroupModel.objects.get_or_create(
                name=group,
                description=group_descriptions.get(group),
            )

            for facet in facets:
                """Creates all facets"""
                facet_obj = FacetModel.objects.get_or_create(name=facet)
                """Creates all project facets"""
                ProjectFacetModel.objects.get_or_create(
                    project=new_project[0],
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

    """Delets all existing projectfacets."""
    ProjectFacetModel = apps.get_model(
        "projects", "ProjectFacet"
    )  # type: Facet
    ProjectFacetModel.objects.all().delete()