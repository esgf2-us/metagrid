#!/bin/bash

OPTION=$1

#Options
clearTables='--clear'

#Filenames
localDockerCompose='docker-compose.yml'
prodDockerCompose='docker-compose.prod.yml'
localPostgres='postgres'
prodPostgres='backend_postgres_1'
dockerCompose=$prodDockerCompose
postgres=$prodPostgres
useSudo=''

#Check whether to run in production or local
containerName=$(docker ps --format "table {{.Names}}" | grep -e "postgres" -e "backend_postgres_1")

if [[ "$containerName" == "$localPostgres" ]]; then
    echo "---LOCAL ENVIRONMENT UPDATE---"
    dockerCompose=$localDockerCompose
    postgres=$localPostgres
elif [[ "$containerName" == "$prodPostgres" ]]; then
    echo "---PRODUCTION ENVIRONMENT UPDATE---"
    useSudo='sudo'
    echo "---REBUILDING DJANGO CONTAINER---"
    sudo docker-compose -f $dockerCompose build django
    echo "---DONE---"
else
    echo "This script should be run when the backend containers are active."
    exit 1
fi

if [[ "$OPTION" == "$clearTables" ]]; then
    echo "---CLEARING EXISTING TABLES TO ALLOW DATA MIGRATION---"
    $useSudo docker-compose -f $dockerCompose run --rm django python manage.py migrate projects zero
    echo "---DONE---"
else
    echo "---UPDATING MIGRATION TABLE TO ALLOW DATA MIGRATION---"
    $useSudo docker-compose -f $dockerCompose run --rm django python manage.py migrate --fake projects 0001_initial
    echo "---DONE---"
fi

echo "---RUNNING MIGRATION UPDATE---"
$useSudo docker-compose -f $dockerCompose run --rm django python manage.py migrate projects
echo "---DONE---"
