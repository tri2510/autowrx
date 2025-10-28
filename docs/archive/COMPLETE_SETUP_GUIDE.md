# 🚀 AutoWRX Complete Setup Guide - Plugin System Integration

This guide provides everything you need to run the complete AutoWRX system with the integrated plugin system.

## 🎯 What You Get

✅ **Full AutoWRX Interface** - Real vehicle model management interface  
✅ **Plugin System** - Complete plugin architecture with hot reload  
✅ **Backend API** - Full backend with MongoDB and vehicle data  
✅ **Multiple Examples** - 3 working plugins (Demo, Vehicle Monitor, ASPICE)  
✅ **Model Integration** - Plugins work with specific vehicle models  
✅ **Production Ready** - Follows industry standards (VS Code, Chrome, N8N, MS Teams)  

## 🚀 Quick Start (30 seconds)

### **Option 1: One-Command Startup**
```bash
# Start everything with one command
./start-autowrx.sh
```

### **Option 2: Manual Setup**
```bash
# Terminal 1: Start Backend
cd backend
node start-dev.js

# Terminal 2: Start Frontend  
cd frontend
npm run dev
```

### **Option 3: Individual Components**
```bash
# Backend only
cd backend && npm install --legacy-peer-deps && node start-dev.js

# Frontend only  
cd frontend && npm install --legacy-peer-deps && npm run dev
```

---

## 🌐 Access Points

| Interface | URL | Description |
|-----------|-----|-------------|
| **Home Page** | http://localhost:3210/ | Main AutoWRX homepage |
| **Vehicle Models** | http://localhost:3210/model | Browse and select vehicle models |
| **Model Detail** | http://localhost:3210/model/bmw-x3-2024 | **MAIN DEMO** - Model with plugin tabs |
| **Plugin Demo** | http://localhost:3210/plugin-demo | Standalone plugin testing |
| **Backend API** | http://localhost:3200 | Backend API server |

---

## 🎮 How to Test the Complete System

### **Step 1: Open Main Interface**
Visit: **http://localhost:3210/model/bmw-x3-2024**

### **Step 2: See Real AutoWRX Interface**
You'll see the exact interface from your image:
- 🗺️ **Journey** tab
- 🔄 **Flow** tab  
- 💻 **SDV Code** tab (with real code editor)
- 📊 **Dashboard** tab
- ✅ **Homologation** tab

### **Step 3: See Plugin Tabs**
Additional tabs added by plugins:
- 🧪 **Test Tab** (basic demo plugin)
- 🚗 **Vehicle Monitor** (advanced dashboard)
- 🎯 **My First Tab** (learning example)

### **Step 4: Test Plugin Features**
Click plugin tabs to see:
- Real-time vehicle data integration
- Interactive UI components
- Persistent data storage
- Toast notifications
- API integration

### **Step 5: Verify Model Context**
- Switch between vehicle models in the dropdown
- See plugins adapt to different model data
- Test model-specific functionality

---

## 🔧 Plugin Development Workflow

### **Create New Plugin (5 minutes)**
```bash
# 1. Create plugin directory
mkdir frontend/public/plugins/my-plugin

# 2. Create manifest.json
cat > frontend/public/plugins/my-plugin/manifest.json << 'EOF'
{
  "name": "My Plugin",
  "id": "my-plugin",
  "tabs": [{
    "id": "my-tab",
    "label": "My Tab",
    "icon": "⚡",
    "component": "MyComponent"
  }],
  "main": "index.js"
}
EOF

# 3. Create index.js
cat > frontend/public/plugins/my-plugin/index.js << 'EOF'
class MyPlugin {
  constructor() { this.api = window.AutoWRXPluginAPI }
  async activate() {
    this.api.registerTab({
      id: 'my-tab', label: 'My Tab', icon: '⚡',
      component: 'MyComponent'
    })
  }
  getComponent(name) {
    if (name === 'MyComponent') {
      return () => React.createElement('div', {className: 'p-8'}, 
        'Hello from my plugin!')
    }
  }
}
window.MyPlugin = MyPlugin
EOF

# 4. Register plugin
# Add '/plugins/my-plugin' to frontend/src/core/plugin-manager.ts

# 5. See it work
# Refresh browser - new tab appears!
```

### **Hot Reload Development**
- Edit plugin files
- Save changes
- Tab automatically reloads
- No browser refresh needed

---

## 📁 Project Structure

```
autowrx/
├── 🚀 start-autowrx.sh              # One-command startup
├── 🛑 stop-autowrx.sh               # Stop all services
├── 📖 COMPLETE_SETUP_GUIDE.md       # This guide
├── 📋 PLUGIN_SYSTEM_IMPLEMENTATION.md # Full implementation details
├── 📚 HOW_TO_ADD_PLUGINS.md         # Plugin development guide
├── 📄 docs/
│   ├── plugin-development-guide.md   # Complete plugin dev docs
│   └── plugin-system-research.md     # Architecture research
├── ⚙️ backend/
│   ├── start-dev.js                 # Backend startup with MongoDB
│   ├── .env                         # Backend configuration
│   └── [standard backend files]
├── 🌐 frontend/
│   ├── src/
│   │   ├── core/                    # Plugin system core
│   │   │   ├── plugin-manager.ts    # Central plugin management
│   │   │   ├── plugin-loader.ts     # Dynamic plugin loading
│   │   │   ├── tab-manager.ts       # Tab registration system
│   │   │   └── plugin-api.ts        # Plugin API interface
│   │   ├── pages/
│   │   │   ├── PageModelList.tsx    # Vehicle model browser
│   │   │   ├── PageModelDetail.tsx  # **MAIN DEMO PAGE**
│   │   │   └── PluginDemo.tsx       # Standalone plugin test
│   │   └── types/plugin.types.ts    # TypeScript definitions
│   └── public/plugins/              # Plugin directory
│       ├── demo-plugin/             # Basic demo
│       ├── vehicle-monitor/         # Advanced dashboard
│       ├── my-first-plugin/         # Learning example
│       └── aspice-plugin/           # ASPICE assessment
└── 🔌 plugins/                      # Additional plugin examples
    └── aspice-plugin/               # Complex plugin example
```

