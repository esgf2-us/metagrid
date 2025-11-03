# Configurable Environment Variables

<!-- start generated backend settings markdown -->
#### `METAGRID_SEARCH_URL`

> !!! example "**Required**"
>     The URL at which the ESG-Search api can be queried. A suitable endpoint will return XML in the browser.
>
>     __Example Values__
>
>     `https://esgf-node.llnl.gov/esg-search/search`

#### `METAGRID_STAC_URL`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) The STAC URL at which the ESG-Search api can be queried. A suitable endpoint will return JSON in the browser.
>
>     __Example Values__
>
>     `https://api.stac.esgf-west.org/`

#### `METAGRID_DATA_UPLOAD_MAX_NUMBER_FIELDS`

> !!! example "*Optional*"
>     __Default:__ `1024`
>
>     Maximum number of form fields allowed in a single upload. Useful for large wget payloads.
>
>     __Example Values__
>
>     `1024`

#### `METAGRID_ESGF_SOLR_URL`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     Address of the ESGF Solr endpoint used by the wget helper logic.
>
>     __Example Values__
>
>     `https://esgf-node.llnl.gov/esg-search/solr`

#### `METAGRID_ESGF_SOLR_SHARDS_XML`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     Path to the XML file containing Solr shards configuration used to resolve mirrors/shards.
>
>     __Example Values__
>
>     `/etc/metagrid/solr_shards.xml`

#### `METAGRID_ESGF_ALLOWED_PROJECTS_JSON`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     Path to a JSON file that lists allowed projects for wget/dataset access checks.
>
>     __Example Values__
>
>     `/etc/metagrid/wget_allowed_projects.json`

#### `METAGRID_WGET_SCRIPT_FILE_DEFAULT_LIMIT`

> !!! example "*Optional*"
>     __Default:__ `1000`
>
>     Default limit on the number of files allowed in a generated wget script.
>
>     __Example Values__
>
>     `1000`

#### `METAGRID_WGET_SCRIPT_FILE_MAX_LIMIT`

> !!! example "*Optional*"
>     __Default:__ `100000`
>
>     Maximum number of files allowed in a generated wget script.
>
>     __Example Values__
>
>     `100000`

#### `METAGRID_WGET_MAX_DIR_LENGTH`

> !!! example "*Optional*"
>     __Default:__ `50`
>
>     Maximum character length for facet values when creating directory names for wget downloads.
>
>     __Example Values__
>
>     `50`

#### `METAGRID_KEYCLOAK_CLIENT_ID`

> !!! example "*Optional*"
>     __Default:__ `metagrid-localhost`
>
>     Used in data migration to register Keycloak social app
>
>     __Example Values__
>
>     `metagrid-localhost`

#### `METAGRID_ADMIN_URL`

> !!! example "*Optional*"
>     The default URL for the Django administration interface is `/admin`. This is a well-known fact and attackers will try to access this URL on your site. The solution is to change the URL of the administration interface. If not set, a random secure path will be generated using `secrets.token_urlsafe()` and can be retrieved using a command similar to the following:
>     `docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml run --rm django python manage.py get_setting ADMIN_URL`

>     !!! warning "Note"
>         This path will change each time the backend is restarted.
>
>     __Example Values__
>
>     `C5PhMrfRDd0x5RY-og2Tk_SwLFs4xWge1j8iM4wx6XQ/`

#### `METAGRID_ADMINS`

> !!! example "*Optional*"
>     __Default:__ `[]`
>
>     A list of all the people who get code error notifications. When `DEBUG=False` and `AdminEmailHandler` is configured in `LOGGING` (done by default), Django emails these people the details of exceptions raised in the request/response cycle. Each item in the list should be a tuple of (Full name, email address). Reference: <https://docs.djangoproject.com/en/5.1/ref/settings/#admins>
>
>     __Example Values__
>
>     `[('Author', 'downie4@llnl.gov'), ('Author', 'ames4@llnl.gov')]`

