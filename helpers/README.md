# AutoWRX Helper Scripts

This directory contains all helper scripts organized by function. These scripts are called by the main launcher scripts in the root directory.

## Directory Structure

```
helpers/
├── common.sh           # Shared functions and utilities
├── start/              # Scripts to start services
│   ├── start-autowrx.sh
│   ├── start-autowrx-with-registry.sh
│   ├── start-isolated.sh
│   └── start-registry.sh
├── stop/               # Scripts to stop services
│   ├── stop-autowrx.sh
│   ├── stop-autowrx-with-registry.sh
│   └── stop-isolated.sh
├── test/               # Test scripts
│   ├── test-auth.sh
│   ├── test-isolated.sh
│   ├── test-login.sh
│   ├── test-plugin-system.sh
│   └── test-session.sh
├── build/              # Build scripts
│   └── build-frontend.sh
└── utils/              # Utility scripts
    └── launch-extension-stack.sh
```

## Common Functions (common.sh)

The `common.sh` file provides shared functions used across all scripts:

### Print Functions
- `print_status(message)` - Print status message in blue
- `print_success(message)` - Print success message in green
- `print_warning(message)` - Print warning message in yellow
- `print_error(message)` - Print error message in red
- `print_header(message)` - Print header with decorative border

### Utility Functions
- `command_exists(command)` - Check if a command is available
- `port_in_use(port)` - Check if a port is currently in use
- `kill_port(port)` - Kill any process using the specified port
- `wait_for_url(url, timeout)` - Wait for a URL to become available
- `check_node()` - Verify Node.js and npm are installed
- `check_directory()` - Verify script is run from correct directory
- `install_dependencies(dir, label)` - Install npm dependencies if needed
- `stop_service(pid_file, name)` - Stop service using PID file
- `open_browser(url)` - Open URL in default browser

### Environment Variables
- `$SCRIPT_DIR` - Root directory of the project
- `$LOG_DIR` - Directory for log files
- `$HELPERS_DIR` - This helpers directory

## Usage in Scripts

To use the common functions in your script:

```bash
#!/usr/bin/env bash

# Source the common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/helpers/common.sh"

# Now you can use any common function
print_header "My Script"
check_node
print_success "Node.js is installed!"
```

## Start Scripts

### start-autowrx.sh
Starts the basic AutoWRX stack (backend + frontend) with production dependencies.

### start-autowrx-with-registry.sh
Starts the full stack including the extension registry service on port 4400.

### start-isolated.sh
Starts an isolated development environment with:
- In-memory MongoDB
- Local authentication (no external auth providers)
- Disabled email and external APIs
- Perfect for development and testing

### start-registry.sh
Starts only the extension registry service on port 4400.

## Stop Scripts

### stop-autowrx.sh
Stops the basic AutoWRX services.

### stop-autowrx-with-registry.sh
Stops all services including the extension registry.

### stop-isolated.sh
Stops the isolated development environment.

## Test Scripts

### test-plugin-system.sh
Comprehensive test of the plugin system:
- Verifies backend and frontend are running
- Checks plugin files exist
- Validates core plugin system files

### test-auth.sh
Tests authentication endpoints and functionality.

### test-isolated.sh
Tests the isolated environment setup and configuration.

### test-login.sh
Tests user login functionality.

### test-session.sh
Tests session management and token handling.

## Build Scripts

### build-frontend.sh
Builds the frontend application for production deployment.

## Utility Scripts

### launch-extension-stack.sh
Orchestrates launching the complete stack with extension registry:
1. Starts registry service
2. Starts backend in isolated mode
3. Starts frontend
4. Waits for all services to be healthy
5. Opens browser to application

## Adding New Scripts

When adding new helper scripts:

1. Place them in the appropriate subdirectory
2. Make them executable: `chmod +x your-script.sh`
3. Source common.sh for shared functionality
4. Use common functions for consistency
5. Add documentation here

Example:

```bash
#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/helpers/common.sh"

print_header "My New Script"

# Your script logic here
check_directory
check_node
print_success "Everything looks good!"
```

## Troubleshooting

### Scripts not executable
```bash
chmod +x helpers/**/*.sh
```

### Can't find common.sh
Make sure you're sourcing it with the correct relative path:
```bash
source "$SCRIPT_DIR/helpers/common.sh"
```

### Port already in use
Use the `kill_port` function:
```bash
kill_port 3200
```

### Logs not found
Check `$LOG_DIR` (usually `./logs/`):
```bash
ls -la logs/
tail -f logs/backend-isolated.log
```
