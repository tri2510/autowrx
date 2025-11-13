# SDV Integration Cheatsheet for v3-Base Team

## Quick Reference for SDV Integration

### 🎯 **What We're Adding**
One-click deployment of Python vehicle apps from AutoWRX to real automotive devices.

### 📍 **Primary Integration Point**
`frontend/src/components/organisms/PrototypeTabCode.tsx`

## Code Integration Snippets

### 1. Add SDV Button to PrototypeTabCode

```typescript
// Add to existing state
const [isOpenSDVHub, setIsOpenSDVHub] = useState(false)

// Add to existing action buttons (next to "Create Velocitas Project")
<DaButton
  onClick={() => setIsOpenSDVHub(true)}
  disabled={!code?.trim()}
  className="bg-da-primary-500"
>
  🚀 Deploy to SDV Devices
</DaButton>

// Add modal (uses existing DaPopup pattern)
<SDVDeploymentHub
  isOpen={isOpenSDVHub}
  onClose={() => setIsOpenSDVHub(false)}
  pythonCode={code}
  prototypeName={prototype?.name}
/>
```

### 2. New Components to Create

#### SDVDeploymentHub.tsx (Main component)
```typescript
import DaButton from '@/components/atoms/DaButton'
import DaPopup from '@/components/atoms/DaPopup'
import { toast } from 'react-toastify'

// Follows existing DaDialog patterns
const SDVDeploymentHub: FC<SDVDeploymentHubProps> = ({
  isOpen,
  onClose,
  pythonCode,
  prototypeName
}) => {
  // Step-by-step deployment wizard
  // 1. Configure → 2. Package → 3. Devices → 4. Kuksa → 5. Deploy
}
```

#### Follow Existing Patterns
- **Forms**: Use existing `DaInput`, `DaSelect`, `DaTextarea`
- **Buttons**: Use existing `DaButton` variants
- **Modals**: Use existing `DaPopup` patterns
- **Toasts**: Use existing `react-toastify`
- **Validation**: Follow existing form validation patterns

### 3. Service Layer Integration

#### SDV Service (frontend/src/services/sdv.service.ts)
```typescript
// Follows existing service patterns
import { serverAxios } from '@/services/base'

class SDVService {
  async createPackage(packageData: PackageData): Promise<Package> {
    // Same pattern as prototypeService.createPrototype
    const response = await serverAxios.post('/sdv/packages', packageData)
    return response.data
  }

  async discoverDevices(): Promise<Device[]> {
    // Same pattern as other API calls
    const response = await serverAxios.get('/sdv/devices/discover')
    return response.data.devices
  }
}

export default new SDVService()
```

### 4. Store Integration

#### SDV Store (frontend/src/stores/sdvStore.ts)
```typescript
// Follows existing Zustand patterns from modelStore.ts
import { create } from 'zustand'

interface SDVStore {
  devices: Device[]
  selectedDevices: string[]
  deploymentStatus: DeploymentStatus[]

  setDevices: (devices: Device[]) => void
  setSelectedDevices: (devices: string[]) => void
  addDeploymentStatus: (status: DeploymentStatus) => void
}

export const useSDVStore = create<SDVStore>((set, get) => ({
  devices: [],
  selectedDevices: [],
  deploymentStatus: [],

  setDevices: (devices) => set({ devices }),
  setSelectedDevices: (devices) => set({ selectedDevices: devices }),
  addDeploymentStatus: (status) => set(state => ({
    deploymentStatus: [...state.deploymentStatus, status]
  }))
}))
```

### 5. Backend Integration

#### Routes (backend/src/routes/v2/sdv.route.js)
```typescript
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../middleware/auth.middleware.js')
const sdvController = require('../../controllers/sdv.controller.js')

// Follows existing route patterns from prototype.route.js
router.post('/packages',
  authenticate,
  sdvController.createPackage
)

router.get('/devices/discover',
  authenticate,
  sdvController.discoverDevices
)

router.post('/deployments',
  authenticate,
  sdvController.deployPackage
)

module.exports = router
```

#### Models (backend/src/models/sdv.model.js)
```typescript
const mongoose = require('mongoose')
const { toJSON, paginate } = require('./plugins')

// Follows existing model patterns from model.model.js
const sdvPackageSchema = new mongoose.Schema({
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

sdvPackageSchema.plugin(toJSON)
sdvPackageSchema.plugin(paginate)

module.exports = mongoose.model('SDV_Package', sdvPackageSchema)
```

#### Controllers (backend/src/controllers/sdv.controller.js)
```typescript
const httpStatus = require('http-status')
const catchAsync = require('../../utils/catchAsync')
const { sdvPackageService } = require('../../services')
const { successResponse } = require('../../utils/response')

// Follows existing controller patterns from prototype.controller.js
const createPackage = catchAsync(async (req, res) => {
  const userId = req.user.id
  const packageData = {
    ...req.body,
    created_by: userId
  }

  const packageResult = await sdvPackageService.createPackage(packageData)

  res.status(httpStatus.CREATED).json(
    successResponse({
      message: 'Package created successfully',
      data: packageResult
    })
  )
})

module.exports = {
  createPackage,
  discoverDevices,
  deployPackage
}
```

## File Structure Overview

