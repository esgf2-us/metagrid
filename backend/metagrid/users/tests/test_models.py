import pytest

from metagrid.users.models import User
from metagrid.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestUser:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.user = UserFactory.create()  # type: User

    def test__str__(self):
        assert self.user.__str__() == self.user.username
