# 🔌 How to Add New Plugins to AutoWRX

This guide shows you **exactly** how to create and integrate new plugins into the AutoWRX system.

## 🚀 **Quick Start - Add a Plugin in 3 Steps**

### **Step 1: Create Plugin Directory**
```bash
mkdir frontend/public/plugins/my-awesome-plugin
```

### **Step 2: Create manifest.json**
```json
{
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "Does something awesome for vehicles",
  "author": "Your Name",
  "id": "my-awesome-plugin",
  "tabs": [
    {
      "id": "awesome-tab",
      "label": "Awesome",
      "icon": "⚡",
      "path": "/awesome",
      "component": "AwesomeComponent",
      "position": 5
    }
  ],
  "activationEvents": ["onStartup"],
  "permissions": ["read:vehicle-data"],
  "main": "index.js"
}
```

### **Step 3: Create index.js**
```javascript
class MyAwesomePlugin {
  constructor() {
    this.api = window.AutoWRXPluginAPI
  }

  async activate() {
    console.log('My Awesome Plugin activated!')
    
    this.api.registerTab({
      id: 'awesome-tab',
      label: 'Awesome',
      icon: '⚡',
      path: '/awesome',
      component: 'AwesomeComponent',
      position: 5
    })

    this.api.showToast('Awesome Plugin loaded!', 'success')
  }

  async deactivate() {
    this.api.unregisterTab('awesome-tab')
  }

  getComponent(componentName) {
    if (componentName === 'AwesomeComponent') {
      return function AwesomeComponent() {
        const api = window.AutoWRXPluginAPI
        
        return React.createElement('div', {
          className: 'p-8'
        }, [
          React.createElement('h1', {
            key: 'title',
            className: 'text-3xl font-bold mb-4'
          }, '⚡ My Awesome Plugin'),
          
          React.createElement('button', {
            key: 'btn',
            className: 'bg-blue-500 text-white px-4 py-2 rounded',
            onClick: () => api.showToast('Button clicked!', 'success')
          }, 'Click Me!')
        ])
      }
    }
    return null
  }
}

window.MyAwesomePlugin = MyAwesomePlugin
```

### **Step 4: Register Plugin (Add to plugin manager)**
Edit `frontend/src/core/plugin-manager.ts`:
```typescript
const builtInPlugins = [
  '/plugins/demo-plugin',
  '/plugins/vehicle-monitor',
  '/plugins/my-awesome-plugin',  // ← Add this line
]
```

### **Step 5: Test**
1. Save files
2. Refresh browser
3. Go to `/plugin-demo`
4. See your new "⚡ Awesome" tab!

---

## 📋 **Plugin Integration Methods**

### **Method 1: Built-in Plugin (Recommended for development)**
✅ **Best for:** Testing, development, core features
- Put plugin in `/frontend/public/plugins/your-plugin/`
- Add to `plugin-manager.ts` built-in list
- Automatically loads on startup

### **Method 2: Dynamic Plugin Loading**
✅ **Best for:** Production, user-installed plugins
```javascript
// Load plugin dynamically
const pluginManager = require('@/core/plugin-manager').pluginManager
await pluginManager.loadPlugin('/path/to/plugin')
```

### **Method 3: Hot-loadable Plugin**
✅ **Best for:** Development with hot reload
- Same as Method 1
- Plugin automatically reloads when files change
- Perfect for development workflow

---

## 🛠️ **Complete Plugin Structure**

```
your-plugin/
├── manifest.json          # Plugin metadata and configuration
├── index.js              # Main plugin class
├── components/           # Optional: separate component files
│   └── MyComponent.js
├── styles/              # Optional: CSS files
│   └── plugin.css
├── assets/              # Optional: images, icons
│   └── icon.png
└── README.md            # Optional: documentation
```

---

## 📖 **Plugin API Reference**

### **Available APIs in your plugin:**
```javascript
const api = window.AutoWRXPluginAPI

// Tab management
api.registerTab(tabDefinition)
api.unregisterTab(tabId)

// Navigation
api.navigate('/some-path')
api.getCurrentPath()

// Data access
api.getVehicleData()
api.subscribeToVehicleUpdates(callback)

// UI utilities
api.showToast('message', 'success')
api.showDialog({ title: 'Confirm', message: 'Are you sure?' })

// Storage
await api.setStorage('key', data)
const data = await api.getStorage('key')

// State management
api.setGlobalState('key', value)
const value = api.getGlobalState().key
```

