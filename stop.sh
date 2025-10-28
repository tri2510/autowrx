#!/usr/bin/env bash

# AutoWRX Stop Script - Stop all running services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers/common.sh"

print_header "Stopping AutoWRX Services"

# Stop all possible services
if [ -f "$SCRIPT_DIR/helpers/stop/stop-autowrx-with-registry.sh" ]; then
    print_status "Attempting to stop full stack..."
    "$SCRIPT_DIR/helpers/stop/stop-autowrx-with-registry.sh" 2>/dev/null || true
fi

if [ -f "$SCRIPT_DIR/helpers/stop/stop-isolated.sh" ]; then
    print_status "Attempting to stop isolated environment..."
    "$SCRIPT_DIR/helpers/stop/stop-isolated.sh" 2>/dev/null || true
fi

if [ -f "$SCRIPT_DIR/helpers/stop/stop-autowrx.sh" ]; then
    print_status "Attempting to stop basic AutoWRX..."
    "$SCRIPT_DIR/helpers/stop/stop-autowrx.sh" 2>/dev/null || true
fi

# Kill any remaining processes on key ports
print_status "Cleaning up ports..."
kill_port 3200  # Backend
kill_port 3210  # Frontend
kill_port 4400  # Registry

# Clean up any remaining node processes related to AutoWRX
print_status "Cleaning up remaining processes..."
pkill -f "autowrx.*node" 2>/dev/null || true
pkill -f "start-autowrx" 2>/dev/null || true
pkill -f "start-isolated" 2>/dev/null || true
pkill -f "registry-service" 2>/dev/null || true

print_success "All AutoWRX services stopped"
print_status "Logs available in: $LOG_DIR"
