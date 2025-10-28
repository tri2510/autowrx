# AutoWRX Development Guide

Complete guide for developing with AutoWRX, including the new plugin/extension system.

## Quick Start for Developers

The fastest way to start developing:

```bash
./dev.sh
```

This starts the **Isolated Development Environment** with:
- ✅ Backend API on port 3200
- ✅ Frontend on port 3210
- ✅ In-memory MongoDB (no external database needed)
- ✅ Local authentication (no external auth providers)
- ✅ Plugin system fully enabled
- ✅ All external APIs disabled

Access: http://localhost:3210

**Test Credentials:**
- User: `user@autowrx.local` / `password123`
- Admin: `admin@autowrx.local` / `AutoWRX2025!`

## Development Modes

This branch supports multiple development modes:

### 1. Isolated Mode (Recommended)

**Best for:** New developers, plugin development, testing without dependencies

```bash
./dev.sh
# or
./helpers/start/start-isolated.sh
```

**Features:**
- No MongoDB installation required
- No external auth setup needed
- Perfect for plugin development
- Fast startup

### 2. Full Stack with Extension Registry

**Best for:** Testing the complete extension system

```bash
./start.sh  # Choose option 1
# or
./helpers/utils/launch-extension-stack.sh
```

**Includes:**
- Backend on port 3200
- Frontend on port 3210
- Extension Registry on port 4400

### 3. Basic Mode

**Best for:** Production-like development

```bash
./helpers/start/start-autowrx.sh
```

**Requirements:**
- MongoDB running on localhost:27017
- Proper `.env` configuration

### 4. Component Mode

Start individual components:

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Registry only
./helpers/start/start-registry.sh
```

## Project Architecture

```
autowrx-fork/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes (organized by domain)
│   │   │   └── v2/
│   │   │       ├── system/         # System routes
│   │   │       ├── content/        # Content routes
│   │   │       ├── user-management/# User routes
│   │   │       └── vehicle-data/   # Vehicle routes
│   │   ├── services/     # Business logic
│   │   └── middlewares/  # Express middlewares
│   ├── start-isolated.js # Isolated mode entry point
│   └── package.json
│
├── frontend/             # React/Vite application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── core/         # Plugin system core
│   │   │   ├── plugin-manager.ts
│   │   │   ├── plugin-loader.ts
│   │   │   ├── tab-manager.ts
│   │   │   └── plugin-api.ts
│   │   ├── services/     # API clients
│   │   └── stores/       # State management
│   ├── public/
│   │   └── plugins/      # Development plugins
│   └── package.json
│
├── registry-service/     # Extension registry microservice
│   ├── src/
│   │   ├── app.js        # Express server
│   │   ├── routes/       # API routes
│   │   └── data/         # Mock data
│   └── package.json
│
├── runtime/              # Runtime data
│   └── plugin-registry/
│       ├── installed/    # Installed plugins
│       ├── packages/     # Plugin packages
│       └── catalog.json  # Plugin catalog
│
├── helpers/              # Helper scripts
│   ├── common.sh         # Shared functions
│   ├── start/            # Start scripts
│   ├── stop/             # Stop scripts
│   ├── test/             # Test scripts
│   ├── build/            # Build scripts
│   └── utils/            # Utility scripts
│
└── docs/                 # Documentation
    ├── guides/           # Detailed guides
    └── ...
