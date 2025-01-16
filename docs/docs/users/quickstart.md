# Quick Start
### Prerequisites

- [docker-compose](https://docs.docker.com/compose/install/)
- A working Index Node to which Metagrid is able to connect
- A registered Globus Client UUID and Secret

### Clone the repository
```bash
git clone https://github.com/esgf2-us/metagrid.git
cd metagrid
```
### Configure a local overlay
```yaml
# docker-compose.SITENAME-overlay.yml
services:
  django:
    environment:
      METAGRID_SEARCH_URL: https://esgf-node.llnl.gov/esg-search/search
      METAGRID_WGET_URL: https://esgf-node.llnl.gov/esg-search/wget
      METAGRID_STATUS_URL: https://esgf-node.llnl.gov/proxy/status
      METAGRID_SOLR_URL: https://esgf-node.llnl.gov/esg-search
      METAGRID_SOCIAL_AUTH_GLOBUS_KEY: 94c44808-9efd-4236-bffd-1185b1071736
      METAGRID_SOCIAL_AUTH_GLOBUS_SECRET: 34364292-2752-4d5e-8295
```

### Bring up the stack
```bash
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml up
```

### Run Django migrations
```bash
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml run --rm django python manage.py migrate
```

### Access the site
- <http://localhost:8080>