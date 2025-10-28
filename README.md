# AutoWRX v3 - Extension Registry Branch

AutoWRX is a comprehensive vehicle development platform with an extensible plugin system.

## Quick Start

Get started in under 2 minutes:

```bash
# Start development environment
./dev.sh

# Or use interactive launcher
./start.sh
```

Access the application at http://localhost:3210

**Default Login:**
- Email: `user@autowrx.local`
- Password: `password123`

For detailed instructions, see [QUICK_START.md](QUICK_START.md)

## What's New in This Branch

This `feature/extension-registry-prototype` branch introduces:

✨ **Extension Registry Service** - Standalone microservice for plugin distribution
🔌 **Plugin Management System** - Install, configure, and manage plugins from UI
⚙️  **Site Configuration** - Scoped configuration system for flexible deployments
🔐 **Local Authentication** - Isolated development without external dependencies
🏗️  **Route Reorganization** - Logical grouping of backend APIs
📊 **Health Monitoring** - `/healthz` endpoints for all services

## Project Structure

```
autowrx-fork/
├── start.sh              # Interactive launcher
├── stop.sh               # Stop all services
├── test.sh               # Run tests
├── dev.sh                # Quick development mode
├── backend/              # Node.js backend API
├── frontend/             # React frontend
├── registry-service/     # Extension registry microservice
├── runtime/              # Plugin runtime directory
├── helpers/              # Helper scripts (organized by function)
├── docs/                 # Documentation
│   ├── guides/           # Detailed guides
│   ├── deployment/       # Deployment docs
│   └── ...
└── logs/                 # Service logs
```

## Available Scripts

### Root Level (User-Facing)

| Script | Description |
|--------|-------------|
| `./start.sh` | Interactive launcher with menu |
| `./stop.sh` | Stop all AutoWRX services |
| `./test.sh` | Run test suites |
| `./dev.sh` | Quick start for development |

### Helper Scripts

Helper scripts are organized in `helpers/` by function:

- **`helpers/start/`** - Start services (isolated, full stack, registry only)
- **`helpers/stop/`** - Stop services
- **`helpers/test/`** - Test scripts (auth, plugins, isolated env)
- **`helpers/build/`** - Build scripts
- **`helpers/utils/`** - Utility scripts

See [helpers/README.md](helpers/README.md) for details.

## Development

### Prerequisites

- Node.js v16+ and npm v7+
- (Optional) MongoDB - not required for isolated mode

### Start Development

```bash
# Quick start (isolated environment)
./dev.sh

# Full stack with extension registry
./helpers/utils/launch-extension-stack.sh

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

### Testing

```bash
# Run all tests
./test.sh

# Run specific test
./helpers/test/test-plugin-system.sh

