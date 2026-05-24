#!/bin/bash

set -e

cd "$(dirname "$0")/.."

LOG_FILE="scripts/deploy.log"

DOCKER_USER="kenhm25"
TEST_TAG="$(git rev-parse --short HEAD)-time-$(date +%H%M)"

echo "Deploy tag: $TEST_TAG"

echo "" >> "$LOG_FILE"
echo "====================================" >> "$LOG_FILE"
echo "Deploy started at $(date)" >> "$LOG_FILE"
echo "Tag: $TEST_TAG" >> "$LOG_FILE"
echo "====================================" >> "$LOG_FILE"

echo "=== Building backend image ==="
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t "$DOCKER_USER/auction-api:$TEST_TAG" \
  -f Dockerfile \
  --push \
  . >> "$LOG_FILE" 2>&1

echo "=== Building frontend image ==="
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t "$DOCKER_USER/auction-frontend:$TEST_TAG" \
  -f frontend/Dockerfile.prod \
  --push \
  ./frontend >> "$LOG_FILE" 2>&1

echo "=== Inspecting image architectures ==="
docker buildx imagetools inspect \
  "$DOCKER_USER/auction-api:$TEST_TAG" \
  >> "$LOG_FILE" 2>&1

docker buildx imagetools inspect \
  "$DOCKER_USER/auction-frontend:$TEST_TAG" \
  >> "$LOG_FILE" 2>&1

echo "=== Updating Kubernetes deployments ==="

kubectl set image deployment/auction-api \
  django="$DOCKER_USER/auction-api:$TEST_TAG" \
  >> "$LOG_FILE" 2>&1

kubectl set image deployment/auction-frontend \
  nginx="$DOCKER_USER/auction-frontend:$TEST_TAG" \
  >> "$LOG_FILE" 2>&1

echo "=== Waiting for rollout ==="

kubectl rollout status deployment/auction-api \
  >> "$LOG_FILE" 2>&1

kubectl rollout status deployment/auction-frontend \
  >> "$LOG_FILE" 2>&1

echo "=== Current pods ==="

kubectl get pods \
  >> "$LOG_FILE" 2>&1

echo "Deploy complete: $TEST_TAG"

echo "Deploy completed at $(date)" >> "$LOG_FILE"