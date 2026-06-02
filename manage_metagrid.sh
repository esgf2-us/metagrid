# Detect container runtime (Docker or Podman)
if command -v docker &> /dev/null && docker ps &> /dev/null 2>&1; then
    CONTAINER_CMD="docker"
elif command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
else
    echo "Error: Neither Docker nor Podman is available or running."
    echo "Please install Docker or Podman and ensure the service is running."
    exit 1
fi

echo "Using container runtime: $CONTAINER_CMD"

# Constants
LOCAL_COMPOSE="-f docker-compose.yml"
PROD_COMPOSE="-f docker-compose.yml -f docker-compose.prod.yml"
KEYCLOAK_COMPOSE="-f docker-compose.keycloak.yml"
GLOBUS_COMPOSE="-f docker-compose.globus.yml"
KEYCLOAK_PROD_OVERLAY="-f docker-compose.keycloak.prod.yml"
LOCAL_OVERLAY="-f docker-compose-local-overlay.yml"
PROD_OVERLAY="-f docker-compose-prod-overlay.yml"

set -e

#Custom functions
function startProductionService() {
    clear
    echo "Choose authentication method:"
    echo "1 Globus - default"
    echo "2 Keycloak"
    echo "3 None"
    read -r auth_choice

    # Default to 1 (Globus) if no value is entered
    if [ -z "$auth_choice" ]; then
        auth_choice=1
    fi

    case $auth_choice in
    1)
        echo "Starting Metagrid production deployment with Globus"
        $CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY $GLOBUS_COMPOSE up --build -d
        echo "Command used:"
        echo "$CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY $GLOBUS_COMPOSE up --build -d"
        ;;
    2)
        echo "Starting Metagrid production deployment with Keycloak"
        $CONTAINER_CMD compose $PROD_COMPOSE $KEYCLOAK_COMPOSE $KEYCLOAK_PROD_OVERLAY $PROD_OVERLAY --profile keycloak up --build -d
        echo "Command used:"
        echo "$CONTAINER_CMD compose $PROD_COMPOSE $KEYCLOAK_COMPOSE $KEYCLOAK_PROD_OVERLAY $PROD_OVERLAY --profile keycloak up --build -d"
        ;;
    3)
        echo "Starting Metagrid production deployment with no auth"
        $CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY up --build -d
        echo "Command used:"
        echo "$CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY up --build -d"
        ;;
    *)
        echo "Invalid choice. Please select 1, 2, or 3."
        startProductionService
        return
        ;;
    esac
}

function startLocalService() {
    clear
    echo "Choose local deployment auth method:"
    echo "1 Globus - default"
    echo "2 Keycloak"
    echo "3 None"
    read -r auth_choice

    # Default to 1 (Globus) if no value is entered
    if [ -z "$auth_choice" ]; then
        auth_choice=1
    fi

    case $auth_choice in
    1)
        echo "Starting Metagrid with Globus auth"
        $CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY $GLOBUS_COMPOSE --profile docs up --build -d
        echo "Command used:"
        echo "$CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY $GLOBUS_COMPOSE --profile docs up --build -d"
        ;;
    2)
        echo "Starting Metagrid with Keycloak auth"
        $CONTAINER_CMD compose $LOCAL_COMPOSE $KEYCLOAK_COMPOSE $LOCAL_OVERLAY  --profile keycloak --profile docs up --build -d
        echo "Command used:"
        echo "$CONTAINER_CMD compose $LOCAL_COMPOSE $KEYCLOAK_COMPOSE $LOCAL_OVERLAY --profile keycloak --profile docs up --build -d"
        ;;
    3)
        echo "Starting Metagrid with no auth"
        $CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY --profile docs up --build -d
        echo "Command used:"
        echo "$CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY --profile docs up --build -d"
        ;;
    *)
        echo "Invalid choice. Please select 1, 2, or 3."
        startLocalService
        ;;
    esac
}

function stopDockerContainers() {
    echo "Stopping Metagrid"
    $CONTAINER_CMD compose --profile "*" down --remove-orphans
}

function toggleLocalContainers() {
    clear
    # If frontend container is up, stop all services
    if $CONTAINER_CMD ps -a --format '{{.Names}}' | grep "react"; then
        stopDockerContainers
    else
        # Otherwise stop any remaining services and start them up again
        startLocalService
    fi
}

function installPackagesForLocalDev() {
    clear
    pip install -r backend/requirements/local.txt
    pnpm install --dir frontend
    echo "Packages installed"
}

