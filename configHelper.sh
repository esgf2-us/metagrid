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
            # required values are never considered default
            eval "${var_name}__IS_DEFAULT=false"
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
    if [ -z "$value" ]; then
      # user accepted default
      eval "$var_name='${default_value}'"
      eval "${var_name}__IS_DEFAULT=true"
    else
      eval "$var_name='${value}'"
      eval "${var_name}__IS_DEFAULT=false"
    fi
}

# Function to prompt for multiline optional settings.
# Enter lines, finish by entering a single dot '.' on its own line.
prompt_multiline() {
  local var_name=$1
  local prompt_message=$2
  local default_value=$3
  local description=$4

  echo "(Optional) $prompt_message (end input with a single '.' on a line by itself, or type 'quit' to exit)"
  echo
  echo "Description: $description"
  echo "Default: $default_value"
  echo
  echo "Enter multiline input below. Finish by entering a single dot (.) on its own line:"

  tmpfile=$(mktemp)
  while IFS= read -r line; do
    if [ "$line" = "quit" ]; then
      clear
      rm -f "$tmpfile"
      exit 1
    fi
    if [ "$line" = "." ]; then
      break
    fi
    printf '%s\n' "$line" >>"$tmpfile"
  done

  if [ -s "$tmpfile" ]; then
    value=$(cat "$tmpfile")
    # Use printf -v to safely assign multi-line value to the named variable
    printf -v "$var_name" '%s' "$value"
    eval "${var_name}__IS_DEFAULT=false"
  else
    printf -v "$var_name" '%s' "$default_value"
    eval "${var_name}__IS_DEFAULT=true"
  fi
  rm -f "$tmpfile"
  clear
}

# Backend settings
prompt_optional STAC_URL "Enter the STAC API URL (optional)" "" "(Optional) The STAC URL at which the ESG-Search api can be queried. A suitable endpoint will return JSON in the browser."
prompt_required SEARCH_URL "Enter the ESG-Search API URL" "https://esgf-node.ornl.gov/esgf-1-5-bridge" "The URL at which the ESG-Search api can be queried. A suitable endpoint will return XML in the browser."

# WGET_URL is optional in site_specific.py (default None)
prompt_optional WGET_URL "Enter the ESG-Search wget URL (optional)" "" "(Optional) If set, the URL at which the ESG-Search wget endpoint can be reached. If left empty, the integrated WGET implementation will be used."

prompt_required GLOBUS_CLIENT_KEY "Enter the Globus Social Auth Key" "989830-dasd-b5c6-34d4a3672076" "The Client UUID created for 'SOCIAL_AUTH_GLOBUS_KEY' at https://app.globus.org/settings/developers"
prompt_required GLOBUS_CLIENT_SECRET "Enter the Globus Social Auth Secret" "6aWj3gBYsxUBO++cSXtPzbl4n/sGJdhAmtn70XRoUMA=" "A 'Client Secret' associated with the Client UUID created for 'SOCIAL_AUTH_GLOBUS_KEY' at https://app.globus.org/settings/developers"
prompt_optional STATUS_URL "Enter the Node Status API URL" "" "The URL at which the backend can reach the Node Status API."
prompt_optional AUTHENTICATION_METHOD "Enter the Globus Authentication Method" "none" "Which authentication method to enable for user sign in on the frontend. Options are: globus, keycloak, none."

# Use multiline prompts for these values so users can paste multi-line Markdown/text.
prompt_multiline BANNER_TEXT "Enter the Banner Text (optional)" "" "(Optional) Text to display as a banner above the main body (useful for maintenance notices)."
prompt_multiline SUPPORT_INFO "Enter the Support Info (optional)" "" "(Optional) Text to display site administrator support information."

# Footer default changed to empty string per site_specific.py
prompt_multiline FOOTER_TEXT "Enter the Footer Text (optional)" "" "Text to display in the footer of the frontend. The string should be formatted as Markdown and will be rendered as such."
# GLOBUS_NODES default aligned with site_specific.py
prompt_optional GLOBUS_NODES "Enter a list of Globus enabled nodes (JSON array string)" '["esgf-node.ornl.gov", "eagle.alcf.anl.gov", "esgf-data.nersc.gov"]' "The list of data nodes known to be Globus enabled. A data node must be in this list in order to transfer files from it via Globus."

