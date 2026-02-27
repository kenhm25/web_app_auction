from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Product, Bid

User = get_user_model()


class BidAPITestCase(APITestCase):

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

    def test_unauthenticated_user_cannot_bid(self):
        url = f"/api/products/{self.product.id}/bids/"
        response = self.client.post(url, {"bid_amount": 200})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bid_must_be_higher_than_starting_bid(self):
        self.client.login(username="testuser", password="testpass123")

        url = f"/api/products/{self.product.id}/bids/"
        response = self.client.post(url, {"bid_amount": 50})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_bid_succeeds(self):
        self.client.login(username="testuser", password="testpass123")

        url = f"/api/products/{self.product.id}/bids/"
        response = self.client.post(url, {"bid_amount": 200})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bid.objects.count(), 1)