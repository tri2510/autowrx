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
  TbCube,
  TbDeviceDesktop,
  TbApps,
  TbDatabase,
  TbMessageCircle,
  TbActivity,
  TbCpu,
  TbDeviceFloppy,
  TbNetwork,
  TbClock,
  TbCloudUpload,
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
  TbCar,
  TbSearch,
  TbPlus,
  TbEdit,
  TbTrash,
  TbUsers,
  TbLockOpen,
  TbBolt,
  TbGauge,
  TbTemperature,
  TbSignalG,
  TbChartLine,
  TbRadar,
  TbStack,
  TbGitBranch,
  TbArrowsJoin,
  TbHexagon,
  TbTopologyStar,
  TbComponents,
  TbTransfer
} from 'react-icons/tb'

interface DaUDASetupDashboardProps {
  onCancel?: () => void
  target?: any
  onFinish?: () => void
}

// Types for Fleet Management
interface Device {
  id: string
  name: string
  ip: string
  platform: string
  status: 'online' | 'offline' | 'warning'
  lastSeen: string
  resources: {
    cpu: number
    memory: number
    storage: number
    temperature: number
  }
  apps: DeviceApp[]
  capabilities: string[]
  group: string
  uptime?: string
  latency?: number
  services: DeviceService[]
  deploymentMode: 'standalone' | 'hybrid-full' | 'hybrid-partial'
}

interface DeviceService {
  name: string
  type: 'kuksa' | 'mqtt' | 'vss' | 'python' | 'docker' | 'custom'
  version: string
  status: 'running' | 'stopped' | 'available'
  port?: number
  endpoint?: string
  managedBy: 'uda' | 'external' | 'sdv-runtime'
}

interface DeviceApp {
  id: string
  name: string
  version: string
  status: 'running' | 'stopped' | 'error'
  resources: {
    cpu: number
    memory: number
  }
  autoStart: boolean
  deployedAt: string
  signalCount: number
}

interface DeviceGroup {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  deviceCount: number
  onlineCount: number
  totalApps: number
}

