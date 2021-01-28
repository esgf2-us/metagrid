import pytest
from django.forms.models import model_to_dict

from metagrid.subscriptions.serializers import SubscriptionsSerializer
from metagrid.subscriptions.tests.factories import SubscriptionsFactory


class TestSubscriptionsSerializer:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.subscriptions_data = model_to_dict(SubscriptionsFactory.build())

    def test_serializer_success(self):
        serializer = SubscriptionsSerializer(data=self.subscriptions_data)
        assert serializer.is_valid
