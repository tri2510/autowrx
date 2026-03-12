# AOS Cloud Deployment Plugin

A digital.auto plugin for building and deploying AOS (Autonomous Operating System) applications to edge devices.

## Features

- **C++ Code Editor** - Write and edit C++ source code for AOS applications
- **YAML Config Editor** - Configure application manifests (config.yaml)
- **Docker Instance Management** - View and select AOS Edge Toolchain Docker instances
- **Online/Offline Status** - Filter devices by online status
- **Build & Deploy** - One-click build and deployment to edge devices
- **App Management** - Start, stop, and monitor deployed applications
- **Real-time Logs** - View build and deployment logs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     digital.auto Web UI                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   Docker      │  │   Code        │  │   Status      │      │
│  │   Instances   │  │   Editors     │  │   & Logs      │      │
│  └───────┬───────┘  └───────┬───────┘  └───────────────┘      │
│          │                  │                                  │
└──────────┼──────────────────┼──────────────────────────────────┘
           │                  │
           ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Socket.IO Client                            │
│              (aos.service.ts)                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Kit Manager (kit.digitalauto.tech)                 │
│                    WebSocket Gateway                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   AOS Edge   │  │   AOS Edge   │  │   Vehicle    │
│  Toolchain   │  │  Toolchain   │  │   Edge       │
│  (AET-*)     │  │  (AET-*)     │  │  Runtime     │
└──────────────┘  └──────────────┘  └──────────────┘
```

## External References

### Kit Manager
- **URL**: `https://kit.digitalauto.tech`
- **Purpose**: WebSocket gateway for communicating with edge devices
- **Protocol**: Socket.IO with `messageToKit` / `messageToKit-kitReply` pattern

### AOS Edge Toolchain
- **Repository**: https://github.com/tri2510/aos-edge-toolchain
- **Docker Image**: `tri2510/aos-edge-toolchain:latest`
- **Purpose**: Build and sign AOS applications for ARM64 edge devices
- **Instance Prefix**: `AET-` (AOS Edge Toolchain)
- **Location**: `/home/htr1hc/01_PJNE/16_epam_digitalauto_aos/aos-edge-toolchain`

### Vehicle Edge Runtime (Reference)
- **Location**: `/home/htr1hc/01_PJNE/02_vehicle-edge-runtime`
- **Pattern Used**: Device registration and status broadcasting mechanism
- **Instance Prefix**: `VEA-` (Vehicle Edge Application)

## Kit Manager Protocol

### Registration
```javascript
socket.emit('register_kit', {
  kit_id: 'AET-<unique-id>',
  name: 'AOS Edge Toolchain',
  desc: 'Docker build service for AOS applications',
  support_apis: [
    'aos_build_deploy',
    'aos_list_apps',
    'aos_start_app',
    'aos_stop_app'
  ],
  type: 'aos-edge-toolchain',
  suffix: 'AET',
  online: true
});
```

### Status Broadcasting
```javascript
socket.emit('report-runtime-state', {
  kit_id: 'AET-<unique-id>',
  data: {
    online: true,
    last_seen: '2026-03-12T03:00:59.490Z'
  }
});
```

### Message Handling
```javascript
// Send command
socket.emit('messageToKit', {
  id: 'msg-123',
  cmd: 'aos_build_deploy',
  to_kit_id: 'AET-<instance-id>',
  type: 'aos_build_deploy',
  name: 'my-app',
  cppCode: '// C++ code here',
  yamlConfig: 'config: {}'
});

// Receive response
socket.on('messageToKit-kitReply', (response) => {
  console.log(response.id, response.status);
});
```

## Docker Instance Identification

| Prefix | Meaning | Example |
|--------|---------|---------|
| `AET-` | AOS Edge Toolchain | `AET-TOOLCHAIN-001` |
| `VEA-` | Vehicle Edge Application | `VEA-runtime-abc123` |

## Development

### Build Plugin
```bash
cd backend/static/plugin/aos-cloud-deployment
bash build.sh
```

### Run Dev Server
```bash
cd backend/static/plugin/aos-cloud-deployment
python3 -m http.server 3011
# Access at http://localhost:3011/
```

### Start AOS Broadcaster
```bash
docker run -d --name aos-broadcaster \
  -e INSTANCE_ID=AET-DEV-001 \
  -e KIT_MANAGER_URL=https://kit.digitalauto.tech \
  -e NODE_PATH=/usr/local/lib/node_modules \
  --restart unless-stopped \
  --entrypoint node \
  tri2510/aos-edge-toolchain:latest \
  /usr/local/bin/aos-broadcaster.js
```

### View Broadcaster Logs
```bash
docker logs -f aos-broadcaster
```

## File Structure
```
aos-cloud-deployment/
├── index.js              # Bundled plugin output
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── components/
│   │   └── Page.tsx      # Main UI component
│   ├── services/
│   │   └── aos.service.ts # Socket.IO service
│   ├── types.ts          # TypeScript types
│   └── presets.ts        # Example C++ and YAML presets
├── build.sh              # Build script
└── package.json          # Dependencies
```

## Dependencies
- `socket.io-client` - WebSocket communication with Kit Manager
- `react-icons` - UI icons

## Integration with digital.auto

The plugin is registered as `page-plugin` and loaded by digital.auto's PluginPageRender system:

```javascript
(window as any).DAPlugins = (window as any).DAPlugins || {}
(window as any).DAPlugins['page-plugin'] = {
  components: { Page },
  mount: (el, props) => { /* ... */ },
  unmount: (el) => { /* ... */ }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KIT_MANAGER_URL` | `https://kit.digitalauto.tech` | Kit Manager WebSocket URL |
| `INSTANCE_PREFIX` | `AET` | Docker instance ID prefix |
| `BROADCAST_INTERVAL` | `30000` | Status broadcast interval (ms) |
| `NODE_PATH` | `/usr/local/lib/node_modules` | Node.js module path for socket.io-client |
