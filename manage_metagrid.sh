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
    docker compose -f docker-compose.yml -f docker-compose.local-overlay.yml down --remove-orphans
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

function runPreCommit() {
    clear
    pre-commit run --all-files
}

# Main Menu
function mainMenu() {
    echo "Main Menu Options:"
    echo "1 Start Metagrid - Production"
    echo "2 Stop Metagrid - Production"
    echo "3 Start / Stop Local Dev Containers"
    echo "4 Run pre-commit"
    echo "5 Exit"
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
            runPreCommit
            return 0
        elif [ "$option" = "5" ]; then
            clear
            return 0
        else
            clear
            echo "You entered: $option"
            echo "Please enter a number from 1 to 5"
            mainMenu
        fi
    fi
}

#Container Menu
function containersMenu() {
    echo "Container Start/Stop"
    echo "1 Start Frontend"
    echo "2 Stop Frontend"
    echo "3 Start Backend"
    echo "4 Stop Backend"
    echo "5 Start Traefik"
    echo "6 Stop Traefik"
    echo "7 Start Documentation"
    echo "8 Stop Documentation"
    echo "9 Back to Main Menu"
    read option
    if [ -z $option ]; then
        clear
        echo "Please enter a number corresponding to the menu item."
        containersMenu
    else
        if [ "$option" = "1" ]; then
            startService frontend
            mainMenu
        elif [ "$option" = "2" ]; then
            stopService frontend
            clear
            mainMenu
        elif [ "$option" = "3" ]; then
            startService backend
            mainMenu
        elif [ "$option" = "4" ]; then
            stopService backend
            clear
            mainMenu
        elif [ "$option" = "5" ]; then
            startService traefik
            mainMenu
        elif [ "$option" = "6" ]; then
            stopService traefik
            clear
            mainMenu
        elif [ "$option" = "7" ]; then
            startLocalService docs -d
            mainMenu
        elif [ "$option" = "8" ]; then
            stopLocalService docs -d
            clear
            mainMenu
        elif [ "$option" = "9" ]; then
            clear
            mainMenu
        else
            clear
            echo "You entered: $option"
            echo "Please enter a number from 1 to 9"
            containersMenu
        fi
    fi
}

clear
mainMenu
