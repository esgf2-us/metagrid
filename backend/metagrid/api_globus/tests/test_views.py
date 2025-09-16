import json
from unittest.mock import patch

import pytest
import responses
from django.conf import settings
from django.urls import reverse
from rest_framework import status

from metagrid.api_globus import views
from metagrid.api_globus.views import globus_info_from_doc, search_files

default_scope = (
    "openid profile email urn:globus:auth:scope:transfer.api.globus.org:all"
)

REFRESH_KEY_NAME = "globus_refresh_token"


# Dummy classes for reuse in tests
class DummyResp:

    def __getitem__(self, item):
        return self.get(item)

    def get(self, item):
        return {item: "dummy-submission-id"}


class DummyGlobusHTTPResponse:
    def __init__(self):
        self.status_code = 200
        self.data = {"task_id": "1234"}


class DummyTransferClient:
    def get_submission_id(self):
        # Simulate the real TransferClient.get_submission_id
        return DummyResp()

    def operation_ls(self, endpoint, path="/"):
        raise NotImplementedError("Override in test as needed.")

    def submit_transfer(self, data):
        # Simulate the real TransferClient.submit_transfer
        return DummyGlobusHTTPResponse()


# class DummyTokens:
#     by_resource_server = {
#         "transfer.api.globus.org": {
#             "access_token": "abc123",
#             "refresh_token": "xyz456",
#         }
#     }


class InfoNoConsent:
    consent_required = None


class TransferAPIErrorNoConsent(Exception):
    def __init__(self):
        self.info = InfoNoConsent()

    def __str__(self):
        return "No consent required"


class DummyTransferClient2:
    def operation_ls(self, endpoint, path="/"):
        raise TransferAPIErrorNoConsent()


class ConsentRequiredInfo:
    required_scopes = ["scope1", "scope2"]


class Info:
    consent_required = ConsentRequiredInfo()


class TransferAPIErrorWithConsent(Exception):
    def __init__(self):
        self.info = Info()


@responses.activate
@pytest.mark.django_db
@patch("globus_sdk.TransferClient.submit_transfer")
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_multiple_results.json"], indirect=True
)
def test_globus_multi_transfer_submits_tasks(
    submit_mock, json_fixture, api_client
):
    responses.add(responses.GET, settings.SEARCH_URL, json=json_fixture)
    responses.add(
        responses.GET,
        "https://transfer.api.globus.org/v0.10/submission_id",
        json={"value": "someid"},
    )

    api_client.post(
        reverse("globus_transfer"),
        data={
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token",
            "endpointId": "test_endpoint_id",
            "path": "test_path",
            "project": "CMIP6",
        },
        format="json",
    )

    assert submit_mock.called_with(
        {
            "DATA_TYPE": "transfer",
            "DATA": [
                {
                    "DATA_TYPE": "transfer_item",
                    "source_path": "/css03_data/CMIP6/AerChemMIP/EC-Earth-Consortium/EC-Earth3-AerChem/histSST-piAer/r1i1p1f1/Amon/prsn/gr/v20210831/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_199901-199912.nc",
                    "destination_path": "test_path/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_199901-199912.nc",
                },
                {
                    "DATA_TYPE": "transfer_item",
                    "source_path": "/css03_data/CMIP6/AerChemMIP/EC-Earth-Consortium/EC-Earth3-AerChem/histSST-piAer/r1i1p1f1/Amon/prsn/gr/v20210831/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_200001-200012.nc",
                    "destination_path": "test_path/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_200001-200012.nc",
                },
            ],
            "source_endpoint": "dea29ae8-bb92-4c63-bdbc-260522c92fe8",
            "destination_endpoint": "test_endpoint_id",
            "submission_id": "someid",
            "deadline": "2025-01-06 02:21:50.311298+00:00",
            "verify_checksum": False,
            "preserve_timestamp": False,
            "encrypt_data": False,
            "skip_source_errors": False,
            "fail_on_quota_errors": False,
            "delete_destination_extra": False,
            "notify_on_succeeded": True,
            "notify_on_failed": True,
            "notify_on_inactive": True,
        }
    )


