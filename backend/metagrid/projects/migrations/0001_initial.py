# Generated by Django 3.2.13 on 2022-05-13 03:10

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Facet",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255, unique=True)),
                ("description", models.TextField(null=True)),
            ],
            options={
                "verbose_name": "Facet",
                "verbose_name_plural": "Facets",
            },
        ),
        migrations.CreateModel(
            name="FacetGroup",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(null=True)),
            ],
            options={
                "verbose_name": "FacetGroup",
                "verbose_name_plural": "FacetGroups",
            },
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        help_text="The acronym of the project",
                        max_length=255,
                        unique=True,
                    ),
                ),
                (
                    "full_name",
                    models.CharField(
                        help_text="The spelled out name of the project.",
                        max_length=255,
                        null=True,
                        unique=True,
                    ),
                ),
                (
                    "project_url",
                    models.CharField(
                        help_text="The url associated with this project.",
                        max_length=255,
                        null=True,
                        unique=True,
                    ),
                ),
                (
                    "display_order",
                    models.IntegerField(
                        blank=True,
                        help_text="The value used to order the project results list. 0 indicates show at the top, 1 show under 0 etc.",
                        null=True,
                    ),
                ),
                ("description", models.TextField(null=True)),
            ],
            options={
                "verbose_name": "Project",
                "verbose_name_plural": "Projects",
            },
        ),
        migrations.CreateModel(
            name="ProjectFacet",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "facet",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="projects.facet",
                    ),
                ),
                (
                    "group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="projects.facetgroup",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="facets",
                        to="projects.project",
                    ),
                ),
            ],
            options={
                "verbose_name": "ProjectFacet",
                "verbose_name_plural": "ProjectFacets",
                "unique_together": {("project", "facet")},
            },
        ),
    ]
