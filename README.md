# MetaGrid

![Front-end CI](https://github.com/aims-group/metagrid/workflows/Front-end%20CI/badge.svg)
![Back-end CI](https://github.com/aims-group/metagrid/workflows/Back-end%20CI/badge.svg)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/aims-group/metagrid/master.svg?style=flat-square)](https://codecov.io/gh/aims-group/metagrid/)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

Earth System Grid Federation's (ESGF) next generation search portal

## Repository Structure

This project contains front-end and back-end sub-projects.

## Front-end

[![React](frontend/src/assets/img/react_badge.svg)](https://reactjs.org/)
[![TypeScript](frontend/src/assets/img/typescript_badge.svg)](https://www.typescriptlang.org/)

[![dependencies Status](https://david-dm.org/aims-group/metagrid/status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend)
[![devDependencies Status](https://david-dm.org/aims-group/metagrid/dev-status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend&type=dev)

## Back-end

[![Made with Django.](https://www.djangoproject.com/m/img/badges/djangomade124x25.gif)](http://www.djangoproject.com)

[![Updates](https://pyup.io/repos/github/aims-group/metagrid/shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Python 3](https://pyup.io/repos/github/aims-group/metagrid/python-3-shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Black code style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Getting Started for Local Development

To get started with local development, you will need to carefully follow the steps below for a smooth experience.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)
- Python >= 3.7 for Git Pre-commit (contributors)

### 1. Set up Pre-commit (contributors)

This repo has default integration with [pre-commit](https://pre-commit.com/), a tool for identifying simple issues before submission to code review.

You will need to setup a Python virtual environment to install pre-commit hooks.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r config/requirements/local.txt

pre-commit install
```

Tools used with pre-commit:

- Code styling
  - [prettier](https://prettier.io/)
  - [black](https://black.readthedocs.io/en/stable/)
- Linting
  - [ESLint](https://eslint.org/)
  - [flake8](https://github.com/PyCQA/flake8#flake8)
- Static type checking
  - [mypy](http://mypy-lang.org/)

### 2. Set up Back-end

Open the project in a terminal and set the root directory to `backend`.

#### 2.1. Build the Stack

This can take a while, especially the first time you run this particular command on your development system:

```bash
docker-compose -f docker-compose.yml build
```

Generally, if you want to emulate production environment use `docker-compose.production.yml` instead. And this is true for any other actions you might need to perform: whenever a switch is required, just do it!

#### 2.2. Run the Stack

The first time bringing the containers up might take a while to get started, but subsequent runs will occur quickly.

```bash
docker-compose -f docker-compose.yml up
```

To run in a detached (background) mode, just:

```bash
docker-compose -f docker-compose.yml up -d
```

[Useful Django Management Commands](backend/README.md)

#### 2.3. Final Setup

##### 2.3.1. Create user on Keycloak for authentication

1. Head over to `localhost:8080`
2. Login with admin credentials (automatically created)
   - username: admin
   - password: admin
3. Follow the rest of the instructions in the official Keycloak guide to [create a new user](https://www.keycloak.org/docs/latest/getting_started/#creating-a-user)

##### 2.3.2. Update /etc/hosts file

The Keycloak docker service can be accessed by other containers over a shared network using its docker service name and port, `keycloak:8080`. More information can be found in Docker's [networking guide](https://docs.docker.com/compose/networking/).

For the host to be able to make requests from the browser to the Keycloak service, you will need to resolve the hostname `keycloak` to `localhost`.

1. Open your hosts file

   1. Mac/Linux: `/etc/hosts`
   2. Windows: `C:\Windows\System32\drivers\etc\hosts`

2. Append `0.0.0.0 keycloak` to the end of the file and save

#### 2.4. Accessing Services via Browser

- Django: `localhost:8000`
- Keycloak: `localhost:8080`

### 3. Set up Front-end

Open the project in a terminal and set the root directory to `frontend`.

#### 3.1. Build the Stack

This can take a while, especially the first time you run this particular command on your development system:

```bash
docker-compose -f docker-compose.yml build
```

Generally, if you want to emulate production environment use `docker-compose.production.yml` instead. And this is true for any other actions you might need to perform: whenever a switch is required, just do it!

#### 3.2. Run the Stack

The first time bringing the containers up might take a while to get started, but subsequent runs will occur quickly.

```bash
docker-compose -f docker-compose.yml up
```

To run in a detached (background) mode, just:

```bash
docker-compose -f docker-compose.yml up -d
```

[Useful React Scripts Commands](frontend/README.md)

#### 3.3. Accessing Services via Browser

- React: `localhost:3000`

## Getting Started for Production

Follow the same steps for building the local environment, with the exception of using `docker-compose.prod.yml` and updating the environment variables listed below.

Some settings take into account if the server is configured with or without a subdomain. Follow the examples without a subdomain if you are reproducing the production environment locally.

Finally, note that Keycloak is not included as a Docker service and must be a stand-alone instance hosted elsewhere.

### 1. Back-end Configuration

#### 1.1 Django

Directory: `backend/.envs/.production/.django`

##### `DJANGO_SECRET_KEY`

A secret key for a particular Django installation. This is used to provide cryptographic signing, and should be set to a unique, unpredictable value.

[Source Documentation](https://docs.djangoproject.com/en/3.0/ref/settings/#secret-key)

Example:

```env
DJANGO_SECRET_KEY=YAFKApvifkIFTw0DDNQQdHI34kyQdyWH89acWTogCfm4SGRz2x
```

##### `DJANGO_ADMIN_URL`

The url to access the Django Admin page. It should be set to a unique, unpredictable value (not `admin/`).

Example:

```env
DJANGO_ADMIN_URL=11hxhSu03aSBTOZWCysDvSvcDfa16kFh/
```

##### `DJANGO_ALLOWED_HOSTS`

A list of strings representing the host/domain names that this Django site can serve. This is a security measure to prevent HTTP Host header attacks, which are possible even under many seemingly-safe web server configurations.

[Source Documentation](https://docs.djangoproject.com/en/3.0/ref/settings/#allowed-hosts)

Example with subdomain:

```env
DJANGO_ALLOWED_HOSTS=metagrid
```

Example without subdomain:

If you are not using a subdomain of the domain name set in the project, set `DJANGO_ALLOWED_HOSTS` to your staging/production IP Address.

```env
DJANGO_ALLOWED_HOSTS=localhost
```

Failure to do this will mean you will not have access to your website through the HTTP protocol.

```bash
ERROR Invalid HTTP_HOST header: 'localhost:5000'. You may need to add 'localhost' to ALLOWED_HOSTS.
```

##### `DOMAIN_NAME`

The name of the domain linked to the server.

Example with subdomain:

```env
DOMAIN_NAME=https://backend.metagrid.com
```

Example without subdomain:

```env
DOMAIN_NAME=http://localhost:5000
```

##### `CORS_ORIGIN_WHITELIST`

List of origins that are authorized to make HTTP requests. Make sure to add the URL of the front-end here.

[Source Documentation](https://github.com/adamchainz/django-cors-headers#cors_origin_whitelist)

Example with domain:

```env
CORS_ORIGIN_WHITELIST=https://frontend.metagrid.com
```

Example without subdomain:

If you are not using a subdomain of the domain name set in the project, set `CORS_ORIGIN_WHITELIST` to your staging/production IP Address and port of the react front-end service.

```env
CORS_ORIGIN_WHITELIST=http://localhost:3000
```

##### `KEYCLOAK_URL`

The url of your hosted keycloak server, it must end with `/auth`.

[Source Documentation](https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak)

Example:

```env
KEYCLOAK_URL=https://keycloak.metagrid.com/auth
```

##### `KEYCLOAK_REALM`

The name of the `realm` you want to use.

[Source Documentation](https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak)

Example:

```env
KEYCLOAK_REALM=metagrid
```

##### `KEYCLOAK_CLIENT_ID`

The id for the Keycloak client, or a entity that can request Keycloak to authenticate a user.

Example:

```env
KEYCLOAK_CLIENT_ID=backend
```

### 2. Front-end Configuration

Directory: `frontend/.envs/.production/.react`

#### 2.1 MetaGrid API

##### `REACT_APP_API_PROTOCOL`

The protocol for the MetaGrid back-end API.

Example with subdomain:

```env
REACT_APP_API_PROTOCOL=https
```

Example without subdomain:

```env
REACT_APP_API_PROTOCOL=http
```

##### `REACT_APP_API_URL`

The URL for the MetaGrid back-end API.

Example with subdomain:

```env
REACT_APP_API_URL=backend.metagrid.com
```

Example without subdomain

```env
REACT_APP_API_URL=localhost
```

##### `REACT_APP_API_PORT`

The port for the MetaGrid back-end API.

Example:

```env
REACT_APP_API_PORT=8000
```

#### 2.2 ESGF wget API

[Documentation](https://github.com/ESGF/esgf-wget)

##### `REACT_APP_WGET_API_URL`

The URL for the ESGF wget API.

Example:

```env
REACT_APP_WGET_API_URL=https://pcmdi8vm.llnl.gov/wget
```

#### 2.3 ESGF Search API

[Documentation](https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API)

##### `REACT_APP_ESGF_NODE_PROTOCOL`

The protocol for the ESGF node.

Example:

```env
REACT_APP_ESGF_NODE_PROTOCOL=https://
```

##### `REACT_APP_ESGF_NODE_URL`

The URL for the ESGF node.

Example:

```env
REACT_APP_ESGF_NODE_URL=esgf-node.llnl.gov
```

#### 2.4 Keycloak

##### `REACT_APP_KEYCLOAK_REALM`

The name of the `realm` you want to use.

Example:

```env
REACT_APP_KEYCLOAK_REALM=metagrid
```

##### `REACT_APP_KEYCLOAK_URL`

The url of your hosted keycloak server, it must end with `/auth`.

Example:

```env
RKEYCLOAK_URL=https://keycloak.metagrid.com/auth
```

##### `REACT_APP_KEYCLOAK_CLIENT_ID`

The id for the Keycloak client, or a entity that can request Keycloak to authenticate a user.

Example:

```env
REACT_APP_KEYCLOAK_CLIENT_ID=frontend
```
