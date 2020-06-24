# MetaGrid

![Front-end CI](https://github.com/aims-group/metagrid/workflows/Front-end%20CI/badge.svg)
![Back-end CI](https://github.com/aims-group/metagrid/workflows/Back-end%20CI/badge.svg)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/aims-group/metagrid/master.svg?style=flat-square)](https://codecov.io/gh/aims-group/metagrid/)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

Earth System Grid Federation's (ESGF) next generation search interface.

## Repository Structure

This project is structured as a mono-repo, encompassing two separate sub-projects for the front-end and back-end. For more information, please visit the 'Resources' links below.

## Front-end

[![React](frontend/src/assets/img/react_badge.svg)](https://reactjs.org/)
[![TypeScript](frontend/src/assets/img/typescript_badge.svg)](https://www.typescriptlang.org/)

[![dependencies Status](https://david-dm.org/aims-group/metagrid/status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend)
[![devDependencies Status](https://david-dm.org/aims-group/metagrid/dev-status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend&type=dev)

### Prerequisites

- Node >= 8.10
- npm >= 5.6

See the section about [create-react-app requirements](https://reactjs.org/docs/create-a-new-react-app.html#create-react-app) for more information.

### [Resources](frontend/README.md)

## Back-end

[![Made with Django.](https://www.djangoproject.com/m/img/badges/djangomade124x25.gif)](http://www.djangoproject.com)

[![Updates](https://pyup.io/repos/github/aims-group/metagrid/shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Python 3](https://pyup.io/repos/github/aims-group/metagrid/python-3-shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Black code style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)

### [Resources](backend/README.md)

## Getting Started (Local Development)

### Pre-commit

This repo has default integration with precommit, a python package for identifying simple issues before submission to code review. You will need to setup the Python virtual environment to install pre-commit hooks into your local git repo.

The linters and stylers include:

- Code styling: prettier, black
- Linting: ESLint, flake8
- Static Type Checking: TypeScript, mypy

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r config/requirements/local.txt

pre-commit install
```

### Keycloak

#### Create user on Keycloak for authentication

1. Head over to `localhost:8080`
2. Login with admin credentials (automatically created with docker-compose)
   - username: admin
   - password: admin
3. Follow the rest of the instructions in the official Keycloak 'Getting Started Guided'
   - [https://www.keycloak.org/docs/latest/getting_started/#\_create-new-user](https://www.keycloak.org/docs/latest/getting_started/#_create-new-user)

#### Update /etc/hosts file

The front-end accesses Keycloak using [`localhost:8080`](http://localhost:8080), while the back-end uses `keycloak:8080` (the docker container name). This causes mismatching Auth URLs between the token issued by the front-end, and the keycloak validation performed back-end.

The current hacky work-around is to add a map between `keycloak` and `localhost`. **Please note**, the front-end will be dockerized as well so this will be a future non-issue.

1. Find your hosts file

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux: `/etc/hosts`

2. Append `127.0.0.1 keycloak` to the end of the file

#### Add Keycloak to Django

1. Add site to `django_site`

   - **domain**: localhost:8080
   - **name**: Keycloak

   \*\* make sure `id` is equal to 2 because `SITE_ID` is set to 2 in `config/base.py`

2. Add keycloak client to `socialaccount_socialapp_sites`
   - **provider**: keycloak
   - **name**: MetaGrid
   - **client_id**: backend
