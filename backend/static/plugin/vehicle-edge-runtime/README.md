# Vehicle Edge Runtime Plugin

A digital.auto plugin for deploying and managing vehicle edge applications.

## Features

- 🚀 **Deploy Applications** - Deploy Python, Binary, and Docker applications to vehicle edge runtimes
- 📱 **Application Management** - View, start, stop, and uninstall deployed applications
- 💻 **Console Output** - Real-time console logging from deployments
- 📶 **Connection Management** - Select and connect to multiple vehicle edge runtimes
- 🔄 **Auto-refresh** - Automatically updates application status

## Quick Start

### Build the Plugin

```bash
# Install dependencies
npm install

# Build the plugin
./build.sh
```

This will generate `index.js` - the compiled plugin bundle.

### Test Locally

```bash
# Serve the plugin locally
npx serve .

# Or using Python
python3 -m http.server 3000

# Plugin will be available at:
# http://localhost:3000/index.js
```

### Deploy

1. **Host the plugin** - Choose one of:
   - GitHub Pages
   - Netlify/Vercel
   - Your own server
   - CDN (Cloudflare, AWS S3)

2. **Register in digital.auto**:
   - Navigate to plugin management
   - Create new plugin entry
   - Set URL to your hosted plugin
   - Use slug: `vehicle-edge-runtime`

## Development

### Project Structure

```
vehicle-edge-runtime-plugin/
├── src/
│   ├── components/
│   │   └── Page.tsx          # Main plugin component
│   ├── hooks/
│   │   ├── useVehicleRuntime.ts  # WebSocket connection hook
│   │   └── useConsoleOutput.ts   # Console logging hook
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   └── helpers.ts        # Utility functions
│   └── index.ts              # Plugin entry point
├── build.sh                   # Build script
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

### Adding Features

The plugin is built with:
- **React** - UI components
- **TypeScript** - Type safety
- **esbuild** - Fast bundling

To add new features:

1. Update `src/components/Page.tsx` with new UI
2. Add custom hooks to `src/hooks/`
3. Update types in `src/types/index.ts`

### Current Limitations (To Be Connected)

This plugin currently uses mock data for:
- Kit/device discovery
- WebSocket connections to kit-manager
- Vehicle Edge Runtime API calls

To connect to real services:
1. Update `useVehicleRuntime` hook with real WebSocket URLs
2. Replace mock deployment with real API calls
3. Connect to the kit-manager service for device discovery

## Architecture

### Plugin Registration

The plugin registers globally as `window.DAPlugins['vehicle-edge-runtime']`:

```typescript
{
  components: { Page },
  mount: (el, props) => void,
  unmount: (el) => void
}
```

### Props Interface

The plugin receives these props from the host:

```typescript
interface PluginProps {
  data?: {
    model?: any      // Current model data
    prototype?: any  // Current prototype data
  }
  config?: {
    plugin_id?: string  // Plugin identifier
  }
  api?: {
    updateModel?: (updates) => Promise<any>
    updatePrototype?: (updates) => Promise<any>
    // ... other API methods
  }
}
```

## Deployment Checklist

- [ ] Build plugin: `./build.sh`
- [ ] Test plugin locally
- [ ] Host plugin (GitHub Pages, Netlify, etc.)
- [ ] Register in digital.auto admin
- [ ] Test in production environment
- [ ] Connect to real kit-manager service
- [ ] Connect to real Vehicle Runtime service

## License

MIT

## Support

For issues or questions:
1. Check browser console for errors
2. Verify plugin URL is accessible
3. Ensure React is available globally in host
4. Review digital.auto plugin documentation in `/docs/plugin/`