```

## Development Workflow

### Standard Workflow

1. **Start Services**
   ```bash
   ./dev.sh
   ```

2. **Make Changes**
   - Backend: Edit files in `backend/src/`
   - Frontend: Edit files in `frontend/src/`
   - Auto-reload enabled for both

3. **Test Changes**
   ```bash
   ./test.sh
   ```

4. **Stop Services**
   ```bash
   ./stop.sh
   ```

### Plugin Development Workflow

1. **Start Isolated Environment**
   ```bash
   ./dev.sh
   ```

2. **Create Plugin**
   ```bash
   mkdir -p frontend/public/plugins/my-plugin
   cd frontend/public/plugins/my-plugin
   ```

3. **Create manifest.json**
   ```json
   {
     "id": "my-plugin",
     "name": "My Plugin",
     "version": "1.0.0",
     "description": "My awesome plugin",
     "main": "index.js",
     "tabs": [
       {
         "id": "my-tab",
         "label": "My Tab",
         "component": "MyComponent",
         "path": "/plugin/my-plugin"
       }
     ]
   }
   ```

4. **Create index.js**
   ```javascript
   export function activate(api) {
     console.log('My plugin activated!');

     api.registerComponent('MyComponent', () => {
       return `<div>Hello from My Plugin!</div>`;
     });
   }
   ```

5. **Test Plugin**
   - Navigate to http://localhost:3210/model/[any-model]
   - Look for "My Tab" in the interface

6. **Debug Plugin**
   - Open browser console
   - Use `window.pluginManager` to inspect plugins
   - See [Plugin Debugging Guide](docs/guides/PLUGIN_DEBUGGING_GUIDE.md)

## Development Tools

### Helper Scripts

Located in `helpers/`, organized by function. All scripts source `helpers/common.sh` for shared functionality.

**Start Scripts:**
- `helpers/start/start-isolated.sh` - Isolated environment
- `helpers/start/start-autowrx-with-registry.sh` - Full stack
- `helpers/start/start-registry.sh` - Registry only

**Stop Scripts:**
- `helpers/stop/stop-isolated.sh` - Stop isolated environment
- `helpers/stop/stop-autowrx.sh` - Stop basic AutoWRX

**Test Scripts:**
- `helpers/test/test-plugin-system.sh` - Plugin system tests
- `helpers/test/test-auth.sh` - Authentication tests
- `helpers/test/test-isolated.sh` - Isolated environment tests

See [helpers/README.md](helpers/README.md) for complete reference.

### Useful Commands

```bash
# Check service health
curl http://localhost:3200/healthz
curl http://localhost:4400/healthz

# View logs
tail -f logs/backend-isolated.log
tail -f logs/frontend-isolated.log
tail -f logs/registry-service.log

# Check running services
ps aux | grep node

# Check ports
lsof -i :3200
lsof -i :3210
lsof -i :4400

# Kill a specific port
lsof -ti :3200 | xargs kill
```

## API Development

### Backend API Routes

Routes are organized by domain in `backend/src/routes/v2/`:

```
/v2/
├── system/
│   ├── /changelog          # System changelog
│   ├── /file               # File management
│   ├── /search             # Search functionality
│   └── /site-management    # Site configuration
│
├── content/
│   ├── /discussions        # Discussion threads
│   └── /feedback           # User feedback
│
├── user-management/
│   ├── /auth               # Authentication
│   ├── /users              # User management
│   ├── /permissions        # Permissions
│   └── /assets             # User assets
│
└── vehicle-data/
    ├── /api                # Vehicle APIs
    ├── /extendedApi        # Extended APIs
    ├── /model              # Vehicle models
    └── /prototype          # Prototypes
```

### Adding New API Endpoints

1. **Create Route File**
   ```javascript
   // backend/src/routes/v2/system/my-feature.route.js
   const express = require('express');
   const router = express.Router();

   router.get('/my-endpoint', (req, res) => {
     res.json({ message: 'Hello!' });
   });

   module.exports = router;
   ```

2. **Register Route**
   ```javascript
   // backend/src/routes/v2/system/index.js
   const myFeatureRoutes = require('./my-feature.route');
   router.use('/my-feature', myFeatureRoutes);
   ```

3. **Test Endpoint**
   ```bash
   curl http://localhost:3200/v2/system/my-feature/my-endpoint
   ```

## Frontend Development

### Adding New Pages

1. **Create Page Component**
   ```typescript
   // frontend/src/pages/MyNewPage.tsx
   export function MyNewPage() {
     return <div>My New Page</div>;
   }
   ```

2. **Add Route**
   ```typescript
   // frontend/src/configs/routes.tsx
   {
     path: '/my-page',
     element: <MyNewPage />
   }
   ```

3. **Add Navigation**
   ```typescript
   // frontend/src/components/organisms/NavigationBar.tsx
   <NavLink to="/my-page">My Page</NavLink>
   ```

### Working with Plugin System

```typescript
// Access plugin manager
import { pluginManager } from '@/core/plugin-manager';

// Get installed plugins
const plugins = await pluginManager.getInstalledPlugins();

// Load a plugin
await pluginManager.loadPlugin('my-plugin');

// Register plugin tabs
const tabs = pluginManager.getPluginTabs();
```

## Testing

### Running Tests

```bash
# Interactive test menu
./test.sh

