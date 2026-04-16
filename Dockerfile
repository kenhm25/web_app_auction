FROM python:3.12-slim

# 不產生 pyc
ENV PYTHONDONTWRITEBYTECODE=1
# 讓 log 直接輸出
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

COPY auctionsite/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY auctionsite/ .

EXPOSE 8000