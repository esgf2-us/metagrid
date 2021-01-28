from rest_framework import mixins, viewsets

from metagrid.subscriptions.models import Subscriptions
from metagrid.subscriptions.serializers import SubscriptionsSerializer
from metagrid.users.permissions import IsOwner


class SubscriptionsViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    queryset = Subscriptions.objects.all().order_by("id")
    serializer_class = SubscriptionsSerializer
    permission_classes = [IsOwner]
    lookup_field = "user"

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.filter(user=user).prefetch_related()
        return queryset
