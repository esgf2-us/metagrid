# Constants
METAGRID_CONFIG=metagrid_config
DEFAULT_EDITOR=emacs
CONFIG_DIR=metagrid_configs
BACKUP_DIR=$CONFIG_DIR/backups
BACKUP_FORMAT=config_backup_$(date +'%F_%I-%M-%S')

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
        auth_overlay=""
        echo "Globus selected!"
        ;;
    2)
        auth_overlay="-f docker-compose-keycloak-overlay.yml -f docker-compose-keycloak-prod-overlay.yml"
        echo "Keycloak selected!"
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        startProductionService
        return
        ;;
    esac
    echo ""
    echo "Choose deployment type:"
    echo "1 Traefik"
    echo "2 Local Site Ingress"
    read -r deployment_choice

    base_network_host_off="-f docker-compose.yml -f docker-compose-prod-overlay.yml"
    base_network_host_on="-f docker-compose.yml -f docker-compose-local-overlay.yml -f docker-compose-prod-overlay.yml"

    case $deployment_choice in
    1)
        echo "Starting Metagrid with Traefik deployment"
        docker compose $base_network_host_off $auth_overlay -f docker-compose-traefik-prod-overlay.yml up --build -d
        ;;
    2)
        echo "Starting Metagrid with Standard deployment"
        docker compose $base_network_host_on -f docker-compose-site-ingress-overlay.yml up --build -d
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        startProductionService
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
        docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml up --build -d
        echo "Command used:"
        echo "docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml up --build -d"
        ;;
    2)
        echo "Starting Metagrid with Keycloak auth"
        docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml -f docker-compose-keycloak-overlay.yml up --build -d
        echo "Command used:"
        echo "docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml -f docker-compose-keycloak-overlay.yml up --build -d"
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        startLocalService
        ;;
    esac
}

function stopDockerContainers() {
    echo "Stopping Metagrid"
    docker compose down --remove-orphans
}

function toggleLocalContainers() {
    clear
    # If frontend container is up, stop all services
    if docker ps -a --format '{{.Names}}' | grep "react-local"; then
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
    stopDockerContainers
    docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm django python manage.py migrate
    stopDockerContainers
}

function runPreCommit() {
    clear
    pre-commit run --all-files
}

function runBackendTests() {
    clear
    stopDockerContainers
    docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm django pytest
    stopDockerContainers
}

function runFrontendTests() {
    clear
    stopDockerContainers
    docker compose -f docker-compose.yml -f docker-compose-local-overlay.yml run --rm react 'jest'
    stopDockerContainers
}

function configureLocal() {
    clear
    ./configHelper.sh
}

# Main Menu
function mainMenu() {
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
            return 0
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
    echo "5 Install Packages for Local Dev"
    echo "6 Configure Local"
    echo "7 Back to Main Menu"
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
            installPackagesForLocalDev
            return 0
        elif [ "$option" = "6" ]; then
            configureLocal
            return 0
        elif [ "$option" = "7" ]; then
            clear
            mainMenu
        else
            clear
            echo "You entered: $option"
            echo "Please enter a number from 1 to 7"
            devActionsMenu
        fi
    fi
}

clear
mainMenu
