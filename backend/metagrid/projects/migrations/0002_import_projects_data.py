# Generated by Django 3.2.13 on 2022-05-05 16:59

from django.db import migrations

from metagrid.projects.migrations.scripts.import_functions import (
    insert_data,
    reverse_insert_data,
)


class Migration(migrations.Migration):

    dependencies = [("projects", "0001_initial")]

    operations = [
        migrations.RunPython(insert_data, reverse_insert_data),
    ]
