// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect, useRef } from 'react'
import {
  TbDeviceDesktop,
  TbRocket,
  TbTerminal,
  TbPlayerPlay,
  TbPlayerStop,
  TbRefresh,
  TbTrash,
  TbEye,
  TbSettings,
  TbAlertTriangle,
  TbCheck,
  TbX,
  TbPlus,
  TbDownload,
  TbUpload,
  TbCpu,
  TbProgress,
  TbActivity,
  TbServer,
  TbCode,
  TbBinary,
  TbCloud,
  TbArrowRight
} from 'react-icons/tb'
import useSocketIO from '@/hooks/useSocketIO'

interface VehicleEdgeRuntime {
  id: string
  name: string
  status: 'online' | 'offline' | 'connecting'
  lastSeen: Date
  version: string
  capabilities: string[]
}

interface RunningApp {
  id: string
  name: string
  type: 'python' | 'binary'
  status: 'running' | 'stopped' | 'error'
  startTime?: Date
  resources: {
    cpu: number
    memory: number
  }
  consoleOutput: string[]
}

interface VehicleEdgeRuntimeDashboardProps {
  onClose: () => void
  prototype?: any
}

const DaVehicleEdgeRuntimeDashboard: FC<VehicleEdgeRuntimeDashboardProps> = ({ 
  onClose, 
  prototype 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deploy' | 'apps' | 'console' | 'settings'>('overview')
  const [runtimes, setRuntimes] = useState<VehicleEdgeRuntime[]>([])
  const [selectedRuntime, setSelectedRuntime] = useState<VehicleEdgeRuntime | null>(null)
  const [runningApps, setRunningApps] = useState<RunningApp[]>([])
  const [selectedApp, setSelectedApp] = useState<RunningApp | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentConfig, setDeploymentConfig] = useState({
    type: 'python' as 'python' | 'binary',
    code: prototype?.code || '',
    entryPoint: 'main.py',
    envVars: {} as Record<string, string>,
    resourceLimits: {
      memory: 512,
      cpu: 50
    }
  })
  
  const consoleEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // WebSocket connection for real-time updates
  const socket = useSocketIO()

  useEffect(() => {
    // Auto-scroll console output
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [consoleOutput])

  useEffect(() => {
    // Initialize with mock data (replace with actual API calls)
    const mockRuntimes: VehicleEdgeRuntime[] = [
      {
        id: 'vehicle-runtime-001',
        name: 'Local Vehicle Runtime',
        status: 'online',
        lastSeen: new Date(),
        version: '1.0.0',
        capabilities: ['run_python_app', 'run_binary_app', 'console_subscribe', 'stop_app', 'get_app_status']
      },
      {
        id: 'cloud-runtime-002',
        name: 'Cloud Vehicle Runtime',
        status: 'online',
        lastSeen: new Date(),
        version: '1.0.0',
        capabilities: ['run_python_app', 'run_binary_app', 'console_subscribe', 'stop_app', 'get_app_status']
      }
    ]
    setRuntimes(mockRuntimes)
    setSelectedRuntime(mockRuntimes[0])

    // Mock running apps
    const mockApps: RunningApp[] = [
      {
        id: 'app-001',
        name: 'Vehicle Speed Monitor',
        type: 'python',
        status: 'running',
        startTime: new Date(Date.now() - 5 * 60 * 1000),
        resources: { cpu: 15, memory: 256 },
        consoleOutput: ['Starting vehicle speed monitor...', 'Connected to VSS databroker', 'Monitoring Vehicle.Speed signal...']
      }
    ]
    setRunningApps(mockApps)
  }, [])

  const handleDeployApp = async () => {
    if (!selectedRuntime) return

    setIsDeploying(true)
    try {
      // Send deployment command via WebSocket
      socket?.emit('messageToKit', {
        cmd: deploymentConfig.type === 'python' ? 'run_python_app' : 'run_binary_app',
        to_kit_id: selectedRuntime.id,
        data: {
          code: deploymentConfig.code,
          entryPoint: deploymentConfig.entryPoint,
          env: deploymentConfig.envVars,
          workingDir: '/app',
          resourceLimits: deploymentConfig.resourceLimits
        }
      })

      // Simulate deployment success (replace with actual response handling)
      setTimeout(() => {
        const newApp: RunningApp = {
          id: `app-${Date.now()}`,
          name: prototype?.name || 'New App',
          type: deploymentConfig.type,
          status: 'running',
          startTime: new Date(),
          resources: { cpu: 10, memory: 128 },
          consoleOutput: ['Application deployed successfully', 'Starting execution...']
        }
        setRunningApps(prev => [...prev, newApp])
        setIsDeploying(false)
        setActiveTab('apps')
      }, 2000)
    } catch (error) {
      console.error('Deployment failed:', error)
      setIsDeploying(false)
    }
  }

  const handleStopApp = (appId: string) => {
    if (!selectedRuntime) return

    socket?.emit('messageToKit', {
      cmd: 'stop_app',
      to_kit_id: selectedRuntime.id,
      data: { appId }
    })

    setRunningApps(prev => 
      prev.map(app => 
        app.id === appId 
          ? { ...app, status: 'stopped' as const }
          : app
      )
    )
  }

  const handleViewConsole = (app: RunningApp) => {
    setSelectedApp(app)
    setConsoleOutput(app.consoleOutput)
    setActiveTab('console')
    
    // Subscribe to real-time console output
    socket?.emit('messageToKit', {
      cmd: 'console_subscribe',
      to_kit_id: selectedRuntime?.id,
      data: { executionId: app.id }
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setDeploymentConfig(prev => ({ ...prev, code: content }))
      }
      reader.readAsText(file)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'offline':
      case 'stopped':
        return 'text-gray-600 bg-gray-100'
      case 'connecting':
      case 'error':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
        return <TbCheck className="w-4 h-4" />
      case 'offline':
      case 'stopped':
        return <TbX className="w-4 h-4" />
      case 'connecting':
      case 'error':
        return <TbAlertTriangle className="w-4 h-4" />
      default:
        return <TbAlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-da-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-da-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TbServer className="w-8 h-8 text-da-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-da-gray-900">Vehicle Edge Runtime</h2>
              <p className="text-da-gray-600">Deploy and manage vehicle applications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-da-gray-100 rounded-lg transition-colors"
          >
            <TbX className="w-5 h-5 text-da-gray-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-da-gray-200 px-6">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: TbDeviceDesktop },
            { id: 'deploy', label: 'Deploy', icon: TbRocket },
            { id: 'apps', label: 'Applications', icon: TbCode, count: runningApps.length },
            { id: 'console', label: 'Console', icon: TbTerminal },
            { id: 'settings', label: 'Settings', icon: TbSettings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-da-primary-500 text-da-primary-600'
                  : 'border-transparent text-da-gray-600 hover:text-da-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-da-primary-100 text-da-primary-600 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Runtime Selection */}
            <div className="bg-white rounded-lg border border-da-gray-200 p-6">
              <h3 className="text-lg font-semibold text-da-gray-900 mb-4">Connected Runtimes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runtimes.map((runtime) => (
                  <div
                    key={runtime.id}
                    onClick={() => setSelectedRuntime(runtime)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRuntime?.id === runtime.id
                        ? 'border-da-primary-500 bg-da-primary-50'
                        : 'border-da-gray-200 hover:border-da-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <TbDeviceDesktop className="w-5 h-5 text-da-primary-500" />
                        <h4 className="font-medium text-da-gray-900">{runtime.name}</h4>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(runtime.status)}`}>
                        {getStatusIcon(runtime.status)}
                        <span>{runtime.status}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-da-gray-600">
                      <p>Version: {runtime.version}</p>
                      <p>ID: {runtime.id}</p>
                      <p>Last seen: {runtime.lastSeen.toLocaleTimeString()}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {runtime.capabilities.slice(0, 3).map((cap) => (
                        <span key={cap} className="text-xs bg-da-gray-100 text-da-gray-700 px-2 py-1 rounded">
                          {cap}
                        </span>
                      ))}
                      {runtime.capabilities.length > 3 && (
                        <span className="text-xs bg-da-gray-100 text-da-gray-700 px-2 py-1 rounded">
                          +{runtime.capabilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-da-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-da-gray-600">Running Apps</p>
                    <p className="text-2xl font-bold text-da-gray-900">{runningApps.filter(app => app.status === 'running').length}</p>
                  </div>
                  <TbActivity className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-da-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-da-gray-600">Total Deployments</p>
                    <p className="text-2xl font-bold text-da-gray-900">{runningApps.length}</p>
                  </div>
                  <TbRocket className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-da-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-da-gray-600">Active Runtimes</p>
                    <p className="text-2xl font-bold text-da-gray-900">{runtimes.filter(rt => rt.status === 'online').length}</p>
                  </div>
                  <TbServer className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg border border-da-gray-200 p-6">
              <h3 className="text-lg font-semibold text-da-gray-900 mb-4">Deploy New Application</h3>
              
              {/* Application Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-da-gray-700 mb-2">Application Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeploymentConfig(prev => ({ ...prev, type: 'python' }))}
                    className={`p-4 border rounded-lg transition-all ${
                      deploymentConfig.type === 'python'
                        ? 'border-da-primary-500 bg-da-primary-50'
                        : 'border-da-gray-200 hover:border-da-gray-300'
                    }`}
                  >
                    <TbCode className="w-6 h-6 mx-auto mb-2 text-da-primary-500" />
                    <p className="font-medium">Python Application</p>
                    <p className="text-sm text-da-gray-600">Run Python code in container</p>
                  </button>
                  <button
                    onClick={() => setDeploymentConfig(prev => ({ ...prev, type: 'binary' }))}
                    className={`p-4 border rounded-lg transition-all ${
                      deploymentConfig.type === 'binary'
                        ? 'border-da-primary-500 bg-da-primary-50'
                        : 'border-da-gray-200 hover:border-da-gray-300'
                    }`}
                  >
                    <TbBinary className="w-6 h-6 mx-auto mb-2 text-da-primary-500" />
                    <p className="font-medium">Binary Application</p>
                    <p className="text-sm text-da-gray-600">Execute pre-compiled binary</p>
                  </button>
                </div>
              </div>

              {/* Code Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-da-gray-700">
                    {deploymentConfig.type === 'python' ? 'Python Code' : 'Binary URL'}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={deploymentConfig.type === 'python' ? '.py,.txt' : ''}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {deploymentConfig.type === 'python' && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 px-3 py-1 text-sm border border-da-gray-300 rounded hover:bg-da-gray-50"
                      >
                        <TbUpload className="w-4 h-4" />
                        <span>Upload File</span>
                      </button>
                    )}
                    <button
                      onClick={() => setDeploymentConfig(prev => ({ ...prev, code: prototype?.code || '' }))}
                      className="flex items-center space-x-1 px-3 py-1 text-sm border border-da-gray-300 rounded hover:bg-da-gray-50"
                    >
                      <TbDownload className="w-4 h-4" />
                      <span>Use Prototype Code</span>
                    </button>
                  </div>
                </div>
                {deploymentConfig.type === 'python' ? (
                  <textarea
                    value={deploymentConfig.code}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full h-64 px-3 py-2 border border-da-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                    placeholder="print('Hello Vehicle Edge Runtime!')&#10;import time&#10;while True:&#10;    print('Running...')&#10;    time.sleep(1)"
                  />
                ) : (
                  <input
                    type="url"
                    value={deploymentConfig.code}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                    placeholder="https://example.com/app-binary"
                  />
                )}
              </div>

              {/* Configuration */}
              {deploymentConfig.type === 'python' && (
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-da-gray-700 mb-1">Entry Point</label>
                    <input
                      type="text"
                      value={deploymentConfig.entryPoint}
                      onChange={(e) => setDeploymentConfig(prev => ({ ...prev, entryPoint: e.target.value }))}
                      className="w-full px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-da-gray-700 mb-1">Working Directory</label>
                    <input
                      type="text"
                      value="/app"
                      disabled
                      className="w-full px-3 py-2 border border-da-gray-300 rounded-lg bg-da-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Resource Limits */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-da-gray-700 mb-2">Resource Limits</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-da-gray-600 mb-1">Memory Limit (MB)</label>
                    <input
                      type="number"
                      value={deploymentConfig.resourceLimits.memory}
                      onChange={(e) => setDeploymentConfig(prev => ({
                        ...prev,
                        resourceLimits: { ...prev.resourceLimits, memory: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-da-gray-600 mb-1">CPU Limit (%)</label>
                    <input
                      type="number"
                      value={deploymentConfig.resourceLimits.cpu}
                      onChange={(e) => setDeploymentConfig(prev => ({
                        ...prev,
                        resourceLimits: { ...prev.resourceLimits, cpu: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Environment Variables */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-da-gray-700 mb-2">Environment Variables</label>
                <div className="space-y-2">
                  {Object.entries(deploymentConfig.envVars).map(([key, value]) => (
                    <div key={key} className="flex space-x-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newVars = { ...deploymentConfig.envVars }
                          delete newVars[key]
                          setDeploymentConfig(prev => ({ ...prev, envVars: { ...newVars, [e.target.value]: value } }))
                        }}
                        className="flex-1 px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                        placeholder="Variable name"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setDeploymentConfig(prev => ({
                          ...prev,
                          envVars: { ...prev.envVars, [key]: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                        placeholder="Variable value"
                      />
                      <button
                        onClick={() => setDeploymentConfig(prev => ({
                          ...prev,
                          envVars: Object.fromEntries(Object.entries(prev.envVars).filter(([k]) => k !== key))
                        }))}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TbTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setDeploymentConfig(prev => ({
                      ...prev,
                      envVars: { ...prev.envVars, ['']: '' }
                    }))}
                    className="flex items-center space-x-1 px-3 py-2 text-da-primary-600 hover:bg-da-primary-50 rounded-lg"
                  >
                    <TbPlus className="w-4 h-4" />
                    <span>Add Environment Variable</span>
                  </button>
                </div>
              </div>

              {/* Deploy Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleDeployApp}
                  disabled={!selectedRuntime || !deploymentConfig.code || isDeploying}
                  className="flex items-center space-x-2 px-6 py-3 bg-da-primary-500 text-white rounded-lg font-medium hover:bg-da-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeploying ? (
                    <>
                      <TbRefresh className="w-5 h-5 animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <TbRocket className="w-5 h-5" />
                      <span>Deploy to {selectedRuntime?.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-da-gray-200">
              <div className="px-6 py-4 border-b border-da-gray-200">
                <h3 className="text-lg font-semibold text-da-gray-900">Running Applications</h3>
              </div>
              <div className="divide-y divide-da-gray-200">
                {runningApps.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <TbCode className="w-12 h-12 text-da-gray-400 mx-auto mb-4" />
                    <p className="text-da-gray-600">No applications deployed yet</p>
                    <button
                      onClick={() => setActiveTab('deploy')}
                      className="mt-4 px-4 py-2 bg-da-primary-500 text-white rounded-lg hover:bg-da-primary-600"
                    >
                      Deploy First Application
                    </button>
                  </div>
                ) : (
                  runningApps.map((app) => (
                    <div key={app.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${app.type === 'python' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {app.type === 'python' ? <TbCode className="w-5 h-5" /> : <TbBinary className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-da-gray-900">{app.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-da-gray-600">
                              <span>Type: {app.type}</span>
                              {app.startTime && <span>Started: {app.startTime.toLocaleTimeString()}</span>}
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {getStatusIcon(app.status)}
                                <span>{app.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right text-sm">
                            <div className="flex items-center space-x-1 text-da-gray-600">
                              <TbCpu className="w-3 h-3" />
                              <span>{app.resources.cpu}%</span>
                            </div>
                            <div className="flex items-center space-x-1 text-da-gray-600">
                              <TbProgress className="w-3 h-3" />
                              <span>{app.resources.memory}MB</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewConsole(app)}
                            className="p-2 text-da-gray-600 hover:bg-da-gray-100 rounded-lg"
                            title="View Console"
                          >
                            <TbTerminal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => app.status === 'running' ? handleStopApp(app.id) : null}
                            className={`p-2 rounded-lg ${
                              app.status === 'running'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-da-gray-400 cursor-not-allowed'
                            }`}
                            title={app.status === 'running' ? 'Stop Application' : 'Application already stopped'}
                          >
                            {app.status === 'running' ? <TbPlayerStop className="w-4 h-4" /> : <TbPlayerPlay className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-da-gray-200">
              <div className="px-6 py-4 border-b border-da-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-da-gray-900">Console Output</h3>
                  {selectedApp && (
                    <p className="text-sm text-da-gray-600">{selectedApp.name} - {selectedApp.id}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConsoleOutput([])}
                    className="flex items-center space-x-1 px-3 py-1 text-sm border border-da-gray-300 rounded hover:bg-da-gray-50"
                  >
                    <TbTrash className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={() => {
                      if (selectedApp) {
                        handleViewConsole(selectedApp)
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-sm border border-da-gray-300 rounded hover:bg-da-gray-50"
                  >
                    <TbRefresh className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {consoleOutput.length === 0 ? (
                  <div className="text-center py-12">
                    <TbTerminal className="w-12 h-12 text-da-gray-400 mx-auto mb-4" />
                    <p className="text-da-gray-600">No console output available</p>
                    {selectedApp && (
                      <p className="text-sm text-da-gray-500 mt-2">Select an application to view its console output</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                    {consoleOutput.map((line, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {line}
                      </div>
                    ))}
                    <div ref={consoleEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg border border-da-gray-200 p-6">
              <h3 className="text-lg font-semibold text-da-gray-900 mb-4">Runtime Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-da-gray-700 mb-2">Default Runtime</label>
                  <select
                    value={selectedRuntime?.id || ''}
                    onChange={(e) => {
                      const runtime = runtimes.find(rt => rt.id === e.target.value)
                      setSelectedRuntime(runtime || null)
                    }}
                    className="w-full px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                  >
                    {runtimes.map((runtime) => (
                      <option key={runtime.id} value={runtime.id}>
                        {runtime.name} ({runtime.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-da-gray-700 mb-2">WebSocket URL</label>
                  <input
                    type="text"
                    value="ws://localhost:3002/runtime"
                    disabled
                    className="w-full px-3 py-2 border border-da-gray-300 rounded-lg bg-da-gray-50"
                  />
                  <p className="text-sm text-da-gray-600 mt-1">Vehicle Edge Runtime WebSocket endpoint</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-da-gray-700 mb-2">Kit Manager URL</label>
                  <input
                    type="text"
                    value="ws://localhost:3090"
                    disabled
                    className="w-full px-3 py-2 border border-da-gray-300 rounded-lg bg-da-gray-50"
                  />
                  <p className="text-sm text-da-gray-600 mt-1">Kit Manager WebSocket endpoint for runtime communication</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-da-gray-700 mb-2">Default Memory Limit (MB)</label>
                    <input
                      type="number"
                      defaultValue="512"
                      className="w-full px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-da-gray-700 mb-2">Default CPU Limit (%)</label>
                    <input
                      type="number"
                      defaultValue="50"
                      className="w-full px-3 py-2 border border-da-gray-300 rounded-lg focus:ring-2 focus:ring-da-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DaVehicleEdgeRuntimeDashboard