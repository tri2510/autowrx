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
    setDeploymentStep(0)
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

  const DeploymentWizard = () => (
    <div className="space-y-6">
      {/* Quick Deploy CTA */}
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

      {/* Deployment Flow Visualization */}
      {showDeploymentFlow && (
        <div className="bg-white border border-da-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-da-gray-900 mb-6">Deployment Progress</h3>
          <div className="space-y-4">
            {deploymentFlowSteps.map((step, index) => (
              <div key={step.step} className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-da-green-500 text-white' :
                  step.status === 'active' ? 'bg-da-primary-500 text-white' :
                  'bg-da-gray-200 text-da-gray-400'
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-da-gray-900">{step.title}</h4>
                      <p className="text-sm text-da-gray-600">{step.description}</p>
                    </div>
                    {step.status === 'completed' && (
                      <TbCheck className="w-5 h-5 text-da-green-500" />
                    )}
                    {step.status === 'active' && (
                      <TbLoader className="w-5 h-5 text-da-primary-500 animate-spin" />
                    )}
                  </div>
                </div>
                {index < deploymentFlowSteps.length - 1 && (
                  <div className={`w-8 h-0.5 ${step.status === 'completed' ? 'bg-da-green-500' : 'bg-da-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deployments */}
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
    </div>
  )

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
      <div className="bg-gradient-to-r from-da-primary-500 to-da-blue-600 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Welcome to Universal Deployment Agent</h2>
        <p className="text-lg mb-6 text-white text-opacity-90">
          Deploy and manage Python vehicle applications with intelligent VSS signal conflict detection and resolution
        </p>
        <button
          onClick={() => setActiveTab('deployment-wizard')}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center space-x-2"
        >
          <TbRocket className="w-5 h-5" />
          <span>Deploy Your First App</span>
        </button>
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
          { id: 'deployment-wizard', label: 'Deploy App', icon: TbRocket },
          { id: 'devices', label: 'Devices', icon: TbDeviceDesktop },
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