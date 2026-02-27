from django.db import models
from django.conf import settings
from decimal import Decimal

# Create your models here.
class Product(models.Model):
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products', default=1)
    title = models.CharField(max_length=200)
    description = models.TextField()
    starting_bid = models.DecimalField(max_digits=10, decimal_places=2)
    current_highest_bid = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    image_url = models.URLField(blank=True)
    location = models.CharField(max_length=100)

    def save(self, *args, **kwargs):
        if not self.current_highest_bid:
            self.current_highest_bid = self.starting_bid
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Bid(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    bidder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # 使用 ForeignKey 關聯到自定義用戶模型

    def __str__(self):
        return f"{self.bidder.username} bids {self.bid_amount} on {self.product.title}"

from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    # 如果需要添加額外字段，可以在這裡添加
    # 比如：phone_number = models.CharField(max_length=15, blank=True)
    pass