### New Frontend Files
```
frontend/src/
├── components/
│   ├── organisms/
│   │   └── SDVDeploymentHub.tsx          # 🆕 Main deployment hub
│   └── molecules/deployment/
│       ├── DaAppPackager.tsx            # 🆕 App packaging
│       ├── DaDeviceScanner.tsx          # 🆕 Device discovery
│       ├── DaDeploymentManager.tsx      # 🆕 Deployment orchestration
│       └── DaKuksaConfig.tsx            # 🆕 Kuksa configuration
├── services/
│   └── sdv.service.ts                   # 🆕 SDV API service
├── stores/
│   └── sdvStore.ts                      # 🆕 SDV state management
└── configs/
    └── sdv.config.ts                    # 🆕 SDV configuration
```

### New Backend Files
```
backend/src/
├── controllers/
│   └── sdv.controller.js                # 🆕 SDV API handlers
├── models/
│   ├── sdv.model.js                     # 🆕 SDV package model
│   └── device.model.js                  # 🆕 Device model
├── routes/v2/
│   └── sdv.route.js                     # 🆕 SDV API routes
├── services/
│   └── sdv.service.js                   # 🆕 SDV business logic
└── validations/
    └── sdv.validation.js                # 🆕 Input validation
```

### Modified Files
```
frontend/src/components/organisms/
└── PrototypeTabCode.tsx                 # 🔄 Add SDV button and modal

frontend/src/configs/
└── config.ts                            # 🔄 Add SDV configuration

backend/src/app.js                       # 🔄 Add SDV routes
```

## Integration Checklist

### ✅ **Week 1: Frontend Integration**
- [ ] Add SDV button to PrototypeTabCode.tsx
- [ ] Create SDVDeploymentHub component
- [ ] Create DaAppPackager component
- [ ] Create DaDeviceScanner component
- [ ] Test UI integration with existing components

### ✅ **Week 2: Service Layer**
- [ ] Create sdv.service.ts (follow existing patterns)
- [ ] Create sdvStore.ts (follow existing patterns)
- [ ] Add SDV configuration to config.ts
- [ ] Test service integration with existing API

### ✅ **Week 3: Backend Integration**
- [ ] Create SDV models (follow existing patterns)
- [ ] Create SDV controllers (follow existing patterns)
- [ ] Create SDV routes (follow existing patterns)
- [ ] Add routes to app.js
- [ ] Test API integration

### ✅ **Week 4: Testing & Polish**
- [ ] Component testing with existing test framework
- [ ] API integration testing
- [ ] End-to-end testing
- [ ] Documentation updates

## Common Patterns to Follow

### 🔧 **Component Patterns**
```typescript
// ✅ Use existing component patterns
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// ✅ Use existing toast notifications
toast.success('Deployment successful')
toast.error('Deployment failed')

// ✅ Use existing modal patterns
<DaPopup isOpen={isOpen} onClose={onClose}>
  {/* Modal content */}
</DaPopup>
```

### 🛠️ **Service Patterns**
```typescript
// ✅ Use existing service patterns
try {
  const response = await serverAxios.post('/endpoint', data)
  return response.data
} catch (error) {
  console.error('API Error:', error)
  throw error
}
```

### 🗃️ **Store Patterns**
```typescript
// ✅ Use existing Zustand patterns
const useSDVStore = create((set, get) => ({
  state: initialState,
  actions: {
    setState: (newState) => set(newState),
    reset: () => set(initialState)
  }
}))
```

## Gotchas & Tips

### ⚠️ **Important Considerations**
1. **Don't break existing functionality** - SDV should be additive
2. **Follow existing patterns** - Don't reinvent what v3-base already has
3. **Use existing components** - Reuse buttons, forms, modals where possible
4. **Maintain consistency** - Follow existing naming and styling conventions
5. **Test integration** - Ensure SDV doesn't affect existing features

### 💡 **Helpful Tips**
1. **Start with UI** - Build components first, then connect to backend
2. **Use existing auth** - Don't create new authentication system
3. **Leverage existing validation** - Reuse existing validation patterns
4. **Follow existing API patterns** - Use same response formats
5. **Test with existing data** - Use existing prototype data for SDV

## Quick Commands

### 🚀 **Development Setup**
```bash
# Install new dependencies (if any)
cd frontend && npm install

# Start development server
npm run dev

# Test SDV components
npm run test:sdv
```

### 🔍 **Testing Commands**
```bash
# Test SDV integration
npm run test:integration:sdv

# Test SDV components
npm run test:components:sdv

# Test SDV API
npm run test:api:sdv
```

## Support

### 📞 **Get Help**
- **Architecture Questions**: Review [Architecture Blueprint](AUTOWRX_SDV_ARCHITECTURE_BLUEPRINT.md)
- **Implementation Details**: See [Implementation Guide](SDV_IMPLEMENTATION_GUIDE.md)
- **Integration Issues**: Check [Team Integration Guide](TEAM_INTEGRATION_GUIDE.md)
- **Code Examples**: Reference component templates in `/templates/`

### 💬 **Team Communication**
- **Slack**: #sdv-integration for questions
- **Code Reviews**: Tag SDV experts in PRs
- **Architecture Reviews**: Schedule design discussions
- **Testing**: Coordinate with QA team for SDV testing

---

**Remember**: SDV integration is designed to be additive to v3-base, not disruptive. Focus on leveraging existing patterns and components! 🚀