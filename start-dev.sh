#!/bin/sh

# AutoWRX development startup script
# Starts MongoDB (Docker), backend, and frontend (native)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored output
info() {
    echo "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo "${RED}[ERROR]${NC} $1"
}

# Kill process using specified port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ -n "$pid" ]; then
        warn "Port $port is in use (PID: $pid), killing process..."
        kill -9 $pid 2>/dev/null
        sleep 2
        info "Port $port freed"
    fi
}

# Check if MongoDB container is running
check_mongodb() {
    if docker ps | grep -q "autowrx-mongo"; then
        info "MongoDB is already running"
        return 0
    else
        warn "MongoDB is not running"
        return 1
    fi
}

# Start MongoDB container
start_mongodb() {
    info "Starting MongoDB container..."
    docker run --name autowrx-mongo -p 27017:27017 -d mongo:4.4.6-bionic
    if [ $? -eq 0 ]; then
        info "MongoDB started successfully"
    else
        error "Failed to start MongoDB"
        exit 1
    fi
}

# Start backend (native)
start_backend() {
    info "Starting backend server (native)..."
    cd backend
    if [ ! -f ".env" ]; then
        warn "Backend .env file not found, copying from example..."
        cp .env.example .env
        warn "Please edit backend/.env with your configuration"
    fi
    # Ensure NODE_ENV is development
    sed -i 's/^NODE_ENV=production/NODE_ENV=development/' .env
    npm run dev &
    BACKEND_PID=$!
    cd ..
    info "Backend started (PID: $BACKEND_PID)"
}

# Start frontend (native)
start_frontend() {
    info "Starting frontend server (native)..."
    cd frontend
    if [ ! -f ".env" ]; then
        warn "Frontend .env file not found, copying from example..."
        cp .env.example .env
        warn "Please edit frontend/.env with your configuration"
    fi
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    info "Frontend started (PID: $FRONTEND_PID)"
}

# Main execution
main() {
    info "Starting AutoWRX development environment..."

    # Kill processes using required ports
    kill_port 3200  # Backend
    kill_port 3210  # Frontend

    # Start MongoDB (Docker) if not running
    if ! check_mongodb; then
        start_mongodb
        sleep 3  # Give MongoDB time to start
    fi

    # Start backend and frontend (native)
    start_backend
    sleep 5  # Wait for backend to fully start
    start_frontend

    echo ""
    info "All services started successfully!"
    echo ""
    info "Access points:"
    echo "  - Unified application: http://localhost:3200"
    echo "  - Frontend only:      http://localhost:3210"
    echo "  - Backend API:        http://localhost:3200/v2"
    echo ""
    info "To stop all services, press Ctrl+C"

    # Wait for interrupt signal
    trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM
    wait
}

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    error "Docker is not installed or not in PATH"
    exit 1
fi

# Run main function
main