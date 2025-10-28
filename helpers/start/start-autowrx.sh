#!/bin/bash

# AutoWRX Complete System Startup Script
# This script starts both backend and frontend for the full AutoWRX experience with plugin system

set -e

echo "🚀 Starting AutoWRX Complete System..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "PLUGIN_SYSTEM_IMPLEMENTATION.md" ]; then
    print_error "Please run this script from the AutoWRX root directory"
    exit 1
fi

# Create log directory
mkdir -p logs

print_status "Starting Backend Server..."
echo "------------------------------------"

# Start backend in background
cd backend
if [ ! -f "start-dev.js" ]; then
    print_error "Backend development script not found!"
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install --legacy-peer-deps
fi

# Start backend
print_status "Starting backend with in-memory MongoDB..."
node start-dev.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend started successfully (PID: $BACKEND_PID)"
    print_status "Backend running at: http://localhost:3200"
else
    print_error "Failed to start backend. Check logs/backend.log"
    exit 1
fi

cd ..

print_status "Starting Frontend Server..."
echo "------------------------------------"

# Start frontend in background
cd frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install --legacy-peer-deps
fi

# Start frontend
print_status "Starting frontend development server..."
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend started successfully (PID: $FRONTEND_PID)"
    print_status "Frontend running at: http://localhost:3210"
else
    print_error "Failed to start frontend. Check logs/frontend.log"
    # Kill backend if frontend failed
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

echo ""
echo "🎉 AutoWRX System Started Successfully!"
echo "======================================="
echo ""
print_success "Frontend: http://localhost:3210"
print_success "Backend:  http://localhost:3200"
echo ""
print_status "Available interfaces:"
echo "  • Home Page:        http://localhost:3210/"
echo "  • Vehicle Models:   http://localhost:3210/model"  
echo "  • Plugin Demo:      http://localhost:3210/plugin-demo"
echo "  • Model Detail:     http://localhost:3210/model/bmw-x3-2024"
echo ""
print_status "Plugin System Features:"
echo "  🔌 Hot reload plugin development"
echo "  🚗 Model-specific plugin integration" 
echo "  📊 Real-time vehicle data access"
echo "  💾 Persistent plugin storage"
echo "  🎯 Interactive plugin API testing"
echo ""
print_warning "To stop the system, run: ./stop-autowrx.sh"
echo ""
print_status "Logs available in:"
echo "  • Backend:  logs/backend.log"
echo "  • Frontend: logs/frontend.log"
echo ""
print_status "Process IDs saved in:"
echo "  • Backend:  logs/backend.pid"  
echo "  • Frontend: logs/frontend.pid"

# Wait for user input to keep script running
echo ""
print_status "Press Ctrl+C to stop the system, or close this terminal"
echo ""

# Keep script running and handle Ctrl+C
trap 'echo ""; print_status "Stopping AutoWRX system..."; ./stop-autowrx.sh; exit 0' INT

# Keep alive
while true; do
    sleep 1
done