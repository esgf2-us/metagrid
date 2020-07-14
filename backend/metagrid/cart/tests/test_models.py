from typing import TYPE_CHECKING

from metagrid.cart.tests.factories import CartFactory, SearchFactory

if TYPE_CHECKING:
    from metagrid.cart.models import Cart, Search


class TestCart:
    def test__str__(self):
        items = [{"title": "dataset"}]
        cart = CartFactory.build(items=items)  # type: Cart
        assert cart.__str__() == str(items)


class TestSearch:
    def test__str__(self):
        cart = SearchFactory.build()  # type: Search
        assert cart.__str__() == cart
