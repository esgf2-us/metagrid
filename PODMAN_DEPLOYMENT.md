# Podman Production Deployment Guide

Metagrid fully supports **Podman** as a drop-in replacement for Docker on production servers.

---

## Quick Start (5 Steps)

For experienced admins who want to deploy immediately:

```bash
# 1. Install and enable Podman socket
sudo dnf install -y podman podman-compose
sudo systemctl enable --now podman.socket

# 2. Configure firewall (CRITICAL - DNS won't work without this)
sudo firewall-cmd --zone=trusted --add-interface=metagrid_br --permanent
sudo firewall-cmd --reload

# 3. Clone and configure
git clone https://github.com/esgf2-us/metagrid.git
cd metagrid
cp docker-compose-overlay-template.yml docker-compose-prod-overlay.yml
# Edit docker-compose-prod-overlay.yml - set your DOMAIN_NAME

# 4. (Optional) Add SSL certificates for custom cert deployment
mkdir -p traefik/certs
# Copy your cert.crt and cert.key to traefik/certs/

# 5. Deploy
sudo ./manage_metagrid.sh
# Choose: Production (1), Pre-built images (1), SSL method (1 or 2), Auth (1)
```

**Deployment time:** 2-5 minutes with pre-built images

**Default ports:** HTTP (80), HTTPS (443)

