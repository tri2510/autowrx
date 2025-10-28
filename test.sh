#!/usr/bin/env bash

# AutoWRX Test Runner

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers/common.sh"

print_header "AutoWRX Test Runner"

echo "Choose what to test:"
echo ""
echo "  1) Plugin System (full verification)"
echo "  2) Authentication"
echo "  3) Isolated Environment"
echo "  4) Login/Session"
echo "  5) Run All Tests"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_status "Running Plugin System Tests..."
        "$SCRIPT_DIR/helpers/test/test-plugin-system.sh"
        ;;
    2)
        print_status "Running Authentication Tests..."
        "$SCRIPT_DIR/helpers/test/test-auth.sh"
        ;;
    3)
        print_status "Running Isolated Environment Tests..."
        "$SCRIPT_DIR/helpers/test/test-isolated.sh"
        ;;
    4)
        print_status "Running Login/Session Tests..."
        "$SCRIPT_DIR/helpers/test/test-login.sh"
        "$SCRIPT_DIR/helpers/test/test-session.sh"
        ;;
    5)
        print_status "Running All Tests..."
        echo ""
        print_header "1/4: Plugin System Tests"
        "$SCRIPT_DIR/helpers/test/test-plugin-system.sh"

        echo ""
        print_header "2/4: Authentication Tests"
        "$SCRIPT_DIR/helpers/test/test-auth.sh"

        echo ""
        print_header "3/4: Login Tests"
        "$SCRIPT_DIR/helpers/test/test-login.sh"

        echo ""
        print_header "4/4: Session Tests"
        "$SCRIPT_DIR/helpers/test/test-session.sh"

        echo ""
        print_success "All tests completed!"
        ;;
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac
