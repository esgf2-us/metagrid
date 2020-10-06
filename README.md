# MetaGrid

![Front-end CI](https://github.com/aims-group/metagrid/workflows/Front-end%20CI/badge.svg)
![Back-end CI](https://github.com/aims-group/metagrid/workflows/Back-end%20CI/badge.svg)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/aims-group/metagrid/master.svg?style=flat-square)](https://codecov.io/gh/aims-group/metagrid/)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

Earth System Grid Federation's (ESGF) next generation search portal

## Repository Structure

This project contains front-end and back-end sub-projects.

### Front-end

[![React](frontend/src/assets/img/react_badge.svg)](https://reactjs.org/)
[![TypeScript](frontend/src/assets/img/typescript_badge.svg)](https://www.typescriptlang.org/)

[![dependencies Status](https://david-dm.org/aims-group/metagrid/status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend)
[![devDependencies Status](https://david-dm.org/aims-group/metagrid/dev-status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend&type=dev)

### Back-end

[![Made with Django.](https://www.djangoproject.com/m/img/badges/djangomade124x25.gif)](http://www.djangoproject.com)

[![Updates](https://pyup.io/repos/github/aims-group/metagrid/shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Python 3](https://pyup.io/repos/github/aims-group/metagrid/python-3-shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Black code style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Getting Started for Local Development

Carefully follow the steps below for a smooth experience.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)
- Python >= 3.7 for Pre-commit (contributors)

### 1. Set up Pre-commit (contributors)

This repo has default integration with [pre-commit](https://pre-commit.com/), a tool for identifying simple issues before submission to code review. These checks are performed for all staged files using `git commit` before they are committed to a branch.

#### 1.1 Integrated tools

| Platform              | Code Styling                                     | Linting                                          | Type Checking                 |
| --------------------- | ------------------------------------------------ | ------------------------------------------------ | ----------------------------- |
| Python                | [black](https://black.readthedocs.io/en/stable/) | [flake8](https://github.com/PyCQA/flake8#flake8) | [mypy](http://mypy-lang.org/) |
| JavaScript/TypeScript | [prettier](https://prettier.io/)                 | [ESLint](https://eslint.org/)                    | N/A                           |

#### 1.2 Install

```bash
cd backend

# Create a python3 virtual environment using system-level Python
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install local requirements
pip install -r requirements/local.txt

# Install pre-commit hooks
pre-commit install
```

**Note**, any update to `.pre-commit.config.yaml` requires a re-installation of the hooks.

### 2. Set up Back-end

Open the project in a terminal and `cd backend`.

#### 2.1 Build and Run the Stack

This can take a while, especially the first time you run this particular command on your development system but subsequent runs will occur quickly:

```bash
docker-compose -f docker-compose.yml up --build
```

Remove the `--build` flag when you don't need to rebuild (e.g. no updates to Docker/docker-compose related files).

[Useful Django Management Commands](backend/README.md)

##### 2.1.1 Addressing Keycloak Boot Issue

Keycloak has a known fatal issue where if it is interrupted during boot (stopping docker-compose up prematurely), the command that adds the admin user fails. As a result, the Keycloak docker service will not start and outputs the error: _"User with username 'admin' already..."_.

If you run into this problem, follow these work-around steps:

1. Stop all backend containers
   `docker-compose -f docker-compose.yml down`
2. Comment out the two relevant lines

   ```env
   # File: ./backend/.envs/.local/.keycloak

   # KEYCLOAK_USER: admin
   # KEYCLOAK_PASSWORD: pass
   ```

3. Rebuild and restart the containers
   `docker-compose -f docker-compose.yml up --build`
4. Un-do commenting

   ```env
    # File: ./backend/.envs/.local/.keycloak

   KEYCLOAK_USER: admin
   KEYCLOAK_PASSWORD: pass
   ```

Source:

- https://issues.redhat.com/browse/KEYCLOAK-12896
- https://stackoverflow.com/a/59712689/8023435

#### 2.2 Final Setup

##### 2.2.1 Update /etc/hosts file

The Keycloak docker service can be accessed by other containers over a shared network using its docker service name and port, `keycloak:8080`. More information on how this works can be found in Docker's [networking guide](https://docs.docker.com/compose/networking/).

You will need to bind the hostname `keycloak` to `localhost` to allow the browser to make requests to the Keycloak service. Otherwise, it will not recognize the hostname.

1. Open your hosts file with admin privileges

   1. Mac/Linux: `/etc/hosts`
   2. Windows: `C:\Windows\System32\drivers\etc\hosts`

2. Append `127.0.0.1 keycloak` to the end of the file and save

##### 2.2.2 Create user on Keycloak for authentication

This user will be used for logging into registered Keycloak clients, including the React and Django services.

1. Head over to `localhost:8080`/`keycloak:8080`
2. Login with admin credentials (automatically created)
   - username: admin
   - password: admin
3. Follow the rest of the instructions in the official Keycloak guide to [create a new user](https://www.keycloak.org/docs/latest/getting_started/#creating-a-user)

#### 2.3 Accessible Services

- Django: `localhost:8000`
- Keycloak: `localhost:8080`/`keycloak:8080`

### 3. Set up Front-end

Open the project in a terminal and `cd frontend`.

#### 3.1 Build and Run the Stack

This can take a while, especially the first time you run this particular command on your development system but subsequent runs will occur quickly:

```bash
docker-compose -f docker-compose.yml up --build
```

Remove the `--build` flag when you don't need to rebuild (e.g. no updates to Docker/docker-compose related files).

[Useful React Scripts Commands](frontend/README.md)

#### 3.2 Accessible Services

- React: `localhost:3000`

## Getting Started for Production

Building the production environment involves the same steps as local; however, use `docker-compose.production.yml` instead. The environment also needs to be configured.

Some environment variables take into account if the server is configured with or without a subdomain. Follow the examples **without** a subdomain if you are reproducing the production environment locally.

Finally, Keycloak is not a Docker service and must be hosted as a stand-alone instance.

### 1. Back-end Configuration

1. Enter directory: `./backend/.envs/.production/`
2. Copy env files `.django.template` and `.postgres.template`
3. Rename files as `.django` and `.postgres`

#### 1.1 Django

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

#### 1.2 Postgres

The default postgres environment variables can be updated as desired and are self-explanatory.

### 2. Front-end Configuration

1. Enter directory: `./frontend/.envs/.production/`
2. Copy env files `.proxy.template` and `.react.template`
3. Rename files as `.proxy` and `.react`

#### 2.1 React

##### 2.1.1 MetaGrid API

##### `REACT_APP_API_URL`

The URL for the MetaGrid API.

Example with subdomain:

```env
REACT_APP_METAGRID_API_URL=https://backend.metagrid.com
```

Example without subdomain

```env
REACT_APP_METAGRID_API_URL=http://localhost:8000
```

##### 2.1.2 ESGF wget API

[Documentation](https://github.com/ESGF/esgf-wget)

##### `REACT_APP_WGET_API_URL`

The URL for the ESGF wget API.

Example:

```env
REACT_APP_WGET_API_URL=https://pcmdi8vm.llnl.gov/wget
```

##### 2.1.3 ESGF Search API

[Documentation](https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API)

##### `REACT_APP_ESGF_NODE_URL`

The URL for the ESGF node.

Example:

```env
REACT_APP_ESGF_NODE_URL=https://esgf-node.llnl.gov
```

##### 2.1.4 Keycloak

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
REACT_APP_KEYCLOAK_URL=https://keycloak.metagrid.com/auth
```

##### `REACT_APP_KEYCLOAK_CLIENT_ID`

The id for the Keycloak client, or a entity that can request Keycloak to authenticate a user.

Example:

```env
REACT_APP_KEYCLOAK_CLIENT_ID=frontend
```

#### 2.2 Proxy

The default proxy configuration does not need to be updated.
