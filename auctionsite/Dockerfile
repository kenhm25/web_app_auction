FROM python:3.12-slim

# 不產生 pyc
ENV PYTHONDONTWRITEBYTECODE=1
# 讓 log 直接輸出
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 安裝 postgres 需要的套件
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# 先複製 requirements
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# 再複製整個專案
COPY . .

EXPOSE 8000