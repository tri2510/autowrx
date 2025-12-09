#!/bin/sh

# MongoDB startup script for AutoWRX

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if MongoDB container is already running
if docker ps | grep -q "autowrx-mongo"; then
    info "MongoDB container is already running"
    echo ""
    info "MongoDB connection info:"
    echo "  - Host: localhost:27017"
    echo "  - Database: autowrx"
    echo ""
    info "To stop MongoDB: docker stop autowrx-mongo"
    exit 0
fi

# Check if container exists but is stopped
if docker ps -a | grep -q "autowrx-mongo"; then
    info "MongoDB container exists but is stopped, starting..."
    docker start autowrx-mongo
    if [ $? -eq 0 ]; then
        info "MongoDB started successfully"
    else
        error "Failed to start MongoDB"
        exit 1
    fi
else
    info "Creating and starting new MongoDB container..."
    docker run --name autowrx-mongo -p 27017:27017 -d mongo:4.4.6-bionic
    if [ $? -eq 0 ]; then
        info "MongoDB container created and started successfully"
    else
        error "Failed to create MongoDB container"
        exit 1
    fi
fi

# Wait a moment for MongoDB to be ready
sleep 3

# Check if MongoDB is responding
if docker exec autowrx-mongo mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
    info "MongoDB is ready and accepting connections"
else
    warn "MongoDB started but health check failed - this is usually normal on first start"
fi

echo ""
info "MongoDB connection info:"
echo "  - Host: localhost:27017"
echo "  - Database: autowrx"
echo "  - Container: autowrx-mongo"
echo ""
info "Useful commands:"
echo "  - Stop: docker stop autowrx-mongo"
echo "  - Start: docker start autowrx-mongo"
echo "  - Remove: docker rm -f autowrx-mongo (WARNING: deletes all data)"
echo "  - Logs: docker logs autowrx-mongo"
echo "  - Shell: docker exec -it autowrx-mongo mongosh"