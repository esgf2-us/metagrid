import pytest

from metagrid.cart.models import Cart
from metagrid.users.models import User
from metagrid.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestUserManager:
    def test_create_user(self):
        user = User.objects.create_user("jdoe@gmail.com", "password123")
        assert isinstance(user, User)

        # Check user exists
        user_exists = User.objects.filter(pk=user.pk).exists()
        assert user_exists

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            "jdoe@gmail.com", "password123", is_staff=True, is_superuser=True
        )
        assert isinstance(user, User)

        # Check user exists
        user = User.objects.filter(pk=user.pk).first()
        assert User

        # Check user is a superuser
        assert user.is_superuser

    def test__create_user_raises_exception_without_email(self):
        with pytest.raises(ValueError):
            User.objects.create_user(email=None, password="password123")

    def test_create_superuser_without_required_flags(self):
        with pytest.raises(ValueError):
            User.objects.create_superuser(
                "jdoe@gmail.com",
                "password123",
                is_staff=False,
                is_superuser=True,
            )

        with pytest.raises(ValueError):
            User.objects.create_superuser(
                "jdoe@gmail.com",
                "password123",
                is_staff=True,
                is_superuser=False,
            )


class TestUser:
    @pytest.fixture(autouse=True)
    def setUp(self):
        self.user = UserFactory()  # type: User

    def test_save_creates_linked_user_cart(self):
        cart_exists = Cart.objects.filter(user=self.user).exists()
        assert cart_exists

    def test__str__(self):
        assert self.user.__str__() == self.user.email
