// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import DaText from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import {
  TbDeviceDesktop,
  TbApps,
  TbDatabase,
  TbMessageCircle,
  TbActivity,
  TbCpu,
  TbDeviceFloppy,
  TbNetwork,
  TbClock,
  TbCloudUpload as TbUpload,
  TbRefresh,
  TbDownload,
  TbEye,
  TbBug,
  TbSettings,
  TbPlayerPlay,
  TbPlayerStop,
  TbCheck,
  TbX,
  TbAlertTriangle,
  TbPlug,
  TbWifi,
  TbServer,
  TbSearch,
  TbUsers,
  TbShield,
  TbCar,
  TbMapPin,
  TbBattery,
  TbGauge,
  TbClockHour3,
  TbWorld,
  TbRocket,
  TbRefreshAlert,
  TbCircleCheck,
  TbCircleOff,
  TbProgress,
  TbAlertCircle,
  TbStar,
  TbTrendingUp,
  TbDeviceLaptop,
  TbStack,
  TbGitBranch,
  TbHierarchy,
  TbChartDots,
  TbRoute,
  TbCloud,
  TbLock,
  TbUser,
  TbArrowsRight,
  TbClipboard,
  TbApi,
  TbCode,
  TbLayers,
  TbAdjustmentsHorizontal,
  TbFilter,
  TbArrowsSplit,
  TbTransferVertical,
  TbArrowsExchange,
  TbReload,
  TbHistory,
  TbCalendar,
  TbFingerprint,
  TbKey,
  TbCertificate,
  TbZoomScan,
  TbRadar,
  TbClick,
  TbHandClick,
  TbArrowRight,
  TbPlus,
  TbTerminal,
  TbDownload as TbDownloadIcon,
  TbCopy,
  TbChevronRight,
  TbChevronDown,
  TbInfoCircle,
  TbBulb,
  TbDeviceSpeaker,
  TbHeadphones,
  TbMikrophone,
  TbBrandPython,
  TbBrandDocker,
  TbBrandNodejs,
  TbDeviceLaptop as TbDevice,
  TbGitMerge,
  TbGitPullRequest,
  TbGitFork,
  TbSteeringWheel,
} from 'react-icons/tb'

interface DaUDASetupDashboardProps {
  onCancel?: () => void
  target?: any
  onFinish?: () => void
  currentApp?: {
    id: string
    name: string
    code: string
    signals: string[]
    description?: string
  }
}

