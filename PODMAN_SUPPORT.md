# Podman Support for Metagrid

Metagrid now fully supports **Podman** as a drop-in replacement for Docker. The `manage_metagrid.sh` script automatically detects your container runtime and adapts accordingly.

## What is Podman?

[Podman](https://podman.io/) is a daemonless container engine for developing, managing, and running OCI Containers on Linux, macOS, and Windows. Key advantages include:

- **Daemonless architecture**: No background daemon required
- **Rootless containers**: Run containers without root privileges for improved security
- **Docker-compatible**: Compatible with Docker CLI commands and docker-compose files
- **OCI compliance**: Works with Docker images and registries

## Quick Start (Nothing Installed Yet?)

If you're starting from scratch with no container runtime installed:

1. **Choose your setup approach:**
   - **Recommended for most users:** Follow **Option 1: Podman + docker-compose** below
   - **If using recent Podman (4.1+):** Try **Option 2: Native compose plugin** first
   - **Python users:** Consider **Option 3: podman-compose**

2. **Follow the detailed installation steps** for your chosen option in the "Complete Setup Instructions" section below

3. **Once installed, deploy Metagrid:**
   ```bash
   cd /path/to/metagrid
   ./manage_metagrid.sh
   ```
   The script will automatically detect and use Podman.

## Requirements

You'll need either Podman with docker-compose, or Podman with the native compose plugin. Below are complete installation instructions for both approaches.

### Prerequisites

- **macOS**: Homebrew (install from https://brew.sh if not already installed)
- **Linux**: Package manager access (apt, dnf, or yum)
- **All platforms**: Python 3.6+ (for docker-compose installation if needed)

### Complete Setup Instructions

#### Option 1: Podman + docker-compose (Works on all platforms)

This approach uses the standalone docker-compose CLI tool with podman.

**macOS:**
```bash
# 1. Install Podman
brew install podman

# 2. Initialize and start Podman machine
podman machine init
podman machine start

# 3. Install docker-compose
brew install docker-compose

# 4. Configure Podman socket for docker-compose compatibility
# Start the Podman socket service
podman machine ssh "sudo systemctl enable --now podman.socket"

# 5. Set up Docker environment variables to point to Podman
export DOCKER_HOST="unix:///var/run/podman/podman.sock"
# Add this to your ~/.zshrc or ~/.bashrc to make it permanent:
echo 'export DOCKER_HOST="unix:///var/run/podman/podman.sock"' >> ~/.zshrc

# 6. Create a symlink for docker-compose to work with podman
# (Optional but helps with compatibility)
podman system connection default podman-machine-default-root

# 7. Verify installation
podman --version
docker-compose --version
podman ps
```

**Linux (Ubuntu/Debian):**
```bash
# 1. Install Podman
sudo apt-get update
sudo apt-get install -y podman

# 2. Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod 755 /usr/local/bin/docker-compose

# OR install via pip:
# sudo pip3 install docker-compose

# 3. Enable rootless Podman socket (recommended for security)
systemctl --user enable --now podman.socket
systemctl --user status podman.socket

# 4. Enable lingering so user services persist after logout
sudo loginctl enable-linger $USER

# 5. Set up Docker environment variables to point to Podman user socket
export DOCKER_HOST="unix:///run/user/$UID/podman/podman.sock"
# Add this to your ~/.bashrc to make it permanent:
echo 'export DOCKER_HOST="unix:///run/user/$UID/podman/podman.sock"' >> ~/.bashrc
source ~/.bashrc

# 6. Verify installation
podman --version
docker-compose --version
podman ps
```

**Linux (Fedora/RHEL/CentOS):**
```bash
# 1. Install Podman
sudo dnf install -y podman

# 2. Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod 755 /usr/local/bin/docker-compose

# OR install via pip:
# sudo pip3 install docker-compose

# 3. Enable rootless Podman socket (recommended for security)
systemctl --user enable --now podman.socket
systemctl --user status podman.socket

# 4. Enable lingering so user services persist after logout
sudo loginctl enable-linger $USER

# 5. Set up Docker environment variables to point to Podman user socket
export DOCKER_HOST="unix:///run/user/$UID/podman/podman.sock"
# Add this to your ~/.bashrc to make it permanent:
echo 'export DOCKER_HOST="unix:///run/user/$UID/podman/podman.sock"' >> ~/.bashrc
source ~/.bashrc

# 6. Verify installation
podman --version
docker-compose --version
podman ps
```

#### Option 2: Podman with native compose plugin (Recommended if available)

The native `podman compose` command is built into recent versions of Podman.

**macOS:**
```bash
# 1. Install Podman
brew install podman

# 2. Initialize and start Podman machine
podman machine init
podman machine start

# 3. Verify compose plugin is available
podman compose version

# If not available, try updating:
# brew upgrade podman
```

**Linux:**
```bash
# Install Podman (includes compose plugin in recent versions)
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y podman

# Fedora/RHEL/CentOS:
sudo dnf install -y podman

# Verify compose plugin
podman compose version

# If compose plugin is not available, you may need to install it separately
# or use Option 1 (docker-compose) or Option 3 (podman-compose) instead
```

#### Option 3: Podman with podman-compose (Alternative)

This is a Python-based alternative that mimics docker-compose behavior.

```bash
# 1. Install Podman (see Option 1 or 2 above for platform-specific commands)

# 2. Install podman-compose via pip
pip3 install podman-compose

# OR on some systems:
# sudo pip3 install podman-compose

# 3. Verify installation
podman-compose --version
```

### Testing Your Installation

After completing one of the setup options above, test that everything works:

```bash
# 1. Verify Podman is running
podman ps

# 2. Test compose functionality (use the appropriate command for your setup):
# For Option 1 (docker-compose):
docker-compose --version

# For Option 2 (native plugin):
podman compose version

# For Option 3 (podman-compose):
podman-compose --version

# 3. Test that the management script detects your setup
cd /path/to/metagrid
./manage_metagrid.sh
# You should see: "Using container runtime: podman"
```

## How It Works

The `manage_metagrid.sh` script includes automatic container runtime detection:

1. **Docker Detection**: First checks if Docker is available and running
2. **Podman Detection**: Falls back to Podman if Docker is not available
3. **Compose Command Handling**: 
   - Uses `docker compose` or `podman compose` for native compose support
   - Falls back to `podman-compose` if the compose plugin is not available

### Code Implementation

The detection logic at the start of `manage_metagrid.sh`:

```bash
# Detect container runtime (Docker or Podman)
if command -v docker &> /dev/null && docker ps &> /dev/null 2>&1; then
    CONTAINER_CMD="docker"
elif command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    # Check for compose plugin or fallback to podman-compose
    ...
else
    echo "Error: Neither Docker nor Podman is available or running."
    exit 1
fi
```

All compose commands are executed through a helper function `compose_cmd()` that handles the syntax differences between `docker compose`, `podman compose`, and `podman-compose`.

## Using Metagrid with Podman

### Starting Local Development

```bash
./manage_metagrid.sh
# Select option 3: "Start / Stop Local Dev Containers"
```

The script will automatically use Podman if Docker is not available.

### Starting Production Deployment

```bash
./manage_metagrid.sh
# Select option 1: "Start Metagrid - Production"
# Choose your authentication method (Globus, Keycloak, or None)
```

### Manual Commands

You can also run compose commands manually:

```bash
# Start services
podman compose -f docker-compose.yml -f docker-compose-local-overlay.yml up --build -d

# Stop services
podman compose --profile "*" down --remove-orphans

# View logs
podman compose logs -f

# Run migrations
podman compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm django python manage.py migrate
```

## Differences from Docker

### Volume Mounts
Podman handles volumes similarly to Docker, but:
- Volumes are stored in `~/.local/share/containers/storage/volumes/` (Linux)
- On macOS, volumes are inside the Podman machine VM

### Networking
- Podman uses different network drivers but is compatible with docker-compose networking
- Container-to-container communication works the same way
- Port bindings work identically

### Performance
- Podman generally has similar performance to Docker
- On macOS, both use a VM, so performance is comparable
- On Linux, Podman may have slightly better performance due to its daemonless architecture

## Troubleshooting

### Podman machine not started (macOS)
```bash
podman machine start
```

### docker-compose can't connect to Podman socket

**Error:** `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`

**Solution:**
```bash
# Check that the Podman socket is running
podman machine ssh "systemctl status podman.socket"

# If not running, enable it:
podman machine ssh "sudo systemctl enable --now podman.socket"

# Make sure DOCKER_HOST is set correctly
export DOCKER_HOST="unix:///var/run/podman/podman.sock"

# For macOS, you may need to use SSH forwarding:
podman machine ssh "sudo ln -s /run/podman/podman.sock /var/run/docker.sock" || true

# Verify connection
docker-compose --version
```

### docker-compose shows "permission denied" connecting to socket

**Error:** `permission denied while trying to connect to the docker API at unix:///run/podman/podman.sock`

This means docker-compose is trying to connect to the root Podman socket but your user doesn't have permission. **Solution: Use rootless Podman socket instead:**

```bash
# 1. Stop the system (root) Podman socket if running
sudo systemctl stop podman.socket
sudo systemctl disable podman.socket

# 2. Enable the user Podman socket
systemctl --user enable --now podman.socket

# 3. Enable lingering so user services persist
sudo loginctl enable-linger $USER

# 4. Update DOCKER_HOST to use the user socket
export DOCKER_HOST="unix:///run/user/$UID/podman/podman.sock"
echo 'export DOCKER_HOST="unix:///run/user/$UID/podman/podman.sock"' >> ~/.bashrc
source ~/.bashrc

# 5. Verify the user socket is running
systemctl --user status podman.socket

# 6. Test docker-compose connection
docker-compose --version
podman ps
```

**Why rootless?** Rootless Podman is more secure and doesn't require root privileges to run containers. It's the recommended approach for development environments.

### SELinux labeling errors (RHEL/Fedora/CentOS)

**Error:** `lsetxattr(label=...) operation not supported` during image builds

This happens when the filesystem doesn't support SELinux extended attributes. **Solution: Disable SELinux labeling for your user (user-specific, safe for shared servers):**

```bash
# 1. Create Podman storage configuration (user-specific)
mkdir -p ~/.config/containers
cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"

[storage.options]
mount_program = "/usr/bin/fuse-overlayfs"

[storage.options.overlay]
ignore_chown_errors = "true"
mountopt = "nodev,metacopy=on"
EOF

# 2. Disable SELinux labeling for your containers (user-specific)
cat > ~/.config/containers/containers.conf << 'EOF'
[containers]
label = false
EOF

# 3. Install fuse-overlayfs if not already installed (may need admin)
# Check if it's available:
which fuse-overlayfs
# If not found, ask your system administrator to install:
# sudo dnf install -y fuse-overlayfs

# 4. Reset YOUR Podman storage (only affects your user, not others)
podman system reset --force

# 5. Restart YOUR user Podman socket (only affects your user)
systemctl --user restart podman.socket

# 6. Verify SELinux labeling is disabled
podman info | grep -i selinux
# Should show "selinuxEnabled: false"

# 7. Try building again
./manage_metagrid.sh
```

**Alternative (⚠️ SYSTEM-WIDE - requires admin coordination on shared servers):**

If you're on a dedicated/single-user system, you can set SELinux to permissive for containers:
```bash
# WARNING: This affects ALL users on the system
sudo semanage permissive -a container_t
```

**Note for shared servers:** The first solution (storage configuration) is recommended as it only affects your user account and doesn't impact other users on the system.

### Shared servers without subuid/subgid configured

**Error:** `cannot find UID/GID for user: no subuid ranges found in /etc/subuid`

On shared servers, your user may not have subordinate UID/GID ranges configured, which are required for rootless Podman. You have two options:

**Option A: Ask your administrator to configure subuid/subgid (Recommended)**

Send this to your system administrator:
```bash
# Admin command to enable rootless Podman for user 'downie4'
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 downie4
```

After this is configured, follow the rootless setup instructions above.

**Option B: Use rootful Podman with sudo (Workaround)**

If rootless isn't feasible, you can use Podman with sudo. Note: This requires sudo access and containers will run as root.

```bash
# 1. Update DOCKER_HOST to use system socket
export DOCKER_HOST="unix:///run/podman/podman.sock"
echo 'export DOCKER_HOST="unix:///run/podman/podman.sock"' >> ~/.bashrc
source ~/.bashrc

# 2. Enable the system Podman socket
sudo systemctl enable --now podman.socket

# 3. Verify the socket is running
sudo systemctl status podman.socket
# Press 'q' to quit the status view

# 4. Ensure docker-compose is in sudo's PATH
# Check if sudo can find docker-compose:
sudo which docker-compose

# If it returns "no docker-compose", create a symlink:
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify sudo can now find it:
sudo which docker-compose

# 5. Run manage_metagrid with sudo
cd /path/to/metagrid
sudo -E ./manage_metagrid.sh
# The -E flag preserves your environment variables
```

**Using rootful Podman:**
```bash
# View running containers
sudo podman ps

# View logs
sudo podman logs <container_name>

# Stop containers
sudo ./manage_metagrid.sh
# Select the stop option from the menu

# Execute commands in containers
sudo podman exec -it django bash
```

**Note:** When using rootful Podman, all `podman` commands must be run with `sudo`. Container files and volumes will be owned by root.

### Compose plugin not found
```bash
# Install podman-compose as fallback
pip install podman-compose

# Or install docker-compose (see setup instructions above)
# Or follow instructions at: https://github.com/docker/compose
```

### Permission issues
```bash
# Podman supports rootless mode (recommended)
podman info

# Check if running rootless
podman unshare cat /proc/self/uid_map
```

### Container connectivity issues

If containers can't communicate with each other:

```bash
# Check network
podman network ls
podman network inspect <network-name>

# Recreate network
podman compose down
podman compose up -d
```

### Volume persistence issues

```bash
# List volumes
podman volume ls

# Inspect volume
podman volume inspect <volume-name>

# Clean up unused volumes
podman volume prune
```

## Testing Podman Support

To verify Podman support works correctly:

1. **Ensure Docker is not running** (if you want to force Podman usage):
   ```bash
   # macOS/Linux
   docker ps  # Should fail or show Docker is not running
   ```

2. **Start Podman** (macOS):
   ```bash
   podman machine start
   ```

3. **Run the management script**:
   ```bash
   ./manage_metagrid.sh
   ```
   
   You should see: `Using container runtime: podman`

4. **Start local services** and verify they work correctly.

## Migration from Docker to Podman

If you're switching from Docker to Podman:

1. **Stop Docker containers**:
   ```bash
   docker compose down
   ```

2. **Start Podman machine** (macOS):
   ```bash
   podman machine init
   podman machine start
   ```

3. **Use the management script** as usual - it will automatically use Podman.

4. **Rebuild images**:
   ```bash
   ./manage_metagrid.sh
   # Select option 3 to start local services
   ```

### Data Migration

Volumes are not automatically migrated between Docker and Podman. If you need to preserve data:

1. **Export data from Docker**:
   ```bash
   docker compose exec -T postgres pg_dumpall -U postgres > backup.sql
   ```

2. **Import to Podman**:
   ```bash
   podman compose up -d postgres
   podman compose exec -T postgres psql -U postgres < backup.sql
   ```

## Additional Resources

- [Podman Documentation](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/) - GUI for managing Podman
- [Docker to Podman Migration Guide](https://docs.podman.io/en/latest/markdown/podman-compose.1.html)
- [Rootless Containers](https://rootlesscontaine.rs/)

## Support

If you encounter issues with Podman support:

1. Check that Podman is properly installed and running
2. Verify the compose plugin or podman-compose is available
3. Review the troubleshooting section above
4. Check Metagrid documentation at https://metagrid.readthedocs.io/
5. Open an issue on the [Metagrid GitHub repository](https://github.com/aims-group/metagrid/issues)
