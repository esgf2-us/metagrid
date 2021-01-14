# Getting Started with Back-end Development

This walkthrough will show you how to contribute to MetaGrid's back-end. You'll learn about the technologies used, the file scaffolding scheme, and the style guide. Resources are also provided to get new contributors up to speed in the technologies.

## Technologies

### Core

- [Django](https://www.djangoproject.com/start/overview/)
- [Django REST Framework (DRF)](https://www.django-rest-framework.org/)

### Styler and Linting

- Styler: [Black](https://black.readthedocs.io/en/stable/)
- Linter: [Flake8](https://flake8.pycqa.org/en/latest/)
- Static Type Checker: [mypy](https://mypy.readthedocs.io/en/stable/introduction.html)

### Testing/QA

- Test Runner: [pytest](https://docs.pytest.org/en/stable/)
- Code Coverage: Coverage.py (through [pytest-cov](https://pytest-cov.readthedocs.io/en/latest/readme.html) package)

### DevOps

- [Docker](https://www.docker.com/)
- [Docker-Compose](https://docs.docker.com/compose/)

## File Scaffold

### Root

Adapted from [Cookiecutter Django's](https://github.com/pydanny/cookiecutter-django/tree/master/%7B%7Bcookiecutter.project_slug%7D%7D) scaffolding scheme

```scaffold
backend
├── .envs
│ ├── .local
│ └── .production
├── docker
│ ├── local
│ └── production
├── docs
├── metagrid
│ ├── config
│ │ ├── base.py
│ │ ├── local.py
│ │ ├── production.py
│ │ ├── test.py
│ │ ├── urls.py
│ │ └── wsgi.py
│ ├── mysites
│ ├── users
│ └── ...
├── requirements
│ ├── base.txt
│ ├── local.txt
│ └── production.txt
├── .coveragerc
├── .dockerignore
├── .editorconfig
├── .gitignore
├── docker-compose.prod.yml
├── docker-compose.yml
├── manage.py
├── mkdocs.yml
├── pyproject.toml
└── setup.cfg
```

- `/.envs` - stores environment variables for each microservice found in the docker-compose files, separated by environment and service
- `/docker` - stores files used by each microservice found in the docker-compose files, including DockerFiles, start scripts, etc, separated by environment and service
- `/docs` - stores documentation files for the project
- `/metagrid` - stores Django apps
  - `/config` - not a Django app, stores Django configuration files
    - `base.py` - base setting shared across local development and production environments
    - `local.py` - extends `base.py` with local development environment settings
    - `production.py` - extends `base.py` with production environment settings
    - `test.py` - extends `base.py` with test environment settings
    - `urls.py` - provides URL mapping to Django views
    - `wsgi.py` - interface between application server to connect with Django. Used primarily in deployment.
  - `/mysites` - **not a standalone app, only hosts data migrations** for internal Django apps and external third-party apps
  - `/users` - handles user related data such as accounts and profiles
- `.coveragerc` - configuration file for coverage.py (used by pytest-cov)
- `.dockerignore` - files and folders to ignore when building docker containers
- `.editorconfig` - configuration file for unifying coding style for different editors and IDEs
- `docker-compose.prod.yml` - the production build of docker-compose
- `docker-compose.yml` - the local development build of docker-compose
- `manage.py` - a command-line utility that lets you interact with this Django project in various ways, such as starting the project or running migrations
- `mkdocs.yml` - configuration file for [MkDocs](https://www.mkdocs.org/user-guide/configuration/)
- `pyproject.toml` - configuration for system dependencies written in the TOML format. In MetaGrid, it is specifically used to configure Black which does not support setup.cfg
- `setup.cfg` - configuration for system dependencies such as flake8 and mypy. setup.cfg is preferred over using individual config files because it centralizes configuration

### Django Apps

[What are Django Apps?](https://docs.djangoproject.com/en/3.1/ref/applications/)

Below is an example of how MetaGrid scaffolds Django apps (a `cart` app in this case).

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

#### Test Files

- A `test.py` file will be auto-generated after you run the `startapp` command, but you can delete. Instead, create a `tests` folder to store all your test files.
- Each testable file should have an associated test file. Typically, you should be testing `models.py`, `serializers.py`, `views.py` and `urls.py`. Run pytest to generate a coverage report automatically to see what you should test.

## Style Guide

The MetaGrid back-end follows the [Black](https://black.readthedocs.io/en/stable/the_black_code_style.html) code style, which reformats entire files in place. It is not configurable and doesn't take previous formatting into account. Please spend some time reading through Black's code style guide.

Since Black is a project dependency, you just need to set up the virtual environment using the `requirements/local.txt` dependencies file then point your IDE/text editor to it.

Afterwards, your code can be **automatically reformatted** through your IDE/text editor or by using [pre-commit](../getting_started_local#1-set-up-precommit). This means you don't have to worry about manually styling your code for every commit, and you can focus on the architecture of change. Automation is the key.

**Style guide and linting rules are enforced in CI test builds.**.

## Useful Django Commands

Run a command inside the docker container:

```bash
docker-compose -p metagrid_local_backend run --rm django [command]
```

### Setting Up Users

- To create an superuser account, use this command:

```bash
python manage.py createsuperuser
```

### Test coverage

To run the tests, check your test coverage, and generate an HTML coverage report:

```bash
pytest
open htmlcov/index.html
```

### Type checks

Running type checks with mypy:

```bash
mypy metagrid
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
