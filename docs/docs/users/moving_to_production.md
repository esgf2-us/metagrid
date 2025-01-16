# Getting Started for Production

While the stack runs out of the box, there are some settings you'll want to change before moving to production. All of these settings can be configured through environment variables. The easiest way to set these is through docker compose overlay files. The repository contains one such file: `docker-compose.prod-overlay.yml`. This production overlay blanks out a few unsafe settings used for development in order to ensure that they are properly configured in production. You'll create another overlay file with your own settings to be merged in with the production overlay and default settings at run time.

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
      METAGRID_SOLR_URL: https://esgf-node.llnl.gov/esg-search
      METAGRID_SOCIAL_AUTH_GLOBUS_KEY: 94c44808-9efd-4236-bffd-1185b1071736
      METAGRID_SOCIAL_AUTH_GLOBUS_SECRET: 34364292-2752-4d5e-8295
```
## Bringing up the stack in production

Now that you have your site overlay file created, you'll use it and the provided Production overlay to bring the stack online:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod-overlay.yml -f docker-compose.SITENAME-overlay.yml up
```
With the stack running in production mode, you should be able to access the frontend at <http://localhost:8080>

## Exposing it to the outside world

TODO: Instructions for reverse proxying and cert configuration

## Helpful Commands

### Create a Superuser

Useful for logging into Django Admin page to manage the database.

```bash
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml run --rm django python manage.py createsuperuser
```

### Check logs

```bash
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml logs
```

### Check status of containers

```bash
docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml ps
```
