# Getting Started for Local Development

Carefully follow the steps below for a smooth experience.

!!! note

    If you're new to Docker, please be aware that some resources are cached system-wide
    and might reappear if you generate a project multiple times with the same name (e.g.
    this issue with Postgres `<docker-postgres-auth-failed>`).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)
- Python >= 3.8 for Pre-commit (contributors)

## 1. Set up Pre-commit (contributors)

This repo has default integration with [pre-commit](https://pre-commit.com/), a tool for identifying simple issues before submission to code review. These checks are performed for all staged files using `git commit` before they are committed to a branch.

### 1.1 Integrated hooks

| Platform              | Code Styling                                     | Linting                                          | Type Checking                 |
| --------------------- | ------------------------------------------------ | ------------------------------------------------ | ----------------------------- |
| Python                | [black](https://black.readthedocs.io/en/stable/) | [flake8](https://github.com/PyCQA/flake8#flake8) | [mypy](http://mypy-lang.org/) |
| JavaScript/TypeScript | [prettier](https://prettier.io/)                 | [ESLint](https://eslint.org/)                    | N/A                           |

### 1.2 Install

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

## 2. Set up Back-end

Open the project in a terminal and `cd backend`.

### 2.1 Build and Run the Stack

This can take a while, especially the first time you run this particular command on your development system but subsequent runs will occur quickly:

```bash
docker-compose -p metagrid_backend_dev -f docker-compose.yml up --build
```

Remove the `--build` flag when you don't need to rebuild (e.g. no updates to Docker/docker-compose related files).

### 2.2 Additional Configuration

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
3. Follow the rest of the instructions in the official Keycloak guide to [create a new user](https://www.keycloak.org/docs/latest/getting_started/#creating-a-user)

### 2.3 Accessible Services

- Django: `localhost:8000`
- Keycloak: `localhost:8080`/`keycloak:8080`

### 2.4 Troubleshooting

#### Addressing Keycloak Boot Issue

Keycloak has a known fatal issue where if it is interrupted during boot (stopping `docker-compose up` prematurely), the command that adds the admin user fails.

As a result, the Keycloak docker service will not start and outputs the error **_"User with username 'admin' already..."_**.

If you run into this problem, follow these workaround steps:

1. Stop all back-end containers
   `docker-compose -p metagrid_dev_backend -f docker-compose.yml down`
2. Comment out the two relevant lines (`./backend/.envs/.local/.keycloak`)

   - `#KEYCLOAK_USER: admin`
   - `#KEYCLOAK_PASSWORD: pass`

3. Rebuild and restart the containers
   `docker-compose -f docker-compose.yml up --build`
4. Un-do commenting
   - `KEYCLOAK_USER: admin`
   - `KEYCLOAK_PASSWORD: pass`

Source:

- [https://issues.redhat.com/browse/KEYCLOAK-12896](https://issues.redhat.com/browse/KEYCLOAK-12896)
- [https://stackoverflow.com/a/59712689/8023435](https://stackoverflow.com/a/59712689/8023435)

## 3. Set up Front-end

Open the project in a terminal and `cd frontend`.

### 3.1 Build and Run the Stack

This can take a while, especially the first time you run this particular command on your development system but subsequent runs will occur quickly:

```bash
docker-compose -p metagrid_frontend_dev -f docker-compose.yml up --build
```

Remove the `--build` flag when you don't need to rebuild (e.g. no updates to Docker/docker-compose related files).

### 3.2 Accessible Services

- React: `localhost:3000`

---