prompt_optional DATA_UPLOAD_MAX_NUMBER_FIELDS "Enter DATA_UPLOAD_MAX_NUMBER_FIELDS" "1024" "Maximum number of form fields allowed in a single upload (useful for large wget payloads)."
prompt_optional GLOBUS_PUBLIC_INDEX_ENDPOINT_ID "Enter the Globus public index endpoint ID" "a8ef4320-9e5a-4793-837b-c45161ca1845" "The Globus index ID for the public ESGF2 data."
prompt_optional WGET_SCRIPT_FILE_DEFAULT_LIMIT "Enter WGET_SCRIPT_FILE_DEFAULT_LIMIT" "9999" "Default limit on number of files allowed in a generated wget script."
prompt_optional WGET_SCRIPT_FILE_MAX_LIMIT "Enter WGET_SCRIPT_FILE_MAX_LIMIT" "100000" "Maximum limit on number of files allowed in a generated wget script."
prompt_optional WGET_MAX_DIR_LENGTH "Enter WGET_MAX_DIR_LENGTH" "50" "Maximum character length for facet values when creating directory names for wget downloads."

prompt_optional HOTJAR_ID "Enter Hotjar ID (optional)" "" "(Optional) The Hotjar ID for tracking user interactions."
prompt_optional HOTJAR_SV "Enter Hotjar SV (optional)" "" "(Optional) The Hotjar SV for tracking user interactions."
prompt_optional GOOGLE_ANALYTICS_TRACKING_ID "Enter Google Analytics Tracking ID (optional)" "" "(Optional) The Google Analytics tracking ID."

# Frontend-specific Vite environment variables
prompt_optional VITE_FEDERATED_NODES_URL "Enter Federated Nodes URL (optional)" "https://esgf.github.io/nodes.html" "The URL for the federated nodes link displayed in the frontend navigation bar. This allows users to access federated nodes and other Metagrid services hosted elsewhere in the federation."

# Prompt for Keycloak deployment
echo "(Optional) Do you wish to add Keycloak social auth settings? ('yes' or 'no', default: 'no')"
read -r USE_KEYCLOAK

if [ "$USE_KEYCLOAK" == "yes" ]; then
    # Keycloak settings
    prompt_optional KEYCLOAK_URL "Enter the Keycloak URL (optional)" "" "The URL at which the Keycloak server can be reached."
    prompt_optional KEYCLOAK_REALM "Enter the Keycloak Realm (optional)" "" "The Keycloak realm to use for authentication."
    prompt_optional KEYCLOAK_CLIENT_ID "Enter the Keycloak Client ID (optional)" "metagrid-localhost" "The Keycloak client ID to use for authentication."
fi

# Django settings
prompt_required DOMAIN_NAME "Enter the Domain Name" "example.com" "The domain name for the Django application."
prompt_required DJANGO_ALLOWED_HOSTS "Enter the Django Allowed Hosts" '["example.com", "localhost"]' "A list of strings representing the host/domain names that this Django site can serve."
prompt_required DJANGO_SECRET_KEY "Enter the Django Secret Key" "secret_key_replace_this!" "A secret key for a particular Django installation."

# New optional backend/admin settings
prompt_optional ADMIN_URL "Enter ADMIN_URL (optional - leave blank to auto-generate)" "" "Optional override for the Django admin path (if left blank a random path will be generated)."
prompt_optional ADMINS "Enter ADMINS (optional - JSON list of tuples)" "'[]'" "Optional list of admin tuples. Example: '[(\"Admin\",\"admin@example.com\")]'"
prompt_optional DATABASE_PASSWORD "Enter DATABASE_PASSWORD (optional)" "postgres" "Database password for the Metagrid backend."
prompt_optional DATABASE_URL "Enter DATABASE_URL, make sure it contains the database password you set previously if not using defaults (optional)" "postgresql://postgres:$DATABASE_PASSWORD@postgres:5432/postgres" "Database connection URL for the Metagrid backend."

# Build YAML blocks for multiline fields only if user supplied non-default values
FOOTER_BLOCK=""
BANNER_BLOCK=""
SUPPORT_BLOCK=""

if [ "${FOOTER_TEXT__IS_DEFAULT:-true}" = "false" ]; then
  FOOTER_BLOCK=$(printf '\n      METAGRID_FOOTER_TEXT: |\n%s' "$(printf '%s\n' "$FOOTER_TEXT" | sed 's/^/        /')")
fi

if [ "${BANNER_TEXT__IS_DEFAULT:-true}" = "false" ]; then
  BANNER_BLOCK=$(printf '\n      METAGRID_BANNER_TEXT: |\n%s' "$(printf '%s\n' "$BANNER_TEXT" | sed 's/^/        /')")
fi

