#!/bin/bash

# AutoWRX System Stop Script
# This script stops both backend and frontend servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[AutoWRX]${NC} $1"
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

echo "🛑 Stopping AutoWRX System..."
echo "============================="

# Stop backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        print_status "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        print_success "Backend stopped"
    else
        print_warning "Backend process not running"
    fi
    rm -f logs/backend.pid
else
    print_warning "Backend PID file not found"
fi

# Stop frontend  
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        print_status "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        print_success "Frontend stopped"
    else
        print_warning "Frontend process not running"
    fi
    rm -f logs/frontend.pid
else
    print_warning "Frontend PID file not found"
fi

# Clean up any remaining node processes for AutoWRX
print_status "Cleaning up any remaining processes..."
pkill -f "node.*start-dev.js" 2>/dev/null || true
pkill -f "vite.*3210" 2>/dev/null || true

print_success "AutoWRX system stopped successfully"
print_status "All processes terminated and cleaned up"
echo ""