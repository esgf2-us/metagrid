# Generated by Django 3.0.5 on 2020-04-29 18:11

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_auto_20200429_1735'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='facet',
            name='count',
        ),
    ]
