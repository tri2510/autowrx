#!/usr/bin/env bash

# AutoWRX Launcher - Main entry point to start services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers/common.sh"

print_header "AutoWRX Launcher"

echo "Choose how to start AutoWRX:"
echo ""
echo "  1) Full Stack with Extension Registry"
echo "     (Backend + Frontend + Registry Service)"
echo ""
echo "  2) Isolated Development Environment"
echo "     (In-memory MongoDB, local auth, no external dependencies)"
echo ""
echo "  3) Basic AutoWRX"
echo "     (Backend + Frontend only)"
echo ""
echo "  4) Registry Service Only"
echo "     (For testing extensions)"
echo ""
echo "  5) Backend Only"
echo ""
echo "  6) Frontend Only"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        print_status "Starting Full Stack with Extension Registry..."
        "$SCRIPT_DIR/helpers/utils/launch-extension-stack.sh"
        ;;
    2)
        print_status "Starting Isolated Development Environment..."
        "$SCRIPT_DIR/helpers/start/start-isolated.sh"
        ;;
    3)
        print_status "Starting Basic AutoWRX..."
        "$SCRIPT_DIR/helpers/start/start-autowrx.sh"
        ;;
    4)
        print_status "Starting Registry Service..."
        "$SCRIPT_DIR/helpers/start/start-registry.sh"
        ;;
    5)
        print_status "Starting Backend Only..."
        cd "$SCRIPT_DIR/backend"
        npm run dev
        ;;
    6)
        print_status "Starting Frontend Only..."
        cd "$SCRIPT_DIR/frontend"
        npm run dev
        ;;
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac
