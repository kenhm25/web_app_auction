from django.urls import path
from .api_views import ProductListCreateView, BidCreateView, RegisterAPIView, MeAPIView

urlpatterns = [
    path("products/", ProductListCreateView.as_view()),
    path("products/<int:product_id>/bids/", BidCreateView.as_view()),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("me/", MeAPIView.as_view(), name="me"),
]
