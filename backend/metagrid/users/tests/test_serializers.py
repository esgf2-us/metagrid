import pytest
from django.contrib.auth.hashers import check_password
from django.forms.models import model_to_dict

from ..serializers import CreateUserSerializer
from .factories import UserFactory

pytestmark = pytest.mark.django_db


class TestCreateUserSerializer:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.user_data = model_to_dict(UserFactory.build())

    def test_serializer_with_empty_data(self):
        serializer = CreateUserSerializer(data={})
        assert not serializer.is_valid()

    def test_serializer_with_valid_data(self):
        serializer = CreateUserSerializer(data=self.user_data)
        assert serializer.is_valid()

    def test_serializer_hashes_password(self):
        serializer = CreateUserSerializer(data=self.user_data)
        assert serializer.is_valid()

        user = serializer.save()
        assert check_password(self.user_data.get("password"), user.password)
