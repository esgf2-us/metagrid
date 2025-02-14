# Constants
LOCAL_COMPOSE="-f docker-compose.yml"
PROD_COMPOSE="-f docker-compose.yml -f docker-compose.prod.yml"
KEYCLOAK_COMPOSE="-f docker-compose.keycloak.yml"
LOCAL_OVERLAY="-f docker-compose-local-overlay.yml"
PROD_OVERLAY="-f docker-compose-prod-overlay.yml"

set -e

#Custom functions
function startProductionService() {
    clear
    echo "Choose authentication method:"
    echo "1 Globus"
    echo "2 Keycloak"
    read -r auth_choice

    case $auth_choice in
    1)
        echo "Starting Metagrid production deployment with Globus"
        docker compose $PROD_COMPOSE $PROD_OVERLAY up --build -d
        echo "Command used:"
        echo "docker compose $PROD_COMPOSE $PROD_OVERLAY up --build -d"
        ;;
    2)
        echo "Starting Metagrid production deployment with Keycloak"
        docker compose $PROD_COMPOSE $KEYCLOAK_COMPOSE $PROD_OVERLAY --profile keycloak up --build -d
        echo "Command used:"
        echo "docker compose $PROD_COMPOSE $KEYCLOAK_COMPOSE $PROD_OVERLAY --profile keycloak up --build -d"
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        startProductionService
        return
        ;;
    esac
}

function startLocalService() {
    clear
    echo "Choose local deployment auth method:"
    echo "1 Globus"
    echo "2 Keycloak"
    read -r auth_choice

    case $auth_choice in
    1)
        echo "Starting Metagrid with Globus auth"
        docker compose $LOCAL_COMPOSE $LOCAL_OVERLAY --profile docs up --build -d
        echo "Command used:"
        echo "docker compose $LOCAL_COMPOSE $LOCAL_OVERLAY --profile docs up --build -d"
        ;;
    2)
        echo "Starting Metagrid with Keycloak auth"
        docker compose $LOCAL_COMPOSE $KEYCLOAK_COMPOSE $LOCAL_OVERLAY --profile docs --profile keycloak up --build -d
        echo "Command used:"
        echo "docker compose $LOCAL_COMPOSE $KEYCLOAK_COMPOSE $LOCAL_OVERLAY --profile docs --profile keycloak up --build -d"
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        startLocalService
        ;;
    esac
}

function stopDockerContainers() {
    echo "Stopping Metagrid"
    docker compose --profile "*" down --remove-orphans
}

function toggleLocalContainers() {
    clear
    # If frontend container is up, stop all services
    if docker ps -a --format '{{.Names}}' | grep "react"; then
        stopDockerContainers
    else
        # Otherwise stop any remaining services and start them up again
        startLocalService
    fi
}

function installPackagesForLocalDev() {
    clear
    pip install -r backend/requirements/local.txt
    yarn install --cwd frontend
    echo "Packages installed"
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
        docker compose $LOCAL_COMPOSE $LOCAL_OVERLAY run --rm django python manage.py migrate
        stopDockerContainers
        ;;
    2)
        stopDockerContainers
        docker compose $PROD_COMPOSE $PROD_OVERLAY run --rm django python manage.py migrate
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
        docker compose $LOCAL_COMPOSE $LOCAL_OVERLAY build django
        docker compose $LOCAL_COMPOSE $LOCAL_OVERLAY run --rm django python manage.py migrate --fake projects 0001_initial
        docker compose $LOCAL_COMPOSE $LOCAL_OVERLAY run --rm django python manage.py migrate projects
        stopDockerContainers
        ;;
    2)
        stopDockerContainers
        docker compose $PROD_COMPOSE $PROD_OVERLAY build django
        docker compose $PROD_COMPOSE $PROD_OVERLAY run --rm django python manage.py migrate --fake projects 0001_initial
        docker compose $PROD_COMPOSE $PROD_OVERLAY run --rm django python manage.py migrate projects
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
    docker compose $LOCAL_COMPOSE $LOCAL_OVERLAY --profile docs run --rm django pytest
    stopDockerContainers
}

function runFrontendTests() {
    clear
    cd frontend
    yarn run test
    cd ..
}

function configureProduction() {
    clear
    ./configHelper.sh
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
            runPreCommit && runBackendTests && runFrontendTests && echo "All tests passed!"
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
    echo "6 Install Packages for Local Dev"
    echo "7 Configure Production"
    echo "8 Back to Main Menu"
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
            installPackagesForLocalDev
            return 0
        elif [ "$option" = "7" ]; then
            configureProduction
            return 0
        elif [ "$option" = "8" ]; then
            clear
            mainMenu
        else
            clear
            echo "You entered: $option"
            echo "Please enter a number from 1 to 8"
            devActionsMenu
        fi
    fi
}

clear
mainMenu
