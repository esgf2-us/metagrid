# Getting Started for Production

While the stack runs out of the box, there are some settings you'll want to change before moving to production. All of these settings can be configured through environment variables. The easiest way to set these is through docker compose overlay files. The repository contains one such file: `docker-compose.prod.yml`. This production overlay blanks out a few unsafe settings used for development in order to ensure that they are properly configured in production. You'll create another overlay file with your own settings to be merged in with the production overlay and default settings at run time.

## Creating your site overlay file

Create a new file for your overlay; the name is arbitrary but by convention is usually `docker-compose.SITENAME-overlay.yml`. Begin with the following content:
```yaml
services:
  django:
    environment:
```
Read through the following configurable environment variables and set them as keys under the `environment` key of your site-specific overlay. For example:
```yaml
services:
  django:
    environment:
      METAGRID_SEARCH_URL: https://esgf-node.llnl.gov/esg-search/search
      METAGRID_WGET_URL: https://esgf-node.llnl.gov/esg-search/wget
      METAGRID_STATUS_URL: https://esgf-node.llnl.gov/proxy/status
      METAGRID_SOCIAL_AUTH_GLOBUS_KEY: 94c44808-9efd-4236-bffd-1185b1071736
      METAGRID_SOCIAL_AUTH_GLOBUS_SECRET: 34364292-2752-4d5e-8295
  react:
    environment:
      VITE_FEDERATED_NODES_URL: 'https://esgf.github.io/nodes.html'
```

Note that frontend-specific settings (prefixed with `VITE_`) should be set under the `react` service, while backend settings are set under the `django` service.
## Bringing up the stack in production

### Prerequisites

**For Docker:**
```bash
docker compose version
```

**For Podman (RHEL/CentOS/Fedora):**

Podman requires either the compose plugin or `podman-compose`. The `manage_metagrid.sh` script will automatically detect which is available.

**Option 1: Install podman-compose (recommended for RHEL):**
```bash
pip3 install --user podman-compose
# Verify installation
podman-compose --version
```

**Option 2: Use built-in compose plugin (RHEL 9+):**
```bash
# Check if available
podman compose version

# If not available, install podman-plugins
sudo dnf install podman-plugins
```

### Starting the Stack

**Using the management script (recommended):**
```bash
./manage_metagrid.sh
# Select option 1 for "Start Metagrid - Production"
```

The script automatically detects your container runtime and uses the appropriate commands.

**Manual command:**
```bash
# Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.SITENAME-overlay.yml up -d

# Podman with compose plugin
podman compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.SITENAME-overlay.yml up -d

# Podman with podman-compose
podman-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.SITENAME-overlay.yml up -d
```

With the stack running in production mode, you should be able to access the frontend at <https://sitename.com>

## Exposing it to the outside world

You can use the provided Traefik configuration to serve as a reverse proxy and provide a Let's Encrypt certificate (provided you have a public DNS entry pointed to port 80 on the machine running the stack that Let's Encrypt can use to verify control of the domain).

Modify your site overlay to set the DOMAIN_NAME environment variable and service ports for Traefik:
```yaml
services:
  django:
    environment:
      METAGRID_SEARCH_URL: https://esgf-node.llnl.gov/esg-search/search
      METAGRID_WGET_URL: https://esgf-node.llnl.gov/esg-search/wget
      METAGRID_STATUS_URL: https://esgf-node.llnl.gov/proxy/status
      METAGRID_SOCIAL_AUTH_GLOBUS_KEY: 94c44808-9efd-4236-bffd-1185b1071736
      METAGRID_SOCIAL_AUTH_GLOBUS_SECRET: 34364292-2752-4d5e-8295
  react:
    environment:
      VITE_FEDERATED_NODES_URL: 'https://esgf.github.io/nodes.html'
  traefik:
    environment:
      DOMAIN_NAME: my-domain.com
    ports:
    - 80:9080
    - 443:9443
```

And Traefik should now be serving on 80 and 443

## Helpful Commands

### Create a Superuser

Useful for logging into Django Admin page to manage the database.

```bash
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml run --rm django python manage.py createsuperuser
```

### Check logs

```bash
# Docker
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml logs

# Podman
podman compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml logs
# or
podman-compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml logs
```

### Check status of containers

```bash
# Docker
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml ps

# Podman
podman compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml ps
# or
podman-compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml ps
```

## Podman-Specific Notes

### Rootless vs Rootful Mode

Podman can run in two modes:

- **Rootless (recommended)**: Containers run as your user without sudo. Requires `podman-compose` or the compose plugin.
- **Rootful (with sudo)**: Containers run as root. May cause networking issues where the browser cannot connect to services.

**Always prefer rootless mode** by installing `podman-compose` as shown above.

### Troubleshooting Podman

**Issue: "Cannot connect to the Docker daemon at unix:///run/user/*/podman/podman.sock"**

This indicates the Podman socket is not running or `podman-compose` is not installed.

**Solution:**
```bash
# Install podman-compose
pip3 install --user podman-compose

# Verify
podman-compose --version

# Then run the management script
./manage_metagrid.sh
```

**Issue: "trigger-limit-hit" on podman.socket**

This occurs when using `docker-compose` with Podman socket API compatibility. The solution is to use `podman-compose` instead:

```bash
pip3 install --user podman-compose
```

The `manage_metagrid.sh` script will automatically prefer `podman-compose` over socket-based alternatives.
