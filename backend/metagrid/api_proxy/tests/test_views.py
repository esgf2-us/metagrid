import pytest
from django.urls import reverse

from rest_framework.test import APITestCase


class TestProxyViewSet(APITestCase):
    def test_wget(self):
        url = reverse("do-wget")
        response = self.client.get(url)

    def test_search(self):
        url = reverse("do-search")
        response = self.client.get(url)

    def test_status(self):
        url = reverse("do-status")
        response = self.client.get(url)

    def test_citation(self):
        url = reverse("do-citation")
        response = self.client.get(url)