from django.contrib import admin

# Register your models here.
from .models import Product, Bid, CustomUser

admin.site.register(Product)
admin.site.register(Bid)
admin.site.register(CustomUser)