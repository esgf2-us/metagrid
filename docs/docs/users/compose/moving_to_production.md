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

**The simplest approach is rootful Podman with sudo:**

```bash
# 1. Install Podman and podman-compose
sudo dnf install -y podman fuse-overlayfs
sudo dnf install -y python3-pip || sudo yum install -y python3-pip
sudo pip3 install podman-compose

# 2. Verify installation
sudo podman --version
sudo podman-compose --version

# 3. Configure Podman for root (disable SELinux, configure DNS)
# Since we use sudo, configure for root user
sudo mkdir -p /root/.config/containers
sudo bash -c 'cat > /root/.config/containers/containers.conf << "EOF"
[containers]
label = false

[network]
# Use Google DNS (or replace with your organization's DNS servers)
dns_servers = ["8.8.8.8", "8.8.4.4"]
EOF'

# 4. Enable system Podman socket
sudo systemctl enable --now podman.socket

# That's it! Use sudo with the management script.
sudo ./manage_metagrid.sh
```

**For development/testing with rootless Podman (requires admin setup):**

If you need rootless mode, ask your system administrator to configure subuid/subgid ranges first:

```bash
# Admin runs:
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 <username>
```

Then follow the rootless setup in the PODMAN_SUPPORT.md documentation.

### Starting the Stack

**Using the management script with Podman (recommended for RHEL):**

```bash
sudo ./manage_metagrid.sh
# Select option 1 for "Start Metagrid - Production"
```

The script automatically detects your container runtime and uses the appropriate commands.

**Using the management script with Docker:**

```bash
./manage_metagrid.sh
# Select option 1 for "Start Metagrid - Production"
```

**Manual commands:**

```bash
# Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.SITENAME-overlay.yml up -d

# Podman (rootful with sudo - recommended for RHEL)
sudo podman-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.SITENAME-overlay.yml up -d

# Podman (rootless - requires subuid/subgid configuration)
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

# Podman (rootful - use sudo)
sudo podman logs <container-name>
# or
sudo podman-compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml logs
```

### Check status of containers

```bash
# Docker
docker compose ps

# Podman (rootful - use sudo)
sudo podman ps
# or
sudo podman-compose ps
```

## Podman-Specific Notes for RHEL Production

### Rootful vs Rootless Mode

Podman can run in two modes:

- **Rootful (with sudo) - Recommended for RHEL production**: Containers run as root. Works reliably on NFS home directories and shared servers without additional configuration. Browser access works normally when ports are bound to `0.0.0.0`.

- **Rootless (without sudo) - Requires admin setup**: Containers run as your user. Requires:
  - Subuid/subgid ranges configured by system administrator
  - Local (non-NFS) storage or special NFS configuration
  - More complex troubleshooting for SELinux/filesystem issues

**For typical RHEL production environments with NFS home directories, use rootful mode with sudo.**

### Troubleshooting Podman on RHEL

**Issue: "cannot find UID/GID for user: no subuid ranges found"**

This is expected on RHEL servers. Use rootful Podman with sudo instead:

```bash
sudo ./manage_metagrid.sh
```

**Issue: "lsetxattr(label=...) operation not supported" or SELinux errors**

Your filesystem doesn't support SELinux extended attributes (common with NFS). Disable SELinux for your containers:

```bash
# Create containers config
mkdir -p ~/.config/containers
cat > ~/.config/containers/containers.conf << 'EOF'
[containers]
label = false
EOF

# Reset Podman storage
sudo podman system reset --force

# Try again
sudo ./manage_metagrid.sh
```

**Issue: "Network file system detected as backing store"**

This is a warning, not an error. Your home directory is on NFS, which is normal for RHEL servers. The warning can be safely ignored, or you can silence it by adding `force_mask = "700"` to your storage.conf.

**Issue: Browser cannot connect to services**

Check that:

1. Services are actually running: `sudo podman ps`
2. Ports are bound to `0.0.0.0` (not 127.0.0.1)
3. Firewall allows traffic: `sudo firewall-cmd --list-ports`
4. SELinux is not blocking (check logs): `sudo ausearch -m avc -ts recent`
