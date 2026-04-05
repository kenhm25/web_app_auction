from rest_framework import serializers
from .models import Product, Bid
from django.contrib.auth import get_user_model

class ProductSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Product
        fields = [
            "id",
            "seller",
            "title",
            "description",
            "starting_bid",
            "current_highest_bid",
            "image_url",
            "location",
        ]
        read_only_fields = ["seller", "current_highest_bid"]

class BidCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = [
            "bid_amount",
        ]

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id", 
            "username", 
            "email", 
            "password"
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
        )
        return user
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", 
            "username", 
            "email"
        ]

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
        }

        return data