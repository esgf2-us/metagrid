# SSL Certificate Configuration for Traefik

This document explains how to configure SSL/TLS certificates for your Metagrid deployment using Traefik.

## Overview

Traefik supports two methods for SSL certificate management:

1. **Let's Encrypt** (automatic, recommended for most deployments)
2. **Custom SSL certificates** (for organizations that provide their own certificates)

## Option 1: Let's Encrypt (Default)

Let's Encrypt provides free, automatic SSL certificates. This is the default configuration.

### Configuration Steps:

1. In your `docker-compose-<site>-overlay.yml`, add the `LETSENCRYPT_EMAIL` environment variable:

```yaml
services:
  traefik:
    environment:
      DOMAIN_NAME: your-domain.example.com
      LETSENCRYPT_EMAIL: admin@example.com
```

2. Ensure port 80 is accessible from the internet (required for Let's Encrypt HTTP challenge)

3. Deploy with your container runtime:

**Using the management script (recommended):**
```bash
./manage_metagrid.sh
# Select option 1 for "Start Metagrid - Production"
```

**Manual deployment:**
```bash
# Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-<site>-overlay.yml up -d

# Podman
podman compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-<site>-overlay.yml up -d
# or with podman-compose
podman-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-<site>-overlay.yml up -d
```

Let's Encrypt will automatically obtain and renew certificates. Certificate data is stored in the `traefik_certs` volume.

## Option 2: Custom SSL Certificates

If you have your own SSL certificate and private key files, follow these steps:

### Prerequisites:

- SSL certificate file (e.g., `certificate.crt`)
- Private key file (e.g., `private.key`)
- (Optional) Intermediate/chain certificates

If you have intermediate certificates, create a certificate bundle:
```bash
cat your-certificate.crt intermediate.crt > certificate-bundle.crt
```

### Configuration Steps:

1. Place your certificate and key files on the server (e.g., `/opt/ssl/` directory)

2. In your `docker-compose-<site>-overlay.yml`:

```yaml
services:
  traefik:
    environment:
      DOMAIN_NAME: your-domain.example.com
      SSL_CERT_FILE: /etc/traefik/certs/certificate.crt
      SSL_KEY_FILE: /etc/traefik/certs/private.key
    volumes:
      # Mount your certificate files (update paths to match your server)
      - /opt/ssl/certificate.crt:/etc/traefik/certs/certificate.crt:ro
      - /opt/ssl/private.key:/etc/traefik/certs/private.key:ro
      # Use the custom SSL configuration file
      - ./traefik/traefik.prod.custom-ssl.yml:/etc/traefik/traefik.yml
```

3. **Important**: Remove or comment out any `LETSENCRYPT_EMAIL` variable

4. Deploy:

**Using the management script (recommended):**
```bash
./manage_metagrid.sh
# Select option 1 for "Start Metagrid - Production"
```

**Manual deployment:**
```bash
# Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-<site>-overlay.yml up -d

# Podman
podman compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-<site>-overlay.yml up -d
# or with podman-compose
podman-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-<site>-overlay.yml up -d
```

### Security Notes:

- The `:ro` suffix makes the mounts read-only for security
- Ensure certificate files have appropriate permissions (e.g., `chmod 600` for the private key)
- Store certificates in a secure location on the host

## Switching Between Methods

### From Let's Encrypt to Custom Certificates:

1. Stop the Traefik container
2. Update your overlay file as described in Option 2
3. Redeploy

### From Custom Certificates to Let's Encrypt:

1. Stop the Traefik container
2. Remove custom certificate volume mounts
3. Remove the `traefik.prod.custom-ssl.yml` volume mount
4. Add `LETSENCRYPT_EMAIL` environment variable
5. Redeploy

## Troubleshooting

### Let's Encrypt Issues:

- **Rate limits**: Let's Encrypt has rate limits. Check [their documentation](https://letsencrypt.org/docs/rate-limits/)
- **Port 80 blocked**: Ensure port 80 is accessible from the internet
- **Logs**: Check Traefik logs:
  ```bash
  # Docker
  docker compose logs traefik

  # Podman
  podman compose logs traefik
  # or
  podman logs <container-name>
  ```

### Custom Certificate Issues:

- **Certificate format**: Ensure certificates are in PEM format
- **File permissions**: Verify the Docker container can read the mounted files
- **Certificate chain**: Include intermediate certificates if required
- **Expiration**: Custom certificates must be manually renewed and updated

### Verify SSL Configuration:

Test your SSL configuration:
```bash
# Check certificate details
openssl s_client -connect your-domain.example.com:443 -servername your-domain.example.com

# Check certificate expiration
echo | openssl s_client -servername your-domain.example.com -connect your-domain.example.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Files Reference

- `traefik.prod.yml` - Default production config (Let's Encrypt)
- `traefik.prod.custom-ssl.yml` - Production config for custom SSL certificates
- `docker-compose-overlay-template.yml` - Template with SSL configuration examples
