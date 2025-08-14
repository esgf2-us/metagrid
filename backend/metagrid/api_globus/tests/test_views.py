import json
from unittest.mock import patch

import pytest
import responses
from django.conf import settings
from django.urls import reverse

from metagrid.api_globus import views
from metagrid.api_globus.views import globus_info_from_doc, search_files

default_scope = (
    "openid profile email urn:globus:auth:scope:transfer.api.globus.org:all"
)


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
