# Quick Start
### Prerequisites

- [helm](https://helm.sh/docs/intro/install/)
- A working Index Node to which Metagrid is able to connect
- A registered Globus Client UUID and Secret

### Create a helm values file
```yaml
# my-values.yaml
ingress:
  host: esgf-node.example.com

config:
  METAGRID_SOCIAL_AUTH_GLOBUS_KEY: 94c44808-9efd-4236-bffd-1185b1071736
  METAGRID_SOCIAL_AUTH_GLOBUS_SECRET: 34364292-2752-4d5e-8295
  METAGRID_SEARCH_URL: https://esgf-node.ornl.gov/esg-search/search
  METAGRID_WGET_URL: https://esgf-node.ornl.gov/esg-search/wget

postgresql:
  postgresql:
    password: pgpass
    repmgrPassword: repmgrpass

  pgpool:
    adminPassword: pgpooladminpass
```

### Install the helm chart
```bash
helm install my-release oci://ghcr.io/esgf2-us/metagrid -f my-values.yaml

```