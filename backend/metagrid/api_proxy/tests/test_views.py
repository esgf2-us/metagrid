import pytest
from django.urls import reverse

from rest_framework.test import APITestCase


class TestProxyViewSet(APITestCase):
    def test_wget(self):
        url = reverse("do-wget")
        response = self.client.get(url, { 'dataset_id' : })

    def test_search(self):
        url = reverse("do-search")
        postdata = { 'project' : "CMIP6", 'limit' : 0 }
        response = self.client.post(url, postdata)
        response = self.client.put(url, postdata)


    def test_status(self):
        url = reverse("do-status")
        response = self.client.get(url)

    def test_citation(self):
        url = reverse("do-citation")
        response = self.client.get(url)

        response = self.client.post(url, json={'citurl' : "https://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.CMIP.IPSL.IPSL-CM6A-LR.abrupt-4xCO2.r12i1p1f1.Amon.n2oglobal.gr.v20191003.json"})
