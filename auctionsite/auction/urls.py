from django.urls import path
from . import views
from .views import add_product, add_bid, register, user_login, user_logout, UserProductList, delete_product, search_results
from .api_views import ProductListCreateView, BidCreateView

urlpatterns = [
    path("api/products/", ProductListCreateView.as_view()),
    path('', views.product_list, name='product_list'),
    path('products/<int:id>/', views.product_detail, name='product_detail'),
    path('add-product/', add_product, name='add_product'),
    path('products/<int:product_id>/bid/', add_bid, name='add_bid'),
    path('register/', register, name='register'),
    path('login/', user_login, name='login'),
    path('logout/', user_logout, name='logout'), 
    path('myproducts/', UserProductList.as_view(), name='myproducts'),
    path('delete_product/<int:pk>/', delete_product, name='delete_product'),
    path('search/', search_results, name='search_results'),
    path("api/products/<int:product_id>/bids/", BidCreateView.as_view()),
]
