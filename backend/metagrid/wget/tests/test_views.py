import json
from unittest.mock import patch

import responses
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class TestWgetViewSet(APITestCase):
    @responses.activate
    def test_wget(self):
        url = reverse("do-wget")
        response = self.client.get(
            url,
            {
                "dataset_id": "CMIP6.CMIP.IPSL.IPSL-CM6A-LR.abrupt-4xCO2.r12i1p1f1.Amon.n2oglobal.gr.v20191003|esgf-data1.llnl.gov"
            },
        )
        assert response.status_code == status.HTTP_200_OK

    def test_wget_invalid_param_returns_400(self):
        """Invalid query parameter should return 400 with message."""
        url = reverse("do-wget")
        resp = self.client.get(url, {"invalidparam": "value"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert b"Invalid HTTP query parameter" in resp.content

    def test_wget_unsupported_field_returns_400(self):
        """Unsupported field (e.g., lat) should return 400."""
        url = reverse("do-wget")
        resp = self.client.get(url, {"lat": "10"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert b"Unsupported parameter" in resp.content

    def test_wget_simple_invalid_value_returns_400(self):
        """Passing an invalid value to 'simple' should return 400."""
        url = reverse("do-wget")
        resp = self.client.get(url, {"simple": "notaboolean"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert b'must be set to true or false' in resp.content

    def test_wget_no_files_found_returns_empty_message(self, monkeypatch):
        """When ESGGlobusQuery returns no files, view should respond with 'No files found'."""
        url = reverse("do-wget")

        class DummyQuery:
            def __init__(self, *a, **k):
                pass

            def query_file_records(self, dsid, wget=True):
                return []  # no files

        # Patch the ESGGlobusQuery used by the view to our dummy
        monkeypatch.setattr("metagrid.wget.views.ESGGlobusQuery", DummyQuery)

        resp = self.client.get(url, {"dataset_id": "SOMEDATASET"})
        assert resp.status_code == status.HTTP_200_OK
        assert b"No files found for datasets." in resp.content

    def test_wget_generates_script_and_sets_warning_when_exceeds_limit(self, monkeypatch):
        """When number of files > file_limit ensures script generation path runs and returns attachment."""
        url = reverse("do-wget")

        # Create two fake file_info entries so num_files > limit (we will set limit to 1)
        fake_file_info = {
            "title": "file1.nc",
            "checksum_type": ["md5"],
            "checksum": ["deadbeef"],
            "url": ["http://example.com/file1.nc|HTTPServer|HTTPServer"],
            # include some facet used by directory construction if needed
            "activity_id": ["ACT"],
        }
        fake_file_info_2 = {
            "title": "file2.nc",
            "checksum_type": ["md5"],
            "checksum": ["cafebabe"],
            "url": ["http://example.com/file2.nc|HTTPServer|HTTPServer"],
            "activity_id": ["ACT"],
        }

        class DummyQuery:
            def __init__(self, *a, **k):
                pass

            def query_file_records(self, dsid, wget=True):
                return [fake_file_info, fake_file_info_2]

        # Patch ESGGlobusQuery to return our two files
        monkeypatch.setattr("metagrid.wget.views.ESGGlobusQuery", DummyQuery)

        # Reduce the default limit so that num_files > file_limit triggers warning_message logic
        monkeypatch.setattr(settings, "WGET_SCRIPT_FILE_DEFAULT_LIMIT", 1)

        # Patch render in the view module so template file location is not required
        monkeypatch.setattr("metagrid.wget.views.render", lambda request, tpl, ctx: "GENERATED_SCRIPT")

        # POST expects JSON body according to the view; send JSON payload
        payload = {"dataset_id": ["SOMEDATASET"], "download_structure": ["activity_id"], "simple": ["false"]}
        resp = self.client.post(url, data=json.dumps(payload), content_type="application/json")

        assert resp.status_code == status.HTTP_200_OK
        # Content disposition should indicate an attachment filename
        assert "attachment; filename=" in resp["Content-Disposition"]
        # The returned body should be the rendered template content we patched
        assert resp.content.decode() == "GENERATED_SCRIPT"
