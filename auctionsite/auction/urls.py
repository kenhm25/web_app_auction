from django.urls import path

from .api_views import (
    ProductListCreateView,
    BidCreateView,
    RegisterAPIView,
    MeAPIView,
    GoogleOAuthStartAPIView,
    GoogleOAuthCallbackAPIView,
)

urlpatterns = [
    path("products/", ProductListCreateView.as_view(), name="product-list"),
    path("products/<int:product_id>/bids/", BidCreateView.as_view(), name="bid-create"),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("me/", MeAPIView.as_view(), name="me"),
    path("auth/google/start/", GoogleOAuthStartAPIView.as_view(), name="google-oauth-start"),
    path("auth/google/callback/", GoogleOAuthCallbackAPIView.as_view(), name="google-oauth-callback"),
]
