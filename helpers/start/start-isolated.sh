#!/bin/bash

# AutoWRX Isolated Production-like Development Environment
# Fully isolated, no external dependencies, production-like settings

set -e

echo "🏭 Starting AutoWRX Isolated Production Environment..."
echo "===================================================="

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SELF_DIR/../.." && pwd)"
LOG_DIR="$REPO_ROOT/logs"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
STOP_AUTOWRX_SCRIPT="$REPO_ROOT/helpers/stop/stop-autowrx.sh"
STOP_ISOLATED_SCRIPT="$REPO_ROOT/helpers/stop/stop-isolated.sh"

source "$REPO_ROOT/helpers/common.sh"

cd "$REPO_ROOT"

print_status "Preparing isolated environment..."
if [ -x "$STOP_ISOLATED_SCRIPT" ]; then
    "$STOP_ISOLATED_SCRIPT" 2>/dev/null || true
fi
if [ -x "$STOP_AUTOWRX_SCRIPT" ]; then
    "$STOP_AUTOWRX_SCRIPT" 2>/dev/null || true
fi
kill_port 3200
kill_port 3210
print_status "Cleanup complete. Launching isolated stack..."

mkdir -p "$LOG_DIR"

print_status "Starting Isolated Backend Server..."
echo "------------------------------------"

cd "$BACKEND_DIR"

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install --legacy-peer-deps
fi

# Copy isolated environment configuration
print_status "Setting up isolated production configuration..."
cp .env.isolated .env

# Start isolated backend
print_status "Starting isolated backend with local auth and in-memory database..."
node start-isolated.js > "$LOG_DIR/backend-isolated.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend-isolated.pid"

# Wait for backend to start
sleep 5

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Isolated backend started successfully (PID: $BACKEND_PID)"
    print_status "Backend running at: http://localhost:3200"
else
    print_error "Failed to start isolated backend. Check logs/backend-isolated.log"
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
npm run dev > "$LOG_DIR/frontend-isolated.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend-isolated.pid"

# Wait for frontend to start
sleep 5

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend started successfully (PID: $FRONTEND_PID)"
    print_status "Frontend running at: http://localhost:3210"
else
    print_error "Failed to start frontend. Check logs/frontend-isolated.log"
    # Kill backend if frontend failed
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd "$REPO_ROOT"

echo ""
echo "🏭 AutoWRX Isolated Production Environment Started!"
echo "=================================================="
echo ""
print_success "Frontend: http://localhost:3210"
print_success "Backend:  http://localhost:3200"
echo ""
print_status "Environment Mode: ISOLATED PRODUCTION-LIKE"
echo ""
print_status "🔐 Authentication:"
echo "  • Local auth service (no external dependencies)"
echo "  • JWT tokens with production-like expiration"
echo "  • Secure cookie settings"
echo ""
print_status "👤 Test Users:"
echo "  • admin@autowrx.local   | AutoWRX2025!   (admin)"
echo "  • dev@autowrx.local     | AutoWRX2025!   (admin)"  
echo "  • user@autowrx.local    | password123    (user)"
echo ""
print_status "🗄️  Database:"
echo "  • In-memory MongoDB (fully isolated)"
echo "  • No external database dependencies"
echo "  • Production-like data structure"
echo ""
print_status "🔌 Plugin System:"
echo "  • Fully functional with authentication"
echo "  • Hot reload development"
echo "  • Production-like security model"
echo ""
print_status "🌐 Network:"
echo "  • No external API calls"
echo "  • No external service dependencies"
echo "  • Completely isolated environment"
echo ""
print_status "🧪 Test Endpoints:"
echo "  • Login: curl -X POST http://localhost:3200/v2/auth/login \\"
echo "           -H 'Content-Type: application/json' \\"
echo "           -d '{\"email\":\"admin@autowrx.local\",\"password\":\"AutoWRX2025!\"}'"
echo "  • Status: curl http://localhost:3200/v2/auth/status"
echo "  • User: curl -H 'Cookie: autowrx_token=TOKEN' http://localhost:3200/v2/users/self"
echo ""
print_status "🎯 Main URLs:"
echo "  • Vehicle Models:  http://localhost:3210/model"
echo "  • Model Detail:    http://localhost:3210/model/bmw-x3-2024"
echo "  • Plugin Demo:     http://localhost:3210/plugin-demo"
echo ""
print_warning "To stop the isolated environment, run: $STOP_ISOLATED_SCRIPT"
echo ""
print_status "Logs available in:"
echo "  • Backend:  logs/backend-isolated.log"
echo "  • Frontend: logs/frontend-isolated.log"
echo ""
print_status "Process IDs saved in:"
echo "  • Backend:  logs/backend-isolated.pid"
echo "  • Frontend: logs/frontend-isolated.pid"

# Wait for user input to keep script running
echo ""
print_status "Press Ctrl+C to stop the isolated environment"
echo ""

# Keep script running and handle Ctrl+C
trap 'echo ""; print_status "Stopping AutoWRX isolated environment..."; "$STOP_ISOLATED_SCRIPT"; exit 0' INT

# Keep alive
while true; do
    sleep 1
done

