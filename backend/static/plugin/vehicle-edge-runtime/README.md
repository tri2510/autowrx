# Vehicle Edge Runtime Plugin

A digital.auto plugin for deploying and managing vehicle edge applications with **real service connections**.

## 📚 Documentation

- **[REFERENCE.md](./REFERENCE.md)** - Complete reference guide with:
  - Original implementation reference
  - Service endpoints & APIs
  - Deployment procedures
  - Troubleshooting guide

## Features

- 🚀 **Deploy Applications** - Deploy Python applications to vehicle edge runtimes
- 📱 **Application Management** - View, start, stop, and uninstall deployed applications
- 💻 **Console Output** - Real-time console logging from deployments
- 📶 **Connection Management** - Select and connect to multiple vehicle edge devices
- 🔄 **Real-time Updates** - WebSocket-based live app status updates
- 🔌 **Real Service Connections** - Connects to actual Kit Manager and Vehicle Runtime services

## Quick Start

### Prerequisites

Ensure the following services are running:
- **Kit Manager**: `http://localhost:3090`
- **Vehicle Runtime**: `ws://localhost:3002/runtime`

### Build the Plugin

```bash
# Install dependencies
npm install

# Build the plugin
./build.sh
```

This generates `index.js` (~39KB) - the compiled plugin bundle.

### Development Server (with CORS)

```bash
# Start Express server with CORS
node server.js

# Server runs on http://localhost:3000
# Plugin available at http://localhost:3000/index.js
```

### Deploy to Autowrx

#### Option 1: Backend Static File Serving (Recommended)

1. **Build the plugin** (if not already built)
   ```bash
   ./build.sh
   ```

2. **Register plugin via Plugin Management UI**:
   - Navigate to Plugin Management page
   - Click "Add Plugin"
   - Fill in:
     - **Name**: `Vehicle Edge Runtime`
     - **Slug**: `vehicle-edge-runtime`
     - **URL**: `/plugin/vehicle-edge-runtime/index.js`
   - Save

3. **Access the plugin**:
   ```
   http://localhost:3210/model/:modelId/library/prototype/:prototypeId/plug?plugid=vehicle-edge-runtime
   ```

#### Option 2: External Hosting (Development)

1. **Start dev server**:
   ```bash
   node server.js  # Runs on port 3000
   ```

2. **Register plugin with external URL**:
   - **URL**: `http://localhost:3000/index.js`

3. **Refresh plugin page** to load from external server.

## Development

### Project Structure

```
vehicle-edge-runtime/
├── src/
│   ├── components/
│   │   └── Page.tsx                      # Main UI component
│   ├── hooks/
│   │   ├── useVehicleRuntimeState.ts     # Real service connections
│   │   ├── useVehicleRuntime.ts          # WebSocket (reference)
│   │   └── useConsoleOutput.ts           # Console logging
│   ├── services/
│   │   ├── runtime.service.ts            # Vehicle Runtime WebSocket client
│   │   └── kitManager.service.ts         # Kit Manager REST client
│   ├── types/
│   │   └── index.ts                      # Type definitions
│   ├── utils/
│   │   └── helpers.ts                    # Utility functions
│   └── index.ts                          # Plugin entry point
├── index.js                              # Built plugin bundle (output)
├── index.js.map                          # Source map
├── build.sh                              # Build script
├── server.js                             # Dev server with CORS
├── test.html                             # Standalone test page
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── README.md                             # This file
└── REFERENCE.md                          # Complete reference guide
```

### Real Service Connections

The plugin connects to two services:

#### 1. Kit Manager (`http://localhost:3090`)
- REST API for device discovery
- Endpoints:
  - `GET /listAllKits` - Get all registered kits
  - `POST /convertCode` - Convert Python code

#### 2. Vehicle Runtime (`ws://localhost:3002/runtime`)
- WebSocket for app management
- Operations:
  - Deploy Python apps
  - List deployed apps
  - Start/Stop/Pause/Resume/Uninstall apps
  - Subscribe to console output
  - Get runtime state

See [REFERENCE.md](./REFERENCE.md) for detailed API documentation.

### Configuration

Default service URLs:
```typescript
const DEFAULT_RUNTIME_URL = 'ws://localhost:3002/runtime'
const DEFAULT_KIT_MANAGER_URL = 'http://localhost:3090'
```

Override via plugin config when registering:
```javascript
{
  runtimeUrl: 'ws://custom-host:3002/runtime',
  kitManagerUrl: 'http://custom-host:3090'
}
```

### Development Workflow

```bash
# Terminal 1: Dev server with CORS
node server.js

# Terminal 2: Watch and rebuild
npm run dev

# Terminal 3: Start services (if testing)
# Kit Manager
cd /path/to/kit-manager && npm start

# Vehicle Runtime
cd /path/to/vehicle-runtime && npm start
```

## Troubleshooting

### Plugin fails to load
1. Check plugin URL is accessible: `curl http://localhost:3000/index.js`
2. Check CORS headers: `curl -I http://localhost:3000/index.js | grep -i access-control`
3. Verify plugin registration: `window.DAPlugins` in browser console

### Connection errors
1. Verify services are running:
   ```bash
   curl http://localhost:3090/listAllKits
   ```
2. Check service URLs in plugin configuration
3. Check browser console for WebSocket errors

### Real-time updates not working
1. Check WebSocket connection in browser Network tab (WS tab)
2. Verify event listeners are registered
3. Check console for WebSocket errors

See [REFERENCE.md](./REFERENCE.md) for complete troubleshooting guide.

## Architecture

### Plugin Registration

```typescript
window.DAPlugins['page-plugin'] = {
  components: { Page },
  mount: (el, props) => void,
  unmount: (el) => void
}
```

### Props Interface

```typescript
interface PluginProps {
  data?: {
    model?: any
    prototype?: any
  }
  config?: {
    plugin_id?: string
    runtimeUrl?: string       // Override Vehicle Runtime URL
    kitManagerUrl?: string    // Override Kit Manager URL
  }
  api?: PluginAPI              // Plugin API methods
}
```

## Original Implementation

This plugin is based on the vehicle-edge-runtime dashboard from:
- **Branch**: `feature/270-new-deployment-extension`
- **Location**: `frontend/src/components/molecules/vehicle-edge-runtime/`
- **Files**: 51 files, ~2200 lines

The plugin simplifies the original to a focused deployment and apps management tool while maintaining real service connections.

## License

MIT

## Support

For detailed documentation, see [REFERENCE.md](./REFERENCE.md).

For issues or questions:
1. Check browser console for errors
2. Verify plugin URL is accessible
3. Ensure React is available globally in host
4. Review digital.auto plugin documentation in `/docs/plugin/`
