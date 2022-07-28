# Constants
METAGRID_CONFIG=metagrid_config
DEFAULT_EDITOR=emacs

#Custom functions
function configure() {
    sudo $DEFAULT_EDITOR metagrid_configs/$METAGRID_CONFIG && cp metagrid_configs/$METAGRID_CONFIG traefik/.env
}

#Arg1 name of service: frontend, backend or traefik
#Arg2 optional '-d' to perform service in background
function startService() {
    echo "Starting $1"
    cd $1
    sudo docker compose -f docker-compose.prod.yml up --build $2
}

function stopService() {
    echo "Stopping $1"
    cd $1
    sudo docker compose -f docker-compose.prod.yml down
}

function startMetagridContainers() {
    startService traefik -d
    startService backend -d
    startService frontend -d
}

function stopMetagridContainers() {
    stopService frontend
    stopService backend
    stopService traefik
}

# Main Menu
function mainMenu() {
    echo "Main Menu Options:"
    echo "1 Configure Metagrid"
    echo "2 Start all containers"
    echo "3 Stop all containers"
    echo "4 Container Start / Stop Menu"
    echo "5 Exit"
    read option
    if [ -z $option ]; then
        clear
        echo "Please enter a number corresponding to the menu item."
        mainMenu
    else
        if [ "$option" = "1" ]; then
            configure
            clear
            mainMenu
        elif [ "$option" = "2" ]; then
            startMetagridContainers
            clear
            mainMenu
        elif [ "$option" = "3" ]; then
            stopMetagridContainers
            clear
            mainMenu
        elif [ "$option" = "4" ]; then
            clear
            containersMenu
        elif [ "$option" = "5" ]; then
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
    echo "7 Back to Main Menu"
    read option
    if [ -z $option ]; then
        clear
        echo "Please enter a number corresponding to the menu item."
        containersMenu
    else
        if [ "$option" = "1" ]; then
            startService frontend
        elif [ "$option" = "2" ]; then
            stopService frontend
            clear
            mainMenu
        elif [ "$option" = "3" ]; then
            startService backend
        elif [ "$option" = "4" ]; then
            stopService backend
            clear
            mainMenu
        elif [ "$option" = "5" ]; then
            startService traefik
        elif [ "$option" = "6" ]; then
            stopService traefik
            clear
            mainMenu
        elif [ "$option" = "7" ]; then
            clear
            mainMenu
        else
            clear
            echo "You entered: $option"
            echo "Please enter a number from 1 to 7"
            containersMenu
        fi
    fi
}

clear
mainMenu
