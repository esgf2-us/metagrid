STEPS TO UPDATE PROJECTS, FACETS OR CATEGORIES

1. Edit the initial data file with the desired changes: metagrid/backend/metagrid/initial_projects_data.py
2. Change to the backend directory:
cd metagrid/backend/
3. Make sure the docker traefik and backend containers are up and running.
If not running, you can run the containers by going to the traefik directory first and running this command:
sudo docker compose -f docker-compose.prod.yml up --build -d
Then do the same in the backend directory (production backend depends on traefik)

RUN UPDATE AND CLEAR TABLES
If you need to clear tables to remove existing facets/projects or change their order then do the steps below:

Option 1:
4. Use the updateProjects.sh script. Just run the script using clear option:
sudo ./updateProject.sh --clear

DONE!

Option 2: Manually update without the script and clear tables:
4. sudo docker compose -f docker-compose.prod.yml build django # Build the container
5. sudo docker compose -f docker-compose.prod.yml run --rm django python manage.py migrate projects zero
6. sudo docker compose -f docker-compose.prod.yml run --rm django python manage.py migrate projects

DONE!

RUN UPDATE WITHOUT CLEARING TABLES
If your update is small and only involves minor modifications or additions to existing projects then you don't need to clear the tables.
If there are deletions or more significant changes, run steps above which include clearing tables otherwise do steps below:

Option 1:
4. Use the updateProjects.sh script. Just run the default script:
sudo ./updateProject.sh

DONE!

Option 2: Manually update without the script and don't clear tables:
4. sudo docker compose -f docker-compose.prod.yml build django # Build the container
5. sudo docker compose -f docker-compose.prod.yml run --rm django python manage.py migrate --fake projects 0001_initial
6. sudo docker compose -f docker-compose.prod.yml run --rm django python manage.py migrate projects

DONE!

MIGRATION FILE ISSUES:
If there are issues when attempting the steps above, make sure you don't have obsolete or modified migration files that don't match what's in the latest repository.
