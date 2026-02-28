# Auction Web API (Django REST Framework)

## Overview

A production-oriented RESTful auction backend system built with Django and Django REST Framework.

This project focuses on backend architecture, transaction safety, authentication design, and containerized deployment.  
It simulates a real-world auction platform with concurrency-safe bidding logic and production-ready configuration.

GitHub:  
https://github.com/kenhm25/web_app_auction


---

## Key Highlights

- RESTful API architecture using Django REST Framework
- JWT-based authentication (stateless)
- Concurrency-safe bidding system using `transaction.atomic()` and `select_for_update()`
- PostgreSQL relational database
- Dockerized deployment
- Gunicorn production WSGI server
- API-level automated testing
- Clean separation of concerns (Model / Serializer / View)


---

## Tech Stack

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT (SimpleJWT)
- Gunicorn
- Docker
- Django ORM
- Transaction management
- APITestCase (API testing)


---

## Core Features

### 1. Product API

- Authenticated users can create products
- Public users can view product list
- Seller automatically assigned from `request.user`
- Validation handled via `ModelSerializer`

### 2. Concurrency-Safe Bidding System

- Only authenticated users can place bids
- Bid must be strictly greater than current highest bid
- Row-level locking with `select_for_update()`
- Atomic transaction prevents race conditions
- Updates product’s `current_highest_bid` within a single transaction

This design ensures consistent bidding state under concurrent requests.

### 3. JWT Authentication

- Stateless authentication using JSON Web Tokens
- Token issuance via login endpoint
- Protected endpoints require Bearer token
- Designed for scalable backend services

### 4. Relational Database Design

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

- Referential integrity enforced via ForeignKey
- DecimalField for financial precision
- Controlled write operations via permission classes
- Optimized read/write operations using ORM


### 5. Automated API Testing

Implemented API-level tests covering:

- Unauthenticated user cannot bid
- Bid lower than current price is rejected
- Valid bid succeeds and creates record
- Concurrency behavior validation

Ensures business logic correctness and transactional integrity.


---

## Architecture Overview

```
Client
   ↓
Django REST API
   ↓
Service Layer (APIView + Serializer)
   ↓
PostgreSQL
```

- Gunicorn serves the Django application
- Docker encapsulates the runtime environment
- PostgreSQL runs as a containerized service


---

## Project Structure

```
auction/
├── models.py
├── serializers.py
├── api_views.py
├── permissions.py
├── tests.py
├── tests_concurrency.py
```

- `models.py` → Database schema
- `serializers.py` → Validation & transformation layer
- `api_views.py` → API endpoint logic
- `tests.py` → API behavior verification
- `tests_concurrency.py` → Race condition validation


---
## Running with Docker (Recommended)

### 1. Clone repository

```bash
git clone https://github.com/kenhm25/web_app_auction
cd web_app_auction/auctionsite
```

### 2. Build images

```bash
docker compose build
```

### 3. Start services (detached mode)

```bash
docker compose up -d
```

### 4. Apply database migrations

```bash
docker compose exec web python manage.py migrate
```

### 5. (Optional) Create superuser

```bash
docker compose exec web python manage.py createsuperuser
```

### 6. Stop services

```bash
docker compose down
```

API available at:

```
http://localhost:8000/
```
---

## Engineering Concepts Demonstrated

- Stateless authentication (JWT)
- Transaction isolation
- Row-level locking
- Race condition prevention
- Relational database modeling
- Containerized deployment
- Production WSGI configuration
- API-level testing discipline
- Backend service design


---

## Future Improvements

- Redis caching
- Rate limiting
- Background task queue (Celery)
- CI/CD pipeline
- Cloud deployment (AWS/GCP)
- Load testing


---

## Why This Project Matters

This project demonstrates production-level backend engineering practices rather than tutorial-style CRUD development.

It reflects understanding of:

- Secure authentication
- Concurrency handling
- Data integrity guarantees
- Scalable backend architecture
- Containerized deployment strategy
- Real-world service design patterns

It is designed to represent practical backend engineering skills suitable for entry-level backend roles.