import json

import factory

from metagrid.projects.tests.factories import ProjectFactory
from metagrid.users.tests.factories import UserFactory


class JSONFactory(factory.DictFactory):
    """
    Use with factory.Dict to make JSON strings.
    https://stackoverflow.com/a/41154232
    """

    @classmethod
    def _generate(cls, create, attrs):
        obj = super()._generate(create, attrs)
        return json.dumps(obj)


class CartFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "cart.Cart"

    items = factory.Dict({"title": "dataset"}, dict_factory=JSONFactory)


class SearchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "cart.Search"

    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    default_facets = factory.Dict({"latest": True}, dict_factory=JSONFactory)
    active_facets = factory.Dict(
        {"facet": ["option"]}, dict_factory=JSONFactory
    )
    text_inputs = factory.List(["input1"])
    url = factory.Faker("url")
