from metagrid.cart.models import Cart
from metagrid.cart.tests.factories import CartFactory


class TestCart:
    def test__str__(self):
        items = [{"title": "dataset"}]
        cart = CartFactory.build(items=items)  # type: Cart
        assert cart.__str__() == str(items)
