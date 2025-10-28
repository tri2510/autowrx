# AutoWRX Quick Start Guide

Welcome to AutoWRX! This guide will help you get started quickly.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

## Quick Start

### Option 1: Development Mode (Recommended for First-Time Users)

The fastest way to get started is with the isolated development environment:

```bash
./dev.sh
```

This starts:
- Backend on http://localhost:3200
- Frontend on http://localhost:3210
- In-memory database (no setup needed)
- Local authentication

**Test Users:**
- `user@autowrx.local` / `password123` (regular user)
- `admin@autowrx.local` / `AutoWRX2025!` (admin)

### Option 2: Interactive Launcher

For more options, use the interactive launcher:

```bash
./start.sh
```

This presents a menu with choices:
1. Full Stack with Extension Registry
2. Isolated Development Environment
3. Basic AutoWRX
4. Registry Service Only
5. Backend Only
6. Frontend Only

### Option 3: Direct Commands

If you know what you want:

```bash
# Isolated environment (recommended for development)
./helpers/start/start-isolated.sh

# Full stack with extension registry
./helpers/utils/launch-extension-stack.sh

# Basic AutoWRX
./helpers/start/start-autowrx.sh

# Registry only
./helpers/start/start-registry.sh
```

## Stopping Services

To stop all running services:

```bash
./stop.sh
```

This will:
- Stop all AutoWRX services
- Clean up ports (3200, 3210, 4400)
- Remove PID files
- Terminate background processes

## Running Tests

Run the test suite:

```bash
./test.sh
```

Choose from:
1. Plugin System Tests
2. Authentication Tests
3. Isolated Environment Tests
4. Login/Session Tests
5. Run All Tests

Or run specific tests directly:

```bash
./helpers/test/test-plugin-system.sh
./helpers/test/test-auth.sh
./helpers/test/test-login.sh
```

## Accessing the Application

Once started, access AutoWRX at:

- **Frontend:** http://localhost:3210
- **Backend API:** http://localhost:3200
- **Registry API:** http://localhost:4400 (when running with registry)

### Key URLs

- Login: http://localhost:3210/login
- Vehicle Models: http://localhost:3210/model
- Model Detail: http://localhost:3210/model/bmw-x3-2024
- Plugin Demo: http://localhost:3210/plugin-demo
- Extension Center: http://localhost:3210/extension-center

## Common Tasks

### Install Dependencies

```bash
# Backend
cd backend && npm install --legacy-peer-deps

# Frontend
cd frontend && npm install

# Registry service
cd registry-service && npm install
```

### View Logs

Logs are stored in the `logs/` directory:

```bash
# View backend logs
tail -f logs/backend-isolated.log

# View frontend logs
tail -f logs/frontend-isolated.log

# View registry logs
tail -f logs/registry-service.log
```

### Check Service Health

```bash
# Backend
curl http://localhost:3200/healthz

# Registry
curl http://localhost:4400/healthz
```

### Build for Production

```bash
# Build frontend
./helpers/build/build-frontend.sh

# Or manually
cd frontend && npm run build
```

## Plugin Development

### Available Plugins

AutoWRX comes with demo plugins:
- `demo-plugin` - Basic example plugin
- `my-first-plugin` - Tutorial plugin
- `vehicle-monitor` - Vehicle monitoring plugin

### Plugin Locations

- Frontend plugins: `frontend/public/plugins/`
- Installed plugins: `runtime/plugin-registry/installed/`
- Plugin packages: `runtime/plugin-registry/packages/`

### Testing Plugins

1. Start the isolated environment:
   ```bash
   ./dev.sh
   ```

2. Navigate to a vehicle model:
   http://localhost:3210/model/bmw-x3-2024

3. Look for plugin tabs in the interface

### Plugin Management

Access the plugin management panel from the model detail page to:
- Install plugins from the catalog
- Upload custom plugins
- Edit plugin manifests
- Enable/disable plugins

## Troubleshooting

### Ports Already in Use

```bash
# Stop all services
./stop.sh

# Or kill specific ports manually
lsof -ti :3200 | xargs kill
lsof -ti :3210 | xargs kill
lsof -ti :4400 | xargs kill
```

### Dependencies Not Installing

```bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or force
npm install --force
```

### Services Not Starting

1. Check logs in `logs/` directory
2. Verify ports are not in use
3. Ensure Node.js version is correct: `node --version`
4. Check if MongoDB is required (not needed for isolated mode)

### Authentication Issues

When using isolated mode:
- Use `user@autowrx.local` / `password123`
- Tokens expire after 1 hour
- Refresh tokens are available at `/v2/auth/refresh-tokens`

### Frontend Not Loading

1. Check if Vite dev server is running:
   ```bash
   curl http://localhost:3210
   ```

2. Check frontend logs:
   ```bash
   tail -f logs/frontend-isolated.log
   ```

3. Rebuild node_modules:
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

## Environment Modes

### Isolated Mode (Development)
- In-memory MongoDB
- Local authentication
- No external dependencies
- Perfect for plugin development

### Basic Mode
- Requires MongoDB connection
- Can use external auth providers
- Full production features

### Full Stack Mode
- All services running
- Extension registry enabled
- Complete plugin ecosystem

## Next Steps

1. **Explore the UI**: Navigate to http://localhost:3210
2. **Try the Plugins**: Visit a model detail page
3. **Read the Docs**: Check `docs/` directory
4. **Develop a Plugin**: See `docs/plugin-development-guide.md`
5. **Configure Settings**: Edit `.env` files in backend/frontend

## Getting Help

- **Documentation**: See `docs/` directory
- **Helpers README**: `helpers/README.md`
- **Plugin Guide**: `HOW_TO_ADD_PLUGINS.md`
- **System Guide**: `PLUGIN_SYSTEM_IMPLEMENTATION.md`
- **Test Results**: `launch-result.txt`

## Scripts Reference

### Root Scripts
- `./start.sh` - Interactive launcher
- `./stop.sh` - Stop all services
- `./test.sh` - Run tests
- `./dev.sh` - Quick development mode

### Helper Scripts
- `helpers/start/*` - Start various configurations
- `helpers/stop/*` - Stop services
- `helpers/test/*` - Test suites
- `helpers/build/*` - Build scripts
- `helpers/utils/*` - Utility scripts

For detailed information on helper scripts, see `helpers/README.md`.