---

## 🎯 **Real Examples You Can Copy**

### **Example 1: Data Display Plugin**
```javascript
// Shows vehicle speed in real-time
getComponent(name) {
  if (name === 'SpeedComponent') {
    return function SpeedDisplay() {
      const [speed, setSpeed] = React.useState(0)
      
      React.useEffect(() => {
        const interval = setInterval(() => {
          const data = window.AutoWRXPluginAPI.getVehicleData()
          setSpeed(data.signals['Vehicle.Speed'] || 0)
        }, 1000)
        
        return () => clearInterval(interval)
      }, [])
      
      return React.createElement('div', {
        className: 'text-center p-8'
      }, [
        React.createElement('h1', { key: 'title' }, 'Current Speed'),
        React.createElement('div', { 
          key: 'speed',
          className: 'text-6xl font-bold text-blue-600'
        }, `${speed} km/h`)
      ])
    }
  }
}
```

### **Example 2: Form Plugin**
```javascript
// Creates a settings form
getComponent(name) {
  if (name === 'SettingsComponent') {
    return function SettingsForm() {
      const api = window.AutoWRXPluginAPI
      
      const handleSubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const settings = Object.fromEntries(formData)
        
        await api.setStorage('settings', settings)
        api.showToast('Settings saved!', 'success')
      }
      
      return React.createElement('form', {
        onSubmit: handleSubmit,
        className: 'p-8 max-w-md'
      }, [
        React.createElement('input', {
          key: 'name',
          name: 'vehicleName',
          placeholder: 'Vehicle Name',
          className: 'w-full p-2 border rounded mb-4'
        }),
        React.createElement('button', {
          key: 'submit',
          type: 'submit',
          className: 'bg-green-500 text-white px-4 py-2 rounded'
        }, 'Save Settings')
      ])
    }
  }
}
```

---

## 🔥 **Advanced Features**

### **Multiple Tabs in One Plugin**
```json
{
  "tabs": [
    {
      "id": "overview-tab",
      "label": "Overview",
      "icon": "📊",
      "component": "OverviewComponent"
    },
    {
      "id": "settings-tab", 
      "label": "Settings",
      "icon": "⚙️",
      "component": "SettingsComponent"
    }
  ]
}
```

### **Plugin Permissions**
```json
{
  "permissions": [
    "read:vehicle-data",      // Access vehicle data
    "write:plugin-storage",   // Save plugin data
    "read:vehicle-errors",    // Access error codes
    "write:vehicle-settings"  // Modify vehicle settings
  ]
}
```

### **Plugin Dependencies**
```json
{
  "dependencies": {
    "moment": "^2.29.0",
    "chart.js": "^3.9.0"
  }
}
```

---

## 🧪 **Testing Your Plugin**

### **1. Quick Test**
1. Create plugin files
2. Add to plugin manager
3. Refresh browser
4. Check console for loading messages
5. Look for your tab

### **2. Debug Console**
Press F12 → Console, look for:
```
🔌 Initializing plugin system...
📦 Loading plugin: /plugins/your-plugin
✅ Plugin loaded: /plugins/your-plugin
```

### **3. Test Plugin Features**
- Click your tab
- Test buttons and interactions
- Check data persistence
- Verify API calls

---

## 🎉 **You Now Have a Working Plugin!**

Your plugin should appear as a new tab in the AutoWRX interface. You can:

✅ **See it working** at http://localhost:3210/plugin-demo  
✅ **Click the tab** to view your component  
✅ **Interact with** buttons and features  
✅ **Access vehicle data** through the API  
✅ **Save and load** plugin-specific data  

---

## 🔄 **Next Steps**

1. **Try the Vehicle Monitor example** - It's already integrated!
2. **Read the full documentation** in `/docs/plugin-development-guide.md`
3. **Check the ASPICE plugin** for a complex example
4. **Create your own** custom plugin for your use case

**Happy plugin development!** 🚀