# New function: refresh Postgres collation version and reindex the database.
# Supports local and production compose sets and optionally creates a SQL backup first.
function refreshPostgresCollation() {
    clear
    echo "Refresh Postgres collation version and reindex database."
    echo "Choose environment to run this against:"
    echo "1 Local (default)"
    echo "2 Production"
    read -r env_choice

    if [ -z "$env_choice" ]; then
        env_choice=1
    fi

    if [ "$env_choice" = "1" ]; then
        COMPOSE="$LOCAL_COMPOSE $LOCAL_OVERLAY"
        ENV_NAME="local"
    elif [ "$env_choice" = "2" ]; then
        COMPOSE="$PROD_COMPOSE $PROD_OVERLAY"
        ENV_NAME="production"
    else
        echo "Invalid choice. Aborting."
        return 1
    fi

    echo
    echo "Target environment: $ENV_NAME"
    echo "This will run the following SQL against the 'postgres' database:"
    echo "  ALTER DATABASE postgres REFRESH COLLATION VERSION;"
    echo "  REINDEX DATABASE postgres;"
    echo
    echo "It is recommended to create a backup first. Create backup? (y/N)"
    read -r do_backup

    if [ "$do_backup" = "y" ] || [ "$do_backup" = "Y" ]; then
        default_file="metagrid_${ENV_NAME}_backup_$(date +%Y%m%d_%H%M%S).sql"
        read -r -p "Enter backup filename (default: $default_file): " backup_file
        if [ -z "$backup_file" ]; then
            backup_file="$default_file"
        fi
        backup_dir="./db_backups"
        mkdir -p "$backup_dir"

        echo "Ensuring postgres container is running for backup..."
        if ! $CONTAINER_CMD compose $COMPOSE up -d postgres; then
            echo "Failed to start postgres container in $ENV_NAME compose. Aborting backup."
            return 1
        fi

        backup_path="$backup_dir/$backup_file"
        echo "Creating SQL backup to: $backup_path"
        # Run pg_dumpall inside container and redirect to host file
        if $CONTAINER_CMD compose $COMPOSE exec -T postgres pg_dumpall -U postgres > "$backup_path"; then
            echo "Backup created at $backup_path"
        else
            echo "Backup failed. Check postgres logs:"
            echo "  $CONTAINER_CMD compose $COMPOSE logs postgres"
            return 1
        fi
    fi

    echo
    echo "Proceed with refreshing collation version and reindex? (y/N)"
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Operation cancelled."
        return 0
    fi

    echo "Ensuring postgres container is running..."
    if ! $CONTAINER_CMD compose $COMPOSE up -d postgres; then
        echo "Failed to start postgres container for $ENV_NAME. Aborting."
        return 1
    fi

    echo "Executing collation refresh and reindex inside the postgres container..."
    if $CONTAINER_CMD compose $COMPOSE exec -T postgres bash -lc \
        "psql -U postgres -d postgres -c \"ALTER DATABASE postgres REFRESH COLLATION VERSION;\" && \
         psql -U postgres -d postgres -c \"REINDEX DATABASE postgres;\""; then
        echo "Collation refreshed and database reindexed successfully for $ENV_NAME."
    else
        echo "Operation failed. Check postgres container logs for details:"
        echo "  $CONTAINER_CMD compose $COMPOSE logs postgres"
        return 1
    fi
}

function runMigrations() {
    clear
    echo "Choose environment:"
    echo "1 Local"
    echo "2 Production"
    read -r env_choice

    case $env_choice in
    1)
        stopDockerContainers
        $CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY run --rm django python manage.py migrate
        stopDockerContainers
        ;;
    2)
        stopDockerContainers
        $CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY run --rm django python manage.py migrate
        stopDockerContainers
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        runMigrations
        ;;
    esac
}

function updateProjectTable() {
    clear
    echo "Choose environment:"
    echo "1 Local"
    echo "2 Production"
    read -r env_choice

    case $env_choice in
    1)
        stopDockerContainers
        $CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY build django
        $CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY run --rm django python manage.py migrate --fake projects 0001_initial
        $CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY run --rm django python manage.py migrate projects
        stopDockerContainers
        ;;
    2)
        stopDockerContainers
        $CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY build django
        $CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY run --rm django python manage.py migrate --fake projects 0001_initial
        $CONTAINER_CMD compose $PROD_COMPOSE $PROD_OVERLAY run --rm django python manage.py migrate projects
        stopDockerContainers
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        updateProjectTable
        ;;
    esac
}

function runPreCommit() {
    clear
    pre-commit run --all-files
}

function runBackendTests() {
    clear
    stopDockerContainers
    if ! $CONTAINER_CMD compose $LOCAL_COMPOSE $LOCAL_OVERLAY --profile docs run --rm django pytest; then
        echo "Some backend tests failed!"
        stopDockerContainers
        return 1
    fi
    stopDockerContainers
    return 0
}

