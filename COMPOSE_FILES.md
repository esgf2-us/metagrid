# Docker Compose Files Reference

This document explains the purpose of each Docker Compose file and how they layer together during deployment.

These compose files work with any deployment method:
- **Manual commands:** `docker-compose` or `podman-compose`
- **Automation tools:** Ansible, Terraform, etc.
- **Convenience script:** `./manage_metagrid.sh` (optional helper)

---

## Files You Edit

These files should be customized for your deployment:

| File | Purpose | When Used |
|------|---------|-----------|
| `docker-compose-prod-overlay.yml` | **Your production configuration** | Production deployments (user-created from template) |
| `docker-compose-overlay-template.yml` | Production config template | Copy this to create your prod-overlay.yml |
| `docker-compose-local-overlay.yml` | Local development settings | Local development customization |

**Getting started:**
```bash
# For production - create your config from template
cp docker-compose-overlay-template.yml docker-compose-prod-overlay.yml
# Edit docker-compose-prod-overlay.yml with your DOMAIN_NAME, secrets, etc.

# For local development - edit directly
nano docker-compose-local-overlay.yml
```

---

## Project-Managed Files (Don't Edit)

These files are maintained by the project and updated via git:

| File | Purpose | When Used |
|------|---------|-----------|
| `docker-compose.yml` | Base configuration | Always (all deployments) |
| `docker-compose.prod.yml` | Production settings | Production deployments |
| `docker-compose.podman.yml` | Podman-specific overrides | All Podman deployments |
| `docker-compose.prebuilt.yml` | Pre-built image tags from GHCR | When using pre-built images |
| `docker-compose.globus.yml` | Globus authentication | When Globus auth chosen |
| `docker-compose.keycloak.yml` | Keycloak local dev | When Keycloak + local dev |
| `docker-compose.keycloak.prod.yml` | Keycloak production | When Keycloak + production |
| `docker-compose.customcert.yml` | Docker custom SSL certs | Docker + custom certificates |
| `docker-compose.podman.customcert.yml` | Podman custom SSL certs | Podman + custom certificates |
| `docker-compose.podman.letsencrypt.yml` | Podman Let's Encrypt | Podman + Let's Encrypt SSL |

---

## File Details

### Files You Edit

#### `docker-compose-prod-overlay.yml` ⚠️ USER-CREATED
**Purpose:** Your actual production configuration (overrides template)  
**Contains:** Real DOMAIN_NAME, secrets, database passwords, email settings  
**Status:** **NOT in git** - each deployment creates their own  
**Required for:** Production deployments

**Example:**
```yaml
services:
  traefik:
    environment:
      DOMAIN_NAME: your-domain.example.com
  django:
    environment:
      DOMAIN_NAME: your-domain.example.com
      DJANGO_SECRET_KEY: your-secret-here
      DJANGO_ALLOWED_HOSTS: '["your-domain.example.com", "your-ip", "localhost"]'
```

#### `docker-compose-overlay-template.yml`
**Purpose:** Template showing what settings users need to configure  
**Action:** Copy to `docker-compose-prod-overlay.yml` and customize  
**Contains:** Placeholders for DOMAIN_NAME, secrets, email addresses

**How to use:**
```bash
cp docker-compose-overlay-template.yml docker-compose-prod-overlay.yml
# Edit docker-compose-prod-overlay.yml with your actual values
```

#### `docker-compose-local-overlay.yml`
**Purpose:** Customize local development settings  
**Contains:** Local volume mounts, development environment variables, ports  
**Used by:** Local development deployments

**Common customizations:**
- Development environment variables
- Local volume mount paths
- Database settings for local testing
- Port mappings for direct container access

---

### Core Files (Project-Managed)

#### `docker-compose.yml`
**Purpose:** Base configuration for all services  
**Contains:** Service definitions, local development ports, volume mounts, basic environment  
**Used by:** All deployments (local, production, Docker, Podman)

**Key settings:**
- Container names and images
- Default port mappings (9080:9080, 9443:9443)
- Local development volumes
- Base health checks

#### `docker-compose.prod.yml`
**Purpose:** Production-specific settings  
**Contains:**
- Restart policies (`unless-stopped`)
- Production environment variables (DEBUG=False, SSL settings)
- Database authentication (scram-sha-256)
- Static file volume mounts

**Used by:** Production deployments only (not local dev)

#### `docker-compose.podman.yml`
**Purpose:** Podman-specific overrides  
**Contains:**
- Traefik config mount (`traefik.podman.yml`)
- Docker provider configuration (Podman socket)
- Network configuration with explicit bridge
- Container network aliases (for DNS)
- Traefik labels for dynamic routing
- Host resolv.conf mount (for external DNS)
- Standard port mappings (80→9080, 443→9443)

**Used by:** All Podman deployments

---

### Image Source File (Project-Managed)

#### `docker-compose.prebuilt.yml`
**Purpose:** Use pre-built images from GitHub Container Registry  
**Contains:** Image pull specifications with `${IMAGE_TAG}` variable

