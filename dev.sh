#!/usr/bin/env bash

# AutoWRX Quick Development Launcher
# Starts the isolated environment for quick development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers/common.sh"

print_header "AutoWRX Development Environment"
print_status "Starting isolated environment with:"
echo "  • In-memory MongoDB"
echo "  • Local authentication"
echo "  • No external dependencies"
echo "  • Plugin system enabled"
echo ""

# Check prerequisites
check_node

# Start the isolated environment
"$SCRIPT_DIR/helpers/start/start-isolated.sh"
