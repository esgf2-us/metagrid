# Podman Support for Metagrid

Metagrid now fully supports **Podman** as a drop-in replacement for Docker. The `manage_metagrid.sh` script automatically detects your container runtime and adapts accordingly.

## What is Podman?

[Podman](https://podman.io/) is a daemonless container engine for developing, managing, and running OCI Containers on Linux, macOS, and Windows. Key advantages include:

- **Daemonless architecture**: No background daemon required
- **Rootless containers**: Run containers without root privileges for improved security
- **Docker-compatible**: Compatible with Docker CLI commands and docker-compose files
- **OCI compliance**: Works with Docker images and registries

## Requirements

### Option 1: Podman with compose plugin (Recommended)

```bash
# macOS
brew install podman
podman machine init
podman machine start

# Linux (Fedora/RHEL/CentOS)
sudo dnf install podman

# Linux (Ubuntu/Debian)
sudo apt-get install podman

# Verify compose plugin
podman compose version
```

### Option 2: Podman with podman-compose

```bash
# Install podman-compose
pip install podman-compose

# Verify installation
podman-compose --version
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

### Compose plugin not found
```bash
# Install podman-compose as fallback
pip install podman-compose

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
