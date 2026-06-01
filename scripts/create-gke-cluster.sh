#!/bin/bash

set -euo pipefail

CLUSTER_NAME="auction-cluster"
REGION="asia-east1"
NODE_LOCATION="asia-east1-a"
NUM_NODES="1"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is required but was not found."
  exit 1
fi

echo "Creating GKE cluster: ${CLUSTER_NAME}"
echo "Region: ${REGION}"
echo "Node location: ${NODE_LOCATION}"
echo "Nodes: ${NUM_NODES}"

gcloud container clusters create "${CLUSTER_NAME}" \
  --region "${REGION}" \
  --node-locations "${NODE_LOCATION}" \
  --num-nodes "${NUM_NODES}" \
  --enable-ip-alias

echo "Fetching kubectl credentials..."
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --region "${REGION}"

echo "GKE cluster is ready: ${CLUSTER_NAME}"
