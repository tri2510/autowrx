#!/bin/bash

# AutoWRX Complete System Startup Script
# This script starts both backend and frontend for the full AutoWRX experience with plugin system

set -e

echo "🚀 Starting AutoWRX Complete System..."
echo "=================================="

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SELF_DIR/../.." && pwd)"
LOG_DIR="$REPO_ROOT/logs"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
STOP_AUTOWRX_SCRIPT="$REPO_ROOT/helpers/stop/stop-autowrx.sh"
STOP_ISOLATED_SCRIPT="$REPO_ROOT/helpers/stop/stop-isolated.sh"

source "$REPO_ROOT/helpers/common.sh"

cd "$REPO_ROOT"

print_status "Preparing AutoWRX environment..."
if [ -x "$STOP_AUTOWRX_SCRIPT" ]; then
    "$STOP_AUTOWRX_SCRIPT" 2>/dev/null || true
fi
if [ -x "$STOP_ISOLATED_SCRIPT" ]; then
    "$STOP_ISOLATED_SCRIPT" 2>/dev/null || true
fi
kill_port 3200
kill_port 3210
print_status "Cleanup complete. Starting services..."

mkdir -p "$LOG_DIR"

print_status "Starting Backend Server..."
echo "------------------------------------"

cd "$BACKEND_DIR"
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
node start-dev.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend.pid"

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

cd "$REPO_ROOT"

print_status "Starting Frontend Server..."
echo "------------------------------------"

cd "$FRONTEND_DIR"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install --legacy-peer-deps
fi

# Start frontend
print_status "Starting frontend development server..."
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

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

cd "$REPO_ROOT"

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
print_warning "To stop the system, run: $STOP_AUTOWRX_SCRIPT"
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
trap 'echo ""; print_status "Stopping AutoWRX system..."; "$STOP_AUTOWRX_SCRIPT"; exit 0' INT

# Keep alive
while true; do
    sleep 1
done

