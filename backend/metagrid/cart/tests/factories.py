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
        obj = super()._generate(create, attrs)  # pragma: no cover
        return json.dumps(obj)  # pragma: no cover


class CartFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "cart.Cart"

    items = factory.Dict({"title": "dataset"}, dict_factory=JSONFactory)


class SearchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "cart.Search"

    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    min_version_date = None
    max_version_date = None
    version_type = "latest"
    result_type = "all"
    filename_vars = factory.List(["input1"])
    active_facets = factory.Dict(
        {"facet": ["option"]}, dict_factory=JSONFactory
    )
    text_inputs = factory.List(["input1"])
    url = factory.Faker("url")
