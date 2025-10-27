# AutoWRX Plugin Development Guide

## Overview

This guide provides comprehensive instructions for developing plugins for the AutoWRX platform. AutoWRX plugins allow developers to extend the platform with custom tabs and functionality, similar to how VS Code extensions or Chrome extensions work.

## Getting Started

### Prerequisites

- Node.js 18+
- TypeScript knowledge
- React experience
- Understanding of AutoWRX platform basics

### Development Environment Setup

1. **Clone the AutoWRX repository**
```bash
git clone https://github.com/eclipse-autowrx/autowrx.git
cd autowrx
```

2. **Install dependencies**
```bash
cd frontend
npm install
```

3. **Start development server**
```bash
npm run dev
```

## Plugin Architecture

### Plugin Structure

A basic AutoWRX plugin consists of:

```
my-plugin/
├── manifest.json          # Plugin metadata and configuration
├── index.tsx              # Main plugin entry point
├── components/            # React components
│   └── MyTabComponent.tsx
├── styles/               # CSS/SCSS files
│   └── plugin.css
└── package.json          # NPM package configuration
```

### Manifest File (manifest.json)

```json
{
  "name": "ASPICE Assessment Plugin",
  "version": "1.0.0",
  "description": "Automotive SPICE assessment and compliance plugin",
  "author": "Your Name",
  "id": "aspice-plugin",
  "tabs": [
    {
      "id": "aspice-assessment",
      "label": "ASPICE",
      "icon": "🔍",
      "path": "/aspice",
      "component": "AspiceTabComponent",
      "position": 6,
      "permissions": ["read:vehicle-data"]
    }
  ],
  "activationEvents": ["onStartup"],
  "permissions": [
    "read:vehicle-data",
    "write:plugin-storage"
  ],
  "main": "index.tsx",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Main Plugin File (index.tsx)

```typescript
import React from 'react'
import { AutoWRXPluginAPI } from '@/types/plugin.types'
import AspiceTabComponent from './components/AspiceTabComponent'

declare global {
  interface Window {
    AutoWRXPluginAPI: AutoWRXPluginAPI
  }
}

class AspicePlugin {
  private api: AutoWRXPluginAPI

  constructor() {
    this.api = window.AutoWRXPluginAPI
  }

  async activate(): Promise<void> {
    console.log('ASPICE Plugin activated')
    
    // Register the tab
    this.api.registerTab({
      id: 'aspice-assessment',
      label: 'ASPICE',
      icon: '🔍',
      path: '/aspice',
      component: 'AspiceTabComponent',
      position: 6
    })

    // Subscribe to vehicle data updates
    this.api.subscribeToVehicleUpdates((data) => {
      console.log('Vehicle data updated:', data)
    })
  }

  async deactivate(): Promise<void> {
    console.log('ASPICE Plugin deactivated')
    this.api.unregisterTab('aspice-assessment')
  }

  getComponent(componentName: string): React.ComponentType | null {
    switch (componentName) {
      case 'AspiceTabComponent':
        return AspiceTabComponent
      default:
        return null
    }
  }
}

export default AspicePlugin
```

### Tab Component (components/AspiceTabComponent.tsx)

```typescript
import React, { useState, useEffect } from 'react'
import { AutoWRXPluginAPI, VehicleData } from '@/types/plugin.types'

declare global {
  interface Window {
    AutoWRXPluginAPI: AutoWRXPluginAPI
  }
}