@responses.activate
@pytest.mark.django_db
@patch(
    "globus_sdk.TransferClient.submit_transfer",
    side_effect=ValueError(),
)
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_multiple_results.json"], indirect=True
)
def test_globus_transfer_returns_207_when_submission_errors(
    submit_mock, json_fixture, api_client
):
    responses.add(responses.GET, settings.SEARCH_URL, json=json_fixture)
    responses.add(
        responses.GET,
        "https://transfer.api.globus.org/v0.10/submission_id",
        json={"value": "someid"},
    )

    response = api_client.post(
        reverse("globus_transfer"),
        data={
            "authScope": default_scope,
            "endpointId": "test_endpoint_id",
            "path": "test_path",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_207_MULTI_STATUS


@responses.activate
@pytest.mark.django_db
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_multiple_results.json"], indirect=True
)
def test_globus_transfer_returns_207_when_tokens_are_missing(
    json_fixture, api_client
):
    responses.add(responses.GET, settings.SEARCH_URL, json=json_fixture)
    responses.add(
        responses.GET,
        "https://transfer.api.globus.org/v0.10/submission_id",
        json={"value": "someid"},
    )
    responses.add(
        responses.POST, "https://transfer.api.globus.org/v0.10/submission_id"
    )
    responses.add(
        responses.POST, "https://transfer.api.globus.org/v0.10/transfer"
    )

    response = api_client.post(
        reverse("globus_transfer"),
        data={
            "authCode": "test_auth_code",
            "authScope": default_scope,
            "endpointId": "test_endpoint_id",
            "path": "test_path",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_207_MULTI_STATUS


@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_remapped_data_node.json"], indirect=True
)
@patch(
    "metagrid.api_globus.views.DATANODE_MAP",
    {"esgf-node.ornl.gov": "dead-beef-cafe"},
)
def test_globus_transfer_respects_data_node_remapping(json_fixture):
    globus_info = globus_info_from_doc(json_fixture["response"]["docs"][0])
    assert globus_info[0] == "dead-beef-cafe"


@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_remapped_endpoint_id.json"], indirect=True
)
@patch(
    "metagrid.api_globus.views.ENDPOINT_MAP",
    {"dead-beef-cafe": "something-new"},
)
def test_globus_transfer_respects_endpoint_id_remapping(json_fixture):
    globus_info = globus_info_from_doc(json_fixture["response"]["docs"][0])
    assert globus_info[0] == "something-new"


@responses.activate
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_single_result.json"], indirect=True
)
def test_search_files_single_file_with_empty_params(json_fixture):
    responses.add(
        responses.GET,
        settings.SEARCH_URL,
        json=json_fixture,
    )
    url_params = {}
    globus_info = list(search_files(url_params))

    call_params = responses.calls[0].request.params
    assert call_params["limit"] == "1"
    assert call_params["distrib"] == "false"
    assert call_params["format"] == "application/solr+json"
    assert call_params["type"] == "File"
    # assert call_params["fields"] == "url,data_node"

    assert globus_info == [
        (
            "dea29ae8-bb92-4c63-bdbc-260522c92fe8",
            "/css03_data/CMIP6/AerChemMIP/EC-Earth-Consortium/EC-Earth3-AerChem/histSST-piAer/r1i1p1f1/Amon/prsn/gr/v20210831/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_199901-199912.nc",
        )
    ]


@responses.activate
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_multiple_results.json"], indirect=True
)
def test_search_files_multiple_results(json_fixture):
    responses.add(
        responses.GET,
        settings.SEARCH_URL,
        json=json_fixture,
    )
    url_params = {"project": "CMIP6"}
    globus_info = list(search_files(url_params))

    call_params = responses.calls[0].request.params
    assert call_params["limit"] == "10000"
    assert call_params["format"] == "application/solr+json"
    assert call_params["type"] == "File"
    # assert call_params["fields"] == "url,data_node"
    assert call_params["project"] == "CMIP6"
    assert globus_info == [
        (
            "dea29ae8-bb92-4c63-bdbc-260522c92fe8",
            "/css03_data/CMIP6/AerChemMIP/EC-Earth-Consortium/EC-Earth3-AerChem/histSST-piAer/r1i1p1f1/Amon/prsn/gr/v20210831/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_199901-199912.nc",
        ),
        (
            "dea29ae8-bb92-4c63-bdbc-260522c92fe8",
            "/css03_data/CMIP6/AerChemMIP/EC-Earth-Consortium/EC-Earth3-AerChem/histSST-piAer/r1i1p1f1/Amon/prsn/gr/v20210831/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_200001-200012.nc",
        ),
    ]