**Used when:** Choosing "pre-built images" option (recommended for NFS/HPC)

**Images:**
- `ghcr.io/esgf2-us/metagrid-frontend:${IMAGE_TAG}`
- `ghcr.io/esgf2-us/metagrid-backend:${IMAGE_TAG}`

**Auto-detection:** Script detects PR number from branch (e.g., `IMAGE_TAG=pr-XXX`)

---

### Authentication Files (Project-Managed)

#### `docker-compose.globus.yml`
**Purpose:** Enable Globus authentication  
**Contains:** Environment variables for Globus OAuth  
**Used when:** Choosing Globus auth option (default)

#### `docker-compose.keycloak.yml`
**Purpose:** Enable Keycloak for local development  
**Contains:** Keycloak container configuration, dev settings  
**Used when:** Choosing Keycloak auth + local development

#### `docker-compose.keycloak.prod.yml`
**Purpose:** Enable Keycloak for production  
**Contains:** Keycloak production configuration  
**Used when:** Choosing Keycloak auth + production deployment

---

### SSL Certificate Files (Project-Managed)

#### `docker-compose.customcert.yml`
**Purpose:** Use custom SSL certificates with Docker  
**Contains:** Traefik config mount for custom cert configuration  
**Used when:** Docker + custom certificates option

**Requires:** Files in `traefik/certs/`:
- `cert.crt` - Your SSL certificate
- `cert.key` - Your private key

#### `docker-compose.podman.customcert.yml`
**Purpose:** Use custom SSL certificates with Podman  
**Contains:** Traefik custom cert config mount, dynamic certificate configuration

**Used when:** Podman + custom certificates option (option 2)

#### `docker-compose.podman.letsencrypt.yml`
**Purpose:** Use Let's Encrypt automatic certificates with Podman  
**Contains:** Certresolver labels for Traefik routers  

**Used when:** Podman + Let's Encrypt SSL

**Requires:**
- Domain resolving to server
- Ports 80/443 publicly accessible
- Valid email in `traefik/traefik.podman.yml`

---

## Deployment Examples

Compose files are loaded in order, with later files overriding earlier ones.

### Example 1: Podman Production with Pre-built Images + Let's Encrypt + Globus

**Manual deployment:**
```bash
# Set environment variables
export IMAGE_TAG=pr-XXX  # or version tag
export DOMAIN_NAME=your-domain.example.com

# Deploy with podman-compose
sudo podman-compose \
  -f docker-compose.yml \
  -f docker-compose.prebuilt.yml \
  -f docker-compose-prod-overlay.yml \
  -f docker-compose.globus.yml \
  -f docker-compose.podman.yml \
  -f docker-compose.podman.letsencrypt.yml \
  up -d
```

**Using manage script (convenience option):**
```bash
sudo ./manage_metagrid.sh
# Choose: 1 (Production), 1 (Pre-built), 1 (Let's Encrypt), 1 (Globus)
```

**Files loaded in order:**
1. `docker-compose.yml` - Base
2. `docker-compose.prebuilt.yml` - GHCR images
3. `docker-compose-prod-overlay.yml` - Your settings
4. `docker-compose.globus.yml` - Globus auth
5. `docker-compose.podman.yml` - Podman overrides
6. `docker-compose.podman.letsencrypt.yml` - Let's Encrypt labels

### Example 2: Podman Production with Custom Certificates + No Auth

**Manual deployment:**
```bash
export IMAGE_TAG=pr-XXX
export DOMAIN_NAME=your-domain.example.com

sudo podman-compose \
  -f docker-compose.yml \
  -f docker-compose.prebuilt.yml \
  -f docker-compose-prod-overlay.yml \
  -f docker-compose.podman.yml \
  -f docker-compose.podman.customcert.yml \
  up -d
```

**Using manage script:**
```bash
sudo ./manage_metagrid.sh
# Choose: 1 (Production), 1 (Pre-built), 2 (Custom cert), 3 (No auth)
```

**Files loaded:**
1. `docker-compose.yml`
2. `docker-compose.prebuilt.yml`
3. `docker-compose-prod-overlay.yml`
4. `docker-compose.podman.yml`
5. `docker-compose.podman.customcert.yml`

### Example 3: Local Development with Keycloak

**Manual deployment:**
```bash
docker-compose \
  -f docker-compose.yml \
  -f docker-compose-local-overlay.yml \
  -f docker-compose.keycloak.yml \
  --profile keycloak \
  up --build -d
```

**Using manage script:**
```bash
./manage_metagrid.sh
# Choose: 3 (Local), 2 (Keycloak)
```

**Files loaded:**
1. `docker-compose.yml`
2. `docker-compose-local-overlay.yml`
3. `docker-compose.keycloak.yml`

---

## Understanding File Layering

Docker Compose merges files from left to right, with later files overriding earlier ones.

**Example layering:**
```yaml
# docker-compose.yml
services:
  traefik:
    ports:
      - '9080:9080'
    
# docker-compose.podman.yml (OVERRIDES ports)
services:
  traefik:
    ports:
      - '80:9080'  # ← This wins
```

