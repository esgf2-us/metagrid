# Getting Started with Back-end Development

This page will show you how to contribute to MetaGrid's back-end. You'll learn about the technologies used, the file structure scheme, and the style guide. Resources are also provided to get new contributors up to speed in the technologies.

## Technologies

### Core

- [Django](https://www.djangoproject.com/start/overview/)
- [Django REST Framework (DRF)](https://www.django-rest-framework.org/)

### Formatter and Linter

- Formatter: [Black](https://black.readthedocs.io/en/stable/)
- Linter: [Flake8](https://flake8.pycqa.org/en/latest/)
- Static Type Checker: [mypy](https://mypy.readthedocs.io/en/stable/introduction.html)

### Testing/QA

- Test Runner: [pytest](https://docs.pytest.org/en/stable/)
- Code Coverage: Coverage.py (through [pytest-cov](https://pytest-cov.readthedocs.io/en/latest/readme.html) package)

### DevOps

- [Docker](https://www.docker.com/)
- [Docker-Compose](https://docs.docker.com/compose/)

## File Structure

### Root

Adapted from [Cookiecutter Django's](https://github.com/pydanny/cookiecutter-django/tree/master/%7B%7Bcookiecutter.project_slug%7D%7D) file structure scheme

<!-- generated with tree backend --gitignore -I "__init__.py" -I tests -L 2 -->

```scaffold
backend
├── config
│   ├── settings
│   ├── urls.py
│   └── wsgi.py
├── Dockerfile
├── gunicorn_conf.py
├── manage.py
├── metagrid
│   ├── api_globus
│   ├── api_proxy
│   ├── cart
│   ├── initial_projects_data.py
│   ├── mysites
│   ├── projects
│   └── users
├── pyproject.toml
├── README.md
├── requirements
│   ├── base.txt
│   └── local.txt
├── setup.cfg
├── UpdateProjectData_README.txt
└── updateProjects.sh
```

- `config/` - stores Django configuration files
  - `settings/` - stores Django settings files
    - `static.py` - Settings that are changed from their Django defaults but are unlikely to change from site to site.
    - `site_specific.py` - Settings that are likely to need to be configured per site.
  - `urls.py` - provides URL mapping to Django views
  - `wsgi.py` - interface between application server to connect with Django.
- `Dockerfile` - The Dockerfile used for the backend Django service
- `docs/` - stores documentation files for the project
- `metagrid/` - stores Django apps
  - `initial_projects_data.py` - used to pre-populate the postgres database with project related groups, facets etc. If modified, then you must run the updateProjects.sh script for the database to be updated.
  - `api_proxy/` - handles the proxy communication between the backend and outside sources like esgf, citations etc.
  - `cart/` - handles the data cart related models and views
  - `mysites/` - only hosts data migrations for internal Django apps and external third-party apps, not a typical standalone Django app
  - `projects/` - handles project related models and views, including reading in the initial project data for the database.
  - `users/` - handles user related data such as accounts and profiles
- `.coveragerc` - configuration file for coverage.py (used by pytest-cov)
- `.dockerignore` - files and folders to ignore when building docker containers
- `.editorconfig` - configuration file for unifying coding style for different editors and IDEs
- `docker-compose.prod.yml` - The Production overlay used to reset settings that are fine in developement but dangerous in production.
- `docker-compose.yml` - the local development build of docker-compose
- `manage.py` - a command-line utility that lets you interact with this Django project in various ways, such as starting the project or running migrations
- `mkdocs.yml` - configuration file for [MkDocs](https://www.mkdocs.org/user-guide/configuration/)
- `pyproject.toml` - configuration for system dependencies written in the TOML format. In MetaGrid, it is specifically used to configure Black which does not support setup.cfg
- `setup.cfg` - configuration for system dependencies such as flake8 and mypy. setup.cfg is preferred over using individual config files because it centralizes configuration
- `updateProjects.sh` - a script which updates the database using initial_project_data.py. For example, if a new project has come out, or an existing one has had changes or been removed, the intial_project_data.py would need to be updated and then this script is run to migrate the django database.

### Django Apps

[What are Django Apps?](https://docs.djangoproject.com/en/3.1/ref/applications/)

#### General Practices

- Django apps should by tightly focused on its task rather than a combination of multiple tasks
- Keep Django apps small. If an app becomes too complex, break it up.
- App's name should be a plural version of the app's main model (e.g. `users` for `User` model)
  - Use valid, PEP8 compliant and importable Python package names, which are short, all-lowercase names
  - Use underscores for readability, but avoid in most cases.

#### Starting an App

Run the command to start an app

```bash
docker compose run --rm django python manage.py startapp <app_name>
```

Register the app under `INSTALLED_APPS`

```python
INSTALLED_APPS =[
    ...
    # Your apps
    "metagrid.users",
    "metagrid.app_name"
]
```

#### App File Structure

Below is an example of how MetaGrid scaffolds Django apps.

<!-- generated with tree backend --gitignore -I "__init__.py" -I tests -L 2 -->

```scaffold
backend
└── metagrid
    └── cart
        ├── migrations
        ├── tests
        │   ├── __init__.py
        │   ├── factories.py
        │   ├── test_models.py
        │   ├── test_serializers.py
        │   ├── test_urls.py
        │   └── test_views.py
        ├── __init__.py
        ├── admin.py
        ├── app.py
        ├── models.py
        ├── serializers.py
        └── views.py
```

\* denotes file is auto-generated after running `python manage.py startapp <APP_NAME>`

- `\migrations` - stores Django migration files for the app's models
- `\tests` - stores test related files
  - `factories.py` - stores factories, which are fixtures based on your Django models for testing purposes
- `admin.py`\* - used to display your models in the Django admin panel. You can also customize your admin panel
- `app.py`\* - created to help the user include any application configuration for the app. Using this, you can configure some of the attributes of the application
- `models.py`\* - stores Django models
- `serializers.py` - stores Django REST Framework [serializers](https://www.django-rest-framework.org/api-guide/serializers/)
- `views.py`\* - stores Django REST Framework [views](https://www.django-rest-framework.org/api-guide/views/), [generic views](https://www.django-rest-framework.org/api-guide/generic-views/), and [viewsets](https://www.django-rest-framework.org/api-guide/viewsets/)
  - If `views.py` becomes too large from storing views and viewsets for example, you can seperate viewsets in a `viewsets.py`

#### Building REST APIs in an App

After adding an app, you can start building REST APIs for the frontend. Here's the typical flow for creating an API.

1. Add [models](https://docs.djangoproject.com/en/3.1/intro/tutorial02/#creating-models)
2. (If needed) Link user-related models to `User` model through `OnetoOneField`
   - Make sure to update the `User` model's `save()` method (e.g. add `Cart.objects.create(user=self)`). When a new `User` object is saved, it will map a new `Cart` object automatically
   - You need to create and run a [data migration](https://docs.djangoproject.com/en/3.1/topics/migrations/#data-migrations) to create new `Cart` objects that map to any existing `User` objects. Make sure to have a [reverse operation](https://docs.djangoproject.com/en/3.1/ref/migration-operations/#django.db.migrations.operations.RunPython) for `RunPython` in case you need to reverse the migration
3. Add [model serializers](https://www.django-rest-framework.org/tutorial/1-serialization/#using-modelserializers) and/or [serializers](https://www.django-rest-framework.org/tutorial/1-serialization/#creating-a-serializer-class)
4. Add [viewsets](https://www.django-rest-framework.org/tutorial/6-viewsets-and-routers/), [generic class-based views](https://www.django-rest-framework.org/tutorial/3-class-based-views/), and/or [views](https://www.django-rest-framework.org/tutorial/2-requests-and-responses/),
   - Viewsets and generic class-based views are the preferred way to write APIs because it abstracts a lot of boilerplate code, making code simpler and cleaner
   - If you need custom behaviors in a view and viewsets/generic class-based views aren't cutting it, then use the `APIView` class
5. Register your viewsets to the router in `urls.py` and/or add your views/generic class-based views to the `urls.py` list
6. Run `pytest` and open `htmlcov/index.html` to view code coverage
7. Write tests for 100% coverage

#### Testing the App

1. Delete the autogenerated `tests.py` file
2. Create a `tests` folder to store all your test files
3. If needed, add `test_models.py`, `test_serializers.py`, `test_views.py`, `test_urls.py`
   - The convention is to add an associated `test_` file for a file that needs to be tested

#### Creating and Applying Model Migrations (Database Version Control)

[What are migrations?](https://docs.djangoproject.com/en/3.1/topics/migrations/)

> Migrations are Django’s way of propagating changes you make to your models (adding a field, deleting a model, etc.) into your database schema.
> They’re designed to be mostly automatic, but you’ll need to know when to make migrations, when to run them, and the common problems you might run into.

## Style Guide

MetaGrid's back-end follows the [Black](https://black.readthedocs.io/en/stable/the_black_code_style.html) code style. Please read through Black's code style guide.

**Style guide and linting rules are enforced in CI test builds.**

## Useful Django Commands

Run a command inside the docker container:

```bash
docker compose run --rm django [command]
```

### Django migrations

Make migrations

```bash
python manage.py makemigrations your_app_name
```

- You specify the app using `your_app_name`, or omit to run on all

Make data migration

- https://docs.djangoproject.com/en/3.1/topics/migrations/#data-migrations
- Useful for changing the data in the database itself, in conjunction with the schema if you want

```bash
python manage.py makemigrations --empty your_app_name
```

Show migrations

```bash
python manage.py showmigrations
```

Run migrations

```bash
python manage.py migrate your_app_name
```

- You specify the app using `your_app_name`, or omit to run on all

### Creating a Superuser

Useful for logging into Django Admin page to manage the database

```bash
python manage.py createsuperuser
```

### Show URLs

Produce a tab-separated list of (url_pattern, view_function, name) tuples. Useful for writing tests and testing REST APIs using `curl`, Postman, etc.

```bash
python manage.py show_urls
```

### Run the Enhanced Django Shell

Useful for prototyping and testing code

Run the enhanced django shell:

```bash
python manage.py shell_plus
```

### Run Tests and Produce Coverage Report

To run the tests, check your test coverage, and generate an HTML coverage report:

```bash
# Optional, stop existing Django containers so tests can run without conflicts
docker compose down
# Runs the tests
docker compose run --rm django pytest
```

Note: Run commands above within the 'metagrid/backend' directory.

The HTML coverage report is located here: `htmlcov/index.html`.

### Format Code

Format with `black`

```bash
black .
```

Sort imports with `isort`

```bash
isort .
```

### Type Checks

```bash
mypy metagrid
```

### Linting

```bash
flake8 .
```

## New Contributor Resources

Here are some resources to get you up to speed with the technologies.

### Documentation

- [Official Django Docs](https://docs.djangoproject.com/en/3.1/)
- [Official Django REST Framework Docs](https://www.django-rest-framework.org/)

### Courses

- [Django Crash Course](https://www.youtube.com/watch?v=e1IyzVyrLSU)
- [Django REST Framework](https://www.youtube.com/watch?v=TmsD8QExZ84&list=PL-51WBLyFTg3k9JKxT7ExP8Xvt4GeG5zc)

### Tutorials and Cheatsheets

- [Official Django Tutorial](https://docs.djangoproject.com/en/3.1/intro/tutorial01/)
- [Official Django REST Framework Tutorial](https://www.django-rest-framework.org/tutorial/quickstart/)
- [Agiliq- Building APIs with Django and Django REST Framework](https://books.agiliq.com/projects/django-api-polls-tutorial/en/latest/)
