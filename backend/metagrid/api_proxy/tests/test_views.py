from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class TestProxyViewSet(APITestCase):
    fixtures = ["users.json"]

    def test_globus_auth_unauthenticated(self):
        url = reverse("globus-auth")
        response = self.client.get(url)
        assert response.data == {"is_authenticated": False}
        assert response.status_code == status.HTTP_200_OK

    @override_settings(
        SOCIAL_AUTH_GLOBUS_KEY="1", SOCIAL_AUTH_GLOBUS_SECRET="2"
    )
    def test_globus_auth_begin(self):
        response = self.client.get(
            reverse("social:begin", kwargs={"backend": "globus"})
        )
        self.assertEqual(response.status_code, 302)

    def test_do_globus_get_endpoint(self):
        url = reverse("globus-get-endpoint")

        data = {"endpoint_id": "0247816e-cc0d-4e03-a509-10903f6dde11"}
        response = self.client.get(url, data)
        print(response.status_code)
        assert response.status_code == status.HTTP_200_OK

    def test_do_globus_search_endpoints(self):
        url = reverse("globus-search-endpoints")

        data = {"search_text": "0247816e-cc0d-4e03-a509-10903f6dde11"}
        response = self.client.get(url, data)
        print(response.status_code)
        assert response.status_code == status.HTTP_200_OK

    def test_globus_auth_complete(self):
        url = reverse("globus-auth")
        User = get_user_model()
        user = User.objects.all().first()

        user.set_password("password")
        user.save()

        logged_in = self.client.login(
            username=user.get_username(), password="password"
        )
        self.assertTrue(logged_in)

        response = self.client.get(url)
        profile = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(profile.get("is_authenticated", False))
        self.assertTrue(profile.get("access_token", False))

    def test_globus_auth_logout(self):
        url = reverse("globus-logout")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)

    def test_wget(self):
        url = reverse("do-wget")
        response = self.client.get(
            url,
            {
                "dataset_id": "CMIP6.CMIP.IPSL.IPSL-CM6A-LR.abrupt-4xCO2.r12i1p1f1.Amon.n2oglobal.gr.v20191003|esgf-data1.llnl.gov"
            },
        )
        assert response.status_code == status.HTTP_200_OK

    def test_search(self):
        url = reverse("do-search")
        postdata = {"project": "CMIP6", "limit": 0}
        response = self.client.get(url, postdata)
        assert response.status_code == status.HTTP_200_OK

    # def test_status(self):
    #     url = reverse("do-status")
    #     response = self.client.get(url)
    #     assert response.status_code == status.HTTP_200_OK

    def test_citation(self):
        url = reverse("do-citation")
        jo = {
            "citurl": "https://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.CMIP.IPSL.IPSL-CM6A-LR.abrupt-4xCO2.r12i1p1f1.Amon.n2oglobal.gr.v20191003.json"
        }

        response = self.client.post(url, jo, format="json")
        assert response.status_code == status.HTTP_200_OK

        jo = {
            "citurl": "https://aims4.llnl.gov/WDCC/meta/CMIP6/CMIP6.CMIP.IPSL.IPSL-CM6A-LR.abrupt-4xCO2.r12i1p1f1.Amon.n2oglobal.gr.v20191003.json"
        }

        response = self.client.post(url, jo, format="json")
        assert response.status_code != status.HTTP_200_OK

    def test_temp_storage(self):
        getUrl = reverse("temp_storage_get")
        setUrl = reverse("temp_storage_set")

        # Testing get when temp storage is not in session
        test_data = {"dataKey": "test"}
        response = self.client.post(getUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # TESTING SET REQUESTS

        # Testing bad set request
        test_data = {"badRequest": "badValue"}
        response = self.client.post(setUrl, test_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Testing no change set request
        test_data = {"dataKey": "test", "dataValue": "None"}
        response = self.client.post(setUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Testing set request basic (no temp storage set)
        test_data = {"dataKey": "test", "dataValue": "testValue"}
        response = self.client.post(setUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Testing no change set request with temp storage set
        test_data = {"dataKey": "test", "dataValue": "None"}
        response = self.client.post(setUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Testing set request basic with temp storage set
        test_data = {"dataKey": "test", "dataValue": "testValue"}
        response = self.client.post(setUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # TESTING GET REQUESTS

        # Testing get invalid
        test_data = {"invalid": "badGet"}
        response = self.client.post(getUrl, test_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Testing get full temp storage
        test_data = {"dataKey": "temp_storage"}
        response = self.client.post(getUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Testing get data when temp storage is none
        test_data = {"dataKey": "value"}
        response = self.client.post(getUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Testing get data when temp storage is none
        test_data = {"dataKey": "test"}
        response = self.client.post(getUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Testing setting all of temp storage
        test_data = {"dataKey": "temp_storage", "dataValue": None}
        response = self.client.post(setUrl, test_data, format="json")
        assert response.status_code == status.HTTP_200_OK