@responses.activate
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_multiple_results.json"], indirect=True
)
def test_search_dataset_multiple_results(json_fixture):
    responses.add(
        responses.GET,
        settings.SEARCH_URL,
        json=json_fixture,
    )
    url_params = {
        "dataset_id": [
            "CMIP6.r281i1p1f2.Emon.grassFracC3.gr",
            "CMIP6.PAMIP.CNRM-CERFACS.CNRM-CM6-1.pdSST-pdSIC.r282i1p1f2.Emon.mrtws.gr",
        ]
    }
    globus_info = list(search_files(url_params))

    call_params = responses.calls[0].request.params
    assert call_params["limit"] == "10000"
    assert call_params["format"] == "application/solr+json"
    assert call_params["type"] == "File"
    # assert call_params["fields"] == "url,data_node"
    assert call_params["dataset_id"] == ",".join(
        [
            "CMIP6.r281i1p1f2.Emon.grassFracC3.gr",
            "CMIP6.PAMIP.CNRM-CERFACS.CNRM-CM6-1.pdSST-pdSIC.r282i1p1f2.Emon.mrtws.gr",
        ]
    )
    assert globus_info == [
        (
            "dea29ae8-bb92-4c63-bdbc-260522c92fe8",
            "/css03_data/CMIP6/AerChemMIP/EC-Earth-Consortium/EC-Earth3-AerChem/histSST-piAer/r1i1p1f1/Amon/prsn/gr/v20210831/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_199901-199912.nc",
        ),
        (
            "dea29ae8-bb92-4c63-bdbc-260522c92fe8",
            "/css03_data/CMIP6/AerChemMIP/EC-Earth-Consortium/EC-Earth3-AerChem/histSST-piAer/r1i1p1f1/Amon/prsn/gr/v20210831/prsn_Amon_EC-Earth3-AerChem_histSST-piAer_r1i1p1f1_gr_200001-200012.nc",
        ),
    ]


def test_globus_info_from_doc_raises_value_error():
    doc = {
        "url": ["not_a_globus_url|NotGlobus|NotGlobus"],
        "data_node": "some_node",
    }
    with pytest.raises(
        ValueError, match="Unable to find Globus info from doc urls"
    ):
        globus_info_from_doc(doc)


@patch("requests.get")
def test_search_files_raises_value_error_when_no_response_or_docs(mock_get):
    # Simulate a response with missing 'response' and 'docs'
    mock_get.return_value.text = '{"unexpected": "structure"}'
    mock_get.return_value.json.return_value = {"unexpected": "structure"}
    mock_get.return_value.status_code = 200

    with pytest.raises(ValueError, match="ESGF search did not return results"):
        list(search_files({"project": "CMIP6"}))


@patch("requests.get")
def test_search_files_json_decode_error(mock_get):
    # Simulate a response that raises a JSONDecodeError
    mock_get.return_value.text = "not a json string"
    mock_get.return_value.json.side_effect = json.JSONDecodeError(
        "Expecting value", "not a json string", 0
    )
    mock_get.return_value.status_code = 200

    with pytest.raises(
        ValueError,
        match="ESGF search did not return results: not a json string",
    ):
        list(search_files({"project": "CMIP6"}))


@pytest.mark.django_db
def test_globus_download_request_rejects_non_post(api_client):
    # Simulate GET request
    response = api_client.get(reverse("globus_transfer"))
    assert response.status_code == 405


@pytest.mark.django_db
def test_globus_download_request_returns_auth_url(api_client, monkeypatch):
    # Patch GlobusTransferAuthFlow to always return None for get_transfer_client and set an auth_url
    class DummyAuthFlow:
        def __init__(self, *a, **k):
            self.auth_url = "https://auth.globus.org/authorize"

        def get_transfer_client(self, *a, **k):
            return None

    monkeypatch.setattr(views, "GlobusTransferAuthFlow", DummyAuthFlow)
    response = api_client.post(
        reverse("globus_transfer"),
        data={
            "authScope": "test_scope",
            "authRedirectUrl": "http://localhost:8080/cart/items",
            "endpointId": "test_endpoint_id",
            "path": "test_path",
        },
        format="json",
    )
    assert response.status_code == 207
    data = response.json()
    assert "auth_url" in data
    assert data["auth_url"] == "https://auth.globus.org/authorize"


def test_globus_info_from_doc_invalid_url_type():
    # url is not a list
    doc = {
        "url": "not_a_list",
        "data_node": "some_node",
    }
    with pytest.raises(Exception):
        views.globus_info_from_doc(doc)  # Should raise TypeError


