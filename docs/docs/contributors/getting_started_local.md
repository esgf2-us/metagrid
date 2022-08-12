# Getting Started for Local Development

!!! note

    If you're new to Docker, please be aware that some resources are cached system-wide
    and might reappear if you generate a project multiple times with the same name (e.g.
    this issue with Postgres `<docker-postgres-auth-failed>`).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)
- Python >= 3.8 to create virtual environment for `pre-commit` package

## 1. Clone your fork and keep in sync with upstream `master`

```bash
git clone https://github.com/<your-github-username>/metagrid.git
```

Rebase your fork with upstream to keep in sync

```bash
# Add the remote, call it "upstream":
git remote add upstream https://github.com/aims-group/metagrid.git

# Fetch all the branches of that remote into remote-tracking branches
git fetch upstream

# Make sure that you're on your master branch:
git checkout master

# Rewrite your master branch so that any of your commits that
# aren't already in upstream/master are replayed on top of the
# other branch:
git rebase upstream/master
git push -f origin master
```

Checkout a new branch from `master`.

```bash
git checkout -b <branch-name> master
```

## 2. Set up `pre-commit`

This repo has default integration with [pre-commit](https://pre-commit.com/), a tool for identifying simple issues before submission to code review. These checks are performed for all staged files using `git commit` before they are committed to a branch.

### 2.1 Integrated Hooks (Quality Assurance Tools)

| Platform              | Code Formatter                                   | Linter                                           | Type Checker                  |
| --------------------- | ------------------------------------------------ | ------------------------------------------------ | ----------------------------- |
| Python                | [black](https://black.readthedocs.io/en/stable/) | [flake8](https://github.com/PyCQA/flake8#flake8) | [mypy](http://mypy-lang.org/) |
| JavaScript/TypeScript | [prettier](https://prettier.io/)                 | [ESLint](https://eslint.org/)                    | N/A                           |

### 2.2 Install

```bash

# Create a python3 virtual environment using system-level Python.
# There may be alternative ways for you to do this.
python3 -m venv backend/venv

# Activate the virtual environment
source backend/venv/bin/activate

# Install local requirements
pip install -r requirements/local.txt

# Install pre-commit hooks
pre-commit install
```

**Note: any update to `.pre-commit.config.yaml` requires a reinstallation of the hooks**

### 2.3 Helpful Commands

Automatically run all pre-commit hooks (just commit)

```bash
git commit -m '...'
```

![Pre-commit Output](../images/pre-commit-passing.png)

Manually run all pre-commit hooks

```bash
pre-commit run --all-files.
```

Run individual hook

```bash
# Available hook ids: trailing-whitespace, end-of-file-fixer, check-yaml, black, isort, flake8, mypy
pre-commit run <hook_id>.
```

## 3. Set up Back-end

Open the project in a terminal and `cd backend`.

### 3.1 Build and Run the Stack

This can take a while, especially the first time you run this particular command on your development system but subsequent runs will occur quickly:

```bash
docker-compose -p metagrid_backend_dev up --build
```

### 3.2 Additional Configuration

#### Update `/etc/hosts` file

The Keycloak docker service can be accessed by other containers over a shared network using its docker service name and port, `keycloak:8080`. More information on how this works can be found in Docker's [networking guide](https://docs.docker.com/compose/networking/).

You will need to bind the hostname `keycloak` to `localhost` to allow the browser to make requests to the Keycloak service. Otherwise, it will not recognize the hostname and a network connection won't be established.

1. Open your hosts file with admin privileges
   1. Mac/Linux: `/etc/hosts`
   2. Windows: `C:\Windows\System32\drivers\etc\hosts`
2. Append `127.0.0.1 keycloak` to the end of the file and save

#### Create user on Keycloak for authentication

This user will be used for logging into registered Keycloak clients, including the React and Django services.

1. Head over to `localhost:8080`/`keycloak:8080`
2. Login with admin credentials (automatically created)
   - username: admin
   - password: admin
3. Follow the official Keycloak instructions to [create a new user](https://www.keycloak.org/docs/latest/getting_started/#creating-a-user)

### 3.3 Accessible Services

- Django: `localhost:8000`
- Keycloak: `localhost:8080`/`keycloak:8080`

### 3.4 Troubleshooting

#### Addressing Keycloak Boot Issue

Keycloak has a known fatal issue where if it is interrupted during boot (stopping `docker-compose up` prematurely), the command that adds the admin user fails.

As a result, the Keycloak docker service will not start and outputs the error **_"User with username 'admin' already..."_**.

If you run into this problem, follow these workaround steps:

1. Stop all back-end containers
   `docker-compose -p metagrid_backend_dev down`
2. Comment out the two relevant lines (`./backend/.envs/.local/.keycloak`)

   - `#KEYCLOAK_USER: admin`
   - `#KEYCLOAK_PASSWORD: pass`

3. Rebuild and restart the containers
   `docker-compose -p metagrid_backend_dev up --build`
4. Un-do commenting
   - `KEYCLOAK_USER: admin`
   - `KEYCLOAK_PASSWORD: pass`

Source:

- [https://issues.redhat.com/browse/KEYCLOAK-12896](https://issues.redhat.com/browse/KEYCLOAK-12896)
- [https://stackoverflow.com/a/59712689/8023435](https://stackoverflow.com/a/59712689/8023435)

## 4. Set up Front-end

Open the project in a terminal and `cd frontend`.

### 4.1 Build and Run the Stack

This can take a while, especially the first time you run this particular command on your development system but subsequent runs will occur quickly:

```bash
docker-compose -p metagrid_frontend_dev up --build
```

### 4.2 Accessible Services

- React: `localhost:3000`

---

## Convenience Script for Common Tasks

If you cd to the root project directory for metagrid, you'll see there is a `manage_metagrid.sh` script. 

This script provides some convenience functions for common tasks related to running Metagrid. Selecting the 'Start / Stop Local Dev Containers' option in the main menu will automatically build the frontend and backend local containers using the same commands described earlier on this page. If the containers are already running, then the same option will stop the containers instead.

This is a quick way to start and stop the Metagrid app for local development. The other functions in the script are related to production mode and are explained further here: [Getting Started for Production](getting_started_production.md)

## VSCode Configuration

`.vscode/settings.json` files are provided to automatically configure your VSCode to leverage the quality assurance tools even if you use workspaces or open the folder directly.

## Third Party Tool Integration

Code coverage: [![Codecov Coverage](https://codecov.io/gh/aims-group/metagrid/branch/master/graph/badge.svg)](https://codecov.io/gh/aims-group/metagrid/)

Dependency Monitoring: [![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/) [![Updates](https://pyup.io/repos/github/aims-group/metagrid/shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)

Docs: [![Documentation Status](https://readthedocs.org/projects/metagrid/badge/?version=latest)](https://metagrid.readthedocs.io/en/latest/?badge=latest)
