from django.contrib import admin

from metagrid.subscriptions.models import Subscriptions


@admin.register(Subscriptions)
class SubscriptionsAdmin(admin.ModelAdmin):
    pass
