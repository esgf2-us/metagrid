import secrets
from typing import Literal, Optional, Sequence

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class MetagridBackendSettings(BaseSettings):
    """Settings used by the Metagrid backend directly"""

    model_config = SettingsConfigDict(
        env_prefix="METAGRID_",
        case_sensitive=True,
    )

    WGET_URL: str = Field(
        description="The URL at which the ESG-Search wget endpoint can be reached.",
        examples=["https://esgf-node.llnl.gov/esg-search/wget"],
    )
    KEYCLOAK_CLIENT_ID: str = Field(
        default="metagrid-localhost",
        examples=["metagrid-localhost"],
        description="Used in data migration to register Keycloak social app",
    )
    ADMIN_URL: str = Field(
        examples=["C5PhMrfRDd0x5RY-og2Tk_SwLFs4xWge1j8iM4wx6XQ/"],
        description="""The default URL for the Django administration interface is `/admin`. This is a well-known fact and attackers will try to access this URL on your site. The solution is to change the URL of the administration interface. If not set, a random secure path will be generated using `secrets.token_urlsafe()` and can be retrieved using a command similar to the following:
>     `docker compose -f docker-compose.yml -f docker-compose.SITENAME-overlay.yml run --rm django python manage.py get_setting ADMIN_URL`

>     !!! warning "Note"
>         This path will change each time the backend is restarted.""",
        default_factory=secrets.token_urlsafe,
    )
    ADMINS: Sequence[tuple[str, str]] = Field(
        default=[],
        examples=[
            [
                ("Author", "downie4@llnl.gov"),
                ("Author", "ames4@llnl.gov"),
            ]
        ],
        description="A list of all the people who get code error notifications. When `DEBUG=False` and `AdminEmailHandler` is configured in `LOGGING` (done by default), Django emails these people the details of exceptions raised in the request/response cycle. Each item in the list should be a tuple of (Full name, email address). "
        "Reference: <https://docs.djangoproject.com/en/5.1/ref/settings/#admins>",
    )
    SOCIAL_AUTH_GLOBUS_KEY: str = Field(
        examples=["94c44808-9efd-4236-bffd-1185b1071736"],
        description="The `Client UUID` obtained by registering a `portal, science gateway, or other application you host` with Globus at <https://app.globus.org/settings/developers>",
    )
    SOCIAL_AUTH_GLOBUS_SECRET: str = Field(
        examples=["6aWj3gBYsxUBO++cSXtPzbl4n/sGJdhAmtn70XRoUMA="],
        description="A `Client Secret` associated with the Client UUID created for `SOCIAL_AUTH_GLOBUS_KEY` at https://app.globus.org/settings/developers",
    )


class MetagridFrontendSettings(BaseSettings):
    """Settings retrieved by the Metagrid frontend.

    These are kept separate from the Metagrid backend settings to make it easy to serialize them to json and send to the frontend.
    """

    model_config = SettingsConfigDict(
        env_prefix="METAGRID_",
        case_sensitive=True,
    )

    AUTHENTICATION_METHOD: Literal["keycloak", "globus"] = Field(
        default="globus",
        description="Which authentication method to enable for user sign in on the frontend.",
    )

    SEARCH_URL: str = Field(
        description="The URL at which the ESG-Search api can be queried. A suitable endpoint will return XML in the browser.",
        examples=["https://esgf-node.ornl.gov/esgf-1-5-bridge"],
    )

    BANNER_TEXT: Optional[str] = Field(
        default=None,
        examples=["My banner notification text."],
        description="Text to display as a banner above the main body. Useful for providing maintenance notices or important news. The banner will be hidden permanently if the user clicks the close button.",
    )
    FOOTER_TEXT: str = Field(
        default="",
        description="Text to display in the footer of the frontend. Useful for adding a link to the terms of service or other legal information. The string should be formatted as MarkDown and will be rendered as such.",
    )
    GLOBUS_CLIENT_ID: str = Field(
        examples=["536321f7-c0e9-462c-b5c6-34d4a3672076"],
        description="The `Client UUID` obtained by registering a `a thick client or script that will be installed and run by users on their devices` with Globus at <https://app.globus.org/settings/developers>  This is required even if signing in with Globus is not enabled. It is used for browsing Globus Collections to which files may be sent.",
    )
    STATUS_URL: Optional[str] = Field(
        default=None,
        description="The URL at which the backend can reach the Node Status API.",
        examples=["https://esgf-node.llnl.gov/proxy/status"],
    )
    GLOBUS_NODES: Sequence[str] = Field(
        default=[
            "aims3.llnl.gov",
            "esgf-data1.llnl.gov",
            "esgf-data2.llnl.gov",
            "esgf-node.ornl.gov",
            "eagle.alcf.anl.gov",
        ],
        description="The list of data nodes known to be Globus enabled. A data node must be in this list in order to transfer files from it via Globus.",
    )
    KEYCLOAK_REALM: Optional[str] = Field(
        default=None,
        examples=["myrealm"],
        description="The Keycloak realm to use for authentication.",
    )
    KEYCLOAK_URL: Optional[str] = Field(
        default=None,
        examples=["https://keycloak.example.com"],
        description="The URL of the Keycloak server.",
    )
    KEYCLOAK_CLIENT_ID: Optional[str] = Field(
        default="",
        examples=["myclientid"],
        description="The Keycloak client ID to use for authentication.",
    )
    HOTJAR_ID: Optional[int] = Field(
        default=None,
        examples=[123456],
        description="The Hotjar ID for tracking user interactions.",
    )
    HOTJAR_SV: Optional[int] = Field(
        default=None,
        examples=[7],
        description="The Hotjar SV for tracking user interactions.",
    )
    GOOGLE_ANALYTICS_TRACKING_ID: Optional[str] = Field(
        default=None,
        examples=["UA-12345678-1"],
        description="The Google Analytics tracking ID for tracking user interactions.",
    )
