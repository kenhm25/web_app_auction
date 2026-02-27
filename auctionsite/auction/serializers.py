from rest_framework import serializers
from .models import Product, Bid

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "seller",
            "title",
            "description",
            "starting_bid",
            "image_url",
            "location",
        ]
        read_only_fields = ["seller"]

class BidCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = [
            "bid_amount",
        ]