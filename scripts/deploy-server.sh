#!/bin/bash
# Server-side deployment script
# This script should run on the deployment server, triggered by webhook

set -e

# Configuration
DEPLOY_DIR="/opt/deploy/autowrx"
ENVIRONMENT="${1:-staging}"
FRONTEND_IMAGE="${2}"
BACKEND_IMAGE="${3}"

echo "=== AutoWRX Deployment ===="
echo "Environment: $ENVIRONMENT"
echo "Frontend Image: $FRONTEND_IMAGE"
echo "Backend Image: $BACKEND_IMAGE"
echo "=========================="

# Create deployment directory
mkdir -p "$DEPLOY_DIR/$ENVIRONMENT"
cd "$DEPLOY_DIR/$ENVIRONMENT"

# Pull docker-compose file from repo (or use existing)
if [ ! -f "docker-compose.stack.yml" ]; then
    echo "Fetching docker-compose.stack.yml..."
    curl -sS https://raw.githubusercontent.com/eclipse-autowrx/autowrx/v3-base/docker-compose.stack.yml \
        -o docker-compose.stack.yml
fi

# Update .env.stack with new image tags
if [ ! -f ".env.stack" ]; then
    curl -sS https://raw.githubusercontent.com/eclipse-autowrx/autowrx/v3-base/.env.stack.example \
        -o .env.stack
fi

# Update image tags in .env.stack
sed -i "s|^FRONTEND_IMAGE_TAG=.*|FRONTEND_IMAGE_TAG=${FRONTEND_IMAGE##*:}|" .env.stack
sed -i "s|^BACKEND_IMAGE_TAG=.*|BACKEND_IMAGE_TAG=${BACKEND_IMAGE##*:}|" .env.stack
sed -i "s|^ENV=.*|ENV=$ENVIRONMENT|" .env.stack

# Login to GitHub Container Registry
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

# Pull new images
echo "Pulling images..."
docker pull "$FRONTEND_IMAGE"
docker pull "$BACKEND_IMAGE"

# Pull other required images
docker compose -f docker-compose.stack.yml pull kong upload homologation inventory-be

# Deploy with zero downtime
echo "Deploying stack..."
docker compose -f docker-compose.stack.yml up -d --no-build --remove-orphans

# Wait for health check
echo "Waiting for services to be healthy..."
sleep 15

# Verify deployment
docker compose -f docker-compose.stack.yml ps

# Cleanup old images
docker image prune -f

echo "✓ Deployment complete!"
