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


class SubscriptionsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "subscriptions.Subscriptions"

    subscriptions = factory.List(
        [factory.Dict({"name": "facets"}, dict_factory=JSONFactory)],
    )
