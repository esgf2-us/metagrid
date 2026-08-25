# Podman Deployment Guide

Metagrid fully supports **Podman** as a drop-in replacement for Docker. The `manage_metagrid.sh` script automatically detects your container runtime and adapts accordingly.

## Quick Start

Choose the section that matches your deployment scenario:

- **[NFS Storage / RHEL Production](#nfs-deployment-rhel-production)** - For servers with NFS home directories (most HPC environments)
- **[Standard Linux/macOS](#standard-deployment)** - For local development or servers with local storage
- **[Installation](#installation)** - First-time Podman setup

---

## NFS Deployment (RHEL Production)

**For servers with NFS storage (common in HPC/shared environments), use pre-built images to avoid build issues.**

### Prerequisites

- Podman installed
- **podman-compose 1.6.0+** required: `pip3 install --user podman-compose>=1.6.0`
  - Check version: `podman-compose --version`
  - If multiple versions exist, ensure `~/.local/bin` is first in PATH
- Internet access to ghcr.io (no authentication needed)
- Linux amd64 architecture (pre-built images not available for ARM64)

### One-Time Setup: Configure Podman Storage

**CRITICAL:** Rootless Podman on NFS has severe limitations. **Strongly recommended: use local disk for storage.**

#### Option A: Use Local Disk (Recommended)

If you have local disk available (check with `df -h /var/tmp`):

```bash
mkdir -p ~/.config/containers

# Configure Podman to use local disk instead of NFS
cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"
graphroot = "/var/tmp/podman-$USER"

[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
EOF

# Reset storage to apply new configuration
podman system reset --force

# Verify new location
podman info | grep graphRoot
# Should show: graphRoot: /var/tmp/podman-<username>
```

**Benefits:**
- No permission issues with postgres/database volumes
- Faster performance
- Standard Podman behavior

#### Option B: Stay on NFS (Not Recommended)

If local disk is unavailable, configure for NFS (expect permission issues):

**Step 1: Create Podman Configuration Files**

```bash
mkdir -p ~/.config/containers

# Storage configuration
cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"

[storage.options]
mount_program = "/usr/bin/fuse-overlayfs"

[storage.options.overlay]
# Required for NFS - disable SELinux labeling
force_mask = "0700"
ignore_chown_errors = "true"
skip_mount_home = "false"
mountopt = "nodev"
EOF

# Container configuration to disable SELinux labeling
cat > ~/.config/containers/containers.conf << 'EOF'
[containers]
# Disable SELinux labeling (required for NFS)
label = false
EOF
```

**Step 2: Reset Podman Storage**

⚠️ **WARNING:** This will delete all existing containers, images, and volumes.

```bash
podman system reset --force
```

**Step 3: Verify Configuration**

```bash
podman info | grep -A 5 "store"
```

You should see:
- `force_mask: "0700"`
- `Backing Filesystem: nfs`
- `mount_program: fuse-overlayfs`
- `selinuxEnabled: false`

### Deploy with Pre-built Images

```bash
# Clone and checkout
git clone https://github.com/esgf2-us/metagrid.git
cd metagrid
git checkout <branch-or-tag>

# Deploy
./manage_metagrid.sh
```

Choose:
- **1** - Start Metagrid - Production
- **1** - Use pre-built images ← Recommended for NFS!
- Enter image tag (or press Enter for auto-detected default)
- Your auth method (Globus, Keycloak, or None)

**Deployment time:** 2-5 minutes (vs 15-25 minutes if building locally)

### Accessing the Site

Rootless Podman deployments use **unprivileged ports** (automatically configured):

- **HTTP:** `http://your-server:8080`
- **HTTPS:** `https://your-server:8443`

If you need standard ports (80/443), you must run rootful Podman with `sudo` or enable unprivileged port binding:

```bash
# Option 1: Run rootful (recommended if available)
sudo ./manage_metagrid.sh

# Option 2: Enable unprivileged ports system-wide (requires admin)
sudo sysctl net.ipv4.ip_unprivileged_port_start=80
```

### About Pre-built Images

Pre-built images are automatically created by the development team and published to GitHub Container Registry (GHCR). They are **public** and require no authentication.

**Available tags:**
- `pr-XXX` - Specific pull request builds (e.g., pr-937)
- `vX.X.X` - Release versions (e.g., v1.6.3-rc2)

**View available images:**
- Frontend: https://github.com/esgf2-us/metagrid/pkgs/container/metagrid-frontend
- Backend: https://github.com/esgf2-us/metagrid/pkgs/container/metagrid-backend

**The script automatically detects your PR/branch** and suggests the appropriate tag.

---

## Standard Deployment

For local development or servers **without NFS storage**, you can build images locally.

### Deploy

```bash
./manage_metagrid.sh
```

Choose:
- **1** - Start Metagrid - Production (or **3** for local dev)
- **2** - Build images locally
- Your auth method

The script automatically detects and uses Podman.

---

## Installation

### Prerequisites

- **macOS**: Homebrew (https://brew.sh)
- **Linux**: Package manager access (apt, dnf, or yum)
- **All platforms**: Python 3.6+

### Option 1: Podman + podman-compose (Recommended)

**macOS:**

```bash
# Install Podman
brew install podman

# Initialize and start Podman machine
podman machine init
podman machine start

# Install podman-compose
pip3 install podman-compose

# Add to PATH if needed
export PATH="$HOME/Library/Python/3.*/bin:$PATH"
echo 'export PATH="$HOME/Library/Python/3.*/bin:$PATH"' >> ~/.zshrc

# Verify
podman --version
podman-compose --version
```

**Linux (RHEL/Fedora/CentOS):**

```bash
# Install Podman
sudo dnf install -y podman fuse-overlayfs

# Install podman-compose
pip3 install --user podman-compose

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Enable lingering (optional - keeps user services running after logout)
sudo loginctl enable-linger $USER

# Verify
podman --version
podman-compose --version
```

**Linux (Ubuntu/Debian):**

```bash
# Install Podman
sudo apt-get update
sudo apt-get install -y podman

# Install podman-compose
pip3 install --user podman-compose

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
podman --version
podman-compose --version
```

### Option 2: Podman with Native Compose Plugin

Recent versions of Podman include a built-in compose plugin:

```bash
# Check if available
podman compose version

# If available, you're all set!
# If not, use Option 1 (podman-compose) instead
```

---

## How It Works

The `manage_metagrid.sh` script includes automatic detection:

1. **Checks for Docker** - Uses Docker if available and running
2. **Falls back to Podman** - Detects Podman if Docker isn't available
3. **Selects compose method**:
   - Native `podman compose` plugin (preferred)
   - Falls back to `podman-compose` standalone tool
4. **Handles compatibility**:
   - Profile wildcards (`--profile "*"`)
   - exec -T flag differences
   - Volume creation on NFS

All compose commands go through a `compose_cmd()` helper that handles syntax differences automatically.

---

## Troubleshooting

### Volume Creation Fails with "operation not supported"

**Error:** `lsetxattr(label=...) operation not supported`

**Solution:** You're on NFS storage. Follow the [NFS deployment setup](#nfs-deployment-rhel-production) above, specifically creating the `containers.conf` with `label = false`.

### Pre-built Images Not Found

**Symptoms:** Failed to pull `ghcr.io/esgf2-us/metagrid-frontend:pr-XXX`

**Solutions:**

1. **Check if images exist:**
   - Visit: https://github.com/esgf2-us/metagrid/pkgs/container/metagrid-frontend
   - Verify the tag exists for both frontend and backend

2. **Try a different tag:**
   ```bash
   export IMAGE_TAG=v1.6.3-rc2
   ./manage_metagrid.sh
   ```

3. **Build locally instead:**
   - Choose option 2 when prompted for deployment method

### Socket Trigger Limit Hit (RHEL/Linux)

**Error:** `podman.socket: Trigger limit hit, refusing further activation`

**Solution:** Use `podman-compose` instead of `docker-compose`:

```bash
# Stop and disable problematic socket
systemctl --user stop podman.socket
systemctl --user disable podman.socket
systemctl --user reset-failed

# Remove DOCKER_HOST
unset DOCKER_HOST
sed -i '/DOCKER_HOST/d' ~/.bashrc

# Install podman-compose
pip3 install --user podman-compose
export PATH="$HOME/.local/bin:$PATH"

# Verify
podman-compose --version
```

### Build Takes Forever (15+ minutes)

**Cause:** Building on NFS is extremely slow.

**Solution:** Use pre-built images (deployment method option 1) instead of building locally.

### ARM64 Architecture Mismatch (Mac M1/M2)

**Error:** `no matching manifest for linux/arm64/v8`

**Cause:** Pre-built images are Linux amd64 only.

**Solution:** On Mac, use local build (option 2). Pre-built images are only for Linux deployment servers.

### Podman Machine Not Started (macOS)

```bash
podman machine start
```

### Check Podman Info

```bash
podman info
```

Look for:
- Storage backend location
- Overlay driver options
- SELinux status
- File system type

### View Logs

```bash
# All containers
podman-compose -f docker-compose.yml -f docker-compose.prod.yml logs

# Specific service
podman-compose -f docker-compose.yml -f docker-compose.prod.yml logs react
podman-compose -f docker-compose.yml -f docker-compose.prod.yml logs django
```

### Cleanup and Restart

```bash
# Stop everything
./manage_metagrid.sh  # Choose option 2

# Remove all containers/images (fresh start)
podman system reset --force

# Redeploy
./manage_metagrid.sh  # Choose option 1
```

---

## Advanced Configuration

### Storage Location

By default, Podman stores data in `~/.local/share/containers/storage/`.

**To use local disk instead of NFS:**

```bash
cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"
graphroot = "/local/disk/path/containers/storage"  # Change to local path

[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
EOF

# Reset storage
podman system reset --force
```

### Rootless vs Rootful

Metagrid runs in **rootless mode** by default (recommended for security).

The manage_metagrid.sh script automatically detects and uses rootless Podman.

### Performance Tips

1. **Use local storage** instead of NFS when possible
2. **Use pre-built images** on NFS to avoid slow builds
3. **Increase ulimits** if you see "too many open files"
4. **Enable lingering** on Linux: `sudo loginctl enable-linger $USER`

---

## Differences from Docker

The manage_metagrid.sh script handles these automatically:

1. **Profile wildcards:** `--profile "*"` → removed for podman-compose
2. **exec -T flag:** Handled differently in podman-compose  
3. **Compose syntax:** Detects `podman compose` vs `podman-compose`
4. **Volume mounts:** Stored in different locations but work identically
5. **Networking:** Uses different drivers but compatible with compose networking

---

## Additional Resources

- [Podman Documentation](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/) - GUI for managing Podman
- [Rootless Containers](https://rootlesscontaine.rs/)
- [Metagrid Documentation](https://metagrid.readthedocs.io/)

---

## Getting Help

If you encounter issues:

1. Check Podman version: `podman --version`
2. Check configuration: `cat ~/.config/containers/storage.conf`
3. View full logs: `podman-compose logs`
4. Check system resources: `df -h` and `free -h`
5. Review this guide's troubleshooting section
6. Open an issue: https://github.com/esgf2-us/metagrid/issues
