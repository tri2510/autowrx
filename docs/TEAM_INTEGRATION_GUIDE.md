# AutoWRX SDV Integration Guide
## Comprehensive Guide for v3-Base Development Team

## Introduction to SDV Integration

This document provides the complete integration roadmap for adding SDV (Software Defined Vehicle) deployment capabilities to AutoWRX v3-base. As the development team currently working on v3-base, this guide will help you understand exactly how SDV deployment fits into the existing architecture and what needs to be implemented.

## Quick Overview for v3-Base Team

**What is SDV Integration?**
- Extension that allows deploying Python vehicle apps from AutoWRX web IDE directly to real automotive devices
- Seamless integration with existing v3-base features (GenAI, plugins, code editor)
- Built on top of current v3-base architecture without breaking changes

**Why Now?**
- v3-base has stable foundation (plugin system, UI components, API structure)
- Perfect timing to add deployment capabilities before v3.0 release
- Leverages existing v3-base features (GenAI code generation, plugin extensibility)

## v3-Base Current Architecture Review

Based on our analysis of v3-base, here's what we're building on:

### Existing Core Components (v3-base)
```
frontend/src/
├── components/
│   ├── molecules/
│   │   ├── genAI/              # AI code generation ✅
│   │   ├── dashboard/          # Widget management ✅
│   │   ├── forms/              # Configuration forms ✅
│   │   ├── project_editor/     # Multi-file support ✅
│   │   └── CodeEditor.tsx      # Code editing ✅
│   └── organisms/
│       ├── PrototypeTabCode.tsx    # Main code tab ✅
│       ├── ModelApiList.tsx        # API management ✅
│       └── CustomTabEditor.tsx     # Custom tabs ✅
├── services/
│   ├── plugin.service.ts            # Plugin system ✅
│   ├── prototype.service.ts         # Prototype management ✅
│   └── genAI.service.ts             # AI integration ✅
└── stores/
    ├── modelStore.ts                # State management ✅
    └── authStore.ts                 # Authentication ✅
```

### Backend Components (v3-base)
```
backend/src/
├── controllers/
│   ├── model.controller.js       # Model management ✅
│   ├── prototype.controller.js    # Prototype CRUD ✅
│   └── plugin.controller.js       # Plugin system ✅
├── services/
│   ├── auth.service.js            # Authentication ✅
│   └── plugin.service.js          # Plugin processing ✅
└── models/
    ├── model.model.js             # Data models ✅
    └── plugin.model.js            # Plugin data ✅
```

## SDV Integration: What's Added and Where

### 1. Frontend Integration Points

#### 🎯 **Primary Integration: PrototypeTabCode.tsx**
**Location**: `frontend/src/components/organisms/PrototypeTabCode.tsx`

**Current Code Structure**:
```typescript
const PrototypeTabCode: FC = () => {
  // Existing state
  const [code, setCode] = useState<string>()
  const [prototype, setPrototype] = useState<Prototype>()
  const [isOpenGenAI, setIsOpenGenAI] = useState(false)
  const [isOpenVelocitasDialog, setIsOpenVelocitasDialog] = useState(false)

  return (
    <div className="prototype-code-workspace">
      {/* Existing sections */}
      <CodeEditor code={code} onChange={setCode} />
      <GenAI_Interface />
      <Velocitas_Project_Creator />

      {/* NEW: SDV Deployment Section */}
      <SDV_Deployment_Section />
    </div>
  )
}
```

**What We Add**:
```typescript
// NEW: SDV deployment state
const [isOpenSDVHub, setIsOpenSDVHub] = useState(false)

// NEW: SDV deployment button in existing action area
<div className="action-buttons">
  <DaButton onClick={handleVelocitasCreate}>
    Create Velocitas Project
  </DaButton>

  {/* NEW: SDV Deployment Button */}
  <DaButton
    onClick={() => setIsOpenSDVHub(true)}
    disabled={!code?.trim()}
    className="bg-da-primary-500 hover:bg-da-primary-600"
  >
    🚀 Deploy to SDV Devices
  </DaButton>
</div>

{/* NEW: SDV Deployment Hub Modal */}
<SDVDeploymentHub
  isOpen={isOpenSDVHub}
  onClose={() => setIsOpenSDVHub(false)}
  pythonCode={code}
  prototypeName={prototype?.name}
/>
```

#### 📦 **New Component: SDVDeploymentHub.tsx**
**Location**: `frontend/src/components/organisms/SDVDeploymentHub.tsx`

**Integration with Existing v3-base Components**:
```typescript
import DaButton from '@/components/atoms/DaButton'           // ✅ Existing
import DaPopup from '@/components/atoms/DaPopup'             // ✅ Existing
import DaText from '@/components/atoms/DaText'               // ✅ Existing
import { toast } from 'react-toastify'                       // ✅ Existing

// NEW: SDV-specific components
import DaAppPackager from './deployment/DaAppPackager'
import DaDeviceScanner from './deployment/DaDeviceScanner'
import DaDeploymentManager from './deployment/DaDeploymentManager'
```

**Uses Existing v3-base Patterns**:
- ✅ Same modal pattern as existing popups
- ✅ Same button styling and animations
- ✅ Same toast notification system
- ✅ Same component prop interfaces
- ✅ Same state management patterns

#### 🔧 **Integration with Existing Forms System**
**Leverages**: `frontend/src/components/molecules/forms/`

**Example Integration**:
```typescript
// SDV config forms extend existing form patterns
import { FormCreateModel } from '@/components/molecules/forms/FormCreateModel'
import { ConfigForm } from '@/components/molecules/ConfigForm'

// SDV-specific forms follow same patterns
const DaAppPackager = () => {
  // Reuse existing form validation patterns
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use existing form field components
  return (
    <div className="form-container">
      <DaInput />           // ✅ Existing component
      <DaSelect />          // ✅ Existing component
      <DaTextarea />        // ✅ Existing component
      <DaButton />          // ✅ Existing component
    </div>
  )
}
```

### 2. Service Layer Integration

#### 🔄 **Extension of Existing Services**
**Location**: `frontend/src/services/`

**Current v3-base Services**:
```typescript
// ✅ Existing services we extend
import prototypeService from './prototype.service.ts'
import pluginService from './plugin.service.ts'
import genAIService from './genAI.service.ts'
import authStore from '@/stores/authStore.ts'
```

**New SDV Services (Integration Pattern)**:
```typescript
// ✅ Follows existing service patterns
class SDV_DeploymentService {
  private api = serverAxios  // ✅ Uses existing API client
  private auth = useAuthStore() // ✅ Uses existing auth

  // Follows existing service method patterns
  async createPackage(packageData: PackageData): Promise<Package> {
    // ✅ Same error handling pattern as prototypeService
    try {
      const response = await this.api.post('/sdv/packages', packageData)
      return response.data
    } catch (error) {
      console.error('Failed to create package:', error)
      throw error
    }
  }

  async discoverDevices(): Promise<Device[]> {
    // ✅ Same pattern as existing API calls
    const response = await this.api.get('/sdv/devices/discover')
    return response.data.devices
  }
}

export default new SDV_DeploymentService()
```

**Integration with Existing Store Pattern**:
```typescript
// ✅ Extends existing store patterns (like modelStore)
import { create } from 'zustand'

interface SDV_Store {
  devices: Device[]
  selectedDevices: string[]
  deploymentStatus: DeploymentStatus[]

  // ✅ Follows existing store action patterns
  setDevices: (devices: Device[]) => void
  addDevice: (device: Device) => void
  removeDevice: (deviceId: string) => void
}

export const useSDVStore = create<SDV_Store>((set, get) => ({
  devices: [],
  selectedDevices: [],
  deploymentStatus: [],

  setDevices: (devices) => set({ devices }),
  addDevice: (device) => set(state => ({
    devices: [...state.devices, device]
  })),
  removeDevice: (deviceId) => set(state => ({
    devices: state.devices.filter(d => d.id !== deviceId)
  }))
}))
```

### 3. Backend Integration Points

#### 🛣️ **API Route Integration**
**Location**: `backend/src/routes/`

**Existing v3-base Routes**:
```javascript
// ✅ Current route structure we extend
const modelRoutes = require('./v2/model.route.js')
const prototypeRoutes = require('./v2/prototype.route.js')
const pluginRoutes = require('./v2/plugin.route.js')
const systemRoutes = require('./v2/system.route.js')
```

**SDV Routes Integration**:
```javascript
// ✅ NEW: Add to existing route structure
const sdvRoutes = require('./v2/sdv.route.js')

// ✅ Extend existing app.js route mounting
app.use('/api/models', modelRoutes)           // ✅ Existing
app.use('/api/prototypes', prototypeRoutes)   // ✅ Existing
app.use('/api/plugins', pluginRoutes)         // ✅ Existing
app.use('/api/sdv', sdvRoutes)               // 🆕 NEW

// ✅ Uses existing middleware and patterns
app.use('/api/sdv', [
  validateToken,           // ✅ Existing auth middleware
  rateLimitMiddleware,     // ✅ Existing rate limiting
  corsMiddleware,          // ✅ Existing CORS handling
], sdvRoutes)
```

**SDV Route Structure (Follows v3-base Patterns)**:
```javascript
// backend/src/routes/v2/sdv.route.js
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../middleware/auth.middleware.js')
const { validateSDVPackage } = require('../../validations/sdv.validation.js')
const sdvController = require('../../controllers/sdv.controller.js')

// ✅ Follows existing route patterns
router.post('/packages',
  authenticate,                    // ✅ Existing auth middleware
  validateSDVPackage,             // ✅ Existing validation pattern
  sdvController.createPackage     // ✅ Existing controller pattern
)

router.get('/devices/discover',
  authenticate,                    // ✅ Existing auth middleware
  sdvController.discoverDevices
)

router.post('/deployments',
  authenticate,
  sdvController.deployPackage
)

module.exports = router
```

#### 💾 **Database Model Integration**
**Location**: `backend/src/models/`

**Existing v3-base Models**:
```javascript
// ✅ Current models we extend
const modelSchema = require('./model.model.js')
const prototypeSchema = require('./prototype.model.js')
const pluginSchema = require('./plugin.model.js')
```

**SDV Model Integration**:
```javascript
// backend/src/models/sdv.model.js
const mongoose = require('mongoose')
const { toJSON, paginate } = require('./plugins')  // ✅ Uses existing plugins

// ✅ Follows existing model patterns
const sdvPackageSchema = new mongoose.Schema(
  {
    // ✅ Uses existing field patterns
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    version: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 1000
    },

    // ✅ Uses existing reference patterns
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // ✅ Follows existing array patterns
    deployments: [{
      device_id: String,
      status: {
        type: String,
        enum: ['pending', 'deploying', 'running', 'stopped', 'error'],
        default: 'pending'
      },
      deployed_at: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true  // ✅ Uses existing timestamp pattern
  }
)

// ✅ Apply existing plugins
sdvPackageSchema.plugin(toJSON)
sdvPackageSchema.plugin(paginate)

module.exports = mongoose.model('SDV_Package', sdvPackageSchema)
```

#### 🎮 **Controller Integration**
**Location**: `backend/src/controllers/`