const DaUDASetupDashboard: FC<DaUDASetupDashboardProps> = ({
  onCancel,
  target,
  onFinish,
  currentApp = {
    id: 'current-vehicle-app',
    name: 'My Vehicle App',
    code: '// Vehicle app code here...',
    signals: ['Vehicle.Door.Row1.Left.IsOpen', 'Vehicle.Door.Row1.Right.IsOpen'],
    description: 'Current vehicle application from code editor'
  }
}) => {
  // Wizard state management
  const [wizardStep, setWizardStep] = useState(0)
  const [activeTab, setActiveTab] = useState('architecture')
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStep, setDeploymentStep] = useState('')
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)

  // UDA Agent Architecture based on brainstorming
  const architectureOverview = {
    centralComponents: [
      {
        name: 'UDA Agent Core',
        description: 'Device lifecycle management and orchestration',
        status: 'planned',
        icon: <TbServer className="w-6 h-6" />,
        features: ['App deployment', 'Health monitoring', 'Persistent state', 'VSS management']
      },
      {
        name: 'Device Registry',
        description: 'Centralized device inventory and status tracking',
        status: 'planned',
        icon: <TbCar className="w-6 h-6" />,
        features: ['Device discovery', 'Health monitoring', 'Fleet organization', 'Configuration management']
      },
      {
        name: 'VSS Signal Registry',
        description: 'Signal conflict detection and resolution',
        status: 'planned',
        icon: <TbApi className="w-6 h-6" />,
        features: ['Signal mapping', 'Conflict detection', 'Resolution engine', 'Versioning']
      },
      {
        name: 'Deployment Engine',
        description: 'Multi-app deployment with zero-touch capabilities',
        status: 'planned',
        icon: <TbRocket className="w-6 h-6" />,
        features: ['Rolling updates', 'Health checks', 'Auto-rollback', 'Conflict resolution']
      }
    ],
    controlPlane: [
      {
        name: 'Kit Server Coordination',
        description: 'Fleet-wide operations and orchestration',
        status: 'planned',
        icon: <TbCloud className="w-6 h-6" />,
        features: ['Fleet management', 'Policy enforcement', 'OTA updates', 'Telemetry aggregation']
      },
      {
        name: 'Policy Engine',
        description: 'Rule-based deployment and governance',
        status: 'planned',
        icon: <TbShield className="w-6 h-6" />,
        features: ['Deployment policies', 'Compliance checks', 'Access control', 'Audit trails']
      },
      {
        name: 'Telemetry Pipeline',
        description: 'Real-time fleet monitoring and analytics',
        status: 'planned',
        icon: <TbChartDots className="w-6 h-6" />,
        features: ['Health metrics', 'Performance data', 'Alert management', 'Historical analysis']
      }
    ]
  }

  // Wizard steps based on brainstorming
  const wizardSteps = [
    {
      id: 'architecture',
      title: 'UDA Agent Architecture',
      description: 'Enterprise-grade fleet management for SDV edge devices',
      icon: <TbHierarchy className="w-8 h-8" />,
      component: 'architecture'
    },
    {
      id: 'devices',
      title: 'Device Fleet Management',
      description: 'Device-centric fleet operations and lifecycle management',
      icon: <TbCar className="w-8 h-8" />,
      component: 'devices'
    },
    {
      id: 'deployment',
      title: 'Application Deployment',
      description: 'Deploy vehicle apps with conflict detection and zero-touch capabilities',
      icon: <TbUpload className="w-8 h-8" />,
      component: 'deployment'
    },
    {
      id: 'monitoring',
      title: 'Fleet Monitoring',
      description: 'Real-time fleet health, compliance, and telemetry',
      icon: <TbActivity className="w-8 h-8" />,
      component: 'monitoring'
    }
  ]

  // Mock automotive devices with realistic SDV context
  const generateAutomotiveDevices = () => [
    {
      id: 'automotive-ecu-001',
      name: 'Tesla Model 3 Domain Controller',
      type: 'Automotive ECU',
      platform: 'Automotive Grade Linux',
      status: 'online',
      healthScore: 96,
      apps: [
        {
          id: 'tesla-infotainment',
          name: 'Tesla Infotainment System',
          version: 'v2.1.0',
          signals: ['Vehicle.Body.Infotainment.IsOn', 'Vehicle.Cabin.Infotainment.Volume'],
          health: 'healthy',
          lastUpdate: '5 min ago'
        },
        {
          id: 'tesla-climate',
          name: 'Climate Control Module',
          version: 'v1.8.3',
          signals: ['Vehicle.Cabin.HVAC.Temperature', 'Vehicle.Cabin.HVAC.FanSpeed'],
          health: 'healthy',
          lastUpdate: '2 min ago'
        }
      ],
      capabilities: {
        vss: true,
        mqtt: true,
        can: true,
        diagnostics: true
      },
      location: 'Engineering Test Bay A',
      vehicleInfo: {
        vin: '5YJ3E1EA7JF000001',
        model: 'Model 3',
        year: '2024',
        trim: 'Long Range'
      }
    },
    {
      id: 'automotive-ecu-002',
      name: 'BMW iX Central Control Unit',
      type: 'Domain Controller',
      platform: 'QNX Automotive OS',
      status: 'online',
      healthScore: 94,
      apps: [
        {
          id: 'bmw-assistant',
          name: 'BMW Intelligent Assistant',
          version: 'v3.0.1',
          signals: ['Vehicle.AI.Assistant.IsListening', 'Vehicle.AI.Assistant.Response'],
          health: 'healthy',
          lastUpdate: '1 min ago'
        }
      ],
      capabilities: {
        vss: true,
        mqtt: true,
        can: true,
        diagnostics: false
      },
      location: 'Development Lab B',
      vehicleInfo: {
        vin: 'WBA91A1105VWA00001',
        model: 'iX xDrive50',
        year: '2023'
      }
    },
    {
      id: 'automotive-ecu-003',
      name: 'Mercedes-Benz V2X Gateway',
      type: 'V2X Communication Unit',
      platform: 'Ubuntu Core',
      status: 'online',
      healthScore: 92,
      apps: [
        {
          id: 'v2x-messaging',
          name: 'V2X Message Processor',
          version: 'v1.5.2',
          signals: ['Vehicle.V2X.TrafficLightInfo', 'Vehicle.V2X.EmergencyWarning'],
          health: 'warning',
          lastUpdate: '10 min ago'
        }
      ],
      capabilities: {
        vss: true,
        mqtt: true,
        can: false,
        diagnostics: true
      },
      location: 'V2X Test Environment',
      vehicleInfo: {
        vin: 'WDD213A1JA000001',
        model: 'C-Class',
        year: '2024'
      }
    }
  ]

  const supportedPlatforms = [
    {
      name: 'Linux (Current)',
      icon: '🐧',
      status: 'supported',
      description: 'AMD64/x64 architecture with full feature support',
      features: ['Docker support', 'Multi-app deployment', 'VSS integration', 'Health monitoring']
    },
    {
      name: 'Yocto Linux',
      icon: '🔧',
      status: 'in-development',
      description: 'Custom embedded Linux for automotive production',
      features: ['Cross-compilation support', 'Minimal footprint', 'Real-time capabilities', 'Custom BSPs'],
      estimatedRelease: 'Q2 2025'
    },
    {
      name: 'Automotive Grade Linux',
      icon: '🚗',
      status: 'planned',
      description: 'AGL platform for automotive production',
      features: ['Automotive APIs', 'Graphics acceleration', 'Audio framework', 'System services'],
      estimatedRelease: 'Q3 2025'
    },
    {
      name: 'Android Automotive',
      icon: '🤖',
      status: 'planned',
      description: 'Google\'s automotive OS',
      features: ['Android APIs', 'Google Play Services', 'Automotive UI', 'Security features'],
      estimatedRelease: 'Q4 2025'
    },
    {
      name: 'QNX Automotive OS',
      icon: '⚡',
      status: 'planned',
      description: 'Real-time automotive OS with safety certification',
      features: ['Safety certification', 'Real-time performance', 'Microkernel architecture', 'OTA updates'],
      estimatedRelease: 'Q3 2025'
    },
    {
      name: 'ARM64 Architecture',
      icon: '💻',
      status: 'planned',
      description: 'Support for ARM64 processors in automotive ECUs',
      features: ['ARM64 containers', 'Power efficiency', 'Automotive chipsets', 'Performance'],
      estimatedRelease: 'Q2 2025'
    }
  ]

  const renderArchitectureOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-da-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <TbHierarchy className="w-6 h-6 text-da-primary-500" />
        </div>
        <DaText variant="title" className="text-da-gray-dark mb-2">UDA Agent Architecture</DaText>
        <DaText variant="regular" className="text-da-gray-medium">Enterprise fleet management for SDV edge devices</DaText>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {architectureOverview.centralComponents.map((component, index) => (
          <div key={index} className="bg-da-white rounded-lg p-4 border border-da-gray-light">
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                component.status === 'supported' ? 'bg-green-100' :
                component.status === 'in-development' ? 'bg-yellow-100' : 'bg-da-gray-light'
              }`}>
                <div className={component.status === 'supported' ? 'text-green-600' :
                             component.status === 'in-development' ? 'text-yellow-600' : 'text-da-gray-medium'}>
                  {component.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <DaText variant="regular-medium" className="text-da-gray-dark mb-1">
                  {component.name}
                </DaText>
                <DaText variant="small" className="text-da-gray-medium">
                  {component.description}
                </DaText>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                component.status === 'supported' ? 'bg-green-100 text-green-700' :
                component.status === 'in-development' ? 'bg-yellow-100 text-yellow-700' : 'bg-da-gray-light text-da-gray-medium'
              }`}>
                {component.status === 'supported' ? '✓ Supported' :
                 component.status === 'in-development' ? '🚧 In Development' : '📋 Planned'}
              </span>
            </div>

            <div className="space-y-1">
              {component.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <TbCheck className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <DaText variant="small" className="text-da-gray-medium">
                    {feature}
                  </DaText>
                </div>
              ))}
              {component.features.length > 3 && (
                <DaText variant="small" className="text-da-gray-medium ml-5">
                  +{component.features.length - 3} more features
                </DaText>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Key Features */}
      <div className="bg-da-white rounded-lg p-4 border border-da-gray-light">
        <DaText variant="regular-medium" className="text-da-gray-dark mb-3">Key Architectural Principles</DaText>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: <TbSteeringWheel className="w-4 h-4" />, title: "Device-Centric", desc: "Focus on device lifecycle" },
            { icon: <TbDatabase className="w-4 h-4" />, title: "VSS Registry", desc: "Signal conflict detection" },
            { icon: <TbGitMerge className="w-4 h-4" />, title: "Zero-Touch", desc: "Automated deployment" },
            { icon: <TbShield className="w-4 h-4" />, title: "Enterprise Security", desc: "Role-based access control" }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-da-primary-100 rounded-lg flex items-center justify-center text-da-primary-600">
                {item.icon}
              </div>
              <div>
                <DaText variant="small-medium" className="text-da-gray-dark">{item.title}</DaText>
                <DaText variant="small" className="text-da-gray-medium">{item.desc}</DaText>
              </div>
            </div>
          ))}
        </div>
      </div>
  )

  const renderDeviceManagement = () => (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Fleet Management</h2>
        <p className="text-gray-600">Device-centric fleet operations with persistent lifecycle management</p>
      </div>

      {/* Fleet Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbCar className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{generateAutomotiveDevices().length}</span>
          </div>
          <h3 className="font-semibold">Total Devices</h3>
          <p className="text-sm text-gray-600">In fleet management</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbCircleCheck className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-900">
              {generateAutomotiveDevices().filter(d => d.status === 'online').length}
            </span>
          </div>
          <h3 className="font-semibold">Online Devices</h3>
          <p className="text-sm text-gray-600">Ready for operations</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbApps className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">
              {generateAutomotiveDevices().reduce((sum, d) => sum + d.apps.length, 0)}
            </span>
          </div>
          <h3 className="font-semibold">Deployed Apps</h3>
          <p className="text-sm text-gray-600">Across all devices</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbGauge className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">
              {Math.round(generateAutomotiveDevices().reduce((sum, d) => sum + d.healthScore, 0) / generateAutomotiveDevices().length)}%
            </span>
          </div>
          <h3 className="font-semibold">Fleet Health</h3>
          <p className="text-sm text-gray-600">Average health score</p>
        </div>
      </div>

      {/* Device Grid */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Fleet Devices</h3>
          <div className="flex gap-2">
            <DaButton
              onClick={() => setIsScanning(true)}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <TbProgress className="w-4 h-4 animate-spin" />
                  Scanning Fleet
                </>
              ) : (
                <>
                  <TbRadar className="w-4 h-4" />
                  Scan Network
                </>
              )}
            </DaButton>
            <DaButton variant="secondary" className="flex items-center gap-2">
              <TbPlus className="w-4 h-4" />
              Add Device
            </DaButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {generateAutomotiveDevices().map(device => (
            <div key={device.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              {/* Device Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <h4 className="font-semibold">{device.name}</h4>
                    <p className="text-sm text-gray-600">{device.type} • {device.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {device.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    device.healthScore >= 90 ? 'bg-green-100 text-green-800' :
                    device.healthScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {device.healthScore}% Health
                  </span>
                </div>
              </div>

              {/* Vehicle Information */}
              {device.vehicleInfo && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">VIN:</span>
                      <div className="font-mono font-medium">{device.vehicleInfo.vin}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Model:</span>
                      <div>{device.vehicleInfo.model} {device.vehicleInfo.year}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <div>{device.location}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Platform:</span>
                      <div>{device.platform}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Capabilities */}
              <div className="mb-4">
                <h5 className="font-medium text-sm mb-2">Device Capabilities</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(device.capabilities).map(([capability, enabled]) => (
                    <span key={capability} className={`px-2 py-1 rounded text-xs ${
                      enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {capability.charAt(0).toUpperCase() + capability.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Deployed Applications */}
              <div className="mb-4">
                <h5 className="font-medium text-sm mb-2">Deployed Applications ({device.apps.length})</h5>
                <div className="space-y-2">
                  {device.apps.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          app.health === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium">{app.name}</div>
                          <div className="text-xs text-gray-600">{app.version} • {app.signals.length} signals</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{app.lastUpdate}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Actions */}
              <div className="flex gap-2">
                <DaButton variant="primary" size="sm" className="flex items-center gap-1">
                  <TbUpload className="w-4 h-4" />
                  Deploy App
                </DaButton>
                <DaButton variant="secondary" size="sm" className="flex items-center gap-1">
                  <TbSettings className="w-4 h-4" />
                  Manage
                </DaButton>
                <DaButton variant="secondary" size="sm" className="flex items-center gap-1">
                  <TbActivity className="w-4 h-4" />
                  Monitor
                </DaButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <DaButton variant="secondary" onClick={() => setWizardStep(0)}>
          Back to Architecture
        </DaButton>
        <DaButton
          variant="primary"
          onClick={() => setWizardStep(2)}
          className="flex items-center gap-2"
        >
          Next: App Deployment
          <TbArrowRight className="w-4 h-4" />
        </DaButton>
      </div>
    </div>
  )

  const renderAppDeployment = () => (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Deployment</h2>
        <p className="text-gray-600">Deploy vehicle apps with VSS signal conflict detection and zero-touch capabilities</p>
      </div>

      {/* Current App Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <TbCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">{currentApp.name}</h3>
            <p className="text-sm text-blue-700">{currentApp.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TbApi className="w-4 h-4" />
              <span className="font-medium">VSS Signals</span>
            </div>
            <div className="space-y-1">
              {currentApp.signals.map((signal, idx) => (
                <div key={idx} className="text-xs font-mono text-gray-600 p-1 bg-gray-50 rounded">
                  {signal}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TbCar className="w-4 h-4" />
              <span className="font-medium">Conflict Analysis</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-xs text-gray-600">Conflicts Detected</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TbGitBranch className="w-4 h-4" />
              <span className="font-medium">Deployment Strategy</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">Rolling</div>
              <div className="text-xs text-gray-600">Zero-touch enabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Device Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Select Target Devices</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {generateAutomotiveDevices().map(device => (
            <div key={device.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDevices(prev => [...prev, device.id])
                      } else {
                        setSelectedDevices(prev => prev.filter(id => id !== device.id))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="font-medium">{device.name}</h4>
                    <p className="text-sm text-gray-600">{device.platform} • {device.healthScore}% health</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {device.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Current Apps and Signal Analysis */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium">Current Apps & Signals</h5>
                  <span className="text-xs text-gray-600">{device.apps.length} apps, {device.apps.reduce((sum, app) => sum + app.signals.length, 0)} signals</span>
                </div>

                {/* Signal Conflict Detection */}
                <div className="space-y-2">
                  {device.apps.map(app => (
                    <div key={app.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
                      <span className="font-medium">{app.name}</span>
                      <span className="text-gray-600">{app.signals.length} signals</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployment Options */}
              <div className="flex gap-2">
                <DaButton
                  variant="primary"
                  size="sm"
                  disabled={!selectedDevices.includes(device.id) || device.status !== 'online'}
                  onClick={() => handleDeployToDevice(device.id)}
                >
                  {selectedDevices.includes(device.id) ? 'Selected' : 'Select Device'}
                </DaButton>
                <DaButton variant="secondary" size="sm">
                  View Details
                </DaButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold mb-4">Deployment Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Deployment Strategy</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="strategy" defaultChecked className="text-blue-600" />
                <div>
                  <div className="font-medium">Rolling Update</div>
                  <div className="text-sm text-gray-600">Update devices one by one to minimize downtime</div>
                </div>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="strategy" className="text-blue-600" />
                <div>
                  <div className="font-medium">Parallel Update</div>
                  <div className="text-sm text-gray-600">Update all selected devices simultaneously</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Deployment Options</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="text-blue-600" />
                <span className="text-sm">Enable health checks</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="text-blue-600" />
                <span className="text-sm">Auto-rollback on failure</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="text-blue-600" />
                <span className="text-sm">Pre-deployment validation</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <DaButton variant="secondary" onClick={() => setWizardStep(1)}>
          Back to Devices
        </DaButton>
        <DaButton
          variant="primary"
          onClick={handleBulkDeploy}
          disabled={selectedDevices.length === 0 || isDeploying}
          className="flex items-center gap-2"
        >
          <TbRocket className="w-4 h-4" />
          Deploy to {selectedDevices.length} Device{selectedDevices.length !== 1 ? 's' : ''}
        </DaButton>
      </div>
    </div>
  )

  const renderFleetMonitoring = () => (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fleet Monitoring & Analytics</h2>
        <p className="text-gray-600">Real-time fleet health, compliance monitoring, and telemetry aggregation</p>
      </div>

      {/* Fleet Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbActivity className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-900">98.5%</span>
          </div>
          <h3 className="font-semibold">Fleet Health</h3>
          <div className="text-sm text-gray-600">Average health across all devices</div>
          <div className="mt-2 h-1 bg-green-200 rounded-full">
            <div className="h-1 bg-green-500 rounded-full" style={{ width: '98.5%' }}></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbApps className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{generateAutomotiveDevices().reduce((sum, d) => sum + d.apps.length, 0)}</span>
          </div>
          <h3 className="font-semibold">Active Apps</h3>
          <div className="text-sm text-gray-600">Currently running applications</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbApi className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">
              {generateAutomotiveDevices().reduce((sum, d) => sum + d.apps.reduce((appSum, app) => appSum + app.signals.length, 0), 0)}
            </span>
          </div>
          <h3 className="font-semibold">VSS Signals</h3>
          <div className="text-sm text-gray-600">Registered signal endpoints</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TbTrendingUp className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">99.9%</span>
          </div>
          <h3 className="font-semibold">Uptime</h3>
          <div className="text-sm text-gray-600">30-day fleet availability</div>
        </div>
      </div>

      {/* Real-time Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TbActivity className="w-5 h-5 text-blue-600" />
            Real-Time Activity Stream
          </h3>
          <div className="space-y-3">
            {[
              {
                type: 'deployment',
                message: 'Tesla Model 3 ECU: Successfully deployed Climate Control Module v1.8.3',
                timestamp: '2 minutes ago',
                status: 'success'
              },
              {
                type: 'health',
                message: 'BMW iX Domain Controller: Health check passed (94% score)',
                timestamp: '5 minutes ago',
                status: 'success'
              },
              {
                type: 'warning',
                message: 'Mercedes-Benz V2X Gateway: V2X messaging app showing degraded performance',
                timestamp: '8 minutes ago',
                status: 'warning'
              },
              {
                type: 'deployment',
                message: 'Tesla Model 3 ECU: Rolling update completed for Infotainment System',
                timestamp: '12 minutes ago',
                status: 'success'
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1 ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm">{activity.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{activity.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Summary */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TbAlertTriangle className="w-5 h-5 text-yellow-600" />
            Active Alerts
          </h3>
          <div className="space-y-2">
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm font-medium text-yellow-800">Performance Warning</div>
              <div className="text-xs text-yellow-700">V2X Gateway - High memory usage detected</div>
            </div>
            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm font-medium text-blue-800">Update Available</div>
              <div className="text-xs text-blue-700">1 app ready for security update</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance and Governance */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TbShield className="w-5 h-5 text-green-600" />
          Compliance & Governance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium mb-2">Policy Compliance</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Deployment Policies</span>
                <span className="text-green-600">100%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Security Policies</span>
                <span className="text-green-600">100%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Access Control</span>
                <span className="text-yellow-600">95%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium mb-2">Audit Trail</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Last 24h</span>
                <span className="text-gray-600">1,247 events</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Last 7 days</span>
                <span className="text-gray-600">8,432 events</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Retention</span>
                <span className="text-gray-600">90 days</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium mb-2">Telemetry Pipeline</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Data Rate</span>
                <span className="text-green-600">1.2 MB/min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Latency</span>
                <span className="text-green-600">{"<"} 50ms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Success Rate</span>
                <span className="text-green-600">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <DaButton variant="secondary" onClick={() => setWizardStep(2)}>
          Back to Deployment
        </DaButton>
        <DaButton
          variant="primary"
          onClick={() => {
            alert('UDA Agent fleet monitoring setup complete! Ready for production deployment.')
            onFinish?.()
          }}
          className="flex items-center gap-2"
        >
          Complete Setup
          <TbCheck className="w-4 h-4" />
        </DaButton>
      </div>
    </div>
  )

  const handleDeployToDevice = async (deviceId: string) => {
    // Simulate deployment to specific device
    setIsDeploying(true)
    setDeploymentStep('validating')

    const deploymentSteps = [
      { step: 'validating', duration: 1000 },
      { step: 'packaging', duration: 2000 },
      { step: 'transferring', duration: 3000 },
      { step: 'installing', duration: 4000 },
      { step: 'configuring', duration: 2000 },
      { step: 'health-check', duration: 1000 }
    ]

    for (const { step, duration } of deploymentSteps) {
      setDeploymentStep(step)
      await new Promise(resolve => setTimeout(resolve, duration))
    }

    setIsDeploying(false)
    setDeploymentStep('')

    // Add app to device
    const device = generateAutomotiveDevices().find(d => d.id === deviceId)
    if (device) {
      device.apps.push({
        id: currentApp.id,
        name: currentApp.name,
        version: '1.0.0',
        signals: currentApp.signals,
        health: 'healthy',
        lastUpdate: 'Just now'
      })
    }
  }

  const handleBulkDeploy = async () => {
    if (selectedDevices.length === 0) return

    setIsDeploying(true)
    setDeploymentStep('coordinating')

    // Simulate coordination phase
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Deploy to each selected device
    for (const deviceId of selectedDevices) {
      await handleDeployToDevice(deviceId)
    }

    setIsDeploying(false)
    setDeploymentStep('')

    alert(`Successfully deployed ${currentApp.name} to ${selectedDevices.length} device(s)!`)
  }

  // Platform support status styling
  const getPlatformStatusStyle = (status: string) => {
    switch (status) {
      case 'supported':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-development':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const handleDeployment = async () => {
    setIsDeploying(true)
    setDeploymentStep('coordinating')

    const steps = ['coordinating', 'validating', 'packaging', 'transferring', 'installing', 'configuring', 'health-check']

    for (const step of steps) {
      setDeploymentStep(step)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate deployment time
    }

    // Complete deployment
    setDeploymentStep('complete')
    setTimeout(() => {
      setIsDeploying(false)
      setWizardStep(3) // Move to monitoring step
    }, 1500)
  }

  const getPlatformStatusIcon = (status: string) => {
    switch (status) {
      case 'supported':
        return <TbCheck className="w-4 h-4 text-green-600" />
      case 'in-development':
        return <TbProgress className="w-4 h-4 text-yellow-600 animate-spin" />
      case 'planned':
        return <TbClock className="w-4 h-4 text-gray-600" />
      default:
        return <TbAlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-da-gray-light">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-da-white border-b border-da-gray-light">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  index <= wizardStep ? 'bg-da-primary-500 text-da-white' : 'bg-da-gray-medium text-da-white'
                }`}>
                  {index < wizardStep ? <TbCheck className="w-3 h-3" /> : index + 1}
                </div>
                {index < wizardSteps.length - 1 && (
                  <div className={`h-px w-4 transition-colors ${
                    index < wizardStep ? 'bg-da-primary-500' : 'bg-da-gray-medium'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="ml-4">
            <DaText variant="regular-medium" className="text-da-gray-dark">
              {wizardSteps[wizardStep].title}
            </DaText>
            <DaText variant="small" className="text-da-gray-medium">
              {wizardSteps[wizardStep].description}
            </DaText>
          </div>
        </div>
        <DaButton variant="plain" size="sm" onClick={onCancel}>
          <TbX className="w-4 h-4" />
        </DaButton>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {wizardStep === 0 && renderArchitectureOverview()}
          {wizardStep === 1 && renderDeviceManagement()}
          {wizardStep === 2 && renderAppDeployment()}
          {wizardStep === 3 && renderFleetMonitoring()}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-da-white border-t border-da-gray-light">
        <div className="flex items-center gap-2">
          {wizardStep > 0 && (
            <DaButton
              variant="outline-nocolor"
              size="md"
              onClick={() => setWizardStep(wizardStep - 1)}
            >
              <TbArrowRight className="w-4 h-4 rotate-180 mr-2" />
              Previous
            </DaButton>
          )}
        </div>

        <div className="flex items-center gap-2">
          {wizardStep < wizardSteps.length - 1 ? (
            <DaButton
              variant="solid"
              size="md"
              onClick={() => setWizardStep(wizardStep + 1)}
              className="min-w-[100px]"
            >
              Next
              <TbArrowRight className="w-4 h-4 ml-2" />
            </DaButton>
          ) : (
            wizardStep === 2 && selectedDevices.length > 0 && (
              <DaButton
                variant="gradient"
                size="md"
                onClick={handleDeployment}
                disabled={isDeploying}
                className="min-w-[120px]"
              >
                {isDeploying ? (
                  <>
                    <TbProgress className="w-4 h-4 animate-spin mr-2" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <TbRocket className="w-4 h-4 mr-2" />
                    Deploy Now
                  </>
                )}
              </DaButton>
            )
          )}
        </div>
      </div>

      {/* Deployment Progress Modal */}
      {isDeploying && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-da-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-da-primary-100 rounded-full flex items-center justify-center">
                <TbProgress className="w-6 h-6 text-da-primary-500 animate-spin" />
              </div>
              <div>
                <DaText variant="regular-bold" className="text-da-gray-dark">
                  Deploying Application
                </DaText>
                <DaText variant="small" className="text-da-gray-medium">
                  Please wait while we deploy your vehicle app
                </DaText>
              </div>
            </div>

            <div className="space-y-3">
              {['coordinating', 'validating', 'packaging', 'transferring', 'installing', 'configuring', 'health-check'].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    deploymentStep === step ? 'bg-da-primary-500' :
                    index < ['coordinating', 'validating', 'packaging', 'transferring', 'installing', 'configuring', 'health-check'].indexOf(deploymentStep)
                    ? 'bg-green-500' : 'bg-da-gray-medium'
                  }`}>
                    {index < ['coordinating', 'validating', 'packaging', 'transferring', 'installing', 'configuring', 'health-check'].indexOf(deploymentStep) ? (
                      <TbCheck className="w-2.5 h-2.5 text-white" />
                    ) : deploymentStep === step ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ) : null}
                  </div>
                  <DaText variant="small" className={`${
                    deploymentStep === step ? 'font-medium text-da-primary-600' :
                    index < ['coordinating', 'validating', 'packaging', 'transferring', 'installing', 'configuring', 'health-check'].indexOf(deploymentStep)
                    ? 'text-green-600' : 'text-da-gray-medium'
                  }`}>
                    {step.charAt(0).toUpperCase() + step.slice(1).replace('-', ' ')}
                  </DaText>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-da-primary-50 rounded-lg border border-da-primary-200">
              <DaText variant="small" className="text-da-primary-700">
                Deploying <strong>{currentApp.name}</strong> to {selectedDevices.length} device(s) with VSS signal validation...
              </DaText>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DaUDASetupDashboard