---

## 🎯 Key Features Demonstrated

### **Real AutoWRX Integration**
- ✅ Authentic vehicle model interface
- ✅ Standard tabs (Journey, Flow, SDV Code, Dashboard, Homologation)
- ✅ Vehicle-specific data context
- ✅ Professional UI matching your requirements

### **Plugin System**
- ✅ Dynamic tab creation
- ✅ Hot reload development
- ✅ Model-aware plugins
- ✅ Persistent storage
- ✅ API access (vehicle data, navigation, UI)
- ✅ Security sandbox
- ✅ TypeScript support

### **Development Experience**
- ✅ Industry-standard architecture
- ✅ Easy plugin creation workflow
- ✅ Comprehensive documentation
- ✅ Example plugins for learning
- ✅ Debug tools and logging

---

## 🔍 Testing Checklist

### **System Startup**
- [ ] Backend starts on port 3200
- [ ] Frontend starts on port 3210
- [ ] No errors in console logs
- [ ] MongoDB connects successfully

### **Main Interface**
- [ ] Vehicle models load at `/model`
- [ ] Model detail page shows at `/model/bmw-x3-2024`
- [ ] All 5 built-in tabs are visible
- [ ] Plugin tabs appear after built-in tabs
- [ ] Tab switching works smoothly

### **Plugin Functionality**
- [ ] Test tab shows success message
- [ ] Vehicle Monitor displays dashboard
- [ ] My First Tab shows interactive features
- [ ] Plugin buttons trigger actions
- [ ] Data persistence works
- [ ] Vehicle data access works

### **Model Integration**
- [ ] Vehicle model data appears in plugins
- [ ] Model switching updates plugin context
- [ ] API data reflects current model
- [ ] Signals show model-specific data

---

## 🛠️ Troubleshooting

### **Backend Won't Start**
```bash
# Check if port 3200 is busy
lsof -i :3200

# Check backend logs
tail -f logs/backend.log

# Restart backend only
cd backend && node start-dev.js
```

### **Frontend Won't Start**
```bash
# Check if port 3210 is busy
lsof -i :3210

# Check frontend logs  
tail -f logs/frontend.log

# Restart frontend only
cd frontend && npm run dev
```

### **Plugins Not Loading**
```bash
# Check browser console (F12)
# Look for plugin loading messages
# Verify plugin files exist in public/plugins/

# Check plugin manager registration
# Edit frontend/src/core/plugin-manager.ts
```

### **Port Conflicts**
```bash
# Kill all AutoWRX processes
./stop-autowrx.sh

# Kill any remaining processes
sudo lsof -ti:3200,3210 | xargs sudo kill -9

# Restart
./start-autowrx.sh
```

---

## 🚦 System Status

### **Backend Health Check**
```bash
curl http://localhost:3200/health || echo "Backend not running"
```

### **Frontend Health Check**
```bash
curl http://localhost:3210 || echo "Frontend not running"
```

### **Plugin System Check**
Open browser console at http://localhost:3210/model/bmw-x3-2024 and look for:
```
🔌 Initializing plugin system...
📦 Loading plugin: /plugins/demo-plugin
✅ Plugin loaded: /plugins/demo-plugin
```

---

## 🎉 Success Criteria

You have successfully implemented the AutoWRX plugin system when:

✅ **Real Interface**: http://localhost:3210/model/bmw-x3-2024 shows the actual AutoWRX interface  
✅ **Plugin Tabs**: Built-in tabs + plugin tabs are all visible  
✅ **Model Context**: Plugins receive vehicle model data  
✅ **Interactive**: Plugin buttons and features work  
✅ **Persistent**: Plugin data survives page reload  
✅ **Hot Reload**: Plugin changes update without browser refresh  

---

## 📞 Support

- 📖 **Full Documentation**: `docs/plugin-development-guide.md`
- 🏗️ **Implementation Details**: `PLUGIN_SYSTEM_IMPLEMENTATION.md`
- 🔧 **Plugin Creation**: `HOW_TO_ADD_PLUGINS.md`
- 🔍 **Browser Console**: Check for plugin loading messages
- 📂 **Log Files**: `logs/backend.log` and `logs/frontend.log`

---

## 🚀 Next Steps

1. **Test the system** using the URLs above
2. **Create your own plugin** using the provided examples
3. **Integrate with real vehicle data** from your backend
4. **Deploy to production** with proper security measures
5. **Share with your team** for collaborative development

**The complete AutoWRX plugin system is ready for production use!** 🎉