**Follows Existing Controller Patterns**:
```javascript
// backend/src/controllers/sdv.controller.js
const httpStatus = require('http-status')
const catchAsync = require('../../utils/catchAsync')
const { sdvPackageService } = require('../../services')
const { successResponse } = require('../../utils/response')

// ✅ Follows existing controller patterns
const createPackage = catchAsync(async (req, res) => {
  // ✅ Uses existing user pattern
  const userId = req.user.id

  // ✅ Uses existing validation pattern
  const packageData = {
    ...req.body,
    created_by: userId
  }

  // ✅ Uses existing service pattern
  const packageResult = await sdvPackageService.createPackage(packageData)

  // ✅ Uses existing response pattern
  res.status(httpStatus.CREATED).json(
    successResponse({
      message: 'Package created successfully',
      data: packageResult
    })
  )
})

const discoverDevices = catchAsync(async (req, res) => {
  // ✅ Follows existing service call pattern
  const devices = await sdvDeviceService.discoverDevices()

  // ✅ Uses existing response pattern
  res.json(
    successResponse({
      data: devices
    })
  )
})

module.exports = {
  createPackage,
  discoverDevices
}
```

### 4. Plugin System Integration

#### 🔌 **Extending Existing Plugin Architecture**
**Leverages**: Current v3-base plugin system (completed in v3-base)

**Current Plugin Interface**:
```typescript
// ✅ Existing plugin interface we extend
interface Plugin {
  id: string
  name: string
  type: 'genai' | 'dashboard' | 'widget'
  version: string
  config: any
}
```

**SDV Plugin Extension**:
```typescript
// ✅ Extends existing plugin interface
interface SDV_Plugin extends Plugin {
  // ✅ Inherits all existing plugin properties

  // 🆕 NEW: SDV-specific capabilities
  sdv_capabilities?: {
    deployment_presets: Deployment_Preset[]
    device_templates: Device_Template[]
    runtime_configurations: Runtime_Config[]
  }
}

// ✅ Uses existing plugin registration
const registerSDVPlugin = (plugin: SDV_Plugin) => {
  // Reuse existing plugin registry
  pluginRegistry.register(plugin)

  // Add SDV-specific capabilities
  if (plugin.sdv_capabilities) {
    sdvCapabilityRegistry.register(plugin.sdv_capabilities)
  }
}
```

### 5. Configuration Management Integration

#### ⚙️ **Extending Existing Config System**
**Leverages**: Current v3-base configuration system

**Current Config Structure**:
```typescript
// ✅ Existing config patterns we extend
interface AutoWRX_Config {
  genAI: GenAI_Config           // ✅ Existing
  plugins: Plugin_Config        // ✅ Existing
  themes: Theme_Config          // ✅ Existing
}
```

**SDV Config Extension**:
```typescript
// ✅ Extends existing config
interface AutoWRX_Config_Extended extends AutoWRX_Config {
  // 🆕 NEW: SDV deployment configuration
  sdv_deployment: {
    device_discovery: {
      auto_scan: boolean,
      scan_interval_seconds: number,
      network_ranges: string[]
    },
    kuksa: {
      auto_discovery: boolean,
      fallback_broker: boolean,
      preferred_versions: string[]
    },
    deployment: {
      runtime_preferences: 'docker' | 'native' | 'hybrid',
      default_resource_limits: ResourceLimits,
      hot_swap_enabled: boolean
    }
  }
}
```

**Integration with Existing Config Management**:
```typescript
// ✅ Uses existing config service patterns
class ConfigService {
  // ✅ Existing config methods
  async getGenAIConfig(): Promise<GenAI_Config> { }
  async getPluginConfig(): Promise<Plugin_Config> { }

  // 🆕 NEW: SDV config methods follow same patterns
  async getSDV_Config(): Promise<SDV_Deployment_Config> {
    // ✅ Uses existing database access patterns
    const config = await this.configModel.findOne({ type: 'sdv_deployment' })
    return config ? config.value : this.getDefaultSDV_Config()
  }

  async updateSDV_Config(config: Partial<SDV_Deployment_Config>): Promise<void> {
    // ✅ Uses existing update patterns
    await this.configModel.findOneAndUpdate(
      { type: 'sdv_deployment' },
      { value: config },
      { upsert: true }
    )
  }
}
```

