# Auction Web API (Django REST Framework)

A production-oriented RESTful auction backend system built with Django and Django REST Framework.

This project focuses on authentication design, transactional integrity, concurrency control, and containerized deployment.  
It simulates a real-world auction platform with concurrency-safe bidding logic and production-ready configuration.

---

# 🚀 Features Overview

## 1️⃣ Authentication (JWT-Based, Stateless)

- User registration (`POST /api/register/`)
- Login with JWT (`POST /api/token/`)
- Token refresh (`POST /api/token/refresh/`)
- Authenticated user profile (`GET /api/me/`)
- Custom token response including user info
- Password hashing via `create_user()`
- Permission enforcement using `IsAuthenticated`

### Concepts Demonstrated

- Stateless authentication
- Token-based identity verification
- DRF authentication pipeline
- Secure password handling
- Request lifecycle (`request.user` population)

---

## 2️⃣ Product API

- Authenticated users can create products
- Public users can view product list
- Seller automatically assigned from `request.user`
- Validation via `ModelSerializer`
- Controlled write access via permission classes

---

## 3️⃣ Concurrency-Safe Bidding System

- Only authenticated users can bid
- Bid must be strictly greater than current highest bid
- `transaction.atomic()` for transactional safety
- `select_for_update()` for row-level locking
- Atomic update of `current_highest_bid`
- Multi-threaded concurrency test simulation

### Engineering Concepts

- Transaction isolation
- Pessimistic locking
- Data consistency guarantees
- Race condition prevention

---

## 4️⃣ Relational Database Design

Entities:

- **CustomUser** (extends `AbstractUser`)
- **Product**
  - seller (ForeignKey)
  - starting_bid
  - current_highest_bid
- **Bid**
  - product (ForeignKey)
  - bidder (ForeignKey)
  - bid_amount

Design considerations:

- Referential integrity via ForeignKey
- Decimal precision for financial values
- ORM-based abstraction
- Controlled mutation through API layer

---

## 5️⃣ API-Level Automated Testing

Implemented tests covering:

- Unauthenticated user restrictions
- Business rule validation
- Bid amount enforcement
- Concurrency behavior validation
- HTTP status checks
- Data integrity verification

Includes:

- `APITestCase`
- Transaction-based concurrency tests
- Multi-threaded race condition validation

---

## 6️⃣ API Documentation (Swagger / OpenAPI)

- Interactive API documentation
- OpenAPI 3.0 schema generation
- JWT-secured endpoint testing

---

## 7️⃣ Production-Oriented Deployment

- PostgreSQL containerized service
- Django app container
- Gunicorn production WSGI server
- Docker Compose orchestration
- Persistent database volume

---

# 🏗 Architecture Overview

```
Client
↓
URL Routing
↓
Middleware
↓
Authentication
↓
Permission Check
↓
APIView / ViewSet
↓
Serializer Validation
↓
Database
↓
Response
```

---

# 🧱 Project Structure

```
auction/
├── models.py
├── serializers.py
├── api_views.py
├── tests.py
├── tests_concurrency.py
```

- `models.py` → Database schema
- `serializers.py` → Validation & transformation layer
- `api_views.py` → Endpoint logic
- `tests.py` → API behavior verification
- `tests_concurrency.py` → Race condition testing

---

# 📘 API Documentation (Swagger / OpenAPI)

Interactive API documentation is available via Swagger UI.

Access:

```
http://localhost:8000/api/docs/
```

Raw OpenAPI schema:

```
http://localhost:8000/api/schema/
```

### Authentication

Protected endpoints require a Bearer token.

1. Obtain access token:

```bash
POST /api/token/
```

2. Click **Authorize** in Swagger UI  
3. Enter:

```
Bearer <your_access_token>
```

### Example: Place a Bid

```
POST /api/products/{product_id}/bids/
```

```json
{
  "bid_amount": "1500.00"
}
```


---

# 🐳 Running with Docker (Recommended)

## 1. Clone repository

```bash
git clone https://github.com/kenhm25/web_app_auction
cd web_app_auction/auctionsite
```

---

## 2. Build containers

```bash
docker compose build
```

---

## 3. Start services

```bash
docker compose up -d
```

---

## 4. Apply migrations

```bash
docker compose exec web python manage.py migrate
```

---

## 5. Run tests

```bash
docker compose exec web python manage.py test
```

---

## 6. Create superuser (optional)

```bash
docker compose exec web python manage.py createsuperuser
```

---

## 7. Stop services

```bash
docker compose down
```

---

API will be available at:

```
http://localhost:8000/
```

---

# 🧪 Example API Flow (Manual Testing)

## 1️⃣ Register

```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@test.com",
    "password": "strongpassword123"
  }'
```

---

## 2️⃣ Login

```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "strongpassword123"
  }'
```

---

## 3️⃣ Access Protected Endpoint

```bash
curl http://localhost:8000/api/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4️⃣ Create Product

```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MacBook Pro",
    "description": "M1 16GB",
    "starting_bid": "20000.00",
    "location": "Taipei"
  }'
```

---

## 5️⃣ Place Bid

```bash
curl -X POST http://localhost:8000/api/products/1/bids/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bid_amount": "25000.00"
  }'
```

---

# 🔐 Engineering Concepts Demonstrated

- Stateless authentication (JWT)
- Transaction isolation
- Row-level locking
- Race condition prevention
- Relational database modeling
- Containerized deployment
- Production WSGI configuration
- API-level testing discipline
- Layered backend service architecture
- Contract-driven API design

---

# 📈 Future Improvements

- Redis caching
- Rate limiting
- Background task queue (Celery)
- CI/CD pipeline
- Cloud deployment (AWS / GCP)
- Load testing

---

