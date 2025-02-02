from typing import Any, Generator

import pytest
from rest_framework.test import APIClient


@pytest.fixture(scope="function")
def api_client() -> Generator[APIClient, Any, Any]:
    """
    Fixture to provide an API client
    :return: APIClient
    """
    yield APIClient()
