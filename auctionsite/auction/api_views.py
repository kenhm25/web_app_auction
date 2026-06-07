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
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.core.cache import cache
from django.shortcuts import redirect
from google.auth.transport import requests
from google.oauth2 import id_token
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode
import json
import re
import secrets
import requests as http_requests
import hashlib
import base64
import time

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    def list(self, request, *args, **kwargs):
        key = "products:list"
        cached = cache.get(key)
        if cached is not None:
            return Response(cached)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many = True)
        data = serializer.data
        cache.set(
            key,
            data,
            timeout=300
        )
        return Response(data)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        cache.delete("products:list")


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

        start = time.time()
        with transaction.atomic():
            product = get_object_or_404(
                        Product.objects.select_for_update(),
                        id=product_id
                    )

            lock_acquire_time = time.time() - start
            print(
                f"lock_acquire_time ={lock_acquire_time:.3f}s "
                f"Product ID={product_id} "
                f"bid={bid_amount}"
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

        cache.delete("products:list")
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
GOOGLE_OAUTH_STATE_SALT = "auction.google-oauth-state"
GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 600


def get_google_oauth_config():
    config = {
        "client_id": getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", ""),
        "client_secret": getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", ""),
        "redirect_uri": getattr(settings, "GOOGLE_OAUTH_REDIRECT_URI", ""),
        "frontend_redirect_url": getattr(settings, "FRONTEND_OAUTH_REDIRECT_URL", ""),
    }
    missing = [key for key, value in config.items() if not value]
    return config, missing


def build_unique_google_username(email, name):
    base_value = name or email.split("@", 1)[0] or "google-user"
    base_username = re.sub(r"[^A-Za-z0-9_.-]", "-", base_value).strip(".-")
    base_username = (base_username or "google-user")[:120]
    username = base_username
    suffix = 1

    while User.objects.filter(username=username).exists():
        suffix += 1
        username = f"{base_username[:110]}-{suffix}"

    return username


class GoogleOAuthStartAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        config, missing = get_google_oauth_config()
        if missing:
            return Response(
                {"detail": "Google OAuth is not configured.", "missing": missing},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Generate a unique nonce for the OAuth state
        # state_nonce 是 OAuth state 用的 nonce
        state_nonce = secrets.token_urlsafe(32)
        request.session["google_oauth_state"] = state_nonce

        # Generate a unique nonce for the OIDC flow
        # oidc_nonce 是 ID token replay 防護用的 OIDC nonce
        oidc_nonce = secrets.token_urlsafe(32)
        request.session["google_oauth_nonce"] = oidc_nonce

        # Generate a unique code verifier for the OAuth pkce
        # code_verifier 是 OAuth pkce 用的 code verifier
        code_verifier = secrets.token_urlsafe(64)
        request.session[
            "google_oauth_code_verifier"
        ] = code_verifier
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(
                code_verifier.encode()
            ).digest()
        ).decode().rstrip("=")

        state = signing.TimestampSigner(salt=GOOGLE_OAUTH_STATE_SALT).sign(state_nonce)
        params = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "scope": "openid email profile",
            "prompt": "consent",
            "state": state,
            "nonce": oidc_nonce,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }

        google_auth_url = (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            + urlencode(params)
        )
        return redirect(google_auth_url)


class GoogleOAuthCallbackAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        config, missing = get_google_oauth_config()
        if missing:
            return Response(
                {"detail": "Google OAuth is not configured.", "missing": missing},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if request.GET.get("error"):
            return Response(
                {
                    "detail": "Google OAuth authorization failed.",
                    "error": request.GET.get("error"),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = request.GET.get("code")
        state = request.GET.get("state")
        if not code or not state:
            return Response(
                {"detail": "Missing authorization code or state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            state_nonce = signing.TimestampSigner(salt=GOOGLE_OAUTH_STATE_SALT).unsign(
                state,
                max_age=GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
            )
        except signing.BadSignature:
            return Response(
                {"detail": "Invalid or expired OAuth state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected_state_nonce = request.session.pop("google_oauth_state", None)
        if not expected_state_nonce or not secrets.compare_digest(state_nonce, expected_state_nonce):
            return Response(
                {"detail": "OAuth state did not match the current browser session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code_verifier = request.session.pop(
            "google_oauth_code_verifier",
            None
        )
        if not code_verifier:
            return Response(
                {"detail": "Code verifier not found in session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token_response = http_requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": config["client_id"],
                    "client_secret": config["client_secret"],
                    "redirect_uri": config["redirect_uri"],
                    "grant_type": "authorization_code",
                    "code_verifier": code_verifier,
                },
                timeout=10,
            )
            token_data = token_response.json()
        except http_requests.RequestException:
            return Response(
                {"detail": "Failed to reach Google token endpoint."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except ValueError:
            return Response(
                {"detail": "Google token endpoint returned an invalid response."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if token_response.status_code != 200:
            return Response(
                {"detail": "Failed to exchange authorization code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_id_token = token_data.get("id_token")
        if not google_id_token:
            return Response(
                {"detail": "Google did not return an id_token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                google_id_token,
                requests.Request(),
                config["client_id"],
            )
        except ValueError:
            return Response(
                {"detail": "Google id_token verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected_oidc_nonce = request.session.pop("google_oauth_nonce", None)
        id_token_nonce = idinfo.get("nonce")

        if not expected_oidc_nonce or not id_token_nonce or not secrets.compare_digest(id_token_nonce, expected_oidc_nonce):
            return Response(
                {"detail": "OIDC nonce did not match the current browser session."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        email = idinfo.get("email")
        if not email:
            return Response(
                {"detail": "Google account did not provide an email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if idinfo.get("email_verified") is False:
            return Response(
                {"detail": "Google account email is not verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create_user(
                username=build_unique_google_username(email, idinfo.get("name")),
                email=email,
                password=None,
            )

        refresh = RefreshToken.for_user(user)
        safe_id_token_claims = {
            "sub": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "iss": idinfo.get("iss"),
            "aud": idinfo.get("aud"),
            "exp": idinfo.get("exp"),
        }

        redirect_url = (
            config["frontend_redirect_url"]
            + "?"
            + urlencode(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "username": user.username,
                    "email": user.email,
                    "id": user.id,
                    "id_token_claims": json.dumps(safe_id_token_claims),
                },
            )
        )
        return redirect(redirect_url)
