from django.contrib import admin

from metagrid.cart.models import Cart, Search


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    pass


@admin.register(Search)
class SearchAdmin(admin.ModelAdmin):
    pass
