import json
from unittest.mock import patch

import responses
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class TestWgetViewSet(APITestCase):
    def setUp(self):
        # Force integrated wget behavior for most tests
        settings.WGET_URL = None

    @responses.activate
    def test_wget_integrated(self):
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
        assert b"must be set to true or false" in resp.content

    @patch("metagrid.wget.views.ESGGlobusQuery")
    @patch("metagrid.wget.views.render")
    def test_wget_permission_error_returns_400(
        self, mock_render, mock_esgquery
    ):
        # Simulate ESGGlobusQuery raising PermissionError during query
        instance = mock_esgquery.return_value
        instance.query_file_records.side_effect = PermissionError(
            "no access to /nonexistent"
        )

        url = reverse("do-wget")
        resp = self.client.get(url, {"dataset_id": "SOME.DATASET|node.org"})

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert b"unable to access required ESGF helper files" in resp.content

    @patch("metagrid.wget.views.ESGGlobusQuery")
    @patch("metagrid.wget.views.render")
    def test_wget_generic_exception_returns_400(
        self, mock_render, mock_esgquery
    ):
        # Simulate ESGGlobusQuery throwing a generic exception
        instance = mock_esgquery.return_value
        instance.query_file_records.side_effect = Exception("boom")

        url = reverse("do-wget")
        resp = self.client.get(url, {"dataset_id": "SOME.DATASET|node.org"})

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert b"Error querying ESGF metadata" in resp.content

    @patch("metagrid.wget.views.ESGGlobusQuery")
    @patch("metagrid.wget.views.render")
    def test_wget_success_generates_script_and_attachment(
        self, mock_render, mock_esgquery
    ):
        # Return two fake file entries so num_files > default limit if we reduce it
        fake_file_1 = {
            "title": "file1.nc",
            "checksum_type": ["md5"],
            "checksum": ["deadbeef"],
            "url": ["http://example.com/file1.nc|HTTPServer|HTTPServer"],
            "activity_id": ["ACT"],
        }
        fake_file_2 = {
            "title": "file2.nc",
            "checksum_type": ["md5"],
            "checksum": ["cafebabe"],
            "url": ["http://example.com/file2.nc|HTTPServer|HTTPServer"],
            "activity_id": ["ACT"],
        }

        instance = mock_esgquery.return_value
        instance.query_file_records.return_value = [fake_file_1, fake_file_2]

        # Patch render to avoid TemplateDoesNotExist
        mock_render.return_value = "GENERATED_SCRIPT"

        # set value directly on settings
        from django.conf import settings as django_settings

        # ensure we restore afterwards
        prev = getattr(django_settings, "WGET_SCRIPT_FILE_DEFAULT_LIMIT", None)
        django_settings.WGET_SCRIPT_FILE_DEFAULT_LIMIT = 1

        try:
            url = reverse("do-wget")
            payload = {
                "dataset_id": ["SOMEDATASET"],
                "download_structure": ["activity_id"],
                "simple": ["false"],
            }
            resp = self.client.post(
                url, data=json.dumps(payload), content_type="application/json"
            )

            assert resp.status_code == status.HTTP_200_OK
            # Content disposition should indicate an attachment filename
            assert "attachment; filename=" in resp["Content-Disposition"]
            # The returned body should be the rendered template content we patched
            assert resp.content.decode() == "GENERATED_SCRIPT"
        finally:
            # restore original limit
            if prev is not None:
                django_settings.WGET_SCRIPT_FILE_DEFAULT_LIMIT = prev
