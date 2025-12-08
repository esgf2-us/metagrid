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
prompt_optional STAC_URL "Enter the STAC API URL (optional)" "" "(Optional) The STAC URL at which the ESG-Search api can be queried. A suitable endpoint will return JSON in the browser."
prompt_required SEARCH_URL "Enter the ESG-Search API URL" "https://esgf-node.ornl.gov/esgf-1-5-bridge" "The URL at which the ESG-Search api can be queried. A suitable endpoint will return XML in the browser."

# WGET_URL is optional in site_specific.py (default None)
prompt_optional WGET_URL "Enter the ESG-Search wget URL (optional)" "" "(Optional) If set, the URL at which the ESG-Search wget endpoint can be reached. If left empty, the integrated WGET implementation will be used."

prompt_required GLOBUS_CLIENT_ID "Enter the Globus Client ID" "536321f7-c0e9-462c-b5c6-34d4a3672076" "The 'Client UUID' obtained by registering a thick client or script that will be installed and run by users on their devices with Globus at https://app.globus.org/settings/developers. This is required even if signing in with Globus is not enabled. It is used for browsing Globus Collections to which files may be sent."
prompt_required GLOBUS_CLIENT_KEY "Enter the Globus Social Auth Key" "989830-dasd-b5c6-34d4a3672076" "The Client UUID created for 'SOCIAL_AUTH_GLOBUS_KEY' at https://app.globus.org/settings/developers"
prompt_required GLOBUS_CLIENT_SECRET "Enter the Globus Social Auth Secret" "6aWj3gBYsxUBO++cSXtPzbl4n/sGJdhAmtn70XRoUMA=" "A 'Client Secret' associated with the Client UUID created for 'SOCIAL_AUTH_GLOBUS_KEY' at https://app.globus.org/settings/developers"
prompt_optional STATUS_URL "Enter the Node Status API URL" "https://nimbus-dev.llnl.gov/metagrid-backend/proxy/status" "The URL at which the backend can reach the Node Status API."
prompt_optional AUTHENTICATION_METHOD "Enter the Globus Authentication Method" "none" "Which authentication method to enable for user sign in on the frontend. Options are: globus, keycloak, none."

prompt_optional BANNER_TEXT "Enter the Banner Text (optional)" "" "(Optional) Text to display as a banner above the main body (useful for maintenance notices)."
prompt_optional SUPPORT_INFO "Enter the Support Info (optional)" "" "(Optional) Text to display site administrator support information."

# Footer default changed to empty string per site_specific.py
prompt_optional FOOTER_TEXT "Enter the Footer Text (single-line markdown, optional)" "" "Text to display in the footer of the frontend. The string should be formatted as Markdown and will be rendered as such."
# GLOBUS_NODES default aligned with site_specific.py
prompt_optional GLOBUS_NODES "Enter a list of Globus enabled nodes (JSON array string)" '["aims3.llnl.gov","esgf-data1.llnl.gov","esgf-data2.llnl.gov","esgf-node.ornl.gov","eagle.alcf.anl.gov"]' "The list of data nodes known to be Globus enabled. A data node must be in this list in order to transfer files from it via Globus."

prompt_optional DATA_UPLOAD_MAX_NUMBER_FIELDS "Enter DATA_UPLOAD_MAX_NUMBER_FIELDS" "1024" "Maximum number of form fields allowed in a single upload (useful for large wget payloads)."
prompt_optional GLOBUS_PUBLIC_INDEX_ENDPOINT_ID "Enter the Globus public index endpoint ID" "a8ef4320-9e5a-4793-837b-c45161ca1845" "The Globus index ID for the public ESGF2 data."
prompt_optional WGET_SCRIPT_FILE_DEFAULT_LIMIT "Enter WGET_SCRIPT_FILE_DEFAULT_LIMIT" "9999" "Default limit on number of files allowed in a generated wget script."
prompt_optional WGET_SCRIPT_FILE_MAX_LIMIT "Enter WGET_SCRIPT_FILE_MAX_LIMIT" "100000" "Maximum limit on number of files allowed in a generated wget script."
prompt_optional WGET_MAX_DIR_LENGTH "Enter WGET_MAX_DIR_LENGTH" "50" "Maximum character length for facet values when creating directory names for wget downloads."

prompt_optional HOTJAR_ID "Enter Hotjar ID (optional)" "" "(Optional) The Hotjar ID for tracking user interactions."
prompt_optional HOTJAR_SV "Enter Hotjar SV (optional)" "" "(Optional) The Hotjar SV for tracking user interactions."
prompt_optional GOOGLE_ANALYTICS_TRACKING_ID "Enter Google Analytics Tracking ID (optional)" "" "(Optional) The Google Analytics tracking ID."

# Prompt for Keycloak deployment
echo "(Optional) Do you wish to add Keycloak social auth settings? (yes/no)"
read -r USE_KEYCLOAK

