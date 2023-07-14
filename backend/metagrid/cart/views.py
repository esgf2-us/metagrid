from rest_framework import mixins, viewsets

from metagrid.cart.models import Cart, Search
from metagrid.cart.serializers import CartSerializer, SearchSerializer
from metagrid.users.permissions import IsOwner


class CartViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    queryset = Cart.objects.all().order_by("id")
    serializer_class = CartSerializer
    permission_classes = [IsOwner]
    lookup_field = "user"

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.filter(user=user).prefetch_related()
        return queryset


class SearchViewSet(viewsets.ModelViewSet):
    queryset = Search.objects.all().order_by("id")
    serializer_class = SearchSerializer
    permission_classes = [IsOwner]
    lookup_field = "uuid"

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.filter(user=user).prefetch_related()
        return queryset
