#!/bin/bash

clear
echo
echo "Welcome to the Metagrid configuration helper script."
echo
echo "This script will guide you through setting up the required and optional environment variables for Metagrid deployment."
echo "Optional settings can be skipped by simply pressing 'enter', but required settings cannot be skipped."
echo "Press 'enter' to proceed or type 'quit' to exit..."

read -r start

if [ "$start" == "quit" ]; then
    clear
    exit 1
else
    clear
fi

# Function to prompt for required settings
prompt_required() {
    local var_name=$1
    local prompt_message=$2
    local example_value=$3
    local description=$4

    while true; do
        echo "(Required) $prompt_message (or type 'quit' to exit)"
        echo
        echo "Description: $description"
        echo "Example: $example_value"
        echo

        read -r value
        if [ "$value" == "quit" ]; then
            clear
            exit 1
        elif [ -z "$value" ]; then
            clear
            echo "This setting is required..."
            echo
        else
            clear
            eval "$var_name='$value'"
            break
        fi
    done
}

# Function to prompt for optional settings
prompt_optional() {
    local var_name=$1
    local prompt_message=$2
    local default_value=$3
    local description=$4

    echo "(Optional) $prompt_message (or type 'quit' to exit)"
    echo
    echo "Description: $description"
    echo "Default: $default_value"

    read -r value
    if [ "$value" == "quit" ]; then
        clear
        exit 1
    fi

    clear
    eval "$var_name='${value:-$default_value}'"
}

# Backend settings
prompt_required SEARCH_URL "Enter the ESG-Search API URL" "https://esgf-node.llnl.gov/esg-search/search" "The URL at which the ESG-Search api can be queried. A suitable endpoint will return XML in the browser."
prompt_required WGET_URL "Enter the ESG-Search wget URL" "https://esgf-node.llnl.gov/esg-search/wget" "The URL at which the ESG-Search wget endpoint can be reached."
prompt_required STATUS_URL "Enter the Node Status API URL" "https://nimbus-dev.llnl.gov/metagrid-backend/proxy/status" "The URL at which the backend can reach the Node Status API."
prompt_required GLOBUS_CLIENT_ID "Enter the Globus Client ID" "536321f7-c0e9-462c-b5c6-34d4a3672076" "The 'Client UUID' obtained by registering a thick client or script that will be installed and run by users on their devices with Globus at https://app.globus.org/settings/developers. This is required even if signing in with Globus is not enabled. It is used for browsing Globus Collections to which files may be sent."
prompt_required GLOBUS_CLIENT_SECRET "Enter the Globus Client Secret" "6aWj3gBYsxUBO++cSXtPzbl4n/sGJdhAmtn70XRoUMA=" "A 'Client Secret' associated with the Client UUID created for 'SOCIAL_AUTH_GLOBUS_KEY' at https://app.globus.org/settings/developers"
prompt_required SOLR_URL "Enter the SOLR URL \(default: https://esgf-node.llnl.gov/esg-search\)" "https://esgf-node.llnl.gov/esg-search" "https://esgf-node.llnl.gov/esg-search" "The URL at which the SOLR endpoint can be reached."
prompt_optional AUTHENTICATION_METHOD "Enter the Globus Authentication Method" "globus" "Which authentication method to enable for user sign in on the frontend."
prompt_optional FOOTER_TEXT "Enter the Footer Text (if it's a simple line of markdown). If you need a more complex footer, skip for now and you can update the overlay file with your desired footer markdown afterwards." "Privacy & Legal Notice: [https://www.llnl.gov/disclaimer.html](https://www.llnl.gov/disclaimer.html)" "Text to display in the footer of the frontend. Useful for adding a link to the terms of service or other legal information. The string should be formatted as MarkDown and will be rendered as such."

# Prompt for output file name
echo
echo "Enter the name for this overlay.yml file (default: docker-compose.generated-overlay.yml):"
read -r OUTPUT_FILE
OUTPUT_FILE=${OUTPUT_FILE:-docker-compose.generated-overlay.yml}

cat <<EOF >$OUTPUT_FILE
services:
  django:
    environment:
      METAGRID_SEARCH_URL: $SEARCH_URL
      METAGRID_WGET_URL: $WGET_URL
      METAGRID_STATUS_URL: $STATUS_URL
      METAGRID_SOLR_URL: $SOLR_URL
      METAGRID_SOCIAL_AUTH_GLOBUS_KEY: $GLOBUS_CLIENT_ID
      METAGRID_SOCIAL_AUTH_GLOBUS_SECRET: $GLOBUS_CLIENT_SECRET
      METAGRID_GLOBUS_CLIENT_ID: $GLOBUS_CLIENT_ID
      METAGRID_AUTHENTICATION_METHOD: $AUTHENTICATION_METHOD
      METAGRID_FOOTER_TEXT: $FOOTER_TEXT
EOF

echo "Congratulations! Configuration file '$OUTPUT_FILE' created successfully."