**Result:** Port 80 is used (not 9080)

**Key override patterns:**
- **Ports:** Completely replaced
- **Environment:** Merged (new vars added, existing overridden)
- **Volumes:** Merged (all volumes from all files)
- **Labels:** Merged (all labels from all files)

---

## Automation Tool Examples

### Ansible Playbook Example

```yaml
- name: Deploy Metagrid with Podman
  hosts: metagrid_servers
  become: yes
  vars:
    image_tag: "pr-XXX"
    domain_name: "your-domain.example.com"
  tasks:
    - name: Set environment variables
      set_fact:
        compose_env:
          IMAGE_TAG: "{{ image_tag }}"
          DOMAIN_NAME: "{{ domain_name }}"
    
    - name: Deploy Metagrid
      community.docker.docker_compose:
        project_src: /path/to/metagrid
        files:
          - docker-compose.yml
          - docker-compose.prebuilt.yml
          - docker-compose-prod-overlay.yml
          - docker-compose.globus.yml
          - docker-compose.podman.yml
          - docker-compose.podman.letsencrypt.yml
        env: "{{ compose_env }}"
        state: present
```

### Terraform Example

```hcl
resource "null_resource" "metagrid_deploy" {
  provisioner "remote-exec" {
    inline = [
      "export IMAGE_TAG=pr-XXX",
      "export DOMAIN_NAME=your-domain.example.com",
      "cd /opt/metagrid",
      "sudo podman-compose -f docker-compose.yml -f docker-compose.prebuilt.yml -f docker-compose-prod-overlay.yml -f docker-compose.globus.yml -f docker-compose.podman.yml -f docker-compose.podman.letsencrypt.yml up -d"
    ]
  }
}
```

---

## Quick Decision Tree

**What overlay files do I need?**

```
Deployment type?
├─ Local Development
│  └─ Use: local-overlay + (globus OR keycloak OR none)
│
└─ Production
   ├─ Container runtime?
   │  ├─ Docker
   │  │  └─ SSL method?
   │  │     ├─ Custom → Use: prod-overlay + customcert
   │  │     └─ Let's Encrypt → Use: prod-overlay (built into prod.yml)
   │  │
   │  └─ Podman
   │     └─ SSL method?
   │        ├─ Custom → Use: prod-overlay + podman + podman.customcert
   │        └─ Let's Encrypt → Use: prod-overlay + podman + podman.letsencrypt
   │
   └─ Image source?
      ├─ Pre-built → Add: prebuilt
      └─ Build local → (no extra file)
```

---

## Troubleshooting

### "File not found: docker-compose-prod-overlay.yml"

**Cause:** You haven't created your production config yet  
**Solution:**
```bash
cp docker-compose-overlay-template.yml docker-compose-prod-overlay.yml
# Edit docker-compose-prod-overlay.yml with your settings
```

### "Which file sets DOMAIN_NAME?"

**Answer:** `docker-compose-prod-overlay.yml` (user-created)  
The manage script extracts it from there and exports it for Podman label substitution.

### "Why so many Podman files?"

**Answer:** Separation of concerns
- `docker-compose.podman.yml` - Core Podman differences
- `docker-compose.podman.letsencrypt.yml` - Let's Encrypt specific
- `docker-compose.podman.customcert.yml` - Custom cert specific

This keeps each file focused and makes it easy to add/remove SSL options.

### "Can I remove files I don't use?"

**Not recommended** - The manage script expects them to exist. They're small and don't interfere when not used.

---

## Advanced: Custom Overlays

If you need settings beyond what the templates provide:

```bash
# Create custom overlay
cat > docker-compose-my-custom.yml << 'EOF'
services:
  django:
    environment:
      MY_CUSTOM_SETTING: value
EOF

# (OPTIONAL) Modify manage_metagrid.sh to include it
# Add after PROD_OVERLAY in the compose_cmd line
```

---

## Summary

**Total files:** 12
- **3 files you edit:** prod-overlay (create), template (reference), local-overlay (customize)
- **9 project files:** Maintained via git, don't edit

**Deployment methods supported:**
- ✅ Manual `docker-compose` or `podman-compose` commands
- ✅ Automation tools (Ansible, Terraform, Chef, etc.)
- ✅ Convenience script `./manage_metagrid.sh`
- ✅ CI/CD pipelines
- ✅ Custom orchestration tools

**The system is designed for:**
- ✅ Flexibility (many deployment options and methods)
- ✅ Clarity (each file has one purpose)
- ✅ Maintainability (small, focused files)
- ✅ Automation-friendly (standard compose format)
- ✅ User-friendliness (only edit 1-2 files)

---

## Need Help?

- **File-specific questions:** Check comments at top of each file
- **General deployment:** See [PODMAN_DEPLOYMENT.md](PODMAN_DEPLOYMENT.md)
- **Template customization:** See `docker-compose-overlay-template.yml` comments
- **Issues:** https://github.com/esgf2-us/metagrid/issues
