# Configurable Environment Variables
<!-- start generated backend settings markdown -->
#### `METAGRID_SEARCH_URL`

> !!! example "**Required**"
>     The URL at which the ESG-Search api can be queried. A suitable endpoint will return XML in the browser.
>
>     __Example Values__
>
>     `https://esgf-node.llnl.gov/esg-search/search`

#### `METAGRID_WGET_URL`

> !!! example "**Required**"
>     The URL at which the ESG-Search wget endpoint can be reached.
>
>     __Example Values__
>
>     `https://esgf-node.llnl.gov/esg-search/wget`

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
>     __Default:__ `globus`
>
>     Which authentication method to enable for user sign in on the frontend.

>     __Possible values__
>     `keycloak`, `globus`

#### `METAGRID_BANNER_TEXT`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     Text to display as a banner above the main body. Useful for providing maintenance notices or important news. The banner will be hidden permanently if the user clicks the close button.
>
>     __Example Values__
>
>     `My banner notification text.`

#### `METAGRID_FOOTER_TEXT`

> !!! example "*Optional*"
>     __Default:__ ``
>
>     Text to display in the footer of the frontend. Useful for adding a link to the terms of service or other legal information. The string should be formatted as MarkDown and will be rendered as such.

#### `METAGRID_GLOBUS_CLIENT_ID`

> !!! example "**Required**"
>     The `Client UUID` obtained by registering a `a thick client or script that will be installed and run by users on their devices` with Globus at <https://app.globus.org/settings/developers>  This is required even if signing in with Globus is not enabled. It is used for browsing Globus Collections to which files may be sent.
>
>     __Example Values__
>
>     `536321f7-c0e9-462c-b5c6-34d4a3672076`

#### `METAGRID_STATUS_URL`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     The URL at which the backend can reach the Node Status API.
>
>     __Example Values__
>
>     `https://esgf-node.llnl.gov/proxy/status`

#### `METAGRID_GLOBUS_NODES`

> !!! example "*Optional*"
>     __Default:__ `['aims3.llnl.gov', 'esgf-data1.llnl.gov', 'esgf-data2.llnl.gov', 'esgf-node.ornl.gov']`
>
>     The list of data nodes known to be Globus enabled. A data node must be in this list in order to transfer files from it via Globus.

#### `METAGRID_KEYCLOAK_REALM`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     The Keycloak realm to use for authentication.
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
>     The Keycloak client ID to use for authentication.
>
>     __Example Values__
>
>     `myclientid`

#### `METAGRID_HOTJAR_ID`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     The Hotjar ID for tracking user interactions.
>
>     __Example Values__
>
>     `123456`

#### `METAGRID_HOTJAR_SV`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     The Hotjar SV for tracking user interactions.
>
>     __Example Values__
>
>     `7`

#### `METAGRID_GOOGLE_ANALYTICS_TRACKING_ID`

> !!! example "*Optional*"
>     __Default:__ `None`
>
>     The Google Analytics tracking ID for tracking user interactions.
>
>     __Example Values__
>
>     `UA-12345678-1`
<!-- end generated frontend settings markdown -->
