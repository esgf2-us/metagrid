# Getting Started for Production

Follow this page if you are interested in deploying or running the production environment locally.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)

## Configuring the Stack

Clone the project

```bash
git clone https://github.com/aims-group/metagrid.git
```

If you go to the root project directory for metagrid, you'll see there is a `manage_metagrid.sh` script.

This script provides some convenience functions for tasks related to running Metagrid. When preparing for production, you'll need to edit the file 'metagrid_config' located in the 'metagrid_configs' folder in the root directory. To do so, simply run the script: <code>./manage_metagrid.sh</code>
Then in the script's option menu, select the "Configure Metagrid" option.

This will open up an editor where you can enter the configuration parameters as needed (refer to table below). Once you save the config file and close the editor, the script will automatically copy the configuration to the necessary locations and save a backup using the current timestamp. If you change parameters in the future or need to revert your settings, you can do so by running the "Restore Backup Config" option in the `manage_metagrid.sh` script.

NOTE: You can easily generate a secret key with Python using this command:

`python3 -c 'import secrets; print(secrets.token_hex(100))'`

### Config Parameters

| Environment Variable                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                               | Documentation                                                                   | Type             | Example                                                                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| =========== TREAFIK CONFIG ============= |
| `DOMAIN_NAME`                            | The domain linked to the server hosting the Metagrid site.                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                 | string           | `DOMAIN_NAME=esgf-dev1.llnl.gov`<br><br>Local environment:<br>`DOMAIN_NAME=localhost`                                                                            |
| `PUBLIC_URL`                             | **OPTIONAL** The domain subdirectory that is used to serve the front-end. Leave blank if you want users to access the app from the domain directly.                                                                                                                                                                                                                                                                                                       |                                                                                 | string           | `DOMAIN_SUBDIRECTORY=metagrid`                                                                                                                                   |
| `DOMAIN_SUBDIRECTORY`                    | **OPTIONAL** The domain subdirectory that is proxied to the Django site (e.g. _esgf-dev1.llnl.gov/metagrid-backend_). Omit backslash and match backend rules' `PathPrefix` in `traefik.yml`.                                                                                                                                                                                                                                                              |                                                                                 | string           | `DOMAIN_SUBDIRECTORY=metagrid-backend`                                                                                                                           |
| =========== BACKEND CONFIG ============= |
| `DJANGO_SECRET_KEY`                      | A secret key for a particular Django installation. This is used to provide cryptographic signing, and should be set to a unique, unpredictable value.                                                                                                                                                                                                                                                                                                     | [Link](https://docs.djangoproject.com/en/3.0/ref/settings/#secret-key)          | string           | `DJANGO_SECRET_KEY=YAFKApvifkIFTw0DDNQQdHI34kyQdyWH89acWTogCfm4SGRz2x`                                                                                           |
| `DJANGO_ADMIN_URL`                       | The url to access the Django Admin page. It should be set to a unique, unpredictable value (not `admin/`). Take note of this value in order to access the admin page later on. For example with the settings shown here you would go to: https://esgf-dev1.llnl.gov/metagrid-backend/example_admin_url_87261847395 to access the admin site. Then you would use the admin credentials created when creating a django superuser (explained further below). |                                                                                 | string           | `DJANGO_ADMIN_URL=example_admin_url_87261847395`                                                                                                                 |
| `DJANGO_ALLOWED_HOSTS`                   | A list of strings representing the host/domain names that this Django site can serve. This is a security measure to prevent HTTP Host header attacks, which are possible even under many seemingly-safe web server configurations.                                                                                                                                                                                                                        | [Link](https://docs.djangoproject.com/en/3.0/ref/settings/#allowed-hosts)       | array of strings | `DJANGO_ALLOWED_HOSTS=esgf-dev1.llnl.gov`<br><br>Local environment:<br>`DJANGO_ALLOWED_HOSTS=localhost`                                                          |
| `KEYCLOAK_URL`                           | The url of your hosted Keycloak server, it must end with `/auth`.                                                                                                                                                                                                                                                                                                                                                                                         | [Link](https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak) | string           | `KEYCLOAK_URL=https://keycloak.metagrid.com/auth`                                                                                                                |
| `KEYCLOAK_REALM`                         | The name of the Keycloak realm you want to use.                                                                                                                                                                                                                                                                                                                                                                                                           | [Link](https://django-allauth.readthedocs.io/en/latest/providers.html#keycloak) | string           | `KEYCLOAK_REALM=esgf`                                                                                                                                            |
| `KEYCLOAK_CLIENT_ID`                     | The id for the Keycloak client, which is the entity that can request Keycloak to authenticate a user.                                                                                                                                                                                                                                                                                                                                                     |                                                                                 | string           | `KEYCLOAK_CLIENT_ID=metagrid-backend`                                                                                                                            |
| ========== FRONTEND CONFIG ============= |
| `REACT_APP_METAGRID_URL`                 | The URL for the MetaGrid API used to query projects, users, etc.                                                                                                                                                                                                                                                                                                                                                                                          |                                                                                 | string           | `REACT_APP_METAGRID_API_URL=https://esgf-dev1.llnl/metagrid-backend`<br><br>Local environment:<br>`REACT_APP_METAGRID_API_URL=http://localhost:8000`             |
| `REACT_APP_WGET_API_URL`                 | The URL for the ESGF wget API to generate a wget script for downloading selected datasets.                                                                                                                                                                                                                                                                                                                                                                | [Link](https://github.com/ESGF/esgf-wget)                                       | string           | `REACT_APP_WGET_API_URL=https://pcmdi8vm.llnl.gov/wget`                                                                                                          |
| `REACT_APP_ESGF_NODE_URL`                | The URL for the ESGF Search API node used to query datasets, files, and facets.                                                                                                                                                                                                                                                                                                                                                                           | [Link](https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API)        | string           | `REACT_APP_ESGF_NODE_URL=https://esgf-node.llnl.gov`                                                                                                             |
| `REACT_APP_ESGF_NODE_STATUS`             | The URL for the ESGF node status API node used to query node status.                                                                                                                                                                                                                                                                                                                                                                                      |                                                                                 | string           | `REACT_APP_ESGF_NODE_STATUS_URL=https://aims4.llnl.gov/prometheus/api/v1/query?query=probe_success%7Bjob%3D%22http_2xx%22%2C+target%3D~%22.%2Athredds.%2A%22%7D` |
| `REACT_APP_KEYCLOAK_URL`                 | The url of your hosted Keycloak server, it must end with `/auth`.                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                 | string           | `REACT_APP_KEYCLOAK_URL=https://keycloak.metagrid.com/auth`                                                                                                      |
| `REACT_APP_KEYCLOAK_REALM`               | The name of the Keycloak realm you want to use.                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                 | string           | `REACT_APP_KEYCLOAK_REALM=esgf`                                                                                                                                  |
| `REACT_APP_KEYCLOAK_CLIENT_ID`           | The id for the Keycloak client, which is an entity that can request Keycloak to authenticate a user.                                                                                                                                                                                                                                                                                                                                                      |                                                                                 | string           | `REACT_APP_KEYCLOAK_CLIENT_ID=frontend`                                                                                                                          |
| `REACT_APP_HOTJAR_ID`                    | **OPTIONAL**<br>Your site's ID. This is the ID which tells Hotjar which site settings it should load and where it should save the data collected.                                                                                                                                                                                                                                                                                                         | [Link](https://github.com/abdalla/react-hotjar)                                 | number           | `REACT_APP_HOTJAR_ID=1234567`                                                                                                                                    |
| `REACT_APP_HOTJAR_SV`                    | **OPTIONAL**<br>The snippet version of the Tracking Code you are using. This is only needed if Hotjar ever updates the Tracking Code and needs to discontinue older ones. Knowing which version your site includes allows Hotjar team to contact you and inform you accordingly.                                                                                                                                                                          | [Link](https://github.com/abdalla/react-hotjar)                                 | number           | `REACT_APP_HOTJAR_SV=6`                                                                                                                                          |
| `REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID` | **OPTIONAL**<br>Google Analytics tracking id.                                                                                                                                                                                                                                                                                                                                                                                                             | [Link](https://github.com/react-ga/react-ga#api)                                | string           | `REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID=UA-000000-01`                                                                                                            |

## Building and Running Services

Once you've finished the configuration, you will be ready to start the service containers.
Using the manage_metagrid.sh script you can start or stop all or specific docker containers by selecting the appropriate option in the menu. If you wish to start or stop a container manually, you need to go to the specific service directory, for example the frontend or backend, the run the command below:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

To run the stack and detach the containers, run:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## Post Build Steps

After running the containers for the first time, you should perform some other steps as well to finalize the production deployment of Metagrid.

### 1. Traefik Notes

> Traefik is a modern HTTP reverse proxy and load balancer that makes deploying microservices easy.
> &mdash; <cite><https://github.com/traefik/traefik></cite>

Once configured and running, Traefik will get you a valid certificate from Lets Encrypt and update it automatically. This service should be run before running the backend or frontend if starting it up manually. Using the script to run all containers will build and run them in the appropriate order.

### 2. Back-end Notes

#### 2.1 HTTPS is On by Default

If you are not using a subdomain of the domain name set in the project, then remember to put your staging/production IP address in the `DJANGO_ALLOWED_HOSTS` environment variable before you deploy the back-end. Failure to do this will mean you will not have access to your back-end services through the **HTTP protocol**.

Access to the Django admin is set up by default to require HTTPS in production or once live.

The Traefik reverse proxy used in the default configuration will get you a valid certificate from Lets Encrypt and update it automatically. All you need to do to enable this is to make sure that your DNS records are pointing to the server Traefik runs on.

You can read more about this feature and how to configure it, at [Automatic HTTPS](https://doc.traefik.io/traefik/https/acme/) in the Traefik docs.

#### 2.2 Run Django migrations

In production, you must apply Django migrations manually since they are not automatically applied to the database when you rebuild the docker-compose containers. To do so, with the backend docker container running, run the command below in the backend directory:

```bash
docker-compose -f docker-compose.prod.yml run --rm django python manage.py migrate
```

NOTE: If this step is skipped, you may see issues loading the project drop-down and search table results.

#### 2.3 Updating the database

In production, if the list of projects or specific groups, or facets need to be changed, the postgress database will need to be updated. Running migrations may not be possible without clearing the database tables and rebuilding them to include the new changes. There is a script that is designed to make the update process simpler, by first following the steps below:

- Edit the intial_project_data file with changes that you need to make: ~/metagrid/backend/metagrid/initial_projects_data.py
- Change directory to: ~/metagrid/backend
- Make backups and/or test changes locally to make sure the changes are correct before updating production. Start by running the local backend container:

```bash
docker compose -f docker-compose.yml up --build -d
```

- Then run the updateProjects script to update existing tables without removing user data:

```bash
./updateProjects.sh
```

Otherwise if you wish to clear the tables and start fresh, then run:

```bash
./updateProjects.sh --clear
```

- When satisfied with results, stop the local container and perform the same steps again with the production backend container running

#### 2.4 Helpful Commands

##### Run Command in Running Container

To run a command inside the docker container (front-end, backend, traefik) go to the appropriate directory and run:

```bash
docker-compose -f docker-compose.prod.yml run --rm django [command]
```

##### Creating a Superuser

With backend docker container running, run command below in the backend directory to create a superuser. Useful for logging into Django Admin page to manage the database.

```bash
docker-compose -f docker-compose.prod.yml run --rm django python manage.py createsuperuser
```

### 4. Supervisor

> Supervisor is a client/server system that allows its users to monitor and control a number of processes on UNIX-like operating systems.
> &mdash; <cite><http://supervisord.org/index.html></cite>

Once you are ready with your initial setup, you want to make sure that your application is run by a process manager to survive reboots and auto restarts in case of an error.

Although we recommend using Supervisor, you can use the process manager you are most familiar with. All it needs to do is to run `docker-compose -f production.yml up --build` for `traefik`, `backend`, and `frontend`.

#### 4.1 Install Supervisor

Ubuntu/Debian

```bash
sudo apt install supervisor -y
```

CentOS

```bash
sudo yum update -y
sudo yum install epel-release
sudo yum update
sudo yum -y install supervisor
```

#### 4.2 Enable Supervisor

```bash
sudo systemctl start supervisord
sudo systemctl enable supervisord
sudo systemctl status supervisord
```

#### 4.3 Create Supervisor configuration files

You can use the `.ini` configuration files below as starting points and configure where necessary.

The directory for where to store the `.ini` files vary based on the OS:

- For Ubuntu/Debian: `/etc/supervisor/conf.d/`
- For CentOS: `/etc/supervisor.d/`

`metagrid-traefik.ini`

```ini
[program:metagrid-traefik]
command=docker-compose -f docker-compose.prod.yml up --build
directory=/home/<username>/metagrid/traefik
redirect_stderr=true
autostart=true
autorestart=true
priority=10
```

`metagrid-backend.ini`

```ini
[program:metagrid-backend]
command=docker-compose -f docker-compose.prod.yml up --build
directory=/home/<username>/metagrid/backend
redirect_stderr=true
autostart=true
autorestart=true
priority=10
```

`metagrid-frontend.ini`

```ini
[program:metagrid-frontend]
command=docker-compose -f docker-compose.prod.yml up --build
directory=/home/<your-username>/metagrid/frontend
redirect_stderr=true
autostart=true
autorestart=true
priority=10
```

#### 4.4 Load configurations and start the processes

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

#### 4.5 Check the status

```bash
sudo supervisorctl status
```

Example output

```bash
metagrid-backend                 RUNNING   pid 9359, uptime 1 day, 0:07:28
metagrid-frontend                RUNNING   pid 6819, uptime 1 day, 0:42:53
metagrid-traefik                 RUNNING   pid 9871, uptime 1 day, 0:03:27
```

#### 4.6 Restart or Stop Containers

If you need to manually restart or stop production services for some reason, you must first stop supervisor from restoring the services as soon as they're stopped.

```bash
sudo supervisorctl stop all # Stops supervisor from restoring containers
```

Then either use the manage_metagrid.sh scripts to stop services, or you can go to the directory of the service(s) that you want to stop. For example if you need to stop the frontend and backend services to do a rebuild then:

```bash
cd ./backend # Shutting off backend service
docker-compose -f docker-compose.prod.yml down # Shut down the container
cd ./frontend # Shutting off frontend service
docker-compose -f docker-compose.prod.yml down
```

When you are ready to restore services, you can do so manually using docker-compose:

```bash
docker-compose -f docker-compose.prod.yml up --build # Start the container
```

Or let supervisor restore all:

```bash
sudo supervisorctl start all # Will restore supervisor service and any stopped containers
```

## Helpful Docker-Compose Commands

These commands can be run on any `docker-compose.prod.yml` file.

### Check logs

```bash
docker-compose -f docker-compose.prod.yml logs
```

### Check status of containers

```bash
docker-compose -f docker-compose.prod.yml ps
```