**Troubleshooting?** See [detailed sections below](#troubleshooting).

---

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] **Podman 4.0+** installed: `podman --version`
- [ ] **podman-compose 1.6.0+**: `podman-compose --version`
- [ ] **Podman socket running**: `sudo systemctl status podman.socket`
- [ ] **Firewall configured**: `sudo firewall-cmd --zone=trusted --add-interface=metagrid_br`
- [ ] **docker-compose-prod-overlay.yml** created with your DOMAIN_NAME
- [ ] **SSL certificates** ready (Let's Encrypt or custom)
- [ ] **Ports 80 and 443** publicly accessible
- [ ] **DNS** pointing to your server

**Need help?** See [detailed prerequisite setup](#detailed-prerequisites) below.

---

## SSL Certificate Options

Choose one option when running `./manage_metagrid.sh`:

### Option 1: Let's Encrypt (Automatic, Free)

**Requirements:**
- Domain resolves to your server's public IP
- Ports 80 and 443 publicly accessible
- Server can reach `acme-v02.api.letsencrypt.org`

**How to use:**
```bash
sudo ./manage_metagrid.sh
# Choose option 1 for SSL when prompted
```

**Certificate issued automatically** within 1-2 minutes.

### Option 2: Custom Certificates

**For internal servers or existing certificates (DigiCert, InCommon, etc.):**

```bash
# 1. Place certificates
mkdir -p traefik/certs
cp /path/to/your/cert.crt traefik/certs/
cp /path/to/your/cert.key traefik/certs/
chmod 644 traefik/certs/*.crt
chmod 600 traefik/certs/*.key

# 2. Deploy
sudo ./manage_metagrid.sh
# Choose option 2 for SSL when prompted
```

**File requirements:**
- `traefik/certs/cert.crt` - Your SSL certificate
- `traefik/certs/cert.key` - Your private key

---

## Verifying Deployment

After deployment completes:

```bash
# 1. Check all containers are running
sudo podman ps
# Expected: traefik, react, django, postgres all "Up"

# 2. Test container DNS
sudo podman exec traefik ping -c 2 react
sudo podman exec traefik ping -c 2 django

# 3. Test external DNS (for Let's Encrypt)
sudo podman exec traefik ping -c 2 google.com

# 4. Check Traefik logs for errors
sudo podman logs traefik | grep -i error

# 5. Access your site
curl -k https://your-domain.example.com
# Should return HTML (not 404)

# 6. Check SSL certificate
curl -vI https://your-domain.example.com 2>&1 | grep -i "issuer\|subject"
```

**All tests pass?** ✅ Deployment successful!  
**Something failed?** See [Troubleshooting](#troubleshooting) below.

---

## Detailed Prerequisites

### 1. Install Podman and podman-compose

**RHEL/Fedora/CentOS:**
```bash
sudo dnf install -y podman podman-compose fuse-overlayfs
podman --version
podman-compose --version
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y podman
pip3 install --user podman-compose
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Enable Podman Socket (CRITICAL)

**Required for Traefik service discovery:**

```bash
# Enable and start
sudo systemctl enable --now podman.socket

# Verify it's running
sudo systemctl status podman.socket
sudo ls -lh /run/podman/podman.sock
# Should show: srw-rw---- (socket file, not a directory)
```

**Why needed:** Traefik uses the Docker provider to discover containers via the Podman API socket.

**If socket fails to start:** The path may exist as an empty directory:
```bash
sudo rmdir /run/podman/podman.sock  # Remove if it's a directory
sudo systemctl start podman.socket
```

### 3. Configure Firewall (CRITICAL)

**Required for container DNS and Let's Encrypt:**

```bash
# Add Podman bridge to trusted zone (temporary test)
sudo firewall-cmd --zone=trusted --add-interface=metagrid_br

# Verify
sudo firewall-cmd --zone=trusted --list-all
# Should show: interfaces: metagrid_br

# Test deployment works
sudo ./manage_metagrid.sh  # Start services

# If successful, make permanent
sudo firewall-cmd --zone=trusted --add-interface=metagrid_br --permanent
sudo firewall-cmd --reload
```

**Why needed:**
- Without this, containers cannot resolve each other's hostnames
- External DNS queries timeout (breaks Let's Encrypt)
- Firewall blocks DNS forwarding from the Podman bridge network

**IMPORTANT:** Add firewall rule BEFORE starting containers. If added after:
```bash
sudo ./manage_metagrid.sh  # Stop (option 2)
sudo podman network rm metagrid_default  # Clear network state
sudo ./manage_metagrid.sh  # Start (recreates network)
```

### 4. Create Production Configuration

**Required for Traefik routing:**

```bash
# Use template as starting point
cp docker-compose-overlay-template.yml docker-compose-prod-overlay.yml

# Edit with your settings
nano docker-compose-prod-overlay.yml
```

**Minimum required settings:**
```yaml
services:
  traefik:
    environment:
      DOMAIN_NAME: your-domain.example.com

  django:
    environment:
      DOMAIN_NAME: your-domain.example.com
      DJANGO_ALLOWED_HOSTS: '["your-domain.example.com", "your-server-ip", "localhost"]'
      DJANGO_SECRET_KEY: 'generate-a-secure-random-key-here'
```

**The manage_metagrid.sh script automatically extracts DOMAIN_NAME** for Traefik routing labels.

---

## Deployment for NFS Storage (HPC/Shared Environments)

**For servers with NFS home directories, use pre-built images to avoid slow builds.**

### Storage Configuration (Choose One)

#### Option A: Local Disk (Recommended)

If you have local disk available (`df -h /var/tmp`):

```bash
mkdir -p ~/.config/containers

cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"
graphroot = "/var/tmp/podman-$USER"

[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
EOF

# Reset storage to apply configuration
podman system reset --force

# Verify
podman info | grep graphRoot
# Should show: graphRoot: /var/tmp/podman-<username>
```

**Benefits:** No permission issues, faster performance, standard Podman behavior.

#### Option B: NFS Storage (Not Recommended)

If local disk unavailable:

```bash
mkdir -p ~/.config/containers

# Storage configuration
cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"

[storage.options]
mount_program = "/usr/bin/fuse-overlayfs"

[storage.options.overlay]
force_mask = "0700"
ignore_chown_errors = "true"
skip_mount_home = "false"
mountopt = "nodev"
EOF

# Disable SELinux labeling (required for NFS)
cat > ~/.config/containers/containers.conf << 'EOF'
[containers]
label = false
EOF

# Reset storage
podman system reset --force

# Verify
podman info | grep -A 5 "store"
# Should show: force_mask: "0700", selinuxEnabled: false
```

### Deploy with Pre-built Images

```bash
git clone https://github.com/esgf2-us/metagrid.git
cd metagrid
git checkout <branch-or-tag>

# Create production config
cp docker-compose-overlay-template.yml docker-compose-prod-overlay.yml
# Edit docker-compose-prod-overlay.yml with your settings

# Deploy
sudo ./manage_metagrid.sh
```

Choose:
- **1** - Start Metagrid - Production
- **1** - Use pre-built images ← Recommended for NFS
- Press Enter for auto-detected image tag
- Choose auth method

**Deployment time:** 2-5 minutes (vs 15-25 minutes building locally)

---

## How It Works

### Automatic Container Runtime Detection

The `manage_metagrid.sh` script automatically detects your environment:

1. Checks for Docker - uses if available and running
2. Falls back to Podman if Docker isn't available
3. Selects compose method:
   - Native `podman compose` plugin (preferred)
   - Falls back to `podman-compose` standalone tool

### Compose File Layering

Files are layered in this order (Podman production):

1. `docker-compose.yml` - Base configuration
2. `docker-compose.prebuilt.yml` - Pre-built image tags (if chosen)
3. `docker-compose-prod-overlay.yml` - Your production settings
4. `docker-compose.globus.yml` - Auth configuration
5. `docker-compose.podman.yml` - Podman-specific overrides
6. `docker-compose.podman.letsencrypt.yml` OR `docker-compose.podman.customcert.yml` - SSL config

**Each file overrides settings from previous files.**

### Networking

**Container discovery:** Traefik's Docker provider queries the Podman API for container IPs and metadata via the socket (`/run/podman/podman.sock`).

**Container-to-container DNS:** Handled by aardvark-dns (e.g., `traefik` reaching `react` by hostname).

**External DNS:** Containers use aardvark-dns (10.89.1.1) with Google DNS (8.8.8.8) as fallback for Let's Encrypt and external queries.

---

## Troubleshooting

### Traefik Shows 404 Error

**Symptoms:** Site loads but shows "page not found"

**Solutions:**

```bash
# 1. Verify DOMAIN_NAME is configured
grep "DOMAIN_NAME:" docker-compose-prod-overlay.yml

# 2. Check firewall
sudo firewall-cmd --zone=trusted --list-all | grep metagrid_br

# 3. Verify Traefik can reach services
sudo podman exec traefik ping -c 2 react
sudo podman exec traefik ping -c 2 django

# 4. Check Traefik logs
sudo podman logs traefik | tail -50

# 5. Verify router labels
sudo podman inspect react --format='{{range $k,$v := .Config.Labels}}{{println $k "=" $v}}{{end}}' | grep traefik
```

### Let's Encrypt Certificate Fails

**Symptoms:** Browser shows "Not Secure" or certificate warning

**Cause 1: External DNS not working**

```bash
# Test external DNS
sudo podman exec traefik ping -c 2 google.com

# If fails, check firewall configuration above
```

**Cause 2: Port 443 not accessible**

```bash
# Test from external machine
telnet your-domain.example.com 443

# Or use: https://letsdebug.net/your-domain.example.com
```

**Workaround:** Use custom certificates (see SSL Options above)

### Container Can't Resolve Other Containers

**Symptoms:**
- Traefik logs: `dial tcp: lookup react: read udp ... i/o timeout`
- 404 errors or bad gateway

**Solution:** The `metagrid_br` interface must be in firewall trusted zone. See [Firewall Configuration](#3-configure-firewall-critical) above.

### Podman Socket Fails to Start

**Error:** `Socket trigger limit hit` or socket directory exists

```bash
# If socket path exists as directory
sudo rmdir /run/podman/podman.sock

# Restart socket
sudo systemctl restart podman.socket

# Verify
sudo ls -lh /run/podman/podman.sock
# Should show: srw-rw---- (socket file)
```

### Volume Creation Fails (NFS)

**Error:** `lsetxattr(label=...) operation not supported`

**Solution:** You're on NFS. Follow [NFS Storage Configuration](#option-b-nfs-storage-not-recommended) to disable SELinux labeling.

### Pre-built Images Not Found

**Error:** Failed to pull `ghcr.io/esgf2-us/metagrid-frontend:pr-XXX`

**Solutions:**

1. Check images exist: https://github.com/esgf2-us/metagrid/pkgs/container/metagrid-frontend
2. Try different tag: `export IMAGE_TAG=v1.6.3-rc2`
3. Build locally: Choose option 2 when prompted

### Build Takes Too Long (15+ minutes)

**Cause:** Building on NFS is extremely slow

**Solution:** Use pre-built images (option 1) instead

### Infinite Recursion / Segmentation Fault

**Symptoms:** `./manage_metagrid.sh` crashes immediately

**Solution:**
```bash
git pull  # Get latest manage_metagrid.sh with bug fix
./manage_metagrid.sh
```

### ARM64 Architecture Mismatch

**Error:** `no matching manifest for linux/arm64/v8`

**Cause:** Pre-built images are Linux amd64 only

**Solution:** On ARM64 (Mac M1/M2), build locally (option 2)

---

## Advanced Topics

### Rootful vs Rootless

**Local Development (`./manage_metagrid.sh` option 3):**  
- Rootless mode - no sudo required
- Uses high ports (9080/9443)

**Production Deployment (`./manage_metagrid.sh` option 1):**  
- Rootful mode - requires sudo
- Uses standard ports (80/443)

```bash
# Always use sudo for production
sudo ./manage_metagrid.sh  # Option 1

# Local development doesn't need sudo
./manage_metagrid.sh  # Option 3
```

**Why rootful for production:**
- Ports 80 and 443 require root privileges
- Ensures consistent behavior
- Simplifies firewall configuration

### Custom Storage Location

```bash
cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"
graphroot = "/custom/path/containers/storage"

[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
EOF

# Apply
podman system reset --force
```

### Performance Tips

1. **Use local storage** instead of NFS
2. **Use pre-built images** on NFS to avoid slow builds
3. **Increase ulimits** if seeing "too many open files"
4. **Enable lingering** on Linux: `sudo loginctl enable-linger $USER`

---

## Cleanup and Restart

```bash
# Stop all services
sudo ./manage_metagrid.sh  # Choose option 2

# Complete reset (removes all containers/images)
sudo podman system reset --force

# Redeploy
sudo ./manage_metagrid.sh  # Choose option 1
```

---

## Viewing Logs

```bash
# All containers
sudo podman logs traefik
sudo podman logs django
sudo podman logs react
sudo podman logs postgres

# Follow logs
sudo podman logs -f traefik

# Using compose
cd metagrid
sudo podman-compose -f docker-compose.yml -f docker-compose.podman.yml logs
```

---

## Getting Help

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section above
2. Verify Podman version: `podman --version` (need 4.0+)
3. Check configuration: `cat ~/.config/containers/storage.conf`
4. View system resources: `df -h` and `free -h`
5. Open an issue: https://github.com/esgf2-us/metagrid/issues

---

## Additional Resources

- [Podman Documentation](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/) - GUI for managing Podman
- [Rootless Containers](https://rootlesscontaine.rs/)
- [Metagrid Documentation](https://metagrid.readthedocs.io/)