## Step-by-Step Integration Plan for v3-Base Team

### Phase 1: Frontend Integration (Week 1)

#### Step 1.1: Add SDV Button to PrototypeTabCode
**Files to Modify**:
- `frontend/src/components/organisms/PrototypeTabCode.tsx`

**What to Add**:
```typescript
// Add to existing state
const [isOpenSDVHub, setIsOpenSDVHub] = useState(false)

// Add to existing action buttons section
<DaButton
  onClick={() => setIsOpenSDVHub(true)}
  disabled={!code?.trim()}
  className="bg-da-primary-500"
>
  🚀 Deploy to SDV
</DaButton>

// Add modal (uses existing DaPopup pattern)
<SDVDeploymentHub
  isOpen={isOpenSDVHub}
  onClose={() => setIsOpenSDVHub(false)}
  pythonCode={code}
  prototypeName={prototype?.name}
/>
```

#### Step 1.2: Create SDV Deployment Hub Component
**Files to Create**:
- `frontend/src/components/organisms/SDVDeploymentHub.tsx`

**Pattern**: Follows existing `DaDialog` modal patterns from v3-base

#### Step 1.3: Create SDV Molecule Components
**Files to Create**:
- `frontend/src/components/molecules/deployment/DaAppPackager.tsx`
- `frontend/src/components/molecules/deployment/DaDeviceScanner.tsx`
- `frontend/src/components/molecules/deployment/DaDeploymentManager.tsx`
- `frontend/src/components/molecules/deployment/DaKuksaConfig.tsx`

**Pattern**: Follows existing molecule component patterns (forms, tables, lists)

### Phase 2: Service Layer Integration (Week 2)

#### Step 2.1: Create SDV Service
**Files to Create**:
- `frontend/src/services/sdv.service.ts`

**Pattern**: Follows existing service patterns from `prototype.service.ts`

#### Step 2.2: Create SDV Store
**Files to Create**:
- `frontend/src/stores/sdvStore.ts`

**Pattern**: Follows existing Zustand store patterns from `modelStore.ts`

#### Step 2.3: Add SDV Configuration
**Files to Modify**:
- `frontend/src/configs/config.ts`

**Pattern**: Extend existing configuration object

### Phase 3: Backend Integration (Week 3)

#### Step 3.1: Create SDV Models
**Files to Create**:
- `backend/src/models/sdv.model.js`
- `backend/src/models/device.model.js`

**Pattern**: Follows existing model patterns from `model.model.js`

#### Step 3.2: Create SDV Controllers
**Files to Create**:
- `backend/src/controllers/sdv.controller.js`

**Pattern**: Follows existing controller patterns from `prototype.controller.js`

#### Step 3.3: Create SDV Routes
**Files to Create**:
- `backend/src/routes/v2/sdv.route.js`

**Pattern**: Follows existing route patterns from `prototype.route.js`

#### Step 3.4: Create SDV Services
**Files to Create**:
- `backend/src/services/sdv.service.js`

**Pattern**: Follows existing service patterns from `prototype.service.js`

#### Step 3.5: Add SDV Validations
**Files to Create**:
- `backend/src/validations/sdv.validation.js`

**Pattern**: Follows existing validation patterns from `model.validation.js`

### Phase 4: Integration Testing (Week 4)

#### Step 4.1: Component Testing
**Test existing SDV components with v3-base patterns**

#### Step 4.2: API Integration Testing
**Test SDV APIs work with existing authentication and validation**

#### Step 4.3: End-to-End Testing
**Test complete deployment workflow from code to device**

## Compatibility with Existing v3-base Features

### ✅ **Compatible Features**
- **GenAI Integration**: SDV uses AI-generated Python code seamlessly
- **Plugin System**: SDV deployment plugins extend existing plugin architecture
- **Code Editor**: Full compatibility with existing CodeEditor component
- **Configuration System**: SDV config extends existing config management
- **User Authentication**: Uses existing auth system and permissions
- **Database**: Extends existing database models and relationships