def test_search_files_empty_response(monkeypatch):
    # Patch requests.get to return empty docs
    class DummyResp:
        def __init__(self):
            self.text = '{"response": {"docs": []}}'
            self.status_code = 200

        def json(self):
            return {"response": {"docs": []}}

    monkeypatch.setattr(views.requests, "get", lambda *a, **k: DummyResp())
    result = list(views.search_files({"project": "CMIP6"}))
    assert result == []


def test_submit_transfer_handles_exception(monkeypatch):
    # Patch search_files to raise
    def raise_exc(*a, **k):
        raise Exception("fail!")

    monkeypatch.setattr(views, "search_files", raise_exc)

    class DummyClient:
        pass

    resp = views.submit_transfer({}, DummyClient(), "endpoint", "folder")
    assert resp.status_code == 502
    assert b"fail!" in resp.content


def test_get_transfer_client_from_auth_code_returns_transfer_client(
    monkeypatch,
):
    # Setup dummy tokens and TransferClient
    class DummyTokens:
        by_resource_server = {
            "transfer.api.globus.org": {
                "access_token": "abc123",
                "refresh_token": "xyz456",
            }
        }

    class DummyAuthClient:

        def __init__(self, *a, **k):
            pass

        def oauth2_start_flow(self, *a, **k):
            pass

        def oauth2_exchange_code_for_tokens(self, code):
            assert code == "test_auth_code"
            return DummyTokens()

    class DummyAuthorizer:
        def __init__(self, *a, **k):
            pass

    class DummyTransferClient:

        def __init__(self, authorizer):
            self.authorizer = authorizer

    monkeypatch.setattr(
        views,
        "ConfidentialAppAuthClient",
        lambda *a, **k: DummyAuthClient(),
    )
    monkeypatch.setattr(
        views,
        "RefreshTokenAuthorizer",
        lambda *a, **k: DummyAuthorizer(),
    )
    monkeypatch.setattr(views, "TransferClient", DummyTransferClient)

    flow = views.GlobusTransferAuthFlow(
        clientId="id",
        clientSecret="secret",
        auth_redirect_url="url",
    )
    client = flow.get_transfer_client_from_auth_code("test_auth_code")
    assert isinstance(client, DummyTransferClient)
    assert isinstance(client.authorizer, DummyAuthorizer)


def test_check_for_consent_required(monkeypatch):
    # Patch views.TransferAPIError to our custom error so isinstance works

    monkeypatch.setattr(views, "TransferAPIError", TransferAPIErrorWithConsent)

    class DummyTransferClient:
        def operation_ls(self, endpoint, path="/"):
            raise TransferAPIErrorWithConsent()

    flow = views.GlobusTransferAuthFlow(
        clientId="id",
        clientSecret="secret",
        auth_redirect_url="url",
        target_endpoint="endpoint",
    )
    flow.check_for_consent_required(DummyTransferClient())
    assert flow.consent_required_scopes == ["scope1", "scope2"]

    # Case 2: consent_required is falsy (should print error)
    monkeypatch.setattr(views, "TransferAPIError", TransferAPIErrorNoConsent)

    flow2 = views.GlobusTransferAuthFlow(
        clientId="id", clientSecret="secret", auth_redirect_url="url"
    )
    flow2.target_endpoint = "endpoint"
    flow2.check_for_consent_required(DummyTransferClient2())
    assert flow2.consent_required_scopes == []


@pytest.mark.django_db
def test_globus_download_request_calls_submit_transfer_on_first_try(
    api_client, monkeypatch
):
    # Patch GlobusTransferAuthFlow to return a dummy transfer client on first try
    class DummyAuthFlowForTest:
        def __init__(self, *a, **k):
            pass

        def get_transfer_client(self, *a, **k):
            return DummyTransferClient()

    # Patch search_files to yield one file
    monkeypatch.setattr(views, "GlobusTransferAuthFlow", DummyAuthFlowForTest)
    monkeypatch.setattr(
        views, "search_files", lambda *a, **k: [("ep", "/file")]
    )
    response = api_client.post(
        reverse("globus_transfer"),
        data={
            "authScope": "scope",
            "authRedirectUrl": "url",
            "endpointId": "ep",
            "path": "/dest",
        },
        format="json",
    )
    assert response.status_code == 200
    data = response.json()
    assert "successes" in data
    assert isinstance(data["successes"], list)
    assert data["successes"][0]["task_id"] == "1234"
