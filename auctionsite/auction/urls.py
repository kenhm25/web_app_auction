from django.urls import path
from .api_views import ProductListCreateView, BidCreateView

urlpatterns = [
    path("products/", ProductListCreateView.as_view()),
    path("products/<int:product_id>/bids/", BidCreateView.as_view()),
]
