// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import {
  TbRocket,
  TbDeviceDesktop,
  TbSettings,
  TbAlertTriangle,
  TbCheck,
  TbX,
  TbLoader,
  TbRefresh,
  TbShield,
  TbChartLine,
  TbApps,
  TbPlus,
  TbEdit,
  TbTrash,
  TbArrowRight,
  TbInfoCircle,
  TbDatabase,
  TbCloud,
  TbActivity,
  TbGitBranch,
  TbTerminal,
  TbPackage,
  TbCpu,
  TbWorld,
  TbPlug,
  TbPlayerPlay,
  TbPlayerPause,
  TbPlayerStop,
  TbCopy,
  TbEye,
  TbDownload,
  TbUpload,
  TbTransform,
  TbArrowsRight,
  TbBolt
} from 'react-icons/tb'

import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'

interface DaUDADashboardProps {
  onClose?: () => void
}

interface Device {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline' | 'connecting'
  docker: boolean
  apps: number
  lastSeen: string
  architecture: string
  os: string
  memory: number
  cpu: number
}

interface DeployedApp {
  id: string
  name: string
  version: string
  status: 'running' | 'stopped' | 'error' | 'deploying'
  deviceId: string
  vssSignals: string[]
  memory: number
  cpu: number
  deployedAt: string
  image: string
  ports: number[]
  environment: Record<string, string>
}

interface VSSSignal {
  path: string
  type: 'sensor' | 'actuator' | 'attribute'
  dataType: 'string' | 'boolean' | 'number' | 'double'
  apps: string[]
  kuksaAvailable: boolean
  conflict: boolean
  unit?: string
  min?: number
  max?: number
}

interface SignalConflict {
  id: string
  signalPath: string
  apps: string[]
  conflictType: 'duplicate' | 'missing' | 'type_mismatch'
  severity: 'high' | 'medium' | 'low'
  description: string
  suggestedAction: string
  detectedAt: string
  impact: string
}

// Service Configuration Interfaces
interface ServiceStatus {
  name: string
  detected: boolean
  version?: string
  endpoint?: string
  port?: number
  status: 'running' | 'stopped' | 'unknown' | 'deploying'
  lastChecked: string
  config?: Record<string, any>
}

interface KuksaConfig {
  enabled: boolean
  host: string
  port: number
  useSSL: boolean
  vssPath: string
  authRequired: boolean
  username?: string
  password?: string
  autoDeploy: boolean
  version?: string
}

interface MQTTConfig {
  enabled: boolean
  host: string
  port: number
  useSSL: boolean
  useAuth: boolean
  username?: string
  password?: string
  clientId: string
  topicPrefix: string
  qos: 0 | 1 | 2
  autoDeploy: boolean
  brokerVersion?: string
}

interface ServiceDetectionResult {
  kuksa: ServiceStatus
  mqtt: ServiceStatus
  recommendedActions: string[]
  deploymentReadiness: 'ready' | 'needs_setup' | 'partial'
}

interface DeploymentFlow {
  step: number
  title: string
  description: string
  status: 'completed' | 'active' | 'pending'
  icon: any
}

