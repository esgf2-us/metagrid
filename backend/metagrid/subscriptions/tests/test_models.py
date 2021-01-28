from typing import TYPE_CHECKING

from metagrid.subscriptions.tests.factories import SubscriptionsFactory

if TYPE_CHECKING:
    from metagrid.subscriptions.models import Subscriptions


class TestSubscriptions:
    def test__str__(self):
        subscription = {
            "activity_id": ["CFMIP"],
            "experiment_id": [],
            "frequency": [],
            "id": "akjhsgjkhdfkjhasjdhj",
            "name": "",
            "period": "weekly",
            "realm": [],
            "source_id": [],
            "timestamp": 1613001785195,
            "variable_id": [],
        }
        subscriptions = SubscriptionsFactory.build(
            subscriptions=[subscription]
        )  # type: Subscriptions
        assert subscriptions.__str__() == str([subscription])
