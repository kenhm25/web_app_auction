from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from .models import Product, Bid
from .serializers import ProductSerializer, BidCreateSerializer, RegisterSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from drf_spectacular.utils import extend_schema

from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)



class BidCreateView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(
        request=BidCreateSerializer,
        responses=BidCreateSerializer,
    )
    
    def post(self, request, product_id):
        serializer = BidCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bid_amount = serializer.validated_data["bid_amount"]

        with transaction.atomic():
            product = get_object_or_404(
                        Product.objects.select_for_update(),
                        id=product_id
                    )
            if bid_amount <= product.current_highest_bid:
                return Response(
                    {"detail": f"Bid must be greater than {product.current_highest_bid}."},
                    status=400,
                )
            Product.objects.filter(
                    id=product_id
                ).update(current_highest_bid=bid_amount)
            
            bid = Bid.objects.create(
                product_id=product_id,
                bidder=request.user,
                bid_amount=bid_amount,
            )

        return Response(
            {"id": bid.id, "bid_amount": str(bid.bid_amount)},
            status=201,
        )

class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class MeAPIView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


User = get_user_model()
class GoogleLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        google_token = request.data.get("token")

        if not google_token:
            return Response(
                {"detail": "Missing token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                        google_token,
                        requests.Request(),
                        settings.GOOGLE_OAUTH_CLIENT_ID,
                    )

            email = idinfo.get("email")
            name = idinfo.get("name")
            if not email:
                return Response(
                    {"detail": "Email not provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": name,
                },
            )

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                }
            )

        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )