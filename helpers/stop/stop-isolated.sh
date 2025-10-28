#!/bin/bash

# AutoWRX Isolated Environment Stop Script
# Stops the isolated production-like development environment

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[AutoWRX-ISO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🛑 Stopping AutoWRX Isolated Environment..."
echo "==========================================="

# Stop isolated backend
if [ -f "logs/backend-isolated.pid" ]; then
    BACKEND_PID=$(cat logs/backend-isolated.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        print_status "Stopping isolated backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        print_success "Isolated backend stopped"
    else
        print_warning "Isolated backend process not running"
    fi
    rm -f logs/backend-isolated.pid
else
    print_warning "Isolated backend PID file not found"
fi

# Stop frontend
if [ -f "logs/frontend-isolated.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend-isolated.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        print_status "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        print_success "Frontend stopped"
    else
        print_warning "Frontend process not running"
    fi
    rm -f logs/frontend-isolated.pid
else
    print_warning "Frontend PID file not found"
fi

# Clean up any remaining processes
print_status "Cleaning up any remaining processes..."
pkill -f "node.*start-isolated.js" 2>/dev/null || true
pkill -f "vite.*3210" 2>/dev/null || true

print_success "AutoWRX isolated environment stopped successfully"
print_status "All processes terminated and cleaned up"
echo ""