if [ "${SUPPORT_INFO__IS_DEFAULT:-true}" = "false" ]; then
  SUPPORT_BLOCK=$(printf '\n      METAGRID_SUPPORT_INFO: |\n%s' "$(printf '%s\n' "$SUPPORT_INFO" | sed 's/^/        /')")
fi

# Build the django env lines, only include optional fields that were explicitly set (IS_DEFAULT=false)
ENV_LINES=""

# Helper to append a line if var was set by user
append_if_set() {
  local var_name=$1
  local env_key=$2
  local value
  eval "value=\"\${${var_name}:-}\""
  local is_def
  eval "is_def=\"\${${var_name}__IS_DEFAULT:-true}\""
  if [ "$is_def" = "false" ]; then
    # ensure proper indentation
    ENV_LINES="${ENV_LINES}      ${env_key}: ${value}\n"
  fi
}

# Scalars
append_if_set STAC_URL METAGRID_STAC_URL
append_if_set WGET_URL METAGRID_WGET_URL
append_if_set STATUS_URL METAGRID_STATUS_URL
# Authentication method - default "none" is considered default; will only include when user changed it
append_if_set AUTHENTICATION_METHOD METAGRID_AUTHENTICATION_METHOD
append_if_set GLOBUS_NODES METAGRID_GLOBUS_NODES
append_if_set DATA_UPLOAD_MAX_NUMBER_FIELDS METAGRID_DATA_UPLOAD_MAX_NUMBER_FIELDS
append_if_set GLOBUS_PUBLIC_INDEX_ENDPOINT_ID METAGRID_GLOBUS_PUBLIC_INDEX_ENDPOINT_ID
append_if_set WGET_SCRIPT_FILE_DEFAULT_LIMIT METAGRID_WGET_SCRIPT_FILE_DEFAULT_LIMIT
append_if_set WGET_SCRIPT_FILE_MAX_LIMIT METAGRID_WGET_SCRIPT_FILE_MAX_LIMIT
append_if_set WGET_MAX_DIR_LENGTH METAGRID_WGET_MAX_DIR_LENGTH
append_if_set HOTJAR_ID METAGRID_HOTJAR_ID
append_if_set HOTJAR_SV METAGRID_HOTJAR_SV
append_if_set GOOGLE_ANALYTICS_TRACKING_ID METAGRID_GOOGLE_ANALYTICS_TRACKING_ID
append_if_set ADMIN_URL METAGRID_ADMIN_URL
append_if_set ADMINS METAGRID_ADMINS
append_if_set DATABASE_URL METAGRID_DATABASE_URL
append_if_set KEYCLOAK_URL METAGRID_KEYCLOAK_URL
append_if_set KEYCLOAK_REALM METAGRID_KEYCLOAK_REALM
append_if_set KEYCLOAK_CLIENT_ID METAGRID_KEYCLOAK_CLIENT_ID
append_if_set GLOBUS_CLIENT_KEY METAGRID_SOCIAL_AUTH_GLOBUS_KEY
append_if_set GLOBUS_CLIENT_SECRET METAGRID_SOCIAL_AUTH_GLOBUS_SECRET

# Build frontend environment lines for react service
REACT_ENV_LINES=""
if [ "${VITE_FEDERATED_NODES_URL__IS_DEFAULT:-true}" = "false" ]; then
  REACT_ENV_LINES="${REACT_ENV_LINES}      VITE_FEDERATED_NODES_URL: '$VITE_FEDERATED_NODES_URL'\n"
fi

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

  postgres:
    environment:
      POSTGRES_PASSWORD: $DATABASE_PASSWORD
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'postgres', '-d', '$DATABASE_PASSWORD']

  django:
    environment:
      DOMAIN_NAME: $DOMAIN_NAME
      DJANGO_ALLOWED_HOSTS: '$DJANGO_ALLOWED_HOSTS'
      DJANGO_SECRET_KEY: $DJANGO_SECRET_KEY
      METAGRID_SEARCH_URL: $SEARCH_URL
$(printf '%b' "$ENV_LINES")$( [ -n "$FOOTER_BLOCK" ] && printf '%s\n' "$FOOTER_BLOCK" )$( [ -n "$BANNER_BLOCK" ] && printf '%s\n' "$BANNER_BLOCK" )$( [ -n "$SUPPORT_BLOCK" ] && printf '%s\n' "$SUPPORT_BLOCK" )
EOF

# Add react service section if there are frontend-specific environment variables
if [ -n "$REACT_ENV_LINES" ]; then
cat <<EOF >>$OUTPUT_FILE

  react:
    environment:
$(printf '%b' "$REACT_ENV_LINES")
EOF
fi

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
