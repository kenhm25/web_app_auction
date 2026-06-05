#!/bin/bash

set -euo pipefail

CLUSTER_NAME="auction-cluster"
ZONE="asia-east1-a"
NODE_LOCATION="asia-east1-a"
NUM_NODES="1"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is required but was not found."
  exit 1
fi

echo "Creating GKE cluster: ${CLUSTER_NAME}"
echo "ZONE: ${ZONE}"
echo "Node location: ${NODE_LOCATION}"
echo "Nodes: ${NUM_NODES}"

gcloud container clusters create "${CLUSTER_NAME}" \
  --zone "${ZONE}" \
  --machine-type=e2-medium \
  --num-nodes="${NUM_NODES}" \
  --disk-type=pd-standard \
  --disk-size=50 \
  --release-channel=regular

echo "Fetching kubectl credentials..."
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --zone "${ZONE}"

echo "GKE cluster is ready: ${CLUSTER_NAME}"
