# Auction Web Application
## Overview

A Django-based auction platform that allows users to register, list products, and place bids. The system supports user authentication, product management, and bidding functionality.

This project demonstrates backend system design, relational database modeling, and core auction business logic.

## Features

- User registration and authentication

- Product creation and management

- Bidding system with highest bid tracking

- Seller-only product deletion

- Search functionality


## Tech Stack

- Python

- Django

- SQLite (development)

- Django ORM

- Gunicorn + Nginx (local production-like setup)


## Architecture

The project follows Django’s Model–View–Template (MVT) pattern.

### Models

- **CustomUser**
  - Extended from Django `AbstractUser`

- **Product**
  - seller (ForeignKey to CustomUser)
  - title
  - description
  - starting_bid
  - image_url
  - location

- **Bid**
  - product (ForeignKey to Product)
  - bidder (ForeignKey to CustomUser)
  - bid_amount

## Running the Project Locally
1. Clone the repository

```bash
git clone https://github.com/kenhm25/web_app_auction
cd web_app_auction/auctionsite
```
2. Create and activate virtual environment
macOS / Linux
```bash
python -m venv .venv
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
Open your browser and visit:

http://127.0.0.1:8000/