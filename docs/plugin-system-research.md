# AutoWRX Plugin System Research & Implementation Plan

## Extension Strategies Research Summary

### VS Code Extension Architecture
- **Process Isolation**: Extensions run in separate Node.js processes for stability
- **Lazy Loading**: Extensions only load when activation events are triggered
- **Controlled API Surface**: No direct DOM access, well-defined API boundaries
- **Hot Loading**: Live reload during development with debugging support
- **Manifest System**: `package.json` with activation events and capabilities
- **Communication**: Protocol-based communication (stdin/stdout, JSON)

### Chrome Extension Manifest V3
- **Service Workers**: Event-driven background scripts replacing persistent pages
- **Enhanced Security**: No remote code execution, all code must be bundled
- **Declarative APIs**: Network requests handled through declarativeNetRequest
- **Promise-Based**: Modern async/await patterns
- **Messaging System**: Secure inter-script communication
- **Lifecycle Management**: Automatic activation/deactivation based on events

### N8N Custom Nodes
- **TypeScript-First**: Strong typing with INodeType interface
- **CLI Tools**: `@n8n/node-cli` for scaffolding and validation
- **NPM Distribution**: Community nodes published as npm packages
- **Credential Management**: Secure credential storage and encryption
- **Trigger Mechanisms**: Custom trigger nodes for workflow automation
- **Modular Architecture**: Easy integration with external systems

### Microsoft Teams Apps
- **Manifest-Based**: ZIP package with icons and manifest.json
- **Multiple Scopes**: Personal, channel, chat, and meeting contexts
- **Extension Points**: Tabs, bots, message extensions, meeting extensions
- **Cross-Platform**: Single codebase for Teams, Outlook, Office 365
- **Canvas Model**: Large customizable areas for app content
- **Native Integration**: Deep integration with Teams messaging features

## Current AutoWRX Architecture Analysis

### Navigation System
- React Router based routing system (`/frontend/src/configs/routes.tsx`)
- `RootLayout` component with `NavigationBar` and `Outlet`
- Currently no tab-based navigation - only menu-based navigation
- Routes are statically defined in configuration

### Current Tab Structure
Based on the images provided, the system should support tabs like:
- Journey
- Flow  
- SDV Code
- Dashboard
- Homologation
- Plus new plugin-added tabs

### Component Architecture
- Atomic design pattern (atoms, molecules, organisms)
- Suspense-based lazy loading
- TypeScript throughout
- React hooks for state management

## Plugin System Design Specification

### 1. Plugin Manifest Structure
```typescript
interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  id: string
  
  // Tab configuration
  tabs: TabDefinition[]
  
  // Activation triggers
  activationEvents: string[]
  
  // Permissions required
  permissions: string[]
  
  // Entry points
  main: string
  
  // Dependencies
  dependencies?: Record<string, string>
}

interface TabDefinition {
  id: string
  label: string
  icon?: string
  path: string
  component: string
  position?: number
  permissions?: string[]
}
```

### 2. Plugin API Interface
```typescript
interface AutoWRXPluginAPI {
  // Tab management
  registerTab(tab: TabDefinition): void
  unregisterTab(tabId: string): void
  
  // Navigation
  navigate(path: string): void
  getCurrentPath(): string
  
  // State management
  getGlobalState(): any
  setGlobalState(key: string, value: any): void
  
  // Vehicle data access
  getVehicleData(): VehicleData
  subscribeToVehicleUpdates(callback: (data: VehicleData) => void): void
  
  // UI utilities
  showToast(message: string, type?: 'success' | 'error' | 'info'): void
  showDialog(options: DialogOptions): Promise<boolean>
  
  // Storage
  getStorage(key: string): Promise<any>
  setStorage(key: string, value: any): Promise<void>
}
```

### 3. Plugin Loading Mechanism
```typescript
interface PluginLoader {
  loadPlugin(pluginPath: string): Promise<LoadedPlugin>
  unloadPlugin(pluginId: string): Promise<void>
  reloadPlugin(pluginId: string): Promise<void>
  listPlugins(): LoadedPlugin[]
  enableHotReload(pluginId: string): void
}

interface LoadedPlugin {
  manifest: PluginManifest
  instance: PluginInstance
  status: 'loaded' | 'active' | 'error' | 'disabled'
  tabs: RegisteredTab[]
}
```

### 4. Hot Loading Implementation
- File system watchers for plugin directories
- Module cache invalidation for development
- WebSocket connection for live reload notifications
- Graceful plugin state preservation during reloads

### 5. Security Model
- Plugin sandboxing with restricted API access
- Permission-based access control
- Content Security Policy for plugin content
- Input validation and sanitization
- Secure plugin-to-core communication

### 6. Tab Registration System
```typescript
interface TabManager {
  registerTab(pluginId: string, tab: TabDefinition): void
  unregisterTab(pluginId: string, tabId: string): void
  getActiveTabs(): RegisteredTab[]
  setActiveTab(tabId: string): void
  getActiveTab(): RegisteredTab | null
}

interface RegisteredTab {
  id: string
  pluginId: string
  definition: TabDefinition
  component: React.ComponentType
  isActive: boolean
}
```

## Implementation Architecture

### Frontend Changes Required

1. **Plugin Manager Component**
   - Central plugin loading and management
   - Plugin lifecycle handling
   - Error boundary for plugin failures

2. **Tab System Implementation**
   - Dynamic tab rendering
   - Tab navigation state management
   - Plugin tab integration

3. **API Provider**
   - Context provider for plugin API access
   - Secure method exposure
   - Event system for plugin communication

### Backend API Extensions

1. **Plugin Management Endpoints**
   - `GET /api/plugins` - List installed plugins
   - `POST /api/plugins/install` - Install new plugin
   - `DELETE /api/plugins/:id` - Uninstall plugin
   - `PUT /api/plugins/:id/toggle` - Enable/disable plugin

2. **Plugin Data APIs**
   - Vehicle data access endpoints
   - Plugin-specific storage APIs
   - Configuration management

### File Structure
```
/plugins/
  /core/
    - plugin-manager.ts
    - plugin-loader.ts
    - tab-manager.ts
    - hot-reload.ts
  /api/
    - plugin-api.ts
    - security.ts
  /types/
    - plugin.types.ts
    - manifest.types.ts
/user-plugins/
  /aspice-plugin/
    - manifest.json
    - index.tsx
    - package.json
```

## Development Workflow

1. **Plugin Development**
   - CLI tool for scaffolding: `npx autowrx-plugin create aspice-plugin`
   - TypeScript templates with AutoWRX API types
   - Local development server with hot reload
   - Testing utilities and mock API

2. **Plugin Distribution**
   - NPM package format
   - AutoWRX plugin registry
   - Automated security scanning
   - Version compatibility checks

3. **Installation Process**
   - Admin-only plugin installation
   - Automatic dependency resolution
   - Rollback capability for failed installations
   - Plugin verification and signing

This design provides a robust, secure, and developer-friendly plugin system that follows industry best practices while being tailored to AutoWRX's specific needs.