### 🔄 **Integration Points**
- **PrototypeTabCode**: Primary integration point for SDV deployment
- **API Gateway**: SDV routes added alongside existing routes
- **State Management**: SDV stores coexist with existing stores
- **File System**: SDV packages managed alongside existing file storage

### ⚠️ **Considerations**
- **Database Migrations**: Required for new SDV models
- **API Versioning**: SDV endpoints follow existing v2 API pattern
- **Permissions**: New SDV-specific permissions added to existing system
- **Testing**: SDV features tested alongside existing test suite

## Benefits for v3-Base Team

### 🚀 **Enhanced Capabilities**
- **More Value for Users**: Complete development to deployment workflow
- **Competitive Advantage**: Only platform with full SDV deployment
- **User Engagement**: Increased user retention with deployment capabilities

### 🛠️ **Technical Benefits**
- **Reusable Components**: SDV components follow v3-base patterns
- **Consistent Architecture**: SDV integrates seamlessly with existing system
- **Future Foundation**: Extensible architecture for future features

### 📈 **Business Benefits**
- **Market Differentiation**: Unique SDV deployment capabilities
- **User Growth**: Attracts automotive development teams
- **Revenue Opportunities**: Premium SDV deployment features

## Getting Started Checklist

### ✅ **Prerequisites Met**
- v3-base stable foundation completed ✅
- Plugin system implemented ✅
- GenAI integration working ✅
- UI component library stable ✅
- API architecture established ✅

### 📋 **Team Readiness Checklist**
- [ ] Review SDV architecture documentation
- [ ] Understand integration points in existing codebase
- [ ] Plan development schedule around existing sprints
- [ ] Set up development environment for SDV testing
- [ ] Identify team members for each integration phase

### 🎯 **Implementation Success Metrics**
- All existing v3-base features remain functional
- SDV deployment integrates seamlessly with existing UI
- No breaking changes to existing API contracts
- Performance impact on existing features < 5%
- Code follows existing v3-base patterns and conventions

## Support for Development Team

### 📚 **Documentation Resources**
- [Complete Architecture Blueprint](AUTOWRX_SDV_ARCHITECTURE_BLUEPRINT.md)
- [Implementation Guide](SDV_IMPLEMENTATION_GUIDE.md)
- [API Reference](API_REFERENCE.md)
- [Component Design Specifications](COMPONENT_SPECS.md)

### 💬 **Communication Channels**
- **Slack**: #sdv-integration channel for questions
- **Weekly Sync**: SDV integration progress meetings
- **Code Reviews**: SDV PRs reviewed with existing team
- **Architecture Reviews**: Technical design discussions

### 🔧 **Development Tools**
- **Component Templates**: Pre-configured component scaffolding
- **Testing Frameworks**: Integration with existing test setup
- **Development Environment**: Docker compose with SDV services
- **CI/CD Integration**: SDV tests in existing pipeline

## Conclusion

This SDV integration represents a significant enhancement to AutoWRX v3-base while maintaining full compatibility with existing features. The integration leverages the solid foundation you've built in v3-base and extends it with powerful deployment capabilities.

For the v3-base development team, this integration offers:
- **Familiar Patterns**: All new components follow existing v3-base conventions
- **Incremental Development**: Can be implemented in phases without disruption
- **Shared Architecture**: Builds on existing authentication, API, and database patterns
- **Future-Ready**: Extensible foundation for additional automotive features

The SDV deployment capabilities will position AutoWRX as the leading platform for automotive software development, providing users with a complete solution from idea to deployed vehicle application.

**Next Steps**: Review the detailed implementation guide and begin with Phase 1 frontend integration. The architecture is designed to make this integration as smooth as possible for the existing v3-base team.