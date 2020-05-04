import pytest
from django.forms.models import model_to_dict

from metagrid.projects.serializers import ProjectSerializer
from metagrid.projects.tests.factories import ProjectFactory

pytestmark = pytest.mark.django_db


class TestProjectSerializer:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.project_data = model_to_dict(ProjectFactory.build())

    def test_serializer_success(self):
        serializer = ProjectSerializer(data=self.project_data)
        assert serializer.is_valid
