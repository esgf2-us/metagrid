import json

import factory


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
