import factory
from django.contrib.auth.hashers import make_password

raw_password = "password"


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "users.User"
        django_get_or_create = ("email",)

    id = factory.Faker("uuid4")

    # Have to use make_password since .create() does not hash passwords
    # Source: https://stackoverflow.com/a/42974571
    password = make_password(raw_password)

    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    is_active = True
    is_staff = False
