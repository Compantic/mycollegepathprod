#!/usr/bin/env bash

# Staging deploy script for MyCollegePath
# Usage: bash scripts/deploy-staging.sh

set -euo pipefail

cd "$(dirname "$0")/.."

# Load env vars from .env.local if present
if [ -f ".env.local" ]; then
  set -a
  # shellcheck source=/dev/null
  source .env.local
  set +a
fi

APP_NAME="ca-mycollegepath-staging"
RESOURCE_GROUP="rg-mycollegepath-staging"
ACR_NAME="acrmycollegepathstaging"
REPO="acrmycollegepathstaging.azurecr.io/mycollegepath"

# IMPORTANT:
# Reusing the same Docker tag can result in Azure Container Apps not pulling the new digest,
# so we stamp each deploy with a unique tag + revision suffix.
GIT_SHA="$(git rev-parse --short=8 HEAD 2>/dev/null || echo "nogit")"
STAMP="$(date +"%y%m%d%H%M%S")"
TAG="stg-${STAMP}-${GIT_SHA}"
REV_SUFFIX="${STAMP}"
IMAGE="${REPO}:${TAG}"

echo "Building Docker image: ${IMAGE}"

docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY-}" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN-}" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID-}" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET-}" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID-}" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="${NEXT_PUBLIC_FIREBASE_APP_ID-}" \
  --build-arg NEXT_PUBLIC_APP_URL="https://mycollegepath.ai" \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID="${NEXT_PUBLIC_GA_MEASUREMENT_ID:-G-D4R6MBJ5KB}" \
  -t "${IMAGE}" .

echo "Logging into Azure Container Registry..."
az acr login --name "${ACR_NAME}"

echo "Pushing image to ACR..."
docker push "${IMAGE}"

echo "Updating Azure Container App (staging)..."
az containerapp update \
  --name "${APP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --image "${IMAGE}" \
  --revision-suffix "${REV_SUFFIX}"

echo "Deploy to staging completed."

