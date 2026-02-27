# Auction Web API (Django REST Framework)

## Overview

A RESTful auction backend system built with Django and Django REST Framework.

This project focuses on backend system design, relational database modeling, transaction safety, and API-level testing.  
It simulates a real-world auction platform with concurrency-safe bidding logic.

GitHub:  
https://github.com/kenhm25/web_app_auction


---

## Key Highlights

- RESTful API design using Django REST Framework
- Concurrency-safe bidding system using `transaction.atomic()` and `select_for_update()`
- Relational database schema with ForeignKey constraints
- Permission-based access control
- API-level unit testing with DRF `APITestCase`
- Clear separation of concerns (Model / Serializer / View)


---

## Tech Stack

- Python
- Django
- Django REST Framework
- PostgreSQL / SQLite
- Django ORM
- RESTful API design
- Transaction management
- Unit testing (APITestCase)


---

## Core Features

### 1. Product API

- Authenticated users can create products
- Public users can view product list
- Seller automatically assigned from `request.user`
- Data validation handled via `ModelSerializer`

### 2. Concurrency-Safe Bidding System

- Only authenticated users can place bids
- Bid must be strictly greater than current highest bid
- Row-level locking with `select_for_update()`
- Atomic transaction ensures no race condition
- Updates product’s `current_highest_bid` within transaction

This design prevents inconsistent bid states under concurrent requests.

### 3. Authentication & Permissions

- Session-based authentication
- `IsAuthenticatedOrReadOnly` for product endpoints
- `IsAuthenticated` for bidding endpoint
- Seller-based authorization logic

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

- Referential integrity via ForeignKey
- DecimalField for financial precision
- Controlled write operations via permission classes

### 5. Automated API Testing

Implemented API-level tests covering:

- Unauthenticated user cannot bid
- Bid lower than current price is rejected
- Valid bid succeeds and creates record

This ensures business logic correctness and API behavior validation.


---

## Project Structure

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
- `api_views.py` → API endpoint logic
- `tests.py` → API behavior verification
- `tests_concurrency.py` → race condition behavior verification

---

## Engineering Concepts Demonstrated

- RESTful backend architecture
- Transaction isolation
- Row-level locking
- Race condition prevention
- ORM-based relational modeling
- Permission control
- Backend test design
- Clean API layering


---

## Running the Project Locally

1. Clone the repository

```bash
git clone https://github.com/kenhm25/web_app_auction
cd web_app_auction/auctionsite
```

2. Create and activate virtual environment

macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Apply database migrations

```bash
python manage.py migrate
```

5. Run development server

```bash
python manage.py runserver
```

Visit:

http://127.0.0.1:8000/


---

## Future Improvements

- JWT authentication
- Pagination & filtering
- Docker containerization
- PostgreSQL production deployment
- CI pipeline integration
- Coverage report integration


---

## Why This Project Matters

This project goes beyond basic CRUD operations.

It demonstrates:

- Production-style backend design
- Concurrency handling
- Financial data precision
- API-level testing discipline
- Secure permission-based logic
- Clean and maintainable architecture

It reflects practical backend engineering principles rather than a simple tutorial project.