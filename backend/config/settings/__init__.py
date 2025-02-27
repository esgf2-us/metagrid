from typing import Any, Iterable

from .site_specific import MetagridBackendSettings, MetagridFrontendSettings
from .static import DjangoStaticSettings


def __dir__() -> Iterable[str]:
    """The list of available options are retrieved from
    the dict view of our DjangoSettings object.
    """
    return (
        DjangoStaticSettings.model_fields.keys()
        | MetagridBackendSettings.model_fields.keys()
        | MetagridFrontendSettings.model_fields.keys()
    )


def __getattr__(name: str) -> Any:
    """Turn the module access into a DjangoSettings access"""
    _combined_settings = DjangoStaticSettings().model_dump()
    _combined_settings |= MetagridBackendSettings().model_dump()
    _combined_settings |= MetagridFrontendSettings().model_dump()

    return _combined_settings[name]