# All tests
./helpers/test/test-plugin-system.sh
./helpers/test/test-auth.sh
./helpers/test/test-isolated.sh

# Backend tests (if available)
cd backend && npm test

# Frontend tests (if available)
cd frontend && npm test
```

### Manual Testing

1. **Start Services**
   ```bash
   ./dev.sh
   ```

2. **Test Endpoints**
   ```bash
   # Health check
   curl http://localhost:3200/healthz

   # Login
   curl -X POST http://localhost:3200/v2/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@autowrx.local","password":"password123"}'

   # Get plugins
   curl http://localhost:3200/api/plugins/installed
   ```

3. **Test UI**
   - Visit http://localhost:3210
   - Login with test credentials
   - Navigate to vehicle models
   - Test plugin functionality

## Debugging

### Backend Debugging

```bash
# Start with debugger
cd backend
node --inspect src/app.js

# Or with nodemon
npm run dev:debug
```

Connect Chrome DevTools to `chrome://inspect`

### Frontend Debugging

- Open Chrome DevTools
- Use React DevTools extension
- Check Console for errors
- Use Network tab for API calls

### Plugin Debugging

```javascript
// In browser console
window.pluginManager.listPlugins()
window.pluginManager.getPlugin('my-plugin')
window.tabManager.getTabs()

// Enable debug logging
localStorage.setItem('plugin-debug', 'true')
```

See [Plugin Debugging Guide](docs/guides/PLUGIN_DEBUGGING_GUIDE.md)

## Common Issues

### Port Already in Use

```bash
./stop.sh
# or
lsof -ti :3200 | xargs kill
```

### Dependencies Out of Sync

```bash
cd backend && npm install --legacy-peer-deps
cd frontend && npm install
cd registry-service && npm install
```

### MongoDB Connection Failed

Use isolated mode (doesn't require MongoDB):
```bash
./dev.sh
```

### Plugin Not Loading

1. Check manifest.json is valid
2. Verify plugin files exist
3. Check browser console
4. Restart frontend

### Authentication Fails

For isolated mode, use:
- `user@autowrx.local` / `password123`

Check JWT_SECRET is set in backend/.env

## Best Practices

### Code Style

- Use ESLint for JavaScript/TypeScript
- Follow existing code patterns
- Add comments for complex logic
- Write meaningful commit messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add my feature"

# Push
git push origin feature/my-feature
```

### Testing

- Test in isolated mode first
- Test with full stack if using registry
- Run test suite before committing
- Test in multiple browsers

## Environment Configuration

### Backend .env

```bash
# Development (isolated mode)
NODE_ENV=isolated
PORT=3200
MONGODB_URL=mongodb://localhost:27017/autowrx-isolated
JWT_SECRET=your-secret-key
EXTENSION_REGISTRY_URL=http://localhost:4400

# Production
NODE_ENV=production
PORT=3200
MONGODB_URL=mongodb://production-host:27017/autowrx
JWT_SECRET=secure-production-secret
```

### Frontend .env

```bash
VITE_API_URL=http://localhost:3200
VITE_APP_TITLE=AutoWRX
```

## Performance Tips

1. **Use isolated mode** for faster startup
2. **Keep plugins small** for quick loading
3. **Use lazy loading** for large components
4. **Enable HMR** (Hot Module Replacement)
5. **Monitor bundle size** with Vite's build analyzer

## Resources

- [Quick Start Guide](QUICK_START.md)
- [Plugin Development](docs/guides/HOW_TO_ADD_PLUGINS.md)
- [Helper Scripts](helpers/README.md)
- [Extension System](docs/extension-system-overview.md)
- [API Documentation](backend/docs/)

## Getting Help

- Check logs in `logs/` directory
- Review documentation in `docs/`
- Check helper scripts: `helpers/README.md`
- Review test results: `launch-result.txt`

---

**Quick Commands Reference:**

```bash
# Start
./dev.sh                    # Quick start (isolated)
./start.sh                  # Interactive menu

# Stop
./stop.sh                   # Stop all services

# Test
./test.sh                   # Run tests

# Logs
tail -f logs/*.log         # View logs

# Health
curl localhost:3200/healthz # Check backend
curl localhost:4400/healthz # Check registry
```