# Check plugin system
./helpers/test/test-plugin-system.sh
```

See [development-guide.md](development-guide.md) for detailed development instructions.

## Plugin System

AutoWRX features a comprehensive plugin system for extending functionality.

### Quick Plugin Development

1. Create plugin directory in `frontend/public/plugins/my-plugin/`
2. Add `manifest.json` with plugin metadata
3. Create `index.js` with plugin code
4. Restart frontend to load plugin

### Plugin Locations

- **Development plugins:** `frontend/public/plugins/`
- **Installed plugins:** `runtime/plugin-registry/installed/`
- **Plugin packages:** `runtime/plugin-registry/packages/`

### Example Plugins

- `demo-plugin` - Basic example
- `my-first-plugin` - Tutorial plugin
- `vehicle-monitor` - Vehicle monitoring plugin

For more details, see the [Plugin Development Guide](docs/guides/HOW_TO_ADD_PLUGINS.md)

## Services

### Backend API (Port 3200)

- REST API for vehicle data
- Authentication and authorization
- Plugin management APIs
- Site configuration APIs

Health check: http://localhost:3200/healthz

### Frontend (Port 3210)

- React application with Vite
- Plugin system integration
- Vehicle model management
- Extension center UI

Access: http://localhost:3210

### Extension Registry (Port 4400)

- Plugin catalog and distribution
- Version management
- Extension metadata

Health check: http://localhost:4400/healthz

## Configuration

### Backend Configuration

Configuration files:
- `.env` - Production/development config
- `.env.isolated` - Isolated mode config
- `.env.example` - Example template

Key variables:
- `MONGODB_URL` - MongoDB connection (not needed in isolated mode)
- `JWT_SECRET` - JWT token secret
- `EXTENSION_REGISTRY_URL` - Registry service URL

### Frontend Configuration

- `.env` - Environment variables
- `.env.example` - Example template

Key variables:
- `VITE_API_URL` - Backend API URL
- `VITE_APP_TITLE` - Application title

## Documentation

### Essential Docs (Root Level)

- **[README.md](README.md)** - This file (project overview)
- **[QUICK_START.md](QUICK_START.md)** - Get started quickly
- **[development-guide.md](development-guide.md)** - Development workflows

### Detailed Guides (docs/guides/)

- [Complete Setup Guide](docs/guides/COMPLETE_SETUP_GUIDE.md) - Comprehensive setup instructions
- [Plugin System Implementation](docs/guides/PLUGIN_SYSTEM_IMPLEMENTATION.md) - Technical details
- [How to Add Plugins](docs/guides/HOW_TO_ADD_PLUGINS.md) - Plugin development guide
- [Plugin Debugging Guide](docs/guides/PLUGIN_DEBUGGING_GUIDE.md) - Debugging techniques
- [Isolated Environment](docs/guides/ISOLATED_ENVIRONMENT.md) - Isolated mode details
- [Script Refactoring Summary](docs/guides/SCRIPT_REFACTORING_SUMMARY.md) - Script organization

### API & System Docs (docs/)

- [Extension System Overview](docs/extension-system-overview.md) - Architecture overview
- [Extension Registry Service](docs/extension-registry-service.md) - Registry details
- [Plugin Development Guide](docs/plugin-development-guide.md) - Complete plugin guide
- [Deployment Guide](docs/deployment/) - Production deployment

### Helper Docs

- [Helpers README](helpers/README.md) - Helper scripts documentation

## Troubleshooting

### Services Won't Start

```bash
# Stop all services first
./stop.sh

# Check if ports are free
lsof -i :3200 -i :3210 -i :4400

# Start in isolated mode (no external dependencies)
./dev.sh
```

### Dependencies Issues

```bash
# Backend
cd backend && npm install --legacy-peer-deps

# Frontend
cd frontend && npm install

# Registry
cd registry-service && npm install
```

### View Logs

```bash
# Backend logs
tail -f logs/backend-isolated.log

# Frontend logs
tail -f logs/frontend-isolated.log

# Registry logs
tail -f logs/registry-service.log
```

### Authentication Issues

For isolated mode, use these test accounts:
- **User:** `user@autowrx.local` / `password123`
- **Admin:** `admin@autowrx.local` / `AutoWRX2025!`

### Plugin Not Loading

1. Check plugin manifest is valid JSON
2. Verify plugin files exist in correct location
3. Check browser console for errors
4. Restart frontend: `./stop.sh && ./dev.sh`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Plugin System                          │   │
│  │  • Plugin Manager  • Plugin Loader               │   │
│  │  • Tab Manager     • Plugin API                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────┐  │
│  │ Auth Service │  │ Plugin APIs    │  │ Site Config│  │
│  └──────────────┘  └────────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
         ↓ MongoDB           ↓ HTTP
┌──────────────────┐  ┌─────────────────────────────────┐
│   Database       │  │  Extension Registry Service     │
│ (In-memory for   │  │   • Plugin Catalog              │
│  isolated mode)  │  │   • Version Management          │
└──────────────────┘  └─────────────────────────────────┘
```

## Testing

### Test Coverage

- ✅ Plugin system verification
- ✅ Authentication flows
- ✅ Isolated environment setup
- ✅ Login and session management
- ✅ Health checks

### Run Tests

```bash
# All tests
./test.sh

# Individual tests
./helpers/test/test-plugin-system.sh
./helpers/test/test-auth.sh
./helpers/test/test-isolated.sh
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly using `./test.sh`
4. Update documentation if needed
5. Submit a pull request

## Support

- **Issues:** File issues in the GitHub repository
- **Documentation:** See `docs/` directory
- **Helper Scripts:** See `helpers/README.md`

## License

[Your License Here]

---

**Quick Links:**
- [Quick Start Guide](QUICK_START.md)
- [Development Guide](development-guide.md)
- [Plugin Development](docs/guides/HOW_TO_ADD_PLUGINS.md)
- [Helper Scripts](helpers/README.md)
- [Test Results](launch-result.txt)
