# MetaGrid API Back-end

# STEPS TO UPDATE PROJECTS, FACETS OR CATEGORIES

1. Edit the initial data file with the desired changes: metagrid/backend/metagrid/initial_projects_data.py
2. Start the manage_metagrid.sh script in the root directory (use sudo if needed): ./manage_metagrid.sh
3. Select 'Developer Actions', then choose "Update Project Table" option. The commands to update should run.
DONE!

# Create a new python virtual environment for testing

python3 -m venv backend/venv

# Activate virtual env

source backend/venv/bin/activate

# Deactivate virtual env

deactivate

# Run pre-commit process on all files (will run flake8, black etc.)

pre-commit run --all-files

# Use Black formatting, cd to backend

black .

# Run Flake8 to linter in backend, cd to backend

flake8 .

# Update virtual environment with current requirements (after activating it)

pip install -r requirements/local.txt

# Rebuild container for testing backend

docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm build --no-cache

# Run pyTest (May need to rebuild container before tests)

docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm django pytest

# Run pyTest for a specific test (example)

docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm django pytest metagrid/api_proxy/tests/test_views.py::TestProxyViewSet::test_do_globus_auth

# Run manage.py function

docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm django python manage.py

# Run migrations

docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm django python manage.py migrate
