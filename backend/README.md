# MetaGrid API Back-end

# Create a new python virtual environment for testing
python3 -m venv backend/venv

# Activate virtual env
source backend/venv/bin/activate

# Deactivate virtual env
deactivate

# Use Black formatting, cd to backend
black .

# Run Flake8 to linter in backend, cd to backend
Flake8 .

# Update virtual environment with current requirements (after activating it)
pip install -r requirements/local.txt

# Rebuild container for testing backend
docker compose -p metagrid_backend_dev build --no-cache

# Run pyTest (May need to rebuild container before tests)
docker compose -p metagrid_backend_dev run --rm django pytest

# Run manage.py function
docker compose -p metagrid_backend_dev run --rm django python manage.py <function>

# View backend output in browser (localhost: example)

Enter this browser url: https://aims2.llnl.gov/metagrid-backend/api/v1/projects