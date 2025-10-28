#!/bin/bash

# AutoWRX Isolated Production-like Development Environment
# Fully isolated, no external dependencies, production-like settings

set -e

echo "🏭 Starting AutoWRX Isolated Production Environment..."
echo "===================================================="

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

# Check if we're in the right directory
if [ ! -f "PLUGIN_SYSTEM_IMPLEMENTATION.md" ]; then
    print_error "Please run this script from the AutoWRX root directory"
    exit 1
fi

# Create log directory
mkdir -p logs

print_status "Starting Isolated Backend Server..."
echo "------------------------------------"

# Stop any existing processes
print_status "Stopping existing processes..."
./stop-autowrx.sh 2>/dev/null || true

cd backend

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
node start-isolated.js > ../logs/backend-isolated.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend-isolated.pid

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

cd ..

print_status "Starting Frontend Server..."
echo "------------------------------------"

cd frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install --legacy-peer-deps
fi

# Start frontend
print_status "Starting frontend development server..."
npm run dev > ../logs/frontend-isolated.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend-isolated.pid

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

cd ..

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
print_warning "To stop the isolated environment, run: ./stop-isolated.sh"
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
trap 'echo ""; print_status "Stopping AutoWRX isolated environment..."; ./stop-isolated.sh; exit 0' INT

# Keep alive
while true; do
    sleep 1
done