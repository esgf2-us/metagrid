# Constants
METAGRID_DIR=~/metagrid

#Custom functions
function editTasks(){
    vim ~/tasks_metagrid.sh
}

function openDjangoSettings(){
    vim $METAGRID_DIR/backend/.envs/.production/.django
}

function openPostgresSettings(){
    vim $METAGRID_DIR/backend/.envs/.production/.postgres
}

function openCorsProxySettings(){
    vim $METAGRID_DIR/frontend/.envs/.production/.cors-proxy
}

function openReactSettings(){
    vim $METAGRID_DIR/frontend/.envs/.production/.react
}

function openTraefikSettings(){
    vim $METAGRID_DIR/traefik/traefik.yml
}

function stopSupervisor(){
    sudo supervisorctl stop all
    sudo supervisorctl status
}

function startSupervisor(){
    sudo supervisorctl start all
    sudo supervisorctl status
}

#Arg1 name of service: frontend, backend or traefik
#Arg2 optional '-d' to perform service in background
function startService(){
    echo "Starting $1"
    cd $METAGRID_DIR/$1
    docker-compose -f docker-compose.prod.yml up --build $2
}

function stopService(){
    echo "Stopping $1"
    cd $METAGRID_DIR/$1
    docker-compose -f docker-compose.prod.yml down
}

function startMetagridContainers(){
    startService traefik -d
    startService backend -d
    startService frontend -d
}

function stopMetagridContainers(){
    stopService frontend
    stopService backend
    stopService traefik
}

# Main Menu
function mainMenu(){
    echo "Main Menu Options:"
    echo "1 Set Deployment Version"
    echo "1 Start all containers"
    echo "2 Stop all containers"
    echo "3 Configure Metagrid"
    echo "4 Shows settings menu"
    echo "5 Container Start / Stop Menu"
    echo "6 Exit"
    read option
if [ -z $option ]
then
    clear
    echo "Please enter a number corresponding to the menu item."
    mainMenu
else
    if [ "$option" = "1" ]
    then
	startSupervisor
	clear
	mainMenu
    elif [ "$option" = "2" ]
    then
	stopSupervisor
	clear
	mainMenu
    elif [ "$option" = "3" ]
    then
        startMetagridContainers
	clear
	mainMenu
    elif [ "$option" = "4" ]
    then
        stopMetagridContainers
	clear
	mainMenu
    elif [ "$option" = "5" ]
    then
	clear
        settingsMenu
    elif [ "$option" = "6" ]
    then
	clear
	containersMenu
    elif [ "$option" = "7" ]
    then
        editTasks
	clear
	mainMenu
    elif [ "$option" = 8 ]
    then
	return 0
    else
        clear
        echo "You entered: $option"
        echo "Please enter a number from 1 to 7"
	mainMenu
    fi
fi
}

#Settings Menu
function settingsMenu(){
    echo "Settings Options"
    echo "1 Open Django settings"
    echo "2 Open Cors-Proxy settings"
    echo "3 Open Traefik settings"
    echo "4 Open React settings"
    echo "5 Open Postgres settings"
    echo "6 Back to Main Menu"
    read option
if [ -z $option ]
then
    clear
    echo "Please enter a number corresponding to the menu item."
    settingsMenu
else
    if [ "$option" = "1" ]
    then
        openDjangoSettings
	clear
	mainMenu
    elif [ "$option" = "2" ]
    then
        openCorsProxySettings
	clear
	mainMenu
    elif [ "$option" = "3" ]
    then
        openTraefikSettings
	clear
	mainMenu
    elif [ "$option" = "4" ]
    then
        openReactSettings
	clear
	mainMenu
    elif [ "$option" = "5" ]
    then
        openPostgresSetting
	clear
	mainMenu
    elif [ "$option" = "6" ]
    then
	clear
        mainMenu
    else
	clear
        echo "You entered: $option"
        echo "Please enter a number from 1 to 6"
        settingsMenu
    fi
fi
}

#Container Menu
function containersMenu(){
    echo "Container Start/Stop"
    echo "1 Start Frontend"
    echo "2 Stop Frontend"
    echo "3 Start Backend"
    echo "4 Stop Backend"
    echo "5 Start Traefik"
    echo "6 Stop Traefik"
    echo "7 Back to Main Menu"
    read option
if [ -z $option ]
then
    clear
    echo "Please enter a number corresponding to the menu item."
    containersMenu
else
    if [ "$option" = "1" ]
    then
        startService frontend
    elif [ "$option" = "2" ]
    then
        stopService frontend
	clear
	mainMenu
    elif [ "$option" = "3" ]
    then
     	startService backend
    elif [ "$option" = "4" ]
    then
	stopService backend
	clear
	mainMenu
    elif [ "$option" = "5" ]
    then
        startService traefik
    elif [ "$option" = "6" ]
    then
        stopService traefik
	clear
	mainMenu
    elif [ "$option" = "7" ]
    then
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

mainMenu