if [ "$USE_KEYCLOAK" == "yes" ]; then
    # Keycloak settings
    prompt_optional KEYCLOAK_URL "Enter the Keycloak URL (optional)" "" "The URL at which the Keycloak server can be reached."
    prompt_optional KEYCLOAK_REALM "Enter the Keycloak Realm (optional)" "" "The Keycloak realm to use for authentication."
    prompt_optional KEYCLOAK_CLIENT_ID "Enter the Keycloak Client ID (optional)" "metagrid-localhost" "The Keycloak client ID to use for authentication."
fi

# Django settings
prompt_required DOMAIN_NAME "Enter the Domain Name" "esgf-dev1.llnl.gov" "The domain name for the Django application."
prompt_required DJANGO_ALLOWED_HOSTS "Enter the Django Allowed Hosts" '["esgf-dev1.llnl.gov", "198.128.245.131", "localhost"]' "A list of strings representing the host/domain names that this Django site can serve."
prompt_required DJANGO_SECRET_KEY "Enter the Django Secret Key" "RxPYuuqUmCK2VHHwyqab7tt7PrL-ktuGmOPncb_wwFM" "A secret key for a particular Django installation."

# New optional backend/admin settings
prompt_optional ADMIN_URL "Enter ADMIN_URL (optional - leave blank to auto-generate)" "" "Optional override for the Django admin path (if left blank a random path will be generated)."
prompt_optional ADMINS "Enter ADMINS (optional - JSON list of tuples)" "[]" "Optional list of admin tuples. Example: [(\"Admin\",\"admin@example.com\")]"
prompt_optional DATABASE_URL "Enter DATABASE_URL (optional)" "postgresql://postgres:postgres@postgres:5432/postgres" "Database connection URL for the Metagrid backend."

# Prompt for output file name
echo
echo "Enter the name for this overlay.yml file (default: docker-compose-local-overlay.yml):"
read -r OUTPUT_FILE
OUTPUT_FILE=${OUTPUT_FILE:-docker-compose-local-overlay.yml}

cat <<EOF >$OUTPUT_FILE
services:
  traefik:
    environment:
      DOMAIN_NAME: $DOMAIN_NAME

  django:
    environment:
      DOMAIN_NAME: $DOMAIN_NAME
      DJANGO_ALLOWED_HOSTS: $DJANGO_ALLOWED_HOSTS
      DJANGO_SECRET_KEY: $DJANGO_SECRET_KEY
      METAGRID_SEARCH_URL: $SEARCH_URL
      METAGRID_STAC_URL: $STAC_URL
      METAGRID_WGET_URL: $WGET_URL
      METAGRID_STATUS_URL: $STATUS_URL
      METAGRID_GLOBUS_CLIENT_ID: $GLOBUS_CLIENT_ID
      METAGRID_SOCIAL_AUTH_GLOBUS_KEY: $GLOBUS_CLIENT_KEY
      METAGRID_SOCIAL_AUTH_GLOBUS_SECRET: $GLOBUS_CLIENT_SECRET
      METAGRID_AUTHENTICATION_METHOD: $AUTHENTICATION_METHOD
      METAGRID_FOOTER_TEXT: $FOOTER_TEXT
      METAGRID_GLOBUS_NODES: $GLOBUS_NODES
      METAGRID_DATA_UPLOAD_MAX_NUMBER_FIELDS: $DATA_UPLOAD_MAX_NUMBER_FIELDS
      METAGRID_GLOBUS_PUBLIC_INDEX_ENDPOINT_ID: $GLOBUS_PUBLIC_INDEX_ENDPOINT_ID
      METAGRID_WGET_SCRIPT_FILE_DEFAULT_LIMIT: $WGET_SCRIPT_FILE_DEFAULT_LIMIT
      METAGRID_WGET_SCRIPT_FILE_MAX_LIMIT: $WGET_SCRIPT_FILE_MAX_LIMIT
      METAGRID_WGET_MAX_DIR_LENGTH: $WGET_MAX_DIR_LENGTH
      METAGRID_BANNER_TEXT: $BANNER_TEXT
      METAGRID_SUPPORT_INFO: $SUPPORT_INFO
      METAGRID_HOTJAR_ID: $HOTJAR_ID
      METAGRID_HOTJAR_SV: $HOTJAR_SV
      METAGRID_GOOGLE_ANALYTICS_TRACKING_ID: $GOOGLE_ANALYTICS_TRACKING_ID
      METAGRID_ADMIN_URL: $ADMIN_URL
      METAGRID_ADMINS: $ADMINS
      METAGRID_DATABASE_URL: $DATABASE_URL
EOF

if [ "$USE_KEYCLOAK" == "yes" ]; then
    cat <<EOF >>$OUTPUT_FILE
      METAGRID_KEYCLOAK_URL: $KEYCLOAK_URL
      METAGRID_KEYCLOAK_REALM: $KEYCLOAK_REALM
      METAGRID_KEYCLOAK_CLIENT_ID: $KEYCLOAK_CLIENT_ID

  keycloak:
    profiles: [ "keycloak" ]
    environment:
      KEYCLOAK_USER: admin
      KEYCLOAK_PASSWORD: admin
EOF
fi

echo "Congratulations! Configuration file '$OUTPUT_FILE' created successfully."
