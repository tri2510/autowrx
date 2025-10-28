#!/usr/bin/env bash

# Common functions and utilities for AutoWRX scripts

# Colors for output
export GREEN='\033[0;32m'
export BLUE='\033[0;34m'
export YELLOW='\033[1;33m'
export RED='\033[0;31m'
export NC='\033[0m' # No Color

# Directories
export SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export LOG_DIR="$SCRIPT_DIR/logs"
export HELPERS_DIR="$SCRIPT_DIR/helpers"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Print functions
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

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if a port is in use
port_in_use() {
    local port=$1
    if command_exists lsof; then
        lsof -ti ":$port" >/dev/null 2>&1
    else
        netstat -tuln 2>/dev/null | grep -q ":$port "
    fi
}

# Kill process using a port
kill_port() {
    local port=$1
    if command_exists lsof; then
        local pids
        pids=$(lsof -ti ":$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            print_warning "Port $port in use by PID(s): $pids — terminating."
            for pid in $pids; do
                kill "$pid" 2>/dev/null || true
            done
            sleep 1
        fi
    fi
}

# Wait for a URL to become available
wait_for_url() {
    local url=$1
    local timeout=${2:-120}
    local start=$(date +%s)

    while true; do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        if [ "$status" != "000" ]; then
            return 0
        fi

        local now=$(date +%s)
        if [ $((now - start)) -ge $timeout ]; then
            print_error "Timeout waiting for $url"
            return 1
        fi
        sleep 2
    done
}

# Check if node/npm is installed
check_node() {
    if ! command_exists node; then
        print_error "Node.js not found. Please install Node.js first."
        exit 1
    fi

    if ! command_exists npm; then
        print_error "npm not found. Please install npm first."
        exit 1
    fi
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "$SCRIPT_DIR/package.json" ] && [ ! -f "$SCRIPT_DIR/backend/package.json" ]; then
        print_error "Please run this script from the AutoWRX root directory"
        exit 1
    fi
}

# Install dependencies if needed
install_dependencies() {
    local dir=$1
    local label=$2

    if [ ! -d "$dir/node_modules" ]; then
        print_status "Installing $label dependencies..."
        (cd "$dir" && npm install --legacy-peer-deps)
        print_success "$label dependencies installed"
    fi
}

# Stop a service by PID file
stop_service() {
    local pid_file=$1
    local service_name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" >/dev/null 2>&1; then
            print_status "Stopping $service_name (PID $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
        fi
        rm -f "$pid_file"
    else
        print_warning "$service_name PID file not found"
    fi
}

# Open browser to a URL
open_browser() {
    local url=$1
    if command_exists xdg-open; then
        xdg-open "$url" >/dev/null 2>&1 || true
    elif command_exists open; then
        open "$url" >/dev/null 2>&1 || true
    elif command_exists start; then
        start "" "$url" >/dev/null 2>&1 || true
    else
        print_status "Open your browser to: $url"
    fi
}

# Export all functions
export -f print_status
export -f print_success
export -f print_warning
export -f print_error
export -f print_header
export -f command_exists
export -f port_in_use
export -f kill_port
export -f wait_for_url
export -f check_node
export -f check_directory
export -f install_dependencies
export -f stop_service
export -f open_browser
