STEPS TO UPDATE PROJECTS, FACETS OR CATEGORIES

1. Edit the initial data file with the desired changes: metagrid/backend/metagrid/initial_projects_data.py
2. Go to the root directory so you can perform the steps below (you may need sudo privileges)

RUN UPDATE WITHOUT CLEARING TABLES
If your update is small and only involves minor modifications or additions to existing projects then you don't need to clear the tables.
If there are deletions or more significant changes, run steps further below which include clearing tables, otherwise:

Option 1:
3. Start the manage_metagrid.sh script in the root directory (use sudo if needed): ./manage_metagrid.sh
4. Select 'Developer Actions', then choose "Update Project Table" option. The commands to update should run.

DONE!

Option 2: Manually update without the script and don't clear tables (LOCAL):
3. docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml build django # Build the container
4. docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm django python manage.py migrate --fake projects 0001_initial # Fake projects so it does migration
5. docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm django python manage.py migrate projects # Run migration
6. docker compose --profile "*" down --remove-orphans # Stop all containers

Option 2: Manually update without the script and don't clear tables (PRODUCTION):
3. docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-prod-overlay.yml build django # Build the container
4. docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-prod-overlay.yml run --rm django python manage.py migrate --fake projects 0001_initial # Fake projects so it does migration
5. docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-prod-overlay.yml run --rm django python manage.py migrate projects # Run migration
6. docker compose --profile "*" down --remove-orphans # Stop all containers


DONE!

RUN UPDATE AND CLEAR TABLES, WARNING ISSUES COULD ARISE WITH THIS AND USER CARTS MAY BE AFFECTED
If you need to clear tables to remove existing facets/projects or change their order then do the steps below:

Manually update and clear tables (LOCAL):
3. docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml build django  #Build the container
4. docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm django python manage.py migrate projects zero # Zero the project table (will also affect cart items that refer to a specific project)
5. docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm django python manage.py migrate projects # Run migration
6. docker compose --profile "*" down --remove-orphans # Stop all containers

Manually update and clear tables (PRODUCTION):
3. docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-prod-overlay.yml build django  #Build the container
4. docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-prod-overlay.yml run --rm django python manage.py migrate projects zero # Zero the project table (will also affect cart items that refer to a specific project)
5. docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-prod-overlay.yml run --rm django python manage.py migrate projects # Run migration
6. docker compose --profile "*" down --remove-orphans # Stop all containers

DONE!

MIGRATION FILE ISSUES:
If there are issues when attempting the steps above, make sure you don't have obsolete or modified migration files that don't match what's in the latest repository.