const AspiceTabComponent: React.FC = () => {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const api = window.AutoWRXPluginAPI

  useEffect(() => {
    // Load vehicle data
    const data = api.getVehicleData()
    setVehicleData(data)

    // Load saved assessment data
    loadAssessmentData()
  }, [])

  const loadAssessmentData = async () => {
    try {
      const saved = await api.getStorage('assessment-data')
      setAssessmentData(saved || {})
    } catch (error) {
      console.error('Failed to load assessment data:', error)
    }
  }

  const saveAssessmentData = async (data: any) => {
    try {
      await api.setStorage('assessment-data', data)
      setAssessmentData(data)
      api.showToast('Assessment data saved successfully', 'success')
    } catch (error) {
      api.showToast('Failed to save assessment data', 'error')
    }
  }

  const handleFormSubmit = (formData: any) => {
    const updatedData = { ...assessmentData, ...formData }
    saveAssessmentData(updatedData)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ASPICE Assessment</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Vehicle Information</h2>
          {vehicleData && (
            <div>
              <p><strong>Model:</strong> {vehicleData.model?.name || 'N/A'}</p>
              <p><strong>APIs:</strong> {vehicleData.apis.length} available</p>
              <p><strong>Signals:</strong> {Object.keys(vehicleData.signals).length} signals</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Assessment Form</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            const data = Object.fromEntries(formData)
            handleFormSubmit(data)
          }}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Process Area
              </label>
              <select 
                name="processArea" 
                className="w-full border rounded px-3 py-2"
                defaultValue={assessmentData?.processArea || ''}
              >
                <option value="">Select Process Area</option>
                <option value="SYS.1">System Requirements Analysis</option>
                <option value="SYS.2">System Architectural Design</option>
                <option value="SWE.1">Software Requirements Analysis</option>
                <option value="SWE.2">Software Architectural Design</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Capability Level
              </label>
              <select 
                name="capabilityLevel" 
                className="w-full border rounded px-3 py-2"
                defaultValue={assessmentData?.capabilityLevel || ''}
              >
                <option value="">Select Level</option>
                <option value="0">Incomplete</option>
                <option value="1">Performed</option>
                <option value="2">Managed</option>
                <option value="3">Established</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <textarea 
                name="notes"
                className="w-full border rounded px-3 py-2"
                rows={4}
                defaultValue={assessmentData?.notes || ''}
                placeholder="Assessment notes and findings..."
              />
            </div>

            <button 
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save Assessment
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AspiceTabComponent
```

## Plugin API Reference

### Core API Methods

#### Tab Management
- `registerTab(tab: TabDefinition)` - Register a new tab
- `unregisterTab(tabId: string)` - Remove a tab

#### Navigation
- `navigate(path: string)` - Navigate to a route
- `getCurrentPath()` - Get current route path

#### State Management
- `getGlobalState()` - Access global application state
- `setGlobalState(key: string, value: any)` - Update global state

#### Vehicle Data
- `getVehicleData()` - Get current vehicle data
- `subscribeToVehicleUpdates(callback)` - Subscribe to data changes

#### UI Utilities
- `showToast(message: string, type?: 'success' | 'error' | 'info')` - Show notifications
- `showDialog(options: DialogOptions)` - Show confirmation dialogs

#### Storage
- `getStorage(key: string)` - Get plugin-specific stored data
- `setStorage(key: string, value: any)` - Store plugin data

### Type Definitions

```typescript
interface TabDefinition {
  id: string
  label: string
  icon?: string
  path: string
  component: string
  position?: number
  permissions?: string[]
}

interface VehicleData {
  signals: Record<string, any>
  apis: any[]
  model: any
}
```

## Development Workflow

### 1. Create Plugin Structure

```bash
mkdir my-plugin
cd my-plugin
npm init -y
```

### 2. Set up Development Environment

```bash
# Install AutoWRX types (when available)
npm install @autowrx/plugin-types

# Install React dependencies
npm install react react-dom
npm install -D @types/react @types/react-dom typescript
```

### 3. Develop and Test Locally

1. Place your plugin in `/plugins/my-plugin/`
2. Start AutoWRX in development mode
3. Plugin will be hot-reloaded on file changes

### 4. Build for Production

```bash
npm run build
```

### 5. Package Plugin

```bash
# Create plugin package
npm pack
```

## Best Practices

### Security
- Never hardcode sensitive data
- Use plugin storage API for persisting data
- Validate all user inputs
- Follow principle of least privilege for permissions

### Performance
- Lazy load heavy components
- Use React.memo for expensive renders
- Debounce API calls and user interactions
- Clean up subscriptions in deactivate()

### UX Guidelines
- Follow AutoWRX design system
- Provide loading states
- Show error messages clearly
- Make tabs responsive

### Code Quality
- Use TypeScript for type safety
- Write unit tests for components
- Follow React best practices
- Document your plugin API

## Plugin Distribution

### Publishing to NPM

```bash
npm publish
```

### Manual Installation

1. Upload plugin ZIP to AutoWRX admin panel
2. Plugin will be automatically validated and installed
3. Users can enable/disable via plugin management

## Debugging

### Development Tools
- React DevTools for component inspection
- Browser console for plugin logs
- Network tab for API monitoring

### Common Issues
- **Plugin not loading**: Check manifest.json syntax
- **Component not rendering**: Verify component export
- **API calls failing**: Check permissions in manifest
- **Hot reload not working**: Ensure development mode is enabled

## Example Plugins

### 1. Simple Info Tab
```typescript
// Basic tab that displays static information
```

### 2. Data Visualization Plugin
```typescript
// Plugin that creates charts from vehicle data
```

### 3. Integration Plugin
```typescript
// Plugin that connects to external APIs
```

## Support and Resources

- AutoWRX Plugin API Documentation
- Community Forum
- Example Plugin Repository
- Issue Tracker

## Advanced Topics

### Custom Hooks
```typescript
// Create reusable plugin hooks
const useVehicleData = () => {
  const [data, setData] = useState(null)
  const api = window.AutoWRXPluginAPI
  
  useEffect(() => {
    const data = api.getVehicleData()
    setData(data)
    
    return api.subscribeToVehicleUpdates(setData)
  }, [])
  
  return data
}
```

### Plugin Communication
```typescript
// Inter-plugin communication via global state
api.setGlobalState('sharedData', { key: 'value' })
const sharedData = api.getGlobalState().sharedData
```

### Testing Plugins
```typescript
// Unit testing with mocked API
jest.mock('@autowrx/plugin-api')
```

This guide provides everything needed to develop robust, secure, and user-friendly plugins for the AutoWRX platform.