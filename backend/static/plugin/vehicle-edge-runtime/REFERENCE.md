# Vehicle Edge Runtime Plugin - Reference & Development Guide

## Table of Contents
1. [Original Implementation Reference](#original-implementation-reference)
2. [Services & Endpoints](#services--endpoints)
3. [Plugin Architecture](#plugin-architecture)
4. [Development Setup](#development-setup)
5. [Deployment Procedure](#deployment-procedure)
6. [Troubleshooting](#troubleshooting)

---

## Original Implementation Reference

### Source Branch
- **Branch**: `feature/270-new-deployment-extension`
- **Location**: `frontend/src/components/molecules/vehicle-edge-runtime/`
- **Files**: 51 files, ~2200 lines of code

### Key Reference Files

| File | Purpose |
|------|---------|
| `DaVehicleEdgeRuntimeDashboard.tsx` | Main dashboard component |
| `hooks/useVehicleRuntimeState.ts` | Runtime state management hook |
| `services/vehicleEdgeRuntimeDirect.service.ts` | Vehicle Runtime WebSocket service |
| `services/kitManager.service.ts` | Kit Manager REST API service |

### Type Definitions

```typescript
// Vehicle Edge Runtime Kit
interface VehicleEdgeRuntimeKit {
  socket_id: string
  kit_id: string
  name: string
  last_seen: number
  is_online: boolean
  noRunner: number
  noSubscriber: number
  support_apis: string[]
  desc: string
}

// Vehicle Application
interface VehicleApp {
  app_id: string
  name: string
  version?: string
  status: 'installed' | 'running' | 'stopped' | 'paused' | 'error' | 'starting'
  deploy_time: string
  type: 'python' | 'binary'
  resources?: {
    cpu_limit?: string
    memory_limit?: string
  }
  container_id?: string
  pid?: number
  exit_code?: number
}

// Runtime State
interface RuntimeState {
  runtimeId: string
  status: string
  uptime: number
  version: string
  runningApplications: Array<{
    executionId: string
    appId: string
    status: string
    uptime: number
  }>
}
```

---

## Services & Endpoints

### 1. Kit Manager Service
**Base URL**: `http://localhost:3090`
**Protocol**: HTTP REST API

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/listAllKits` | GET | Get all registered kits | `{ content: VehicleEdgeRuntimeKit[] }` |
| `/listAllClient` | GET | Get all connected clients | `{ content: VehicleEdgeRuntimeClient[] }` |
| `/convertCode` | POST | Convert Python code | `{ content: string }` |

#### Kit Manager Usage Example
```bash
# Get list of kits
curl http://localhost:3090/listAllKits

# Response:
{
  "status": "success",
  "message": "Kits retrieved",
  "content": [
    {
      "kit_id": "kit-001",
      "name": "Vehicle Edge Kit 1",
      "is_online": true,
      "noSubscriber": 1,
      "desc": "Test runtime device"
    }
  ]
}
```

### 2. Vehicle Runtime Service
**Base URL**: `ws://localhost:3002/runtime`
**Protocol**: WebSocket

#### WebSocket Message Format
```typescript
// Request (client -> server)
interface BaseMessage {
  type: string
  id?: string
  [key: string]: any
}

// Response (server -> client)
interface VehicleRuntimeMessage {
  type: string
  id?: string
  status?: string
  [key: string]: any
}
```

#### Vehicle Runtime Operations

| Operation | Request Type | Request Format | Response Type |
|-----------|-------------|----------------|---------------|
| Register Client | `register_client` | `{ clientInfo: ClientInfo }` | - |
| Deploy Python App | `deploy_request` | `{ code, language, prototype, dependencies? }` | `deploy_request-response` |
| List Deployed Apps | `list_deployed_apps` | `{}` | `list_deployed_apps-response` |
| Start App | `run_app` | `{ appId }` | Response |
| Stop App | `stop_app` | `{ appId }` | Response |
| Pause App | `pause_app` | `{ appId }` | Response |
| Resume App | `resume_app` | `{ appId }` | Response |
| Uninstall App | `uninstall_app` | `{ appId }` | Response |
| Get Runtime State | `report_runtime_state` | `{}` | `report_runtime_state-response` |
| Subscribe Console | `console_subscribe` | `{ appId }` | `console_subscribed-response` |

#### Deployment Request Example
```typescript
{
  type: 'deploy_request',
  id: 'deploy-' + Date.now(),
  code: 'print("Hello World")',
  language: 'python',
  vehicleId: 'default-vehicle',
  prototype: {
    id: 'my-app',
    name: 'My App',
    description: 'Python application',
    version: '1.0.0'
  },
  dependencies: []
}
```

#### Deployed Apps Response Example
```typescript
{
  type: 'list_deployed_apps-response',
  applications: [
    {
      app_id: 'my-app',
      name: 'My App',
      status: 'running',
      type: 'python',
      deploy_time: '2025-01-08T12:00:00Z',
      resources: {
        cpu_limit: '50%',
        memory_limit: '512MB'
      }
    }
  ],
  stats: {
    total: 1,
    running: 1,
    paused: 0,
    stopped: 0,
    error: 0
  }
}
```

---

## Plugin Architecture

### File Structure
```
vehicle-edge-runtime/
├── src/
│   ├── components/
│   │   └── Page.tsx                    # Main UI component
│   ├── hooks/
│   │   ├── useVehicleRuntimeState.ts   # Real service connections hook
│   │   ├── useVehicleRuntime.ts        # WebSocket connection (original ref)
│   │   └── useConsoleOutput.ts         # Console logging
│   ├── services/
│   │   ├── runtime.service.ts          # Vehicle Runtime WebSocket client
│   │   └── kitManager.service.ts       # Kit Manager REST client
│   ├── types/
│   │   └── index.ts                    # Type definitions
│   ├── utils/
│   │   └── helpers.ts                  # Utility functions
│   └── index.ts                        # Plugin entry point
├── index.js                            # Built plugin bundle (output)
├── build.sh                            # Build script
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── server.js                           # Dev server with CORS
├── test.html                           # Standalone test page
└── README.md                           # Plugin documentation
```

### Plugin Registration

The plugin registers at `window.DAPlugins['page-plugin']`:

```typescript
// src/index.ts
if (typeof window !== 'undefined') {
  ;(window as any).DAPlugins = (window as any).DAPlugins || {}
  ;(window as any).DAPlugins['page-plugin'] = {
    components: { Page },
    mount: (el, props) => { /* ... */ },
    unmount: (el) => { /* ... */ }
  }
}
```

### Props Interface

```typescript
interface PluginProps {
  data?: {
    model?: any      // Current model data
    prototype?: any  // Current prototype data
  }
  config?: {
    plugin_id?: string           // Plugin identifier
    runtimeUrl?: string          // Override Vehicle Runtime URL
    kitManagerUrl?: string       // Override Kit Manager URL
  }
  api?: PluginAPI                // Plugin API methods
}
```

---

## Development Setup

### Local Development Workflow

```bash
cd /home/htr1hc/01_SDV/85_deploy_extension_real/autowrx/backend/static/plugin/vehicle-edge-runtime

# Terminal 1: Start dev server with CORS
npm run serve
# or
node server.js

# Terminal 2: Watch and rebuild on changes
npm run dev
# or
./build.sh  # Manual rebuild

# Terminal 3: Start services (if testing real connections)
# Kit Manager
cd /path/to/kit-manager && npm start

# Vehicle Runtime
cd /path/to/vehicle-runtime && npm start
```

### Configuration

Edit `src/components/Page.tsx` to change default URLs:

```typescript
const DEFAULT_RUNTIME_URL = 'ws://localhost:3002/runtime'
const DEFAULT_KIT_MANAGER_URL = 'http://localhost:3090'
```

Or pass via plugin config in frontend when registering.

---

## Deployment Procedure

### Option 1: Use Backend Static File Serving (Recommended for Production)

#### Step 1: Build the Plugin
```bash
cd /home/htr1hc/01_SDV/85_deploy_extension_real/autowrx/backend/static/plugin/vehicle-edge-runtime
./build.sh
```

#### Step 2: Register Plugin in Frontend

**Via Plugin Management UI:**
1. Navigate to Plugin Management page
2. Click "Add Plugin"
3. Fill in:
   - **Name**: `Vehicle Edge Runtime`
   - **Slug**: `vehicle-edge-runtime`
   - **URL**: `/plugin/vehicle-edge-runtime/index.js`
   - **Description**: `Deploy and manage vehicle edge applications`
4. Save

**Via Database/API:**
```javascript
// Using browser console or API client
fetch('/v2/system/plugin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Vehicle Edge Runtime',
    slug: 'vehicle-edge-runtime',
    url: '/plugin/vehicle-edge-runtime/index.js',
    description: 'Deploy and manage vehicle edge applications',
    is_internal: false
  })
})
```

#### Step 3: Access the Plugin

**Via Prototype Plugins:**
```
http://localhost:3210/model/:modelId/library/prototype/:prototypeId/plug?plugid=vehicle-edge-runtime
```

**Via Direct URL (if configured):**
```
http://localhost:3210/vehicle-runtime-plugin
```

### Option 2: External Hosting (For Development/Testing)

#### Step 1: Start Dev Server
```bash
cd /home/htr1hc/01_SDV/85_deploy_extension_real/autowrx/backend/static/plugin/vehicle-edge-runtime
node server.js  # Runs on http://localhost:3000 with CORS
```

#### Step 2: Register Plugin with External URL

**Via Plugin Management UI:**
- **URL**: `http://localhost:3000/index.js`

#### Step 3: Refresh Plugin Page
The plugin will load from the external server.

---

## Troubleshooting

### Plugin Fails to Load

**Symptom**: "Failed to load plugin script" error

**Solutions**:
1. **Check plugin URL is accessible**
   ```bash
   curl http://localhost:3000/index.js
   # or
   curl http://localhost:3210/plugin/vehicle-edge-runtime/index.js
   ```

2. **Check CORS headers** (for external hosting)
   ```bash
   curl -I http://localhost:3000/index.js | grep -i access-control
   # Should show: Access-Control-Allow-Origin: *
   ```

3. **Check browser console** for errors:
   - Network tab: Check if index.js loads (status 200)
   - Console tab: Check for JavaScript errors

4. **Verify plugin registration**:
   ```javascript
   // In browser console
   window.DAPlugins
   // Should show: { page-plugin: { components: { Page }, mount, unmount } }
   ```

### Connection Errors

**Symptom**: "Failed to connect to Kit Manager" or "Failed to connect to Vehicle Runtime"

**Solutions**:
1. **Verify services are running**
   ```bash
   # Check Kit Manager
   curl http://localhost:3090/listAllKits

   # Check Vehicle Runtime (WebSocket)
   # Use browser console or WebSocket client
   new WebSocket('ws://localhost:3002/runtime')
   ```

2. **Check service URLs** in plugin configuration

3. **Check network/firewall**:
   ```bash
   # Test connectivity
   telnet localhost 3090
   telnet localhost 3002
   ```

### Real-Time Updates Not Working

**Symptom**: App status doesn't update automatically

**Solutions**:
1. **Check WebSocket connection** in browser Network tab (WS tab)
2. **Verify event listeners** are registered
3. **Check console** for WebSocket errors

### Apps Not Appearing

**Symptom**: No applications shown after deployment

**Solutions**:
1. **Check deployment response** in browser console
2. **Refresh apps** manually (refresh button)
3. **Check Vehicle Runtime logs** for deployment errors

---

## Plugin Development Guidelines

### Based on `/docs/plugin/`

#### Key Principles

1. **Use Global React**
   ```typescript
   // ❌ Don't do this
   import React from 'react'

   // ✅ Do this
   const React: any = (globalThis as any).React
   ```

2. **Register as 'page-plugin'**
   ```typescript
   window.DAPlugins['page-plugin'] = { components, mount, unmount }
   ```

3. **Handle Props Safely**
   ```typescript
   // Use optional chaining
   const modelId = data?.model?.id
   ```

4. **External Dependencies**
   - React/ReactDOM: Externalized (provided by host)
   - Other packages: Bundled into plugin

#### Build Process

```bash
# External packages (NOT bundled)
EXTERNAL_PACKAGES="react,react-dom,react-dom/client,react/jsx-runtime"

# Build command
npx esbuild src/index.ts \
  --bundle \
  --format=iife \
  --platform=browser \
  --jsx=automatic \
  --external:$EXTERNAL_PACKAGES \
  --sourcemap \
  --outfile=index.js
```

---

## Quick Reference Commands

```bash
# Build plugin
./build.sh

# Start dev server
node server.js

# Test standalone
open http://localhost:3000/test.html

# Check services
curl http://localhost:3090/listAllKits
curl http://localhost:3210/plugin/vehicle-edge-runtime/index.js

# Git operations
git status
git add backend/static/plugin/vehicle-edge-runtime/
git commit -m "update: plugin changes"
git push
```

---

## Support & Resources

- **Original Implementation**: `feature/270-new-deployment-extension` branch
- **Plugin Documentation**: `/docs/plugin/`
- **Type Definitions**: `frontend/src/types/plugin.types.ts`
- **Sample Plugin**: `backend/static/plugin/sample-tsx/`

---

*Last Updated: 2025-01-08*
