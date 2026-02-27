from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Bid
from .serializers import ProductSerializer, BidCreateSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Max
from django.db import transaction

class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(seller=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 

class BidCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        with transaction.atomic():
            product = Product.objects.select_for_update().get(id=product_id)

            serializer = BidCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            bid_amount = serializer.validated_data["bid_amount"]

            current_max = (
                Bid.objects.filter(product=product)
                .aggregate(Max("bid_amount"))["bid_amount__max"]
            )

            min_required = current_max if current_max else product.starting_bid

            if bid_amount <= min_required:
                return Response(
                    {"detail": f"Bid must be greater than {min_required}."},
                    status=400,
                )

            bid = Bid.objects.create(
                product=product,
                bidder=request.user,
                bid_amount=bid_amount,
            )

        return Response(
            {"id": bid.id, "bid_amount": str(bid.bid_amount)},
            status=201,
        )