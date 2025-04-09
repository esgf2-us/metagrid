from django.http import JsonResponse
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

    def destroy(self, request, *args, **kwargs):
        user = self.request.user
        queryset = self.queryset.filter(user=user).prefetch_related()
        to_delete = queryset.filter(uuid=kwargs["uuid"])
        deleted_uuids = []
        for record in to_delete:
            deleted_uuids.append(record.uuid)
        to_delete.delete()
        return JsonResponse({"deleted": deleted_uuids})
