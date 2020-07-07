from django.contrib import admin

from metagrid.cart.models import Cart


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    pass
