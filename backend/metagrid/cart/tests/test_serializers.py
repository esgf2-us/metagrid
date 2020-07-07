import pytest
from django.forms.models import model_to_dict

from metagrid.cart.serializers import CartSerializer
from metagrid.cart.tests.factories import CartFactory


class TestCartSerializer:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.cart_data = model_to_dict(CartFactory.build())

    def test_serializer_success(self):
        serializer = CartSerializer(data=self.cart_data)
        assert serializer.is_valid