#### `METAGRID_SOCIAL_AUTH_GLOBUS_KEY`

> !!! example "**Required**"
>     The `Client UUID` obtained by registering a `portal, science gateway, or other application you host` with Globus at <https://app.globus.org/settings/developers>
>
>     __Example Values__
>
>     `94c44808-9efd-4236-bffd-1185b1071736`

#### `METAGRID_SOCIAL_AUTH_GLOBUS_SECRET`

> !!! example "**Required**"
>     A `Client Secret` associated with the Client UUID created for `SOCIAL_AUTH_GLOBUS_KEY` at https://app.globus.org/settings/developers
>
>     __Example Values__
>
>     `6aWj3gBYsxUBO++cSXtPzbl4n/sGJdhAmtn70XRoUMA=`
<!-- end generated backend settings markdown -->
<!-- start generated frontend settings markdown -->
#### `METAGRID_AUTHENTICATION_METHOD`

> !!! example "*Optional*"
>     __Default:__ `none`
>
>     Which authentication method to enable for user sign in on the frontend or 'none' for no sign-in.

>     __Possible values__
>     `keycloak`, `globus`, `none`

#### `METAGRID_SEARCH_URL`

> !!! example "**Required**"
>     The URL at which the ESG-Search api can be queried. A suitable endpoint will return XML in the browser.
>
>     __Example Values__
>
>     `https://esgf-node.ornl.gov/esgf-1-5-bridge`

#### `METAGRID_STAC_URL`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) The STAC URL at which the ESG-Search api can be queried. A suitable endpoint will return JSON in the browser.
>
>     __Example Values__
>
>     `https://api.stac.esgf-west.org/`

#### `METAGRID_BANNER_TEXT`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) Text to display as a banner above the main body. Useful for providing maintenance notices or important news. The banner will be hidden permanently if the user clicks the close button.
>
>     __Example Values__
>
>     `My banner notification text.`

#### `METAGRID_FOOTER_TEXT`

> !!! example "*Optional*"
>     __Default:__ ``
>
>     Text to display in the footer of the frontend. Useful for adding a link to the terms of service or other legal information. The string should be formatted as MarkDown and will be rendered as such.

#### `METAGRID_STATUS_URL`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) The URL at which the backend can reach the Node Status API.
>
>     __Example Values__
>
>     `https://esgf-node.llnl.gov/proxy/status`

#### `METAGRID_GLOBUS_NODES`

> !!! example "*Optional*"
>     __Default:__ `['aims3.llnl.gov', 'esgf-data1.llnl.gov', 'esgf-data2.llnl.gov', 'esgf-node.ornl.gov', 'eagle.alcf.anl.gov']`
>
>     The list of data nodes known to be Globus enabled. A data node must be in this list in order to transfer files from it via Globus.

#### `METAGRID_KEYCLOAK_REALM`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) The Keycloak realm to use for authentication.
>
>     __Example Values__
>
>     `myrealm`

#### `METAGRID_KEYCLOAK_URL`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     The URL of the Keycloak server.
>
>     __Example Values__
>
>     `https://keycloak.example.com`

#### `METAGRID_KEYCLOAK_CLIENT_ID`

> !!! example "*Optional*"
>     __Default:__ ``
>
>     (Optional) The Keycloak client ID to use for authentication.
>
>     __Example Values__
>
>     `myclientid`

#### `METAGRID_HOTJAR_ID`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) The Hotjar ID for tracking user interactions.
>
>     __Example Values__
>
>     `123456`

#### `METAGRID_HOTJAR_SV`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) The Hotjar SV for tracking user interactions.
>
>     __Example Values__
>
>     `7`

#### `METAGRID_GOOGLE_ANALYTICS_TRACKING_ID`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     (Optional) The Google Analytics tracking ID for tracking user interactions.
>
>     __Example Values__
>
>     `UA-12345678-1`
<!-- end generated frontend settings markdown -->
