# Constants
METAGRID_CONFIG=metagrid_config
DEFAULT_EDITOR=emacs
CONFIG_DIR=metagrid_configs
BACKUP_DIR=$CONFIG_DIR/backups
BACKUP_FORMAT=config_backup_$(date +'%F_%I-%M-%S')

set -e

#Custom functions

function startProductionService() {
    echo "Starting Metagrid"
    docker compose -f docker-compose.yml -f docker-compose.prod-overlay.yml up --build -d
}

function stopProductionService() {
    echo "Stopping Metagrid"
    docker compose -f docker-compose.yml -f docker-compose.prod-overlay.yml down --remove-orphans
}

function startLocalService() {
    echo "Starting Metagrid"
    docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml up --build -d
}

function stopLocalService() {
    echo "Stopping Metagrid"
    docker compose down --remove-orphans
}

function toggleLocalContainers() {
    clear
    # If frontend container is up, stop all services
    if docker ps -a --format '{{.Names}}' | grep "metagrid-react"; then
        stopLocalService
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
    stopLocalService
    docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm django python manage.py migrate
    stopLocalService
}

function runPreCommit() {
    clear
    pre-commit run --all-files
}

function runBackendTests() {
    clear
    stopLocalService
    docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm django pytest
    stopLocalService
}

function runFrontendTests() {
    clear
    stopLocalService
    docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml run --rm react 'jest'
    stopLocalService
}

function configureLocal() {
    clear
    ./configHelper.sh
}

# Main Menu
function mainMenu() {
    echo "Main Menu Options:"
    echo "1 Start Metagrid - Production"
    echo "2 Stop Metagrid - Production"
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
            clear
            mainMenu
        elif [ "$option" = "2" ]; then
            stopProductionService
            clear
            mainMenu
        elif [ "$option" = "3" ]; then
            toggleLocalContainers
            clear
            mainMenu
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
