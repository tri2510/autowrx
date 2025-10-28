# AutoWRX Plugin System Debugging Guide

## Quick Status Check

Run this command to verify the system status:
```bash
./test-plugin-system.sh
```

## Problem: "I don't see plugin tabs"

### Step 1: Verify System is Running
```bash
# Check if both servers are running
curl -s http://localhost:3200 > /dev/null && echo "✅ Backend OK" || echo "❌ Backend DOWN"
curl -s http://localhost:3210 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend DOWN" 
```

### Step 2: Test Plugin File Access
```bash
# Test if plugin manifest files are accessible
curl -s http://localhost:3210/plugins/demo-plugin/manifest.json | jq '.name'
curl -s http://localhost:3210/plugins/vehicle-monitor/manifest.json | jq '.name'
curl -s http://localhost:3210/plugins/my-first-plugin/manifest.json | jq '.name'
```

Expected output:
```
"Demo Tab Plugin"
"Vehicle Monitor Plugin"  
"My First Plugin"
```

### Step 3: Check Browser Console for Plugin Loading

1. Open browser and go to: http://localhost:3210/model/bmw-x3-2024
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for these messages:

**Expected Success Messages:**
```
🔌 Initializing plugin system...
✅ Global API and React exposed for plugins
📦 Built-in plugins: None currently
📦 Loading user plugin: /plugins/demo-plugin
✅ User plugin loaded: /plugins/demo-plugin
📦 Loading user plugin: /plugins/vehicle-monitor
✅ User plugin loaded: /plugins/vehicle-monitor
📦 Loading user plugin: /plugins/my-first-plugin
✅ User plugin loaded: /plugins/my-first-plugin
✅ Plugin system initialized
```

**Common Error Messages:**
```
❌ Failed to load user plugin: [plugin-path]: [error-details]
❌ Plugin initialization failed: [error-details]
```

### Step 4: Manual Console Test

Copy and paste this into the browser console:
```javascript
// Test script - paste into browser console at http://localhost:3210/model/bmw-x3-2024

console.log('🧪 Testing Plugin System...')

// Check if global API is available
if (window.AutoWRXPluginAPI) {
  console.log('✅ AutoWRXPluginAPI is available')
  console.log('📋 Available API methods:', Object.keys(window.AutoWRXPluginAPI))
} else {
  console.log('❌ AutoWRXPluginAPI not found')
}

// Check if React is available
if (window.React) {
  console.log('✅ React is available globally')
} else {
  console.log('❌ React not available globally')
}

// Check plugin loading status
setTimeout(() => {
  console.log('🔍 Checking for plugin tabs...')
  
  // Look for plugin tabs in DOM
  const tabElements = document.querySelectorAll('[aria-label="Plugin Tabs"] button')
  console.log(\`📊 Found \${tabElements.length} tab elements\`)
  
  tabElements.forEach((tab, index) => {
    console.log(\`  Tab \${index + 1}: \${tab.textContent}\`)
  })
}, 2000)
```

### Step 5: Verify Plugin Tab Rendering Location

The plugin tabs should appear:
- **Location**: Below the built-in tabs (Journey, Flow, SDV Code, Dashboard, Homologation)
- **Expected Plugin Tabs**: 
  - ✨ Demo
  - 📊 Vehicle Monitor  
  - 🚀 My First Tab

### Step 6: Check System Logs

Backend logs:
```bash
tail -f logs/backend.log
```

Frontend logs:
```bash
tail -f logs/frontend.log
```

## Common Issues and Fixes

### Issue 1: Plugin Files Not Found (404 errors)
**Symptoms**: Console shows 404 errors for plugin manifest.json files
**Fix**: Verify plugin files exist in correct locations:
```bash
ls -la frontend/public/plugins/*/
```

### Issue 2: React Not Available
**Symptoms**: Plugins fail to render with React errors
**Fix**: React is now exposed globally in plugin-manager.ts

### Issue 3: Plugin API Not Available
**Symptoms**: Plugins can't register tabs
**Fix**: AutoWRXPluginAPI is exposed globally in plugin-manager.ts

### Issue 4: Async Loading Issues
**Symptoms**: Plugin initialization completes but tabs don't appear
**Fix**: Check the 1-second timeout in PageModelDetail.tsx:82-86

### Issue 5: Tab Manager Issues
**Symptoms**: Plugins load but tabs don't register
**Fix**: Check tab-manager.ts for registration logic

## Plugin System Architecture

```
PageModelDetail.tsx
├── pluginManager.initialize()
│   ├── exposeGlobalAPI() → window.AutoWRXPluginAPI & window.React
│   ├── loadBuiltInPlugins() → Currently none
│   └── loadUserPlugins() → Load 3 demo plugins
│       └── loadPlugin() for each
│           ├── pluginLoader.loadPlugin()
│           └── tabManager.registerTab()
└── tabManager.getActiveTabs() → Returns plugin tabs for rendering
```

## File Locations

- **Plugin Files**: `/frontend/public/plugins/[plugin-name]/`
- **Core System**: `/frontend/src/core/`
- **Page Integration**: `/frontend/src/pages/PageModelDetail.tsx`
- **Test Scripts**: Root directory (`test-plugin-system.sh`, etc.)

## Success Indicators

When working correctly, you should see:
1. ✅ System test passes
2. ✅ Plugin manifests accessible via HTTP
3. ✅ Browser console shows successful plugin loading
4. ✅ Plugin tabs visible in the UI below built-in tabs
5. ✅ Clicking plugin tabs shows plugin content

## Next Steps for Plugin Development

Once the system is working:
1. Create new plugin in `/frontend/public/plugins/my-plugin/`
2. Add `manifest.json` with plugin metadata
3. Add `index.js` with plugin implementation
4. Restart frontend or wait for hot reload
5. Plugin should appear automatically in the interface