const DaUDASetupDashboard: FC<DaUDASetupDashboardProps> = ({
  onCancel,
  target,
  onFinish
}) => {
  const [view, setView] = useState<'welcome' | 'fleet' | 'device' | 'deployment' | 'setup'>('welcome')
  const [setupStep, setSetupStep] = useState<'method' | 'connect' | 'install' | 'manage'>('method')
  const [selectedMethod, setSelectedMethod] = useState<'ip' | 'manual' | null>(null)
  const [agentIP, setAgentIP] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [connectedAgent, setConnectedAgent] = useState<any>(null)

  // Fleet management state
  const [devices, setDevices] = useState<Device[]>([
    {
      id: 'vehicle-001',
      name: 'Vehicle-001',
      ip: '192.168.1.100',
      platform: 'Raspberry Pi 4',
      status: 'online',
      lastSeen: 'Just now',
      resources: { cpu: 45, memory: 30, storage: 6, temperature: 42 },
      apps: [
        { id: 'app-1', name: 'door-control-v1', version: '1.2.3', status: 'running', resources: { cpu: 5, memory: 45 }, autoStart: true, deployedAt: '2025-11-20', signalCount: 2 },
        { id: 'app-2', name: 'seat-heater-v2', version: '2.1.0', status: 'running', resources: { cpu: 12, memory: 67 }, autoStart: true, deployedAt: '2025-11-22', signalCount: 3 }
      ],
      capabilities: ['python', 'velocitas-sdk', 'service-discovery', 'fleet-orchestration'],
      group: 'production',
      uptime: '3d 14h',
      latency: 12,
      deploymentMode: 'hybrid-full',
      services: [
        { name: 'KUKSA Data Broker', type: 'kuksa', version: '0.4.0', status: 'running', port: 55555, managedBy: 'external' },
        { name: 'MQTT Broker', type: 'mqtt', version: '5.0', status: 'running', port: 1883, managedBy: 'external' },
        { name: 'VSS Repository', type: 'vss', version: '4.0', status: 'available', endpoint: '/vss', managedBy: 'uda' },
        { name: 'Python Runtime', type: 'python', version: '3.9', status: 'running', managedBy: 'uda' }
      ]
    },
    {
      id: 'vehicle-002',
      name: 'Vehicle-002',
      ip: '192.168.1.101',
      platform: 'Raspberry Pi 4',
      status: 'online',
      lastSeen: '2 min ago',
      resources: { cpu: 23, memory: 20, storage: 4, temperature: 38 },
      apps: [
        { id: 'app-3', name: 'speed-monitor-v1', version: '1.0.1', status: 'running', resources: { cpu: 3, memory: 23 }, autoStart: true, deployedAt: '2025-11-25', signalCount: 1 }
      ],
      capabilities: ['python', 'velocitas-sdk', 'service-discovery'],
      group: 'production',
      uptime: '5d 8h',
      latency: 15,
      deploymentMode: 'hybrid-partial',
      services: [
        { name: 'KUKSA Data Broker', type: 'kuksa', version: '0.4.0', status: 'running', port: 55555, managedBy: 'uda' },
        { name: 'Python Runtime', type: 'python', version: '3.9', status: 'running', managedBy: 'uda' }
      ]
    },
    {
      id: 'vehicle-003',
      name: 'Vehicle-003',
      ip: '192.168.1.102',
      platform: 'NVIDIA Jetson',
      status: 'online',
      lastSeen: '1 min ago',
      resources: { cpu: 67, memory: 95, storage: 15, temperature: 55 },
      apps: [
        { id: 'app-4', name: 'lane-assist-v2', version: '2.0.0', status: 'running', resources: { cpu: 25, memory: 156 }, autoStart: true, deployedAt: '2025-11-24', signalCount: 4 },
        { id: 'app-5', name: 'gps-tracker-v1', version: '1.1.0', status: 'running', resources: { cpu: 8, memory: 89 }, autoStart: true, deployedAt: '2025-11-23', signalCount: 2 }
      ],
      capabilities: ['python', 'velocitas-sdk', 'service-discovery', 'docker', 'fleet-orchestration'],
      group: 'production',
      uptime: '2d 3h',
      latency: 8,
      deploymentMode: 'standalone',
      services: [
        { name: 'KUKSA Data Broker', type: 'kuksa', version: '0.4.0', status: 'running', port: 55555, managedBy: 'uda' },
        { name: 'MQTT Broker', type: 'mqtt', version: '5.0', status: 'running', port: 1883, managedBy: 'uda' },
        { name: 'VSS Repository', type: 'vss', version: '4.0', status: 'available', endpoint: '/vss', managedBy: 'uda' },
        { name: 'Docker Engine', type: 'docker', version: '20.10', status: 'running', managedBy: 'uda' },
        { name: 'Python Runtime', type: 'python', version: '3.9', status: 'running', managedBy: 'uda' }
      ]
    },
    {
      id: 'dev-001',
      name: 'DevBoard-A1',
      ip: '192.168.1.200',
      platform: 'Raspberry Pi 4',
      status: 'online',
      lastSeen: 'Just now',
      resources: { cpu: 12, memory: 12, storage: 2, temperature: 35 },
      apps: [],
      capabilities: ['python', 'velocitas-sdk', 'service-discovery'],
      group: 'development',
      uptime: '1d 12h',
      latency: 5,
      deploymentMode: 'standalone',
      services: [
        { name: 'Python Runtime', type: 'python', version: '3.9', status: 'running', managedBy: 'uda' }
      ]
    },
    {
      id: 'dev-002',
      name: 'DevBoard-B2',
      ip: '192.168.1.201',
      platform: 'Raspberry Pi 4',
      status: 'offline',
      lastSeen: '2 hours ago',
      resources: { cpu: 0, memory: 0, storage: 0, temperature: 0 },
      apps: [],
      capabilities: ['python', 'velocitas-sdk'],
      group: 'development',
      deploymentMode: 'standalone',
      services: []
    },
    {
      id: 'sim-001',
      name: 'Simulator-C3',
      ip: '10.0.0.100',
      platform: 'Virtual Environment',
      status: 'offline',
      lastSeen: '30 min ago',
      resources: { cpu: 0, memory: 0, storage: 0, temperature: 0 },
      apps: [],
      capabilities: ['python', 'service-discovery'],
      group: 'development',
      deploymentMode: 'hybrid-partial',
      services: [
        { name: 'SDV Runtime', type: 'docker', version: '2.1.0', status: 'stopped', managedBy: 'external' }
      ]
    }
  ])

  const deviceGroups: DeviceGroup[] = [
    {
      id: 'production',
      name: 'Production',
      icon: <TbCar className="w-4 h-4" />,
      description: 'Live production vehicles',
      deviceCount: devices.filter(d => d.group === 'production').length,
      onlineCount: devices.filter(d => d.group === 'production' && d.status === 'online').length,
      totalApps: devices.filter(d => d.group === 'production').reduce((sum, d) => sum + d.apps.length, 0)
    },
    {
      id: 'development',
      name: 'Development',
      icon: <TbDeviceDesktop className="w-4 h-4" />,
      description: 'Development and testing boards',
      deviceCount: devices.filter(d => d.group === 'development').length,
      onlineCount: devices.filter(d => d.group === 'development' && d.status === 'online').length,
      totalApps: devices.filter(d => d.group === 'development').reduce((sum, d) => sum + d.apps.length, 0)
    }
  ]

  // Fleet metrics
  const fleetMetrics = {
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status === 'online').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    totalApps: devices.reduce((sum, d) => sum + d.apps.length, 0),
    runningApps: devices.reduce((sum, d) => sum + d.apps.filter(a => a.status === 'running').length, 0),
    avgLatency: devices.filter(d => d.latency).reduce((sum, d) => sum + (d.latency || 0), 0) / devices.filter(d => d.latency).length,
    totalMemory: devices.reduce((sum, d) => sum + d.resources.memory, 0)
  }

  // Real connection management
  const [socketConnection, setSocketConnection] = useState<any>(null)

  // Connection Management Functions
  const testConnection = async (ip: string) => {
    setConnectionStatus('connecting')
    try {
      // Test basic TCP connection to check if UDA agent is accessible
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`http://${ip}:3090`, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      setConnectionStatus('connected')
      return true
    } catch (error) {
      setConnectionStatus('failed')
      return false
    }
  }

  const handleConnectToAgent = async () => {
    if (!agentIP) return

    const success = await testConnection(agentIP)
    if (success) {
      // Create agent object for management
      setConnectedAgent({
        id: `agent-${Date.now()}`,
        name: `Agent at ${agentIP}`,
        ip: agentIP,
        status: 'connected',
        capabilities: ['python', 'velocitas-sdk', 'kuksa-databroker'],
        uptime: 'just now'
      })
      setSetupStep('manage')
    }
  }

  // Welcome Screen
  const renderWelcomeScreen = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <TbServer className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to UDA Agent</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Universal Deployment Agent for vehicle applications - Deploy and manage your SDV apps across multiple devices
          </p>
        </div>
      </div>

      {/* Quick Intro Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <TbRadar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Service Discovery</h3>
          <p className="text-sm text-gray-600">
            Automatically detect and integrate with existing KUKSA, MQTT, and VSS services in your network
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <TbArrowsJoin className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Hybrid Deployment</h3>
          <p className="text-sm text-gray-600">
            Seamlessly integrate with SDV Runtime or use standalone - flexible deployment for any infrastructure
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <TbTopologyStar className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Fleet Orchestration</h3>
          <p className="text-sm text-gray-600">
            Manage distributed vehicle apps across multiple devices with centralized control and monitoring
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <TbBolt className="w-5 h-5" />
          Getting Started
        </h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-800">1</span>
            </div>
            <div>
              <p className="font-medium">Install UDA Agent on your device</p>
              <p className="text-sm opacity-90">Run the agent on your vehicle device, development board, or simulator</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-800">2</span>
            </div>
            <div>
              <p className="font-medium">Connect your device</p>
              <p className="text-sm opacity-90">Use quick connect or enter the device IP address manually</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-800">3</span>
            </div>
            <div>
              <p className="font-medium">Deploy vehicle apps</p>
              <p className="text-sm opacity-90">Send your applications and monitor their performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={() => {
            setView('setup')
            setSetupStep('method')
          }}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <TbPlus className="w-5 h-5" />
          Add Your First Device
        </button>

        <button
          onClick={() => setView('fleet')}
          className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <TbActivity className="w-5 h-5" />
          View Fleet
        </button>
      </div>

      {/* Help Section */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Need help? Check out the <a href="#" className="text-blue-600 hover:underline">UDA Agent documentation</a>
        </p>
        <p className="text-xs text-gray-500">
          UDA Agent supports Python applications with Velocitas SDK and KUKSA Data Broker integration
        </p>
      </div>
    </div>
  )

  const renderSetupMethod = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <TbServer className="w-6 h-6 text-blue-500" />
          Connect UDA Agent
        </h2>
        <p className="text-gray-600">Choose how you want to set up your UDA Agent connection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Connect Method */}
        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
             onClick={() => setSelectedMethod('ip')}>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <TbWifi className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold">Quick Connect</h3>
            <p className="text-sm text-gray-600">
              Connect to UDA Agent by IP address. Fast and simple for agents already running.
            </p>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Recommended for most users
            </div>
          </div>
        </div>

        {/* Manual Install Method */}
        <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer"
             onClick={() => setSelectedMethod('manual')}>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <TbDownload className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Manual Setup</h3>
            <p className="text-sm text-gray-600">
              Install UDA Agent manually with step-by-step guide. For new deployments.
            </p>
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              Full control over installation
            </div>
          </div>
        </div>
      </div>

      {selectedMethod === 'ip' && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TbWifi className="w-5 h-5 text-blue-600" />
            Quick Connect via IP
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">UDA Agent IP Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agentIP}
                  onChange={(e) => setAgentIP(e.target.value)}
                  placeholder="192.168.1.100"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleConnectToAgent}
                  disabled={!agentIP || connectionStatus === 'connecting'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {connectionStatus === 'connecting' ? (
                    <>
                      <TbRefresh className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <TbPlug className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Make sure UDA Agent is running on this IP with default port 3090
              </p>
            </div>

            {/* Connection Status */}
            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-md ${
                connectionStatus === 'connected'
                  ? 'bg-green-50 border border-green-200'
                  : connectionStatus === 'failed'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  {connectionStatus === 'connected' && <TbCheck className="w-5 h-5 text-green-600" />}
                  {connectionStatus === 'failed' && <TbX className="w-5 h-5 text-red-600" />}
                  {connectionStatus === 'connecting' && <TbRefresh className="w-5 h-5 text-blue-600 animate-spin" />}
                  <span className="font-medium">
                    {connectionStatus === 'connected' && '✅ Connection Successful!'}
                    {connectionStatus === 'failed' && '❌ Connection Failed'}
                    {connectionStatus === 'connecting' && '🔄 Connecting...'}
                  </span>
                </div>
                {connectionStatus === 'connected' && (
                  <p className="text-sm text-gray-600 mt-1">
                    UDA Agent is ready for vehicle app deployment
                  </p>
                )}
                {connectionStatus === 'failed' && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-red-600">Possible issues:</p>
                    <ul className="list-disc list-inside text-red-600 ml-2">
                      <li>UDA Agent not running on target device</li>
                      <li>Firewall blocking port 3090</li>
                      <li>Incorrect IP address</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedMethod === 'manual' && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50 space-y-6">
          <h3 className="font-semibold flex items-center gap-2">
            <TbDownload className="w-5 h-5 text-green-600" />
            Manual UDA Agent Installation
          </h3>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-medium">Clone UDA Agent Repository</h4>
              </div>
              <code className="block bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
                git clone https://github.com/tri2510/uda-deployment-agent.git<br/>
                cd uda-deployment-agent
              </code>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <h4 className="font-medium">Install Dependencies</h4>
              </div>
              <code className="block bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
                pip install -r config/requirements.txt
              </code>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <h4 className="font-medium">Start UDA Agent</h4>
              </div>
              <div className="space-y-2">
                <code className="block bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
                  python3 src/uda_agent.py --server http://localhost:3090
                </code>
                <p className="text-sm text-gray-600">
                  Replace <code className="bg-gray-100 px-1 rounded">http://localhost:3090</code> with your AutoWRX server URL
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <TbAlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">After Installation</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Once UDA Agent is running, return to this screen and use "Quick Connect" to establish connection.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMethod(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Methods
              </button>
              <button
                onClick={() => setSetupStep('manage')}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                I Have Installed UDA Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Management Interface
  const renderAgentManagement = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <TbServer className="w-6 h-6 text-green-500" />
          UDA Agent Management
        </h2>
        <p className="text-gray-600">
          Manage your connected UDA Agent and deploy vehicle applications
        </p>
      </div>

      {connectedAgent && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <TbCheck className="w-5 h-5 text-green-600" />
                Connected to {connectedAgent.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                IP: {connectedAgent.ip} • Status: Connected • Uptime: {connectedAgent.uptime}
              </p>
            </div>
            <button
              onClick={() => {
                setConnectedAgent(null)
                setSetupStep('method')
                setSelectedMethod(null)
                setConnectionStatus('idle')
              }}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Status */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TbActivity className="w-5 h-5 text-blue-500" />
            Agent Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Connection:</span>
              <span className="text-sm text-green-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Platform:</span>
              <span className="text-sm">Linux</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Agent ID:</span>
              <span className="text-sm font-mono">{connectedAgent?.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Uptime:</span>
              <span className="text-sm">{connectedAgent?.uptime || 'N/A'}</span>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-1">
              {connectedAgent?.capabilities?.map((cap: string) => (
                <span key={cap} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {cap}
                </span>
              )) || (
                <span className="text-xs text-gray-500">No capabilities loaded</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TbSettings className="w-5 h-5 text-purple-500" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => handleDeployVehicleApp()}
              disabled={isDeploying}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeploying ? (
                <>
                  <TbRefresh className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <TbCloudUpload className="w-4 h-4" />
                  Deploy Current App
                </>
              )}
            </button>

            <button
              onClick={() => handleStopVehicleApp()}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <TbPlayerStop className="w-4 h-4" />
              Stop All Apps
            </button>

            <button
              onClick={() => handleRefreshAgentStatus()}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <TbRefresh className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Status */}
      {deploymentStatus && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TbActivity className="w-5 h-5 text-orange-500" />
            Deployment Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <span className={`text-sm font-medium ${
                deploymentStatus.status === 'success' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {deploymentStatus.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">App Name:</span>
              <span className="text-sm">{deploymentStatus.appName || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Process ID:</span>
              <span className="text-sm">{deploymentStatus.pid || 'N/A'}</span>
            </div>
            {deploymentStatus.message && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                {deploymentStatus.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // Action handlers
  const handleDeployVehicleApp = async () => {
    if (!connectedAgent) return

    setIsDeploying(true)
    setDeploymentStatus(null)

    try {
      // This would integrate with the current app deployment system
      // For now, simulate deployment
      setTimeout(() => {
        setDeploymentStatus({
          status: 'success',
          appName: 'Current Vehicle App',
          pid: Math.floor(Math.random() * 10000) + 1000,
          message: 'Vehicle app deployed successfully to UDA Agent'
        })
        setIsDeploying(false)
      }, 2000)
    } catch (error) {
      setDeploymentStatus({
        status: 'failed',
        appName: 'Current Vehicle App',
        message: 'Deployment failed: ' + error
      })
      setIsDeploying(false)
    }
  }

  const handleStopVehicleApp = async () => {
    if (!connectedAgent) return

    // This would send stop command to UDA Agent
    setDeploymentStatus({
      status: 'stopped',
      appName: 'All Vehicle Apps',
      message: 'Stop command sent to UDA Agent'
    })
  }

  const handleRefreshAgentStatus = async () => {
    if (!connectedAgent) return

    // Update uptime to simulate refresh
    setConnectedAgent({
      ...connectedAgent,
      uptime: new Date().toLocaleTimeString()
    })
  }

  // Progress indicator
  const renderProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['method', 'connect', 'install', 'manage'].map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              // @ts-ignore
              ['method', 'connect', 'install', 'manage'].indexOf(setupStep) >= index
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index + 1}
          </div>
          {index < 3 && (
            <div
              className={`w-8 h-1 mx-2 ${
                // @ts-ignore
                ['method', 'connect', 'install', 'manage'].indexOf(setupStep) > index
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  // Fleet Overview Component
  const renderFleetOverview = () => (
    <div className="space-y-6">
      {/* Fleet Metrics */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TbDeviceDesktop className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{fleetMetrics.onlineDevices}</span>
            </div>
            <div className="text-xs text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TbX className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{fleetMetrics.offlineDevices}</span>
            </div>
            <div className="text-xs text-gray-600">Offline</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TbApps className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{fleetMetrics.totalApps}</span>
            </div>
            <div className="text-xs text-gray-600">Total Apps</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TbBolt className="w-4 h-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{fleetMetrics.avgLatency.toFixed(0)}ms</span>
            </div>
            <div className="text-xs text-gray-600">Avg Latency</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TbDeviceFloppy className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">{fleetMetrics.totalMemory}%</span>
            </div>
            <div className="text-xs text-gray-600">Total RAM</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TbAlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">1</span>
            </div>
            <div className="text-xs text-gray-600">Issues</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Last sync: 2 min ago • Fleet: {fleetMetrics.totalDevices} devices
        </div>
      </div>

      {/* Service Discovery Status */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TbRadar className="w-5 h-5 text-blue-500" />
          Service Discovery Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TbCheck className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">KUKSA Data Broker</span>
              </div>
              <span className="text-sm text-green-600">3 found</span>
            </div>
            <p className="text-sm text-green-700 mt-1">Vehicle signal access ready</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TbCheck className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">MQTT Brokers</span>
              </div>
              <span className="text-sm text-green-600">2 found</span>
            </div>
            <p className="text-sm text-green-700 mt-1">Message routing available</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TbComponents className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">VSS Repositories</span>
              </div>
              <span className="text-sm text-blue-600">2 found</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">Signal catalogs loaded</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 text-sm">
            <TbRadar className="w-4 h-4" />
            Run Discovery
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm">
            <TbSettings className="w-4 h-4" />
            Configure Services
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TbActivity className="w-5 h-5 text-blue-500" />
          Fleet Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-sm">
            <TbCloudUpload className="w-4 h-4" />
            Deploy to Fleet
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm">
            <TbPlus className="w-4 h-4" />
            Add Device
          </button>
          <button className="px-3 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 flex items-center justify-center gap-2 text-sm">
            <TbGitBranch className="w-4 h-4" />
            Switch Mode
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm">
            <TbTopologyStar className="w-4 h-4" />
            Orchestrate
          </button>
        </div>
      </div>

      {/* Device Groups */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TbUsers className="w-5 h-5 text-purple-500" />
          Device Groups
        </h3>
        {deviceGroups.map((group) => (
          <div key={group.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  group.onlineCount === group.deviceCount ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                  {group.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{group.name}</h4>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    group.onlineCount === group.deviceCount
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {group.onlineCount}/{group.deviceCount} Online
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {group.totalApps} apps
                </div>
              </div>
            </div>

            {/* Device Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {devices
                .filter(device => device.group === group.id)
                .map((device) => (
                  <div
                    key={device.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                      device.status === 'online' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedDevice(device)
                      setView('device')
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-sm">{device.name}</span>
                      </div>
                      {device.status === 'online' && (
                        <span className="text-xs text-gray-600">{device.latency}ms</span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>{device.platform}</span>
                        <span>{device.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📱 {device.apps.length} apps</span>
                        <span>💾 {device.resources.memory}% RAM</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          device.deploymentMode === 'standalone' ? 'bg-blue-100 text-blue-800' :
                          device.deploymentMode === 'hybrid-full' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {device.deploymentMode === 'standalone' ? '🏠 Standalone' :
                           device.deploymentMode === 'hybrid-full' ? '🔄 Hybrid-Full' :
                           '⚡ Hybrid-Partial'}
                        </span>
                        <span>🔧 {device.services.length} services</span>
                      </div>
                      {device.uptime && (
                        <div className="text-gray-500">
                          Uptime: {device.uptime}
                        </div>
                      )}
                    </div>
                    {device.apps.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex flex-wrap gap-1">
                          {device.apps.slice(0, 2).map((app) => (
                            <span key={app.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {app.name}
                            </span>
                          ))}
                          {device.apps.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              +{device.apps.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Group Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Deploy to Group
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Group Settings
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <TbSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devices, apps, or IPs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Filters
          </button>
        </div>
      </div>
    </div>
  )

  // Device Management Component
  const renderDeviceManagement = () => {
    if (!selectedDevice) return null

    return (
      <div className="space-y-6">
        {/* Device Header */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('fleet')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Fleet
              </button>
              <div className={`w-3 h-3 rounded-full ${
                selectedDevice.status === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <h3 className="text-lg font-semibold">{selectedDevice.name}</h3>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                <TbRefresh className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                <TbSettings className="w-4 h-4 mr-2" />
                Configure
              </button>
              <button className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                <TbX className="w-4 h-4 mr-2" />
                Disconnect
              </button>
            </div>
          </div>

          {/* Device Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Platform</div>
              <div className="font-semibold">{selectedDevice.platform}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">IP Address</div>
              <div className="font-semibold">{selectedDevice.ip}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold text-green-600">{selectedDevice.status}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Latency</div>
              <div className="font-semibold">{selectedDevice.latency}ms</div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Resources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">CPU</span>
                <span className="text-sm font-medium">{selectedDevice.resources.cpu}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${selectedDevice.resources.cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Memory</span>
                <span className="text-sm font-medium">{selectedDevice.resources.memory}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${selectedDevice.resources.memory}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="text-sm font-medium">{selectedDevice.resources.storage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${selectedDevice.resources.storage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Temperature</span>
                <span className="text-sm font-medium">{selectedDevice.resources.temperature}°C</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    selectedDevice.resources.temperature > 60 ? 'bg-red-500' :
                    selectedDevice.resources.temperature > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(selectedDevice.resources.temperature * 1.5, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TbComponents className="w-5 h-5" />
              Services ({selectedDevice.services.length})
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
                <TbRadar className="w-4 h-4 mr-2" />
                Discover
              </button>
              <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                <TbSettings className="w-4 h-4 mr-2" />
                Configure
              </button>
            </div>
          </div>

          {/* Deployment Mode Indicator */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TbGitBranch className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Deployment Mode</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedDevice.deploymentMode === 'standalone' ? 'bg-blue-100 text-blue-800' :
                selectedDevice.deploymentMode === 'hybrid-full' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedDevice.deploymentMode === 'standalone' ? '🏠 Standalone' :
                 selectedDevice.deploymentMode === 'hybrid-full' ? '🔄 Hybrid-Full (Integrates with SDV Runtime)' :
                 '⚡ Hybrid-Partial (Selective Integration)'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {selectedDevice.services.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{service.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.status === 'running' ? 'bg-green-100 text-green-800' :
                        service.status === 'stopped' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {service.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.managedBy === 'uda' ? 'bg-purple-100 text-purple-800' :
                        service.managedBy === 'external' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {service.managedBy === 'uda' ? '🔧 UDA Managed' :
                         service.managedBy === 'external' ? '🔗 External' :
                         '🐳 SDV Runtime'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Version: {service.version} • Type: {service.type}
                      {service.port && ` • Port: ${service.port}`}
                      {service.endpoint && ` • Endpoint: ${service.endpoint}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <TbEye className="w-4 h-4" />
                    </button>
                    {service.managedBy === 'uda' && (
                      <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                        <TbSettings className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {selectedDevice.services.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No services discovered yet
              </div>
            )}
          </div>
        </div>

        {/* Applications */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Applications ({selectedDevice.apps.length})</h3>
            <button className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
              <TbPlus className="w-4 h-4 mr-2" />
              Deploy App
            </button>
          </div>
          <div className="space-y-3">
            {selectedDevice.apps.map((app) => (
              <div key={app.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{app.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        app.status === 'running' ? 'bg-green-100 text-green-800' :
                        app.status === 'stopped' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Version: {app.version} • Deployed: {app.deployedAt} •
                      {app.autoStart ? 'Auto-start enabled' : 'Manual start'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <TbEye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                      <TbRefresh className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <TbTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>CPU: {app.resources.cpu}%</span>
                  <span>Memory: {app.resources.memory}MB</span>
                  <span>VSS Signals: {app.signalCount}</span>
                </div>
              </div>
            ))}
            {selectedDevice.apps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No applications deployed yet
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl h-[80vh] max-h-[700px] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        {view === 'welcome' ? (
          // Welcome screen header - minimal
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TbServer className="w-5 h-5 text-blue-500" />
              UDA Agent Setup
            </h2>
            <button
              onClick={onCancel}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <TbX className="w-4 h-4" />
              Close
            </button>
          </div>
        ) : (
          // Normal navigation header
          <>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TbServer className="w-5 h-5 text-blue-500" />
                UDA Fleet Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your fleet of UDA agents for vehicle application deployment
              </p>
            </div>
            <div className="flex gap-2">
              {/* View Navigation */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('fleet')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    view === 'fleet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TbActivity className="w-4 h-4 mr-2" />
                  Fleet
                </button>
                <button
                  onClick={() => setView('setup')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    view === 'setup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TbPlus className="w-4 h-4 mr-2" />
                  Add Device
                </button>
              </div>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('uda-agent-connected', 'true')
                  onFinish?.()
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Finish
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === 'welcome' && renderWelcomeScreen()}
        {view === 'fleet' && renderFleetOverview()}
        {view === 'device' && renderDeviceManagement()}
        {view === 'setup' && renderSetupMethod()}
      </div>
    </div>
  )
}

export default DaUDASetupDashboard