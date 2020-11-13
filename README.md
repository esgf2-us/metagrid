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

Keycloak has a known fatal issue where if it is interrupted during boot (stopping `docker-compose up` prematurely), the command that adds the admin user fails. As a result, the Keycloak docker service will not start and outputs the error _"User with username 'admin' already..."_.

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

### 1. Traefik

You will need to configure each router's `rule`, which is used to route a request to a service (e.g. django, react, proxy).

1. Enter directory `./backend/docker/production/traefik/`
2. Open `traefik.yml` in your editor
3. Edit rules for routers
   - Change `example.com` to the domain name (e.g. `esgf-dev1.llnl.gov`)
   - **OPTIONAL:** Change `/prefix` to the domain subdirectory for the service
     - For example, the `PathPrefix` for the rules of backend can be `/metagrid-backend` and frontend can be `/metagrid`.
     - **If you don't use a subdirectory, delete `` PathPrefix(`prefix`) `` for the service**

Once configured, Traefik will get you a valid certificate from Lets Encrypt and update it automatically.

### 2. Back-end

1. Enter directory: `./backend/.envs/.production/`
2. Copy env files `.django.template` and `.postgres.template`
3. Rename files as `.django` and `.postgres`
   | Service | Environment Variable | Description | Documentation | Type | Example |
   |---------- |---------------------------------------------------------------------------------------------------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |--------------------------------------------------------------------------------- |------------------ |----------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Django | `DJANGO_SECRET_KEY` | A secret key for a particular Django installation. This is used to provide cryptographic signing, and should be set to a unique, unpredictable value. | [Link](https://docs.djangoproject.com/en/3.0/ref/settings/#secret-key) | string | `DJANGO_SECRET_KEY=YAFKApvifkIFTw0DDNQQdHI34kyQdyWH89acWTogCfm4SGRz2x` |
   | Django | `DJANGO_ADMIN_URL` | The url to access the Django Admin page. It should be set to a unique, unpredictable value (not `admin/`). | | string | `DJANGO_ADMIN_URL=11hxhSu03aSBTOZWCysDvSvcDfa16kFh/` |
   | Django | `DJANGO_ALLOWED_HOSTS` | A list of strings representing the host/domain names that this Django site can serve. This is a security measure to prevent HTTP Host header attacks, which are possible even under many seemingly-safe web server configurations. | [Link](https://docs.djangoproject.com/en/3.0/ref/settings/#allowed-hosts) | array of strings | `DJANGO_ALLOWED_HOSTS=esgf-dev1.llnl.gov`<br><br>Local environment:<br>`DJANGO_ALLOWED_HOSTS=localhost` |
   | Django | `DOMAIN_NAME` | The domain linked to the server hosting the Django site. | | string | `DOMAIN_NAME=esgf-dev1.llnl.gov`<br><br>Local environment:<br>`DOMAIN_NAME=localhost` |
   | Django | `DOMAIN_SUBDIRECTORY` | **OPTIONAL** The domain subdirectory that is proxied to the Django site (e.g. _esgf-dev1.llnl.gov/metagrid-backend_). Omit backslash and match backend rules' `PathPrefix` in `traefik.yml`. | | string | `DOMAIN_SUBDIRECTORY=metagrid-backend` |
   | Django | `CORS_ORIGIN_WHITELIST` | List of origins that are authorized to make HTTP requests. Make sure to add the URL of the front-end here. | [Link](https://github.com/adamchainz/django-cors-headers#cors_origin_whitelist) | array of strings | `CORS_ORIGIN_WHITELIST=https://esgf-dev1.llnl.gov/metagrid`<br><br>Local environment:<br>`CORS_ORIGIN_WHITELIST=http://localhost:3000` |
   | Django | `KEYCLOAK_URL` | The url of your hosted Keycloak server, it must end with `/auth`. | [Link](https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak) | string | `KEYCLOAK_URL=https://keycloak.metagrid.com/auth` |
   | Django | `KEYCLOAK_REALM` | The name of the Keycloak realm you want to use. | [Link](https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak) | string | `KEYCLOAK_REALM=esgf` |
   | Django | `KEYCLOAK_CLIENT_ID` | The id for the Keycloak client, which is the entity that can request Keycloak to authenticate a user. | | string | `KEYCLOAK_CLIENT_ID=metagrid-backend` |
   | Postgres | `POSTGRES_HOST` <br> `POSTGRES_PORT`<br> `POSTGRES_DB`<br> `POSTGRES_USER`<br> `POSTGRES_PASSWORD` | The default Postgres environment variables are self-explanatory and can be updated if needed. | | string | N/A |

### 3. Front-end

1. Enter directory: `./frontend/.envs/.production/`
2. Copy env files `.proxy.template` and `.react.template`
3. Rename files as `.proxy` and `.react`

| Service | Environment Variable                     | Description                                                                                                                                                                                                                                                                      | Documentation                                                            | Type             | Example                                                                                                                                              |
| ------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| React   | `PUBLIC_URL`                             | **OPTIONAL**<br> The subdirectory of the domain where the project is hosted. Must include backslash and match frontend rules' `PathPrefix` in `traefik.yml`.                                                                                                                     | [Link](https://stackoverflow.com/a/58508562/8023435)                     | string           | `PROXY_URL=/metagrid`                                                                                                                                |
| React   | `REACT_APP_API_URL`                      | The URL for the MetaGrid API used to query projects, users, etc.                                                                                                                                                                                                                 |                                                                          | string           | `REACT_APP_METAGRID_API_URL=https://esgf-dev1.llnl/metagrid-backend`<br><br>Local environment:<br>`REACT_APP_METAGRID_API_URL=http://localhost:8000` |
| React   | `REACT_APP_WGET_API_URL`                 | The URL for the ESGF wget API to generate a wget script for downloading selected datasets.                                                                                                                                                                                       | [Link](https://github.com/ESGF/esgf-wget)                                | string           | `REACT_APP_WGET_API_URL=https://pcmdi8vm.llnl.gov/wget`                                                                                              |
| React   | `REACT_APP_ESGF_NODE_URL`                | The URL for the ESGF Search API node used to query datasets, files, and facets.                                                                                                                                                                                                  | [Link](https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API) | string           | `REACT_APP_ESGF_NODE_URL=https://esgf-node.llnl.gov`                                                                                                 |
| React   | `REACT_APP_PROXY_URL`                    | The URL for the proxy API that enables cross-origin requests to anywhere.                                                                                                                                                                                                        |                                                                          | string           | `REACT_APP_PROXY_URL=https://esgf-dev1.llnl.gov/`                                                                                                    |
| React   | `REACT_APP_KEYCLOAK_URL`                 | The url of your hosted Keycloak server, it must end with `/auth`.                                                                                                                                                                                                                |                                                                          | string           | `REACT_APP_KEYCLOAK_URL=https://keycloak.metagrid.com/auth`                                                                                          |
| React   | `REACT_APP_KEYCLOAK_REALM`               | The name of the Keycloak realm you want to use.                                                                                                                                                                                                                                  |                                                                          | string           | `REACT_APP_KEYCLOAK_REALM=esgf`                                                                                                                      |
| React   | `REACT_APP_KEYCLOAK_CLIENT_ID`           | The id for the Keycloak client, which is an entity that can request Keycloak to authenticate a user.                                                                                                                                                                             |                                                                          | string           | `REACT_APP_KEYCLOAK_CLIENT_ID=frontend`                                                                                                              |
| React   | `REACT_APP_HOTJAR_ID`                    | **OPTIONAL**<br>Your site's ID. This is the ID which tells Hotjar which site settings it should load and where it should save the data collected.                                                                                                                                | [Link](https://github.com/abdalla/react-hotjar)                          | number           | `REACT_APP_HOTJAR_ID=1234567`                                                                                                                        |
| React   | `REACT_APP_HOTJAR_SV`                    | **OPTIONAL**<br>The snippet version of the Tracking Code you are using. This is only needed if Hotjar ever updates the Tracking Code and needs to discontinue older ones. Knowing which version your site includes allows Hotjar team to contact you and inform you accordingly. | [Link](https://github.com/abdalla/react-hotjar)                          | number           | `REACT_APP_HOTJAR_SV=6`                                                                                                                              |
| React   | `REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID` | **OPTIONAL**<br>Google Analytics tracking id.                                                                                                                                                                                                                                    | [Link](https://github.com/react-ga/react-ga#api)                         | string           | `REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID=UA-000000-01`                                                                                                |
| Proxy   | `PROXY_ORIGIN_WHITELIST`                 | **OPTIONAL**<br> If set, requests whose origin is not listed are blocked. If this list is empty, all origins are allowed.                                                                                                                                                        | [Link](https://github.com/Rob--W/cors-anywhere#server)                   | array of strings | `PROXY_ORIGIN_WHITELIST=https://esgf-dev1.llnl.gov, http://esgf-dev1.llnl.gov`                                                                       |
