from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Product, Bid
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from django.conf import settings

User = get_user_model()


class ProductAPITestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )

        self.product = Product.objects.create(
            seller=self.user,
            title="Test Product",
            description="Test",
            starting_bid=100,
            image_url="",
            location="Taipei"
        )

        # 產生 JWT token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def authenticate(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )

    def test_unauthenticated_user_cannot_bid(self):
        url = f"/api/products/{self.product.id}/bids/"
        response = self.client.post(url, {"bid_amount": 200})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bid_must_be_higher_than_starting_bid(self):
        self.authenticate()

        url = f"/api/products/{self.product.id}/bids/"
        response = self.client.post(url, {"bid_amount": 50})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_bid_succeeds(self):
        self.authenticate()

        url = f"/api/products/{self.product.id}/bids/"
        response = self.client.post(url, {"bid_amount": 200})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bid.objects.count(), 1)

    def test_authenticated_user_can_create_product(self):
        self.authenticate()

        response = self.client.post(
            "/api/products/",
            {
                "title": "Camera",
                "description": "Mirrorless camera",
                "starting_bid": "300.00",
                "image_url": "",
                "location": "Taipei",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["current_highest_bid"], "300.00")

    def test_product_list_creates_cache(self):
        cache.clear()

        response = self.client.get("/api/products/")
        key = "products:list"
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(cache.get(key))

    def test_create_product_invalidates_cache(self):
        self.authenticate()
        cache.clear()
        key = "products:list"

        cache.set(
            key,
            {"test": "data"},
            timeout=300
        )
        response = self.client.post(
            "/api/products/",
            {
                "title": "Camera",
                "description": "Mirrorless camera",
                "starting_bid": "300.00",
                "image_url": "",
                "location": "Taipei",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIsNone(cache.get(key))

    def test_cache_rebuilt_after_invalidation(self):
        self.authenticate()
        cache.clear()
        key = "products:list"

        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(cache.get(key))

        response = self.client.post(
            "/api/products/",
            {
                "title": "Camera",
                "description": "Mirrorless camera",
                "starting_bid": "300.00",
                "image_url": "",
                "location": "Taipei",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIsNone(cache.get(key))

        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(cache.get(key))

    def test_cache_backend_is_redis(self):
        self.assertIn(
            "django_redis",
            settings.CACHES["default"]["BACKEND"]
        )
