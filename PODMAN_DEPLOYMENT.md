# Podman Deployment Guide

This guide covers deploying Metagrid using Podman, especially on systems with NFS storage.

## Quick Start (Recommended)

**For Podman deployments, use pre-built images to avoid NFS build issues:**

```bash
# 1. Configure Podman for NFS (one-time setup - see below)
# 2. Run deployment script
./manage_metagrid.sh
# Choose 1: Start Production
# Choose 1: Use pre-built images ← Recommended!
# Choose auth method
```

**Why pre-built images?**
- ✅ Fast: 2-5 minutes vs 15-25+ minutes building
- ✅ Reliable: Avoids NFS + SELinux build failures
- ✅ No auth required: Images are public on GHCR

## Prerequisites

- Podman installed
- podman-compose installed: `pip3 install --user podman-compose`
- Access to the deployment server
- **For pre-built images:** Internet access to ghcr.io (no authentication needed)

## One-Time Setup: Configure Podman for NFS

If your Podman storage is on NFS (common in HPC environments), configure it once:

### Step 1: Create Podman Configuration Files

Create storage configuration:

```bash
mkdir -p ~/.config/containers
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
```

Create container configuration to disable SELinux labeling:

```bash
cat > ~/.config/containers/containers.conf << 'EOF'
[containers]
# Disable SELinux labeling (required for NFS)
label = false
EOF
```

### Step 2: Reset Podman Storage

**⚠️ WARNING:** This will delete all existing containers, images, and volumes.

```bash
podman system reset --force
```

### Step 3: Verify Configuration

```bash
podman info | grep -A 5 "store"
```

You should see:
- `force_mask: "0700"`
- `Backing Filesystem: nfs`
- `mount_program: fuse-overlayfs`

**Done!** Now you can deploy.

---

## Deployment Steps

### Standard Deployment (Recommended)

1. **Clone and checkout:**
   ```bash
   git clone https://github.com/esgf2-us/metagrid.git
   cd metagrid
   git checkout <branch-or-tag>
   ```

2. **Deploy:**
   ```bash
   ./manage_metagrid.sh
   ```
   
   Choose:
   - **1** - Start Metagrid - Production
   - **1** - Use pre-built images ← Recommended!
   - Your auth method (Globus, Keycloak, or None)

3. **Wait 2-5 minutes** for deployment to complete

The script automatically detects your branch/PR and pulls the corresponding images from GHCR.

## About Pre-built Images

Pre-built images are automatically created by the development team and published to GitHub Container Registry (GHCR). They are **public** and require no authentication to pull.

**Available tags:**
- `pr-XXX` - Specific pull request builds
- `vX.X.X` - Release versions (e.g., v1.6.3)
- `latest` - Most recent build

**View available images:**
- Frontend: https://github.com/esgf2-us/metagrid/pkgs/container/metagrid-frontend
- Backend: https://github.com/esgf2-us/metagrid/pkgs/container/metagrid-backend

### Using Specific Tags

The script auto-detects your branch/PR, but you can override:

```bash
# Deploy a specific version
export IMAGE_TAG=v1.6.3
./manage_metagrid.sh

# Or use latest
export IMAGE_TAG=latest
./manage_metagrid.sh
```

## Podman-Specific Considerations

### Storage Location

By default, Podman stores data in `~/.local/share/containers/storage/`.

If this is on NFS, you **must** configure storage.conf as shown above.

To use local disk instead of NFS:

```bash
cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"
graphroot = "/local/disk/path/containers/storage"  # Change to local path

[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
EOF
```

Then reset storage: `podman system reset --force`

### Rootless vs Rootful

Metagrid runs in **rootless mode** by default (recommended).

The manage_metagrid.sh script automatically detects and uses rootless Podman.

### Differences from Docker

The manage_metagrid.sh script handles these automatically:

1. **Profile wildcards:** `--profile "*"` → removed for podman-compose
2. **exec -T flag:** Handled differently in podman-compose
3. **Compose syntax:** Detects `podman compose` vs `podman-compose`

## Troubleshooting

### Check Podman Info

```bash
podman info
```

Look for:
- Storage backend location
- Overlay driver options
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

# Rebuild and start
./manage_metagrid.sh  # Choose option 1
```

### Common Error: "exit status 125"

This usually means:
1. SELinux/NFS issue → Follow Issue 1 solution
2. Permission problem → Check file ownership
3. Storage corruption → Reset storage

## Performance Tips

1. **Use local storage** if possible (not NFS)
2. **Increase ulimits** if you see "too many open files"
3. **Enable HTTP cache** for faster image pulls

## Security Notes

- Storage on NFS requires `ignore_chown_errors = "true"`
- This is safe for development/test environments
- For production, consider using local disk storage
- Rootless Podman provides good security isolation

## Getting Help

If you encounter issues not covered here:

1. Check Podman version: `podman --version`
2. Check storage config: `cat ~/.config/containers/storage.conf`
3. View full logs: `podman-compose logs`
4. Check system resources: `df -h` and `free -h`

For project-specific issues, refer to the main README.md.
