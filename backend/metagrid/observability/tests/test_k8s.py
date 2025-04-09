from unittest.mock import MagicMock

import pytest
from django.db import OperationalError, connection
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_liveness_returns_200(api_client: APIClient):
    response = api_client.post(reverse("liveness"), {})
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_readiness_returns_200(api_client: APIClient):
    response = api_client.post(reverse("readiness"), {})
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_readiness_returns_500_on_error(api_client: APIClient, monkeypatch):
    mock_cursor = MagicMock()
    mock_cursor.fetchone.side_effect = OperationalError("Mock Error")
    monkeypatch.setattr(connection, "cursor", lambda: mock_cursor)

    response = api_client.post(reverse("readiness"), {})
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