const DaUDADashboard: FC<DaUDADashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'deployments' | 'vss-conflicts' | 'deployment-wizard'>('overview')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showDeploymentFlow, setShowDeploymentFlow] = useState(false)
  const [deploymentStep, setDeploymentStep] = useState(0)

  // Enhanced deployment wizard state
  const [selectedApp, setSelectedApp] = useState('')
  const [selectedTargetDevice, setSelectedTargetDevice] = useState('')
  const [deploymentConfig, setDeploymentConfig] = useState({
    enableAutoRestart: true,
    enableHealthChecks: true,
    enableResourceMonitoring: true,
    enableConflictResolution: true
  })
  const [showFinalCheck, setShowFinalCheck] = useState(false)

  // Service detection and configuration state
  const [serviceDetection, setServiceDetection] = useState<ServiceDetectionResult | null>(null)
  const [isDetectingServices, setIsDetectingServices] = useState(false)
  const [kuksaConfig, setKuksaConfig] = useState<KuksaConfig>({
    enabled: true,
    host: 'localhost',
    port: 8090,
    useSSL: false,
    vssPath: '/vss',
    authRequired: false,
    autoDeploy: false
  })
  const [mqttConfig, setMqttConfig] = useState<MQTTConfig>({
    enabled: true,
    host: 'localhost',
    port: 1883,
    useSSL: false,
    useAuth: false,
    clientId: 'autowrx-deployment',
    topicPrefix: 'vehicle/',
    qos: 1,
    autoDeploy: false
  })
  const [showServiceConfig, setShowServiceConfig] = useState(false)
  const [conflicts, setConflicts] = useState<SignalConflict[]>([
    {
      id: '1',
      signalPath: 'Vehicle.Speed',
      apps: ['SpeedMonitor', 'CruiseControl'],
      conflictType: 'duplicate',
      severity: 'high',
      description: 'Both SpeedMonitor and CruiseControl apps are trying to write to the Vehicle.Speed signal, causing data conflicts.',
      suggestedAction: 'Configure one app as read-only or enable signal multiplexing to allow both apps to access the signal.',
      detectedAt: '2025-01-15 15:32:00',
      impact: 'High: May cause vehicle control instability'
    },
    {
      id: '2',
      signalPath: 'Vehicle.ADAS.ABS.IsActive',
      apps: ['SafetyMonitor'],
      conflictType: 'missing',
      severity: 'medium',
      description: 'SafetyMonitor app requires Vehicle.ADAS.ABS.IsActive signal but it\'s not found in the KUKSA VSS model.',
      suggestedAction: 'Update KUKSA VSS model to include the ABS signal or modify the app to use available signals.',
      detectedAt: '2025-01-15 15:30:00',
      impact: 'Medium: Safety monitoring functionality will be limited'
    },
    {
      id: '3',
      signalPath: 'Vehicle.Powertrain.Transmission.Gear',
      apps: ['GearShifter', 'DrivingMode'],
      conflictType: 'type_mismatch',
      severity: 'low',
      description: 'GearShifter expects integer data type but KUKSA provides string data type for gear position.',
      suggestedAction: 'Update KUKSA VSS model data type or modify app to handle string gear positions.',
      detectedAt: '2025-01-15 15:28:00',
      impact: 'Low: Gear display may show incorrect values'
    }
  ])

  // Comprehensive mock data for demonstration
  const devices: Device[] = [
    {
      id: 'device-1',
      name: 'Vehicle-ECU-01',
      ip: '192.168.1.100',
      status: 'online',
      docker: true,
      apps: 3,
      lastSeen: '2 min ago',
      architecture: 'ARM64',
      os: 'Ubuntu 22.04 LTS',
      memory: 8192,
      cpu: 75
    },
    {
      id: 'device-2',
      name: 'Vehicle-ECU-02',
      ip: '192.168.1.101',
      status: 'online',
      docker: true,
      apps: 2,
      lastSeen: '1 min ago',
      architecture: 'x86_64',
      os: 'Yocto Linux 4.0',
      memory: 4096,
      cpu: 45
    },
    {
      id: 'device-3',
      name: 'Development-Board',
      ip: '192.168.1.102',
      status: 'offline',
      docker: false,
      apps: 0,
      lastSeen: '1 hour ago',
      architecture: 'ARM32',
      os: 'Buildroot',
      memory: 1024,
      cpu: 0
    }
  ]

  // Sample Python apps for deployment
  const sampleApps = [
    {
      id: 'speed-monitor',
      name: 'Speed Monitor App',
      description: 'Real-time vehicle speed monitoring with configurable thresholds',
      category: 'Safety',
      version: '1.2.0',
      memory: 128,
      cpu: 15,
      vssSignals: ['Vehicle.Speed', 'Vehicle.Powertrain.Transmission.CurrentGear']
    },
    {
      id: 'cruise-control',
      name: 'Adaptive Cruise Control',
      description: 'Intelligent cruise control with automatic distance management',
      category: 'Driver Assistance',
      version: '2.1.0',
      memory: 256,
      cpu: 25,
      vssSignals: ['Vehicle.Speed', 'Vehicle.ADAS.CruiseControl.SpeedSet', 'Vehicle.Chassis.Axle.Row1.Wheel.Left.SteeringAngle']
    },
    {
      id: 'battery-monitor',
      name: 'Battery Health Monitor',
      description: 'Electric vehicle battery health and performance monitoring',
      category: 'Powertrain',
      version: '1.0.5',
      memory: 192,
      cpu: 20,
      vssSignals: ['Vehicle.Powertrain.Battery.StateOfCharge', 'Vehicle.Powertrain.Battery.Temperature']
    },
    {
      id: 'gps-tracker',
      name: 'GPS Location Tracker',
      description: 'Real-time GPS positioning and route tracking application',
      category: 'Navigation',
      version: '3.0.1',
      memory: 160,
      cpu: 18,
      vssSignals: ['Vehicle.Position.Latitude', 'Vehicle.Position.Longitude', 'Vehicle.Position.Speed']
    },
    {
      id: 'climate-control',
      name: 'Smart Climate Control',
      description: 'AI-powered cabin climate optimization system',
      category: 'Comfort',
      version: '1.5.2',
      memory: 224,
      cpu: 22,
      vssSignals: ['Vehicle.Cabin.Temperature', 'Vehicle.Cabin.Humidity', 'Vehicle.DoorCount']
    }
  ]

  const deployedApps: DeployedApp[] = [
    {
      id: 'app-1',
      name: 'SpeedMonitor',
      version: '1.2.0',
      status: 'running',
      deviceId: 'device-1',
      vssSignals: ['Vehicle.Speed', 'Vehicle.Acceleration'],
      memory: 45.2,
      cpu: 12.8,
      deployedAt: '2025-01-15 14:30:00',
      image: 'autowrx/speed-monitor:1.2.0',
      ports: [8080, 5000],
      environment: { 'LOG_LEVEL': 'info', 'UPDATE_RATE': '100ms' }
    },
    {
      id: 'app-2',
      name: 'CruiseControl',
      version: '2.1.0',
      status: 'running',
      deviceId: 'device-1',
      vssSignals: ['Vehicle.Speed', 'Vehicle.ADAS.CruiseControl.IsActive'],
      memory: 67.8,
      cpu: 23.4,
      deployedAt: '2025-01-14 09:15:00',
      image: 'autowrx/cruise-control:2.1.0',
      ports: [9090],
      environment: { 'MAX_SPEED': '120', 'SAFETY_MARGIN': '10' }
    },
    {
      id: 'app-3',
      name: 'SafetyMonitor',
      version: '1.0.5',
      status: 'error',
      deviceId: 'device-2',
      vssSignals: ['Vehicle.ADAS.ABS.IsActive', 'Vehicle.ADAS.ABS.IsEmergency'],
      memory: 32.1,
      cpu: 8.7,
      deployedAt: '2025-01-13 16:45:00',
      image: 'autowrx/safety-monitor:1.0.5',
      ports: [7070],
      environment: { 'ALARM_THRESHOLD': 'high', 'REPORT_INTERVAL': '1s' }
    },
    {
      id: 'app-4',
      name: 'GearShifter',
      version: '1.5.2',
      status: 'stopped',
      deviceId: 'device-2',
      vssSignals: ['Vehicle.Powertrain.Transmission.Gear'],
      memory: 28.5,
      cpu: 5.2,
      deployedAt: '2025-01-12 11:20:00',
      image: 'autowrx/gear-shifter:1.5.2',
      ports: [6060],
      environment: { 'SHIFT_MODE': 'auto', 'DISPLAY_TYPE': 'digital' }
    }
  ]

  const vssSignals: VSSSignal[] = [
    {
      path: 'Vehicle.Speed',
      type: 'sensor',
      dataType: 'double',
      apps: ['SpeedMonitor', 'CruiseControl'],
      kuksaAvailable: true,
      conflict: true,
      unit: 'km/h',
      min: 0,
      max: 300
    },
    {
      path: 'Vehicle.Acceleration',
      type: 'sensor',
      dataType: 'double',
      apps: ['SpeedMonitor'],
      kuksaAvailable: true,
      conflict: false,
      unit: 'm/s²',
      min: -10,
      max: 10
    },
    {
      path: 'Vehicle.ADAS.CruiseControl.IsActive',
      type: 'actuator',
      dataType: 'boolean',
      apps: ['CruiseControl'],
      kuksaAvailable: true,
      conflict: false
    },
    {
      path: 'Vehicle.ADAS.ABS.IsActive',
      type: 'actuator',
      dataType: 'boolean',
      apps: ['SafetyMonitor'],
      kuksaAvailable: false,
      conflict: true
    },
    {
      path: 'Vehicle.ADAS.ABS.IsEmergency',
      type: 'actuator',
      dataType: 'boolean',
      apps: ['SafetyMonitor'],
      kuksaAvailable: true,
      conflict: false
    },
    {
      path: 'Vehicle.Powertrain.Transmission.Gear',
      type: 'sensor',
      dataType: 'string',
      apps: ['GearShifter'],
      kuksaAvailable: true,
      conflict: true
    }
  ]

  const deploymentFlowSteps: DeploymentFlow[] = [
    {
      step: 1,
      title: 'Select Python App',
      description: 'Choose the vehicle application to deploy from your current model library',
      status: 'completed',
      icon: TbPackage
    },
    {
      step: 2,
      title: 'Choose Target Device',
      description: 'Select the vehicle ECU where the app will be deployed',
      status: 'completed',
      icon: TbDeviceDesktop
    },
    {
      step: 3,
      title: 'VSS Signal Analysis',
      description: 'Automatically detect and resolve VSS signal conflicts',
      status: 'active',
      icon: TbChartLine
    },
    {
      step: 4,
      title: 'Deploy & Monitor',
      description: 'Deploy the application and monitor real-time status',
      status: 'pending',
      icon: TbRocket
    }
  ]

  const handleResolveConflict = (conflictId: string, action: 'sync-kuksa' | 'remove-signal' | 'multiplex' | 'redeploy') => {
    setConflicts(prev => {
      if (action === 'redeploy') {
        // Simulate redeployment resolution
        setTimeout(() => {
          alert(`Conflict resolved via ${action}. Apps redeployed successfully!`)
        }, 1000)
        return prev.filter(c => c.id !== conflictId)
      }
      return prev.filter(c => c.id !== conflictId)
    })
  }

  const handleStartDeployment = () => {
    setShowDeploymentFlow(true)
    setDeploymentStep(1) // Start with step 1 - App Selection
    setShowFinalCheck(false)
  }

  const handleProceedToNextStep = () => {
    if (deploymentStep < 5) {
      setDeploymentStep(deploymentStep + 1)
    } else if (deploymentStep === 5) {
      setShowFinalCheck(true)
    }
  }

  const handleGoBack = () => {
    if (deploymentStep > 1) {
      setDeploymentStep(deploymentStep - 1)
    }
    setShowFinalCheck(false)
  }

  const handleDeploy = () => {
    // Simulate deployment
    alert('Deployment started! This would trigger the actual deployment process.')
    setShowDeploymentFlow(false)
    setDeploymentStep(0)
    setSelectedApp('')
    setSelectedTargetDevice('')
    setShowFinalCheck(false)
  }

  const handleCancelDeployment = () => {
    setShowDeploymentFlow(false)
    setDeploymentStep(0)
    setSelectedApp('')
    setSelectedTargetDevice('')
    setShowFinalCheck(false)
  }

  // Service detection and deployment functions
  const handleDetectServices = async () => {
    setIsDetectingServices(true)

    try {
      // Simulate service detection - in real implementation, this would call backend APIs
      await new Promise(resolve => setTimeout(resolve, 2000))

      const targetDevice = devices.find(d => d.id === selectedTargetDevice)
      const deviceIP = targetDevice?.ip || 'localhost'

      // Mock detection results
      const kuksaDetected = Math.random() > 0.5
      const mqttDetected = Math.random() > 0.3

      const detectionResult: ServiceDetectionResult = {
        kuksa: {
          name: 'KUKSA Data Broker',
          detected: kuksaDetected,
          version: kuksaDetected ? '0.4.0' : undefined,
          endpoint: kuksaDetected ? `http://${deviceIP}:8090` : undefined,
          port: kuksaDetected ? 8090 : undefined,
          status: kuksaDetected ? 'running' : 'stopped',
          lastChecked: new Date().toISOString(),
          config: kuksaDetected ? {
            vssPath: '/vss',
            sslEnabled: false
          } : undefined
        },
        mqtt: {
          name: 'MQTT Broker',
          detected: mqttDetected,
          version: mqttDetected ? '5.1.0' : undefined,
          endpoint: mqttDetected ? `mqtt://${deviceIP}:1883` : undefined,
          port: mqttDetected ? 1883 : undefined,
          status: mqttDetected ? 'running' : 'stopped',
          lastChecked: new Date().toISOString(),
          config: mqttDetected ? {
            protocolVersion: '5.0',
            clientId: 'autowrx-client'
          } : undefined
        },
        recommendedActions: [
          ...(kuksaDetected ? [] : ['Deploy KUKSA Data Broker for VSS signal management']),
          ...(mqttDetected ? [] : ['Deploy MQTT Broker for vehicle communication']),
          ...(!kuksaDetected && !mqttDetected ? ['Consider using docker-compose for service deployment'] : [])
        ],
        deploymentReadiness:
          kuksaDetected && mqttDetected ? 'ready' :
          kuksaDetected || mqttDetected ? 'partial' : 'needs_setup'
      }

      setServiceDetection(detectionResult)

      // Update configurations based on detection
      if (kuksaDetected) {
        setKuksaConfig(prev => ({
          ...prev,
          host: deviceIP,
          autoDeploy: false
        }))
      } else {
        setKuksaConfig(prev => ({
          ...prev,
          host: deviceIP,
          autoDeploy: true
        }))
      }

      if (mqttDetected) {
        setMqttConfig(prev => ({
          ...prev,
          host: deviceIP,
          autoDeploy: false
        }))
      } else {
        setMqttConfig(prev => ({
          ...prev,
          host: deviceIP,
          autoDeploy: true
        }))
      }

    } catch (error) {
      console.error('Service detection failed:', error)
    } finally {
      setIsDetectingServices(false)
    }
  }

  const handleDeployService = async (serviceType: 'kuksa' | 'mqtt') => {
    const targetDevice = devices.find(d => d.id === selectedTargetDevice)
    if (!targetDevice) return

    console.log(`Deploying ${serviceType} to device ${targetDevice.name}`)

    // Update status to deploying
    if (serviceType === 'kuksa' && serviceDetection) {
      setServiceDetection(prev => prev ? {
        ...prev,
        kuksa: { ...prev.kuksa, status: 'deploying' }
      } : null)

      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 3000))

      setServiceDetection(prev => prev ? {
        ...prev,
        kuksa: {
          ...prev.kuksa,
          detected: true,
          status: 'running',
          version: '0.4.0',
          endpoint: `http://${targetDevice.ip}:8090`,
          port: 8090,
          lastChecked: new Date().toISOString()
        }
      } : null)

      setKuksaConfig(prev => ({ ...prev, autoDeploy: false }))

    } else if (serviceType === 'mqtt' && serviceDetection) {
      setServiceDetection(prev => prev ? {
        ...prev,
        mqtt: { ...prev.mqtt, status: 'deploying' }
      } : null)

      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 2000))

      setServiceDetection(prev => prev ? {
        ...prev,
        mqtt: {
          ...prev.mqtt,
          detected: true,
          status: 'running',
          version: '5.1.0',
          endpoint: `mqtt://${targetDevice.ip}:1883`,
          port: 1883,
          lastChecked: new Date().toISOString()
        }
      } : null)

      setMqttConfig(prev => ({ ...prev, autoDeploy: false }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
        return <TbCheck className="w-4 h-4 text-da-green-500" />
      case 'offline':
      case 'stopped':
        return <TbX className="w-4 h-4 text-da-red-500" />
      case 'connecting':
      case 'deploying':
        return <TbLoader className="w-4 h-4 text-da-blue-500 animate-spin" />
      case 'error':
        return <TbAlertTriangle className="w-4 h-4 text-da-red-500" />
      default:
        return <TbInfoCircle className="w-4 h-4 text-da-gray-500" />
    }
  }

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-da-red-600 bg-da-red-50 border-da-red-200'
      case 'medium': return 'text-da-yellow-600 bg-da-yellow-50 border-da-yellow-200'
      case 'low': return 'text-da-blue-600 bg-da-blue-50 border-da-blue-200'
      default: return 'text-da-gray-600 bg-da-gray-50 border-da-gray-200'
    }
  }

  const DeploymentWizard = () => {
    const onlineDevices = devices.filter(d => d.status === 'online')

    return (
      <div className="space-y-6">
        {/* Device Requirement Alert */}
        {onlineDevices.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TbAlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">No Devices Connected</h3>
                <p className="text-sm text-amber-700 mb-3">
                  You need at least one connected device before deploying applications.
                </p>
                <button
                  onClick={() => setActiveTab('devices')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Connect a Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Deploy CTA - Only show when not in deployment flow */}
        {!showDeploymentFlow && onlineDevices.length > 0 && (
        <div className="bg-gradient-to-r from-da-primary-500 to-da-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Deploy New Python App</h3>
              <p className="text-white text-opacity-90">Deploy your vehicle model app to edge devices with automatic VSS conflict detection</p>
            </div>
            <button
              onClick={handleStartDeployment}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center space-x-2"
            >
              <TbRocket className="w-5 h-5" />
              <span>Start Deployment</span>
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Deployment Flow */}
      {showDeploymentFlow && onlineDevices.length > 0 && (
        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-da-gray-900">Deployment Configuration</h3>
              <button
                onClick={handleCancelDeployment}
                className="text-da-gray-400 hover:text-da-gray-600 transition-colors"
              >
                <TbX className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 h-0.5 bg-da-gray-200 w-full -translate-y-1/2" style={{ zIndex: 0 }} />
              {[
                { step: 1, label: 'Select App', icon: TbPackage },
                { step: 2, label: 'Target Device', icon: TbDeviceDesktop },
                { step: 3, label: 'Service Detection', icon: TbPlug },
                { step: 4, label: 'VSS Analysis', icon: TbChartLine },
                { step: 5, label: 'Configuration', icon: TbSettings }
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    deploymentStep === item.step ? 'bg-da-primary-500 text-white' :
                    deploymentStep > item.step ? 'bg-da-green-500 text-white' :
                    'bg-da-gray-200 text-da-gray-400'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium ${
                    deploymentStep === item.step ? 'text-da-primary-600' :
                    deploymentStep > item.step ? 'text-da-green-600' :
                    'text-da-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Select Python App */}
            {deploymentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-da-gray-900 mb-2">Select Python App</h4>
                  <p className="text-sm text-da-gray-600">Choose the vehicle application to deploy from your current model library</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sampleApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedApp === app.id
                          ? 'border-da-primary-500 bg-da-primary-50'
                          : 'border-da-gray-200 hover:border-da-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-da-gray-900">{app.name}</h5>
                          <p className="text-xs text-da-gray-500">Version {app.version}</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-da-gray-100 text-da-gray-600 rounded-full">
                          {app.category}
                        </span>
                      </div>
                      <p className="text-sm text-da-gray-600 mb-3">{app.description}</p>
                      <div className="flex items-center justify-between text-xs text-da-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <TbCpu className="w-3 h-3 mr-1" />
                            {app.cpu}% CPU
                          </span>
                          <span className="flex items-center">
                            <TbDatabase className="w-3 h-3 mr-1" />
                            {app.memory}MB
                          </span>
                        </div>
                        <div className="flex items-center">
                          <TbGitBranch className="w-3 h-3 mr-1" />
                          {app.vssSignals.length} signals
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dropdown Alternative */}
                <div className="border-t border-da-gray-200 pt-4">
                  <p className="text-sm text-da-gray-600 mb-2">Or select from dropdown:</p>
                  <DaSelect
                    value={selectedApp}
                    onValueChange={setSelectedApp}
                    wrapperClassName="max-w-md"
                  >
                    {sampleApps.map((app) => (
                      <DaSelectItem key={app.id} value={app.id}>
                        {app.name} ({app.version})
                      </DaSelectItem>
                    ))}
                  </DaSelect>
                </div>
              </div>
            )}

            {/* Step 2: Choose Target Device */}
            {deploymentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-da-gray-900 mb-2">Choose Target Device</h4>
                  <p className="text-sm text-da-gray-600">Select the vehicle ECU where the app will be deployed</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.filter(device => device.status === 'online').map((device) => (
                    <div
                      key={device.id}
                      onClick={() => setSelectedTargetDevice(device.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedTargetDevice === device.id
                          ? 'border-da-primary-500 bg-da-primary-50'
                          : 'border-da-gray-200 hover:border-da-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-da-gray-900">{device.name}</h5>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          device.status === 'online'
                            ? 'bg-da-green-100 text-da-green-600'
                            : 'bg-da-red-100 text-da-red-600'
                        }`}>
                          {device.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-da-gray-600">
                        <div className="flex items-center justify-between">
                          <span>IP:</span>
                          <span className="font-mono">{device.ip}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Architecture:</span>
                          <span>{device.architecture}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>OS:</span>
                          <span>{device.os}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Memory:</span>
                          <span>{device.memory}MB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>CPU:</span>
                          <span>{device.cpu}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Current Apps:</span>
                          <span>{device.apps}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dropdown Alternative */}
                <div className="border-t border-da-gray-200 pt-4">
                  <p className="text-sm text-da-gray-600 mb-2">Or select from dropdown:</p>
                  <DaSelect
                    value={selectedTargetDevice}
                    onValueChange={setSelectedTargetDevice}
                    wrapperClassName="max-w-md"
                  >
                    {devices.filter(device => device.status === 'online').map((device) => (
                      <DaSelectItem key={device.id} value={device.id}>
                        {device.name} ({device.ip})
                      </DaSelectItem>
                    ))}
                  </DaSelect>
                </div>
              </div>
            )}

            {/* Step 3: Service Detection */}
            {deploymentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-da-gray-900 mb-2">Service Detection</h4>
                  <p className="text-sm text-da-gray-600">Detect and configure KUKSA Data Broker and MQTT services on the target device</p>
                </div>

                {!serviceDetection ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-da-gray-100 rounded-full mb-4">
                      <TbPlug className="w-8 h-8 text-da-gray-400" />
                    </div>
                    <h5 className="text-lg font-medium text-da-gray-900 mb-2">Detect Required Services</h5>
                    <p className="text-sm text-da-gray-600 mb-6 max-w-md mx-auto">
                      Scan the target device to detect KUKSA Data Broker and MQTT broker services required for VSS signal management.
                    </p>
                    <button
                      onClick={handleDetectServices}
                      disabled={isDetectingServices}
                      className="bg-da-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-da-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                    >
                      {isDetectingServices ? (
                        <>
                          <TbLoader className="w-4 h-4 animate-spin" />
                          <span>Detecting Services...</span>
                        </>
                      ) : (
                        <>
                          <TbActivity className="w-4 h-4" />
                          <span>Detect Services</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Service Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* KUKSA Service Card */}
                      <div className={`border rounded-lg p-4 ${
                        serviceDetection.kuksa.detected
                          ? 'border-da-green-200 bg-da-green-50'
                          : 'border-da-red-200 bg-da-red-50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              serviceDetection.kuksa.detected ? 'bg-da-green-100' : 'bg-da-red-100'
                            }`}>
                              {getStatusIcon(serviceDetection.kuksa.status)}
                            </div>
                            <div>
                              <h5 className="font-medium text-da-gray-900">KUKSA Data Broker</h5>
                              <p className="text-sm text-da-gray-600">
                                {serviceDetection.kuksa.detected
                                  ? `Version ${serviceDetection.kuksa.version}`
                                  : 'Not detected on device'
                                }
                              </p>
                            </div>
                          </div>
                          {serviceDetection.kuksa.detected && (
                            <span className="px-2 py-1 text-xs bg-da-green-100 text-da-green-600 rounded-full">
                              {serviceDetection.kuksa.status}
                            </span>
                          )}
                        </div>

                        {serviceDetection.kuksa.detected ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-da-gray-600">Endpoint:</span>
                              <span className="font-mono text-xs">{serviceDetection.kuksa.endpoint}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-da-gray-600">Port:</span>
                              <span>{serviceDetection.kuksa.port}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-da-gray-600">Last Checked:</span>
                              <span className="text-xs">{new Date(serviceDetection.kuksa.lastChecked).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-da-red-600">
                              KUKSA Data Broker is required for VSS signal management and conflict detection.
                            </p>
                            <button
                              onClick={() => handleDeployService('kuksa')}
                              disabled={serviceDetection.kuksa.status === 'deploying'}
                              className="w-full bg-da-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-da-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center space-x-2"
                            >
                              {serviceDetection.kuksa.status === 'deploying' ? (
                                <>
                                  <TbLoader className="w-3 h-3 animate-spin" />
                                  <span>Deploying...</span>
                                </>
                              ) : (
                                <>
                                  <TbPackage className="w-3 h-3" />
                                  <span>Deploy KUKSA</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* MQTT Service Card */}
                      <div className={`border rounded-lg p-4 ${
                        serviceDetection.mqtt.detected
                          ? 'border-da-green-200 bg-da-green-50'
                          : 'border-da-red-200 bg-da-red-50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              serviceDetection.mqtt.detected ? 'bg-da-green-100' : 'bg-da-red-100'
                            }`}>
                              {getStatusIcon(serviceDetection.mqtt.status)}
                            </div>
                            <div>
                              <h5 className="font-medium text-da-gray-900">MQTT Broker</h5>
                              <p className="text-sm text-da-gray-600">
                                {serviceDetection.mqtt.detected
                                  ? `Version ${serviceDetection.mqtt.version}`
                                  : 'Not detected on device'
                                }
                              </p>
                            </div>
                          </div>
                          {serviceDetection.mqtt.detected && (
                            <span className="px-2 py-1 text-xs bg-da-green-100 text-da-green-600 rounded-full">
                              {serviceDetection.mqtt.status}
                            </span>
                          )}
                        </div>

                        {serviceDetection.mqtt.detected ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-da-gray-600">Endpoint:</span>
                              <span className="font-mono text-xs">{serviceDetection.mqtt.endpoint}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-da-gray-600">Port:</span>
                              <span>{serviceDetection.mqtt.port}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-da-gray-600">Last Checked:</span>
                              <span className="text-xs">{new Date(serviceDetection.mqtt.lastChecked).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-da-red-600">
                              MQTT Broker is recommended for vehicle communication and data streaming.
                            </p>
                            <button
                              onClick={() => handleDeployService('mqtt')}
                              disabled={serviceDetection.mqtt.status === 'deploying'}
                              className="w-full bg-da-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-da-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center space-x-2"
                            >
                              {serviceDetection.mqtt.status === 'deploying' ? (
                                <>
                                  <TbLoader className="w-3 h-3 animate-spin" />
                                  <span>Deploying...</span>
                                </>
                              ) : (
                                <>
                                  <TbPackage className="w-3 h-3" />
                                  <span>Deploy MQTT</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deployment Readiness */}
                    <div className={`border rounded-lg p-4 ${
                      serviceDetection.deploymentReadiness === 'ready'
                        ? 'border-da-green-200 bg-da-green-50'
                        : serviceDetection.deploymentReadiness === 'partial'
                        ? 'border-da-yellow-200 bg-da-yellow-50'
                        : 'border-da-red-200 bg-da-red-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {serviceDetection.deploymentReadiness === 'ready' ? (
                          <TbCheck className="w-5 h-5 text-da-green-600" />
                        ) : serviceDetection.deploymentReadiness === 'partial' ? (
                          <TbAlertTriangle className="w-5 h-5 text-da-yellow-600" />
                        ) : (
                          <TbX className="w-5 h-5 text-da-red-600" />
                        )}
                        <div>
                          <h5 className="font-medium text-da-gray-900">
                            {serviceDetection.deploymentReadiness === 'ready'
                              ? 'Ready for Deployment'
                              : serviceDetection.deploymentReadiness === 'partial'
                              ? 'Partially Ready'
                              : 'Setup Required'
                            }
                          </h5>
                          <p className="text-sm text-da-gray-600 mt-1">
                            {serviceDetection.deploymentReadiness === 'ready'
                              ? 'All required services are available and configured.'
                              : serviceDetection.deploymentReadiness === 'partial'
                              ? 'Some services are available. Deploy missing services for full functionality.'
                              : 'No required services detected. Deploy services to continue.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    {serviceDetection.recommendedActions.length > 0 && (
                      <div className="border border-da-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-da-gray-900 mb-3">Recommended Actions:</h5>
                        <ul className="space-y-2">
                          {serviceDetection.recommendedActions.map((action, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <TbArrowRight className="w-4 h-4 text-da-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-da-gray-600">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: VSS Signal Analysis */}
            {deploymentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-da-gray-900 mb-2">VSS Signal Analysis</h4>
                  <p className="text-sm text-da-gray-600">Automatically detect and resolve VSS signal conflicts</p>
                </div>

                {/* Service Detection Integration */}
                {serviceDetection && (
                  <div className={`border rounded-lg p-4 ${
                    serviceDetection.kuksa.detected
                      ? 'bg-da-green-50 border-da-green-200'
                      : 'bg-da-red-50 border-da-red-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {serviceDetection.kuksa.detected ? (
                        <TbCheck className="w-5 h-5 text-da-green-600 mt-0.5" />
                      ) : (
                        <TbX className="w-5 h-5 text-da-red-600 mt-0.5" />
                      )}
                      <div>
                        <h5 className={`font-medium ${
                          serviceDetection.kuksa.detected ? 'text-da-green-900' : 'text-da-red-900'
                        }`}>
                          KUKSA VSS Integration Status
                        </h5>
                        <p className={`text-sm mt-1 ${
                          serviceDetection.kuksa.detected ? 'text-da-green-700' : 'text-da-red-700'
                        }`}>
                          {serviceDetection.kuksa.detected
                            ? `KUKSA Data Broker v${serviceDetection.kuksa.version} detected at ${serviceDetection.kuksa.endpoint}:${serviceDetection.kuksa.port}. VSS signal conflict analysis is based on this server's configuration.`
                            : 'KUKSA Data Broker not detected. VSS signal conflict detection requires a running KUKSA server. Return to Service Detection to deploy KUKSA.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Conflict Detection Results */}
                <div className="bg-da-blue-50 border border-da-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <TbInfoCircle className="w-5 h-5 text-da-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-da-blue-900">VSS Signal Conflict Analysis</h5>
                      <p className="text-sm text-da-blue-700 mt-1">
                        Analysis based on {serviceDetection?.kuksa.detected ? `KUKSA server configuration at ${serviceDetection.kuksa.endpoint}` : 'standard VSS model'}.
                        Found {conflicts.length} potential conflicts that need attention before deployment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected App Info */}
                {selectedApp && (
                  <div className="border border-da-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-da-gray-900 mb-3">Selected App: {sampleApps.find(a => a.id === selectedApp)?.name}</h5>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-da-gray-700">Required VSS Signals:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sampleApps.find(a => a.id === selectedApp)?.vssSignals.map((signal) => (
                            <span key={signal} className="px-2 py-1 bg-da-gray-100 text-da-gray-700 rounded text-xs">
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conflicts List */}
                {conflicts.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-da-gray-900">Detected Conflicts:</h5>
                    {conflicts.map((conflict) => (
                      <div key={conflict.id} className="border border-da-red-200 rounded-lg p-4 bg-da-red-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <TbAlertTriangle className="w-4 h-4 text-da-red-600" />
                              <span className="font-medium text-da-red-900">{conflict.signalPath}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                conflict.severity === 'high' ? 'bg-da-red-100 text-da-red-700' :
                                conflict.severity === 'medium' ? 'bg-da-yellow-100 text-da-yellow-700' :
                                'bg-da-blue-100 text-da-blue-700'
                              }`}>
                                {conflict.severity}
                              </span>
                            </div>
                            <p className="text-sm text-da-gray-700 mb-2">{conflict.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-da-gray-600">
                              <span>Apps: {conflict.apps.join(', ')}</span>
                              <span>Type: {conflict.conflictType}</span>
                            </div>
                          </div>
                          <button className="text-da-red-600 hover:text-da-red-700">
                            <TbArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-da-green-50 border border-da-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <TbCheck className="w-5 h-5 text-da-green-600" />
                    <span className="text-sm text-da-green-700">
                      Auto-resolution enabled. Conflicts will be automatically resolved during deployment.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Configuration */}
            {deploymentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-da-gray-900 mb-2">Deployment Configuration</h4>
                  <p className="text-sm text-da-gray-600">Configure deployment settings and monitoring options</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Deployment Summary */}
                  <div className="border border-da-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-da-gray-900 mb-3">Deployment Summary</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-da-gray-600">Application:</span>
                        <span className="font-medium">{sampleApps.find(a => a.id === selectedApp)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-da-gray-600">Target Device:</span>
                        <span className="font-medium">{devices.find(d => d.id === selectedTargetDevice)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-da-gray-600">Version:</span>
                        <span className="font-medium">{sampleApps.find(a => a.id === selectedApp)?.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-da-gray-600">Conflicts:</span>
                        <span className="font-medium">{conflicts.length} detected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-da-gray-600">KUKSA Service:</span>
                        <span className={`font-medium ${
                          serviceDetection?.kuksa.detected ? 'text-da-green-600' : 'text-da-red-600'
                        }`}>
                          {serviceDetection?.kuksa.detected ? 'Available' : 'Not Detected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-da-gray-600">MQTT Service:</span>
                        <span className={`font-medium ${
                          serviceDetection?.mqtt.detected ? 'text-da-green-600' : 'text-da-yellow-600'
                        }`}>
                          {serviceDetection?.mqtt.detected ? 'Available' : 'Optional'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Options */}
                  <div className="border border-da-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-da-gray-900 mb-3">Deployment Options</h5>
                    <div className="space-y-3">
                      {Object.entries({
                        enableAutoRestart: 'Auto-restart on failure',
                        enableHealthChecks: 'Enable health monitoring',
                        enableResourceMonitoring: 'Resource usage monitoring',
                        enableConflictResolution: 'Automatic conflict resolution'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deploymentConfig[key as keyof typeof deploymentConfig]}
                            onChange={(e) => setDeploymentConfig(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                            className="rounded border-da-gray-300 text-da-primary-600 focus:ring-da-primary-500"
                          />
                          <span className="text-sm text-da-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resource Requirements */}
                <div className="border border-da-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-da-gray-900 mb-3">Resource Requirements</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedApp && (() => {
                      const app = sampleApps.find(a => a.id === selectedApp)
                      const device = devices.find(d => d.id === selectedTargetDevice)
                      return [
                        { label: 'Memory', value: `${app?.memory || 0}MB`, available: `${device?.memory || 0}MB` },
                        { label: 'CPU', value: `${app?.cpu || 0}%`, available: `${100 - (device?.cpu || 0)}%` },
                        { label: 'VSS Signals', value: app?.vssSignals.length || 0, available: 'N/A' },
                        { label: 'Storage', value: '~50MB', available: '~2GB' }
                      ]
                    })().map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-2xl font-bold text-da-gray-900">{item.value}</div>
                        <div className="text-xs text-da-gray-500">{item.label}</div>
                        <div className="text-xs text-da-green-600">Available: {item.available}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Configuration */}
                {serviceDetection && (
                  <div className="border border-da-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-da-gray-900 mb-3">Service Configuration</h5>
                    <div className="space-y-4">
                      {/* KUKSA Configuration */}
                      <div className={`border rounded-lg p-3 ${
                        serviceDetection.kuksa.detected
                          ? 'border-da-green-200 bg-da-green-50'
                          : 'border-da-red-200 bg-da-red-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              serviceDetection.kuksa.detected ? 'bg-da-green-500' : 'bg-da-red-500'
                            }`}>
                              <TbPlug className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-da-gray-900">KUKSA Data Broker</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              serviceDetection.kuksa.detected
                                ? 'bg-da-green-100 text-da-green-700'
                                : 'bg-da-red-100 text-da-red-700'
                            }`}>
                              {serviceDetection.kuksa.detected ? 'Detected' : 'Not Detected'}
                            </span>
                          </div>
                        </div>
                        {serviceDetection.kuksa.detected ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <label className="text-da-gray-600">Endpoint:</label>
                              <input
                                type="text"
                                value={serviceDetection.kuksa.endpoint || ''}
                                onChange={(e) => {
                                  setServiceDetection(prev => prev ? {
                                    ...prev,
                                    kuksa: { ...prev.kuksa, endpoint: e.target.value }
                                  } : null)
                                }}
                                className="w-full mt-1 px-2 py-1 border border-da-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-da-gray-600">Port:</label>
                              <input
                                type="number"
                                value={serviceDetection.kuksa.port || ''}
                                onChange={(e) => {
                                  setServiceDetection(prev => prev ? {
                                    ...prev,
                                    kuksa: { ...prev.kuksa, port: parseInt(e.target.value) }
                                  } : null)
                                }}
                                className="w-full mt-1 px-2 py-1 border border-da-gray-300 rounded text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-da-red-600">
                            KUKSA Data Broker is required for VSS signal management. Return to Service Detection to deploy.
                          </p>
                        )}
                      </div>

                      {/* MQTT Configuration */}
                      <div className={`border rounded-lg p-3 ${
                        serviceDetection.mqtt.detected
                          ? 'border-da-green-200 bg-da-green-50'
                          : 'border-da-yellow-200 bg-da-yellow-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              serviceDetection.mqtt.detected ? 'bg-da-green-500' : 'bg-da-yellow-500'
                            }`}>
                              <TbWorld className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-da-gray-900">MQTT Broker</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              serviceDetection.mqtt.detected
                                ? 'bg-da-green-100 text-da-green-700'
                                : 'bg-da-yellow-100 text-da-yellow-700'
                            }`}>
                              {serviceDetection.mqtt.detected ? 'Detected' : 'Optional'}
                            </span>
                          </div>
                        </div>
                        {serviceDetection.mqtt.detected ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <label className="text-da-gray-600">Endpoint:</label>
                              <input
                                type="text"
                                value={serviceDetection.mqtt.endpoint || ''}
                                onChange={(e) => {
                                  setServiceDetection(prev => prev ? {
                                    ...prev,
                                    mqtt: { ...prev.mqtt, endpoint: e.target.value }
                                  } : null)
                                }}
                                className="w-full mt-1 px-2 py-1 border border-da-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-da-gray-600">Port:</label>
                              <input
                                type="number"
                                value={serviceDetection.mqtt.port || ''}
                                onChange={(e) => {
                                  setServiceDetection(prev => prev ? {
                                    ...prev,
                                    mqtt: { ...prev.mqtt, port: parseInt(e.target.value) }
                                  } : null)
                                }}
                                className="w-full mt-1 px-2 py-1 border border-da-gray-300 rounded text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-da-yellow-600">
                            MQTT Broker is optional but recommended for vehicle communication.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Final Check Screen */}
            {showFinalCheck && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-da-gray-900 mb-2">Final Check Before Deployment</h4>
                  <p className="text-sm text-da-gray-600">Review all configurations before initiating deployment</p>
                </div>

                <div className="bg-gradient-to-r from-da-yellow-50 to-da-orange-50 border border-da-yellow-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-da-yellow-500 rounded-full flex items-center justify-center">
                      <TbRocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h5 className="text-lg font-semibold text-da-gray-900">Ready to Deploy!</h5>
                      <p className="text-sm text-da-gray-700">All checks passed. You can now deploy your application.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h6 className="font-medium text-da-gray-900 mb-2">Application Details</h6>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-da-gray-600">Name:</span>
                          <span className="font-medium">{sampleApps.find(a => a.id === selectedApp)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-da-gray-600">Version:</span>
                          <span className="font-medium">{sampleApps.find(a => a.id === selectedApp)?.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-da-gray-600">Category:</span>
                          <span className="font-medium">{sampleApps.find(a => a.id === selectedApp)?.category}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h6 className="font-medium text-da-gray-900 mb-2">Target Device</h6>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-da-gray-600">Device:</span>
                          <span className="font-medium">{devices.find(d => d.id === selectedTargetDevice)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-da-gray-600">IP Address:</span>
                          <span className="font-medium">{devices.find(d => d.id === selectedTargetDevice)?.ip}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-da-gray-600">Status:</span>
                          <span className="font-medium text-da-green-600">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-da-yellow-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-da-gray-700">Estimated deployment time:</span>
                      <span className="text-sm font-medium">~2-3 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-da-gray-200">
            <button
              onClick={deploymentStep === 1 ? handleCancelDeployment : handleGoBack}
              className="px-4 py-2 text-da-gray-600 hover:text-da-gray-800 transition-colors"
            >
              {deploymentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex items-center space-x-3">
              {!showFinalCheck ? (
                <button
                  onClick={handleProceedToNextStep}
                  disabled={
                    (deploymentStep === 1 && !selectedApp) ||
                    (deploymentStep === 2 && !selectedTargetDevice)
                  }
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    (deploymentStep === 1 && !selectedApp) ||
                    (deploymentStep === 2 && !selectedTargetDevice)
                      ? 'bg-da-gray-200 text-da-gray-400 cursor-not-allowed'
                      : 'bg-da-primary-500 text-white hover:bg-da-primary-600'
                  }`}
                >
                  <span>{deploymentStep === 5 ? 'Review & Deploy' : 'Next'}</span>
                  <TbArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFinalCheck(false)}
                    className="px-4 py-2 text-da-gray-600 hover:text-da-gray-800 transition-colors"
                  >
                    Back to Configuration
                  </button>
                  <button
                    onClick={handleDeploy}
                    className="px-6 py-2 bg-da-green-500 text-white rounded-lg font-medium hover:bg-da-green-600 transition-colors flex items-center space-x-2"
                  >
                    <TbRocket className="w-4 h-4" />
                    <span>Deploy Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Deployments - Only show when not in deployment flow */}
      {!showDeploymentFlow && (
        <div className="bg-white border border-da-gray-200 rounded-lg">
          <div className="p-4 border-b border-da-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-da-gray-900">Recent Deployments</h3>
            <button className="text-da-primary-600 hover:text-da-primary-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="divide-y divide-da-gray-200">
            {deployedApps.slice(0, 3).map((app) => (
              <div key={app.id} className="p-4 hover:bg-da-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      app.status === 'running' ? 'bg-da-green-100 text-da-green-600' :
                      app.status === 'error' ? 'bg-da-red-100 text-da-red-600' :
                      'bg-da-gray-100 text-da-gray-600'
                    }`}>
                      {getStatusIcon(app.status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-da-gray-900">{app.name}</h4>
                      <p className="text-sm text-da-gray-600">
                        {devices.find(d => d.id === app.deviceId)?.name} • {app.deployedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-da-gray-600">Resources</p>
                      <p className="text-sm font-medium">{app.memory}MB • {app.cpu}% CPU</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-da-gray-400 hover:text-da-gray-600">
                        <TbEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-da-gray-400 hover:text-da-gray-600">
                        <TbRefresh className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}

  const ConflictsTab = () => (
    <div className="space-y-4">
      {/* KUKSA Status */}
      <div className="bg-gradient-to-r from-da-green-50 to-da-emerald-50 border border-da-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TbShield className="w-6 h-6 text-da-green-600" />
            <div>
              <h3 className="font-semibold text-da-green-900">KUKSA VSS Integration</h3>
              <p className="text-sm text-da-green-700">Connected and synchronized with Vehicle Signal Specification</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-da-green-600">Last Sync</p>
              <p className="text-xs text-da-green-600">2 min ago</p>
            </div>
            <button className="p-2 text-da-green-600 hover:bg-da-green-100 rounded-lg transition-colors">
              <TbRefresh className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TbAlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-sm text-red-600">High Severity</p>
              <p className="text-xl font-bold text-red-700">
                {conflicts.filter(c => c.severity === 'high').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TbAlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="text-sm text-yellow-600">Medium Severity</p>
              <p className="text-xl font-bold text-yellow-700">
                {conflicts.filter(c => c.severity === 'medium').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TbInfoCircle className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-blue-600">Low Severity</p>
              <p className="text-xl font-bold text-blue-700">
                {conflicts.filter(c => c.severity === 'low').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Conflicts */}
      <div className="bg-white border border-da-gray-200 rounded-lg">
        <div className="p-4 border-b border-da-gray-200">
          <h3 className="font-semibold text-da-gray-900">Active Signal Conflicts ({conflicts.length})</h3>
          <p className="text-sm text-da-gray-600">Automatically detected VSS signal conflicts requiring resolution</p>
        </div>

        {conflicts.length === 0 ? (
          <div className="p-8 text-center text-da-gray-500">
            <TbShield className="w-12 h-12 mx-auto mb-3 text-da-green-500" />
            <p className="text-lg font-medium text-da-gray-700">All Clear!</p>
            <p>No VSS signal conflicts detected</p>
          </div>
        ) : (
          <div className="divide-y divide-da-gray-200">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="p-6">
                <div className={`rounded-lg border ${getConflictSeverityColor(conflict.severity)}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <TbAlertTriangle className="w-6 h-6" />
                        <div>
                          <h4 className="font-semibold text-lg">{conflict.signalPath}</h4>
                          <p className="text-sm opacity-75">Detected {conflict.detectedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-medium bg-white bg-opacity-70 rounded`}>
                          {conflict.severity.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium bg-white bg-opacity-70 rounded`}>
                          {conflict.conflictType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm mb-4 leading-relaxed">{conflict.description}</p>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1 text-red-700">Impact Assessment:</p>
                      <p className="text-sm">{conflict.impact}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <TbApps className="w-5 h-5" />
                        <div>
                          <span className="text-sm font-medium">Affected Apps:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {conflict.apps.map((app, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-white bg-opacity-70 rounded font-medium">
                                {app}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <TbInfoCircle className="w-5 h-5 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium">Suggested Resolution:</span>
                          <p className="text-sm mt-1">{conflict.suggestedAction}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {conflict.conflictType === 'missing' && (
                        <>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'sync-kuksa')}
                            className="px-4 py-2 text-sm bg-white bg-opacity-70 rounded hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                          >
                            <TbDownload className="w-4 h-4" />
                            <span>Update KUKSA Model</span>
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'remove-signal')}
                            className="px-4 py-2 text-sm bg-white bg-opacity-70 rounded hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                          >
                            <TbX className="w-4 h-4" />
                            <span>Remove Dependency</span>
                          </button>
                        </>
                      )}
                      {conflict.conflictType === 'duplicate' && (
                        <>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'multiplex')}
                            className="px-4 py-2 text-sm bg-white bg-opacity-70 rounded hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                          >
                            <TbArrowsRight className="w-4 h-4" />
                            <span>Enable Multiplexing</span>
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'redeploy')}
                            className="px-4 py-2 text-sm bg-white bg-opacity-70 rounded hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                          >
                            <TbTransform className="w-4 h-4" />
                            <span>Auto-Resolve & Redeploy</span>
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'remove-signal')}
                            className="px-4 py-2 text-sm bg-white bg-opacity-70 rounded hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                          >
                            <TbX className="w-4 h-4" />
                            <span>Manual Configuration</span>
                          </button>
                        </>
                      )}
                      {conflict.conflictType === 'type_mismatch' && (
                        <>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'sync-kuksa')}
                            className="px-4 py-2 text-sm bg-white bg-opacity-70 rounded hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                          >
                            <TbRefresh className="w-4 h-4" />
                            <span>Update Data Type</span>
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'redeploy')}
                            className="px-4 py-2 text-sm bg-white bg-opacity-70 rounded hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                          >
                            <TbTransform className="w-4 h-4" />
                            <span>Auto-Fix & Redeploy</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VSS Signals Overview */}
      <div className="bg-white border border-da-gray-200 rounded-lg">
        <div className="p-4 border-b border-da-gray-200">
          <h3 className="font-semibold text-da-gray-900">VSS Signals Overview ({vssSignals.length} total)</h3>
          <p className="text-sm text-da-gray-600">Complete Vehicle Signal Specification mapping and status</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-da-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-da-gray-500 uppercase tracking-wider">Signal Path</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-da-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-da-gray-500 uppercase tracking-wider">Data Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-da-gray-500 uppercase tracking-wider">Range/Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-da-gray-500 uppercase tracking-wider">Used By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-da-gray-500 uppercase tracking-wider">KUKSA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-da-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-da-gray-200">
              {vssSignals.map((signal, idx) => (
                <tr key={idx} className="hover:bg-da-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-da-gray-900">{signal.path}</td>
                  <td className="px-4 py-3 text-sm text-da-gray-500">
                    <span className={`px-2 py-1 text-xs rounded ${
                      signal.type === 'sensor' ? 'bg-blue-100 text-blue-700' :
                      signal.type === 'actuator' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {signal.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-da-gray-500">
                    <span className="font-mono text-xs">{signal.dataType}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-da-gray-500">
                    {signal.unit && <span className="mr-2">{signal.unit}</span>}
                    {signal.min !== undefined && signal.max !== undefined && (
                      <span className="text-xs">[{signal.min}, {signal.max}]</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {signal.apps.map((app, appIdx) => (
                      <span key={appIdx} className="inline-block px-2 py-1 text-xs bg-da-gray-100 rounded mr-1 font-medium">
                        {app}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {signal.kuksaAvailable ? (
                      <span className="inline-flex items-center text-da-green-600">
                        <TbCheck className="w-4 h-4 mr-1" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-da-red-600">
                        <TbX className="w-4 h-4 mr-1" />
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {signal.conflict ? (
                      <span className="inline-flex items-center text-da-red-600">
                        <TbAlertTriangle className="w-4 h-4 mr-1" />
                        Conflict
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-da-green-600">
                        <TbCheck className="w-4 h-4 mr-1" />
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const DevicesTab = () => (
    <div className="space-y-4">
      {/* Device Connection Guide */}
      <div className="bg-gradient-to-r from-da-blue-50 to-da-indigo-50 border border-da-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-da-blue-900 mb-3">Device Connection Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-da-blue-800 mb-2">Quick Setup Commands:</p>
            <div className="bg-black bg-opacity-10 rounded p-3 font-mono text-sm">
              <p># For Docker-enabled devices</p>
              <p>curl -sSL https://uda.example.com/setup | sh</p>
              <br />
              <p># For non-Docker devices</p>
              <p>curl -sSL https://uda.example.com/setup-native | sh</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-da-blue-800 mb-2">Connection Status:</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">2 devices connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">1 device offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div key={device.id} className={`bg-white border rounded-lg p-4 ${
            device.status === 'online' ? 'border-da-green-200' : 'border-da-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(device.status)}
                <div>
                  <h4 className="font-semibold text-da-gray-900">{device.name}</h4>
                  <p className="text-sm text-da-gray-600">{device.ip}</p>
                </div>
              </div>
              <button className="p-1 text-da-gray-400 hover:text-da-gray-600">
                <TbSettings className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-da-gray-600">Architecture:</span>
                <span className="font-medium">{device.architecture}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-da-gray-600">OS:</span>
                <span className="font-medium">{device.os}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-da-gray-600">Docker:</span>
                <span className={`font-medium ${device.docker ? 'text-da-green-600' : 'text-da-red-600'}`}>
                  {device.docker ? 'Supported' : 'Not Supported'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-da-gray-600">Apps:</span>
                <span className="font-medium">{device.apps}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-da-gray-600">Memory:</span>
                <span className="font-medium">{device.memory}MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-da-gray-600">CPU:</span>
                <div className="flex items-center space-x-1">
                  <span className="font-medium">{device.cpu}%</span>
                  <div className="w-12 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-da-primary-500 h-1.5 rounded-full"
                      style={{ width: `${device.cpu}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-da-gray-600">Last Seen:</span>
                <span className="font-medium">{device.lastSeen}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-da-gray-200 flex space-x-2">
              <button
                onClick={() => setSelectedDevice(device)}
                className="flex-1 px-3 py-2 text-sm bg-da-primary-100 text-da-primary-700 rounded hover:bg-da-primary-200 transition-colors"
              >
                <TbEye className="w-4 h-4 inline mr-1" />
                View Apps
              </button>
              {device.status === 'online' && (
                <button className="px-3 py-2 text-sm bg-da-green-100 text-da-green-700 rounded hover:bg-da-green-200 transition-colors">
                  <TbPlus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-da-primary-500 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Welcome to Universal Deployment Agent</h2>
        <p className="text-lg mb-6 text-white">
          Deploy and manage Python vehicle applications with intelligent VSS signal conflict detection and resolution
        </p>
        <button
          onClick={() => setActiveTab('devices')}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center space-x-2"
        >
          <TbDeviceDesktop className="w-5 h-5" />
          <span>Connect Your First Device</span>
        </button>
      </div>

      {/* Device Status */}
      <div className="bg-white border border-da-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              devices.filter(d => d.status === 'online').length > 0
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}>
              {devices.filter(d => d.status === 'online').length > 0 ? (
                <TbCheck className="w-5 h-5 text-green-600" />
              ) : (
                <TbAlertTriangle className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-da-gray-900">Device Connection Status</h3>
              <p className="text-sm text-da-gray-600">
                {devices.filter(d => d.status === 'online').length} of {devices.length} devices connected
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('devices')}
            className="text-da-primary-500 hover:text-da-primary-600 text-sm font-medium"
          >
            Manage Devices →
          </button>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-da-blue-100 rounded-lg flex items-center justify-center mb-4">
            <TbChartLine className="w-6 h-6 text-da-blue-600" />
          </div>
          <h3 className="font-semibold text-da-gray-900 mb-2">VSS Signal Management</h3>
          <p className="text-sm text-da-gray-600">Automatic detection and resolution of Vehicle Signal Specification conflicts between applications</p>
        </div>

        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-da-green-100 rounded-lg flex items-center justify-center mb-4">
            <TbDeviceDesktop className="w-6 h-6 text-da-green-600" />
          </div>
          <h3 className="font-semibold text-da-gray-900 mb-2">Multi-Device Support</h3>
          <p className="text-sm text-da-gray-600">Deploy and manage applications across multiple vehicle edge devices with real-time monitoring</p>
        </div>

        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-da-purple-100 rounded-lg flex items-center justify-center mb-4">
            <TbShield className="w-6 h-6 text-da-purple-600" />
          </div>
          <h3 className="font-semibold text-da-gray-900 mb-2">KUKSA Integration</h3>
          <p className="text-sm text-da-gray-600">Seamless integration with KUKSA vehicle server for centralized signal management</p>
        </div>

        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-da-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <TbPackage className="w-6 h-6 text-da-yellow-600" />
          </div>
          <h3 className="font-semibold text-da-gray-900 mb-2">Docker Deployment</h3>
          <p className="text-sm text-da-gray-600">Containerized application deployment with automatic resource management and isolation</p>
        </div>

        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-da-red-100 rounded-lg flex items-center justify-center mb-4">
            <TbActivity className="w-6 h-6 text-da-red-600" />
          </div>
          <h3 className="font-semibold text-da-gray-900 mb-2">Real-time Monitoring</h3>
          <p className="text-sm text-da-gray-600">Live monitoring of application performance, resource usage, and signal conflicts</p>
        </div>

        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-da-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <TbTransform className="w-6 h-6 text-da-indigo-600" />
          </div>
          <h3 className="font-semibold text-da-gray-900 mb-2">Auto-Resolution</h3>
          <p className="text-sm text-da-gray-600">Intelligent conflict resolution with multiplexing and automatic redeployment capabilities</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-da-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-da-gray-900 mb-4">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-da-primary-600 mb-2">{devices.length}</div>
            <p className="text-sm text-da-gray-600">Total Devices</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-da-blue-600 mb-2">{deployedApps.length}</div>
            <p className="text-sm text-da-gray-600">Deployed Apps</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-da-purple-600 mb-2">{vssSignals.length}</div>
            <p className="text-sm text-da-gray-600">VSS Signals</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-da-red-600 mb-2">{conflicts.length}</div>
            <p className="text-sm text-da-gray-600">Active Conflicts</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col w-full h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center mb-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <TbRocket className="w-8 h-8 text-da-primary-500" />
          <div>
            <h2 className="text-2xl font-bold text-da-gray-900">Universal Deployment Agent</h2>
            <p className="text-da-gray-600">Python Vehicle App Deployment with VSS Conflict Resolution</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <div className="bg-gradient-to-br from-da-green-50 to-da-emerald-50 border border-da-green-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-green-600">Connected Devices</p>
              <p className="text-2xl font-bold text-da-green-700">
                {devices.filter(d => d.status === 'online').length}/{devices.length}
              </p>
              <p className="text-xs text-da-green-600 mt-1">ECUs Online</p>
            </div>
            <TbDeviceDesktop className="w-8 h-8 text-da-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-da-blue-50 to-da-indigo-50 border border-da-blue-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-blue-600">Deployed Apps</p>
              <p className="text-2xl font-bold text-da-blue-700">{deployedApps.length}</p>
              <p className="text-xs text-da-blue-600 mt-1">
                {deployedApps.filter(a => a.status === 'running').length} Running
              </p>
            </div>
            <TbApps className="w-8 h-8 text-da-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-da-purple-50 to-da-pink-50 border border-da-purple-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-purple-600">VSS Signals</p>
              <p className="text-2xl font-bold text-da-purple-700">{vssSignals.length}</p>
              <p className="text-xs text-da-purple-600 mt-1">
                {vssSignals.filter(s => s.conflict).length} Conflicts
              </p>
            </div>
            <TbChartLine className="w-8 h-8 text-da-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-da-red-50 to-da-orange-50 border border-da-red-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-red-600">Active Conflicts</p>
              <p className="text-2xl font-bold text-da-red-700">{conflicts.length}</p>
              <p className="text-xs text-da-red-600 mt-1">
                {conflicts.filter(c => c.severity === 'high').length} High Priority
              </p>
            </div>
            <TbAlertTriangle className="w-8 h-8 text-da-red-500" />
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-da-gray-100 p-1 rounded-lg flex-shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: TbActivity },
          { id: 'devices', label: 'Devices', icon: TbDeviceDesktop },
          { id: 'deployment-wizard', label: 'Deploy App', icon: TbRocket },
          { id: 'deployments', label: 'Deployments', icon: TbApps },
          { id: 'vss-conflicts', label: 'VSS Conflicts', icon: TbAlertTriangle, count: conflicts.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-da-primary-500 text-white shadow-lg border-2 border-da-primary-600 scale-105'
                : 'text-da-gray-600 hover:text-da-gray-900 hover:bg-da-white hover:shadow-md'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count && tab.count > 0 && (
              <span className="px-2 py-0.5 text-xs bg-da-red-100 text-da-red-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'deployment-wizard' && <DeploymentWizard />}
        {activeTab === 'devices' && <DevicesTab />}
        {activeTab === 'vss-conflicts' && <ConflictsTab />}
        {activeTab === 'deployments' && (
          <div className="bg-white border border-da-gray-200 rounded-lg p-8 text-center h-full flex items-center justify-center">
            <TbApps className="w-12 h-12 mx-auto mb-3 text-da-gray-400" />
            <p className="text-da-gray-500">Detailed deployment management interface</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DaUDADashboard