function runFrontendTests() {
    clear
    cd frontend
    if ! pnpm test; then
        echo "Some frontend tests failed!"
        cd ..
        return 1
    fi
    cd ..
    return 0
}

function configureProduction() {
    clear
    ./configHelper.sh
}

function updateVersion() {
    clear
    read -p "Enter the new version number (e.g., v1.0.0): " new_version

    # Remove 'v' prefix for package.json version
    package_version=${new_version#v}

    # Update package.json
    jq --arg new_version "$package_version" '.version = $new_version' frontend/package.json > tmp.$$.json && mv tmp.$$.json frontend/package.json
    echo "Updated package.json to version $package_version"

    # Update helm/Chart.yaml
    sed -i '' "s/^appVersion:.*/appVersion: \"$new_version\"/" helm/Chart.yaml
    echo "Updated helm/Chart.yaml appVersion to $new_version"
    sed -i '' "s/\(.*--version\).*/\1 $new_version/g" helm/README.md
    echo "Updated helm/README.md version to $new_version"

    # Update helm/helmfile.yaml
    sed -i '' "11s/^  version:.*/  version: \"$package_version\"/" helm/deploy/helmfile.yaml
    echo "Updated helm/deploy/helmfile.yaml version to $package_version"

    # Create new changelog file
    changelog_file="frontend/public/changelog/$new_version.md"
    if [ -f "$changelog_file" ]; then
        echo "Warning: Changelog file for version $new_version already exists!"
    else
        touch "$changelog_file"
        echo "Created new changelog file: $changelog_file"
    fi

    # Update messageData.json
    if jq -e --arg new_version "$new_version" '.changelogVersions | index($new_version)' frontend/messageData.json > /dev/null; then
        echo "Version $new_version already exists in messageData.json"
    else
        jq --arg new_version "$new_version" '.changelogVersions |= [$new_version] + .' frontend/messageData.json > tmp.$$.json && mv tmp.$$.json frontend/messageData.json
        echo "Updated messageData.json with new version $new_version"
    fi
}

# Main Menu
function mainMenu() {
    clear
    echo "Main Menu Options:"
    echo "1 Start Metagrid - Production"
    echo "2 Stop Metagrid Containers"
    echo "3 Start / Stop Local Dev Containers"
    echo "4 Run pre-commit and tests"
    echo "5 Developer Actions"
    echo "6 Exit"
    read option
    if [ -z $option ]; then
        clear
        echo "Please enter a number corresponding to the menu item."
        mainMenu
    else
        if [ "$option" = "1" ]; then
            startProductionService
            return 0
        elif [ "$option" = "2" ]; then
            stopDockerContainers
            mainMenu
        elif [ "$option" = "3" ]; then
            toggleLocalContainers
            return 0
        elif [ "$option" = "4" ]; then
            clear
            runPreCommit && runBackendTests && runFrontendTests && echo "All tests passed!" || echo "Some tests failed!"
            return 0
        elif [ "$option" = "5" ]; then
            clear
            devActionsMenu
        elif [ "$option" = "6" ]; then
            clear
            return 0
        else
            clear
            echo "You entered: $option"
            echo "Please enter a number from 1 to 6"
            mainMenu
        fi
    fi
}

#Container Menu
function devActionsMenu() {
    echo "Local Dev Actions:"
    echo "1 Run pre-commit"
    echo "2 Test Backend"
    echo "3 Test Frontend"
    echo "4 Run Migrations"
    echo "5 Update Project Table"
    echo "6 Refresh Postgres Collation & Reindex"
    echo "7 Install Packages for Local Dev"
    echo "8 Configure Production"
    echo "9 Update Version"
    echo "10 Back to Main Menu"
    read option
    if [ -z $option ]; then
        clear
        echo "Please enter a number corresponding to the menu item."
        devActionsMenu
    else
        if [ "$option" = "1" ]; then
            runPreCommit
            return 0
        elif [ "$option" = "2" ]; then
            runBackendTests
            return 0
        elif [ "$option" = "3" ]; then
            runFrontendTests
            return 0
        elif [ "$option" = "4" ]; then
            runMigrations
            return 0
        elif [ "$option" = "5" ]; then
            updateProjectTable
            return 0
        elif [ "$option" = "6" ]; then
            refreshPostgresCollation
            return 0
        elif [ "$option" = "7" ]; then
            installPackagesForLocalDev
            return 0
        elif [ "$option" = "8" ]; then
            configureProduction
            return 0
        elif [ "$option" = "9" ]; then
            updateVersion
            return 0
        elif [ "$option" = "10" ]; then
            clear
            mainMenu
        else
            clear
            echo "You entered: $option"
            echo "Please enter a number from 1 to 10"
            devActionsMenu
        fi
    fi
}

clear
mainMenu
