import json
from unittest.mock import patch

import pytest
import responses
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from metagrid.api_globus.views import globus_info_from_doc, search_files


@responses.activate
@pytest.mark.django_db
def test_get_access_token(api_client: APIClient):
    responses.add(responses.POST, "https://auth.globus.org/v2/oauth2/token")

    response = api_client.post(reverse("globus_auth"), {})

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
@pytest.mark.parametrize(
    "missing_param", ("access_token", "refresh_token", "endpointId", "path")
)
def test_globus_transfer_missing_required_parameter_returns_400(
    missing_param, api_client
):
    url = reverse("globus_transfer")

    postdata = {
        "access_token": "",
        "refresh_token": "",
        "endpointId": "test",
        "path": "bad/path",
    }
    del postdata[missing_param]
    response = api_client.post(url, postdata, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


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
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token",
            "endpointId": "test_endpoint_id",
            "path": "test_path",
            "project": "CMIP6",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_207_MULTI_STATUS


@responses.activate
@pytest.mark.django_db
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_multiple_results.json"], indirect=True
)
def test_globus_transfer_returns_200_when_submissions_all_succeed(
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
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token",
            "endpointId": "test_endpoint_id",
            "path": "test_path",
            "project": "CMIP6",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK


@responses.activate
@pytest.mark.django_db
@pytest.mark.parametrize(
    "json_fixture", ["esgsearch_invalid_globus_url.json"], indirect=True
)
def test_globus_transfer_returns_502_for_invalid_endpoint_id(
    json_fixture, api_client
):
    responses.add(responses.GET, settings.SEARCH_URL, json=json_fixture)

    response = api_client.post(
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

    assert response.status_code == status.HTTP_502_BAD_GATEWAY


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
