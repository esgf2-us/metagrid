from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from metagrid.api_globus.views import split_value, truncate_urls


class TestGlobusViewSet(APITestCase):
    def test_truncate(self):
        lst = [
            {
                "url": ["test_url:globus_value|Globus"],
                "data_node": "aims3.llnl.gov",
            }
        ]
        results = []
        for value in truncate_urls(lst):
            results.append(value)
        assert results == [("globus_value", "aims3.llnl.gov")]

    def test_split_value(self):
        result = split_value(1)
        result2 = split_value(1.0)
        result3 = split_value("noSplitting")
        result4 = split_value("splitValues,values")
        result5 = split_value("splitValues,values,CESM1(CAM5.1,FV2)")
        result6 = split_value(
            "{splitValues,test},[test,test2],CESM1(CAM5.1,FV2)"
        )

        assert result == 1
        assert result2 == 1.0
        assert result3 == ["noSplitting"]
        assert result4 == ["splitValues", "values"]
        assert result5 == ["splitValues", "values", "CESM1(CAM5.1,FV2)"]
        assert result6 == [
            "{splitValues,test}",
            "[test,test2]",
            "CESM1(CAM5.1,FV2)",
        ]

    def test_get_access_token(self):
        url = reverse("globus_auth")

        getdata = {}
        response = self.client.post(url, getdata)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_globus_transfer(self):
        url = reverse("globus_transfer")

        postdata = {
            "access_token": "",
            "refresh_token": "",
            "endpointId": "test",
            "path": "bad/path",
        }
        response = self.client.post(url, postdata, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
