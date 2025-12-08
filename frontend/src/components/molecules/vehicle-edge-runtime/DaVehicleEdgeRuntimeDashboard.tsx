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
  TbArrowRight,
  TbTool,
  TbWifi,
  TbPlug,
  TbPlugConnected
} from 'react-icons/tb'
import useSocketIO from '@/hooks/useSocketIO'
import DaDeviceSetupWizard from './DaDeviceSetupWizard'
import kitManagerService, { VehicleEdgeRuntimeKit, KitManagerMessage } from '@/services/kitManager.service'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import { DetectedDevice } from '@/utils/networkDiscovery'

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

interface DeploymentResult {
  status: 'success' | 'error' | 'pending'
  message: string
  data?: any
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
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [kits, setKits] = useState<VehicleEdgeRuntimeKit[]>([])
  const [selectedKit, setSelectedKit] = useState<VehicleEdgeRuntimeKit | null>(null)
  const [runningApps, setRunningApps] = useState<RunningApp[]>([])
  const [selectedApp, setSelectedApp] = useState<RunningApp | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
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

  // Initialize Kit Manager connection and fetch kits
  useEffect(() => {
    const initializeKitManager = async () => {
      try {
        setConnectionError(null)
        await kitManagerService.connect()
        setIsConnected(true)

        // Setup event listeners
        setupKitManagerEventListeners()

        // Request initial kits list
        kitManagerService.requestKits()

        // Also fetch kits via REST as backup
        const kitsResponse = await kitManagerService.listKits()
        if (kitsResponse.status === 'OK') {
          setKits(kitsResponse.content)
        }
      } catch (error) {
        console.error('Failed to initialize Kit Manager:', error)
        setConnectionError(error instanceof Error ? error.message : 'Failed to connect to Kit Manager')
        setIsConnected(false)
      }
    }

    initializeKitManager()

    return () => {
      kitManagerService.removeAllListeners()
      kitManagerService.disconnect()
    }
  }, [])

  // Setup Kit Manager event listeners
  const setupKitManagerEventListeners = () => {
    // Listen for kits updates
    kitManagerService.onKitsUpdate((updatedKits) => {
      setKits(updatedKits)
    })

    // Listen for kit messages (deployment results, etc.)
    kitManagerService.onKitMessage((message) => {
      handleKitMessage(message)
    })

    // Listen for connection events
    kitManagerService.onConnect(() => {
      setIsConnected(true)
      setConnectionError(null)
    })

    kitManagerService.onDisconnect((reason) => {
      setIsConnected(false)
      console.warn('Kit Manager disconnected:', reason)
    })

    kitManagerService.onConnectError((error) => {
      setConnectionError(error.message)
      setIsConnected(false)
    })
  }

  // Handle messages from kits
  const handleKitMessage = (message: KitManagerMessage) => {
    // Handle deployment results
    if (message.status === 'OK' || message.status === 'SUCCESS') {
      setDeploymentResult({
        status: 'success',
        message: message.message,
        data: message.data
      })
    } else {
      setDeploymentResult({
        status: 'error',
        message: message.message || 'Unknown error',
        data: message.data
      })
    }

    // Add console output if available
    if (message.data?.output) {
      setConsoleOutput(prev => [...prev, message.data.output])
    }
  }

  useEffect(() => {
    // Auto-scroll console output
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [consoleOutput])

  const handleSetupWizardComplete = (deviceInfo: any) => {
    // Refresh kits list after setup wizard completes
    kitManagerService.requestKits()
    setShowSetupWizard(false)
    setActiveTab('overview')
  }

  useEffect(() => {
    // Auto-select first kit if none selected
    if (!selectedKit && kits.length > 0) {
      const onlineKit = kits.find(kit => kit.is_online) || kits[0]
      setSelectedKit(onlineKit)
    }
  }, [kits, selectedKit])

  const handleDeployApp = async () => {
    if (!selectedKit) return

    setIsDeploying(true)
    setDeploymentResult(null)

    try {
      // Add deployment start message to console
      setConsoleOutput(prev => [...prev, `Deploying ${deploymentConfig.type} app to ${selectedKit.name}...`])

      let finalCode = deploymentConfig.code

      // Convert code to Vehicle App format if it's Python
      if (deploymentConfig.type === 'python' && finalCode) {
        try {
          const convertResponse = await kitManagerService.convertCode({ code: finalCode })
          if (convertResponse.status === 'OK') {
            finalCode = convertResponse.content
            setConsoleOutput(prev => [...prev, 'Code converted to Vehicle App format'])
          }
        } catch (convertError) {
          setConsoleOutput(prev => [...prev, 'Warning: Code conversion failed, using original code'])
          console.warn('Code conversion failed:', convertError)
        }
      }

      // Deploy the application
      await kitManagerService.deployApp(
        selectedKit.kit_id,
        finalCode || '',
        prototype?.name || 'New App'
      )

      // The deployment result will be handled by the event listener
      setConsoleOutput(prev => [...prev, 'Deployment request sent successfully'])
    } catch (error) {
      console.error('Deployment failed:', error)
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Deployment failed'
      })
      setConsoleOutput(prev => [...prev, `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setIsDeploying(false)
    }
  }

  const handleStopApp = async (appId: string) => {
    if (!selectedKit) return

    try {
      setConsoleOutput(prev => [...prev, `Stopping app ${appId}...`])

      // Send stop command to the kit
      kitManagerService.sendMessageToKit({
        to_kit_id: selectedKit.kit_id,
        cmd: 'stop_app',
        appId: appId
      })

      setRunningApps(prev =>
        prev.map(app =>
          app.id === appId
            ? { ...app, status: 'stopped' as const }
            : app
        )
      )

      setConsoleOutput(prev => [...prev, `Stop command sent to ${selectedKit.name}`])
    } catch (error) {
      console.error('Failed to stop app:', error)
      setConsoleOutput(prev => [...prev, `Failed to stop app: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }

  const handleViewConsole = (app: RunningApp) => {
    setSelectedApp(app)
    setConsoleOutput([`Console output for ${app.name}:`, ...app.consoleOutput])
    setActiveTab('console')

    if (selectedKit) {
      // Subscribe to real-time console output
      kitManagerService.subscribeToKit(selectedKit.kit_id)
      setConsoleOutput(prev => [...prev, `Subscribed to real-time updates from ${selectedKit.name}`])
    }
  }

  const handleRefreshKits = async () => {
    try {
      setConsoleOutput(prev => [...prev, 'Refreshing kits list...'])

      // Request fresh kits list via WebSocket
      kitManagerService.requestKits()

      // Also fetch via REST as backup
      const kitsResponse = await kitManagerService.listKits()
      if (kitsResponse.status === 'OK') {
        setKits(kitsResponse.content)
        setConsoleOutput(prev => [...prev, `Found ${kitsResponse.content.length} kits`])
      } else {
        setConsoleOutput(prev => [...prev, `Failed to fetch kits: ${kitsResponse.message}`])
      }
    } catch (error) {
      console.error('Failed to refresh kits:', error)
      setConsoleOutput(prev => [...prev, `Failed to refresh kits: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }

  const handleReconnect = async () => {
    try {
      setConnectionError(null)
      await kitManagerService.connect()
      setConsoleOutput(prev => [...prev, 'Reconnected to Kit Manager'])
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to reconnect')
    }
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
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center space-x-3">
          <TbServer className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Vehicle Edge Runtime</h2>
            <p className="text-muted-foreground">Deploy and manage vehicle applications</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: TbDeviceDesktop },
            { id: 'deploy', label: 'Deploy', icon: TbRocket },
            { id: 'apps', label: 'Applications', icon: TbCode, count: runningApps.length },
            { id: 'console', label: 'Console', icon: TbTerminal },
            { id: 'settings', label: 'Settings', icon: TbSettings }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Runtime Selection */}
            <div className="rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Vehicle Edge Runtimes {isConnected ? <TbPlugConnected className="w-5 h-5 text-green-500 ml-2" /> : <TbPlug className="w-5 h-5 text-yellow-500 ml-2" />}
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleRefreshKits}
                    variant="outline"
                    size="sm"
                    title="Refresh kits"
                  >
                    <TbRefresh className="w-4 h-4" />
                  </Button>
                  {connectionError && (
                    <Button
                      onClick={handleReconnect}
                      variant="outline"
                      size="sm"
                      title="Reconnect to Kit Manager"
                    >
                      Reconnect
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowSetupWizard(true)}
                    className="flex items-center space-x-2"
                  >
                    <TbPlus className="w-4 h-4" />
                    <span>Add Device</span>
                  </Button>
                </div>
              </div>

              {connectionError ? (
                <div className="text-center py-12">
                  <TbAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Connection Error</h3>
                  <p className="text-muted-foreground mb-4">{connectionError}</p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Make sure the Vehicle Edge Runtime is running on port 3090
                    </p>
                    <Button
                      onClick={handleRefreshKits}
                      className="mx-auto"
                    >
                      <TbRefresh className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : kits.length === 0 ? (
                <div className="text-center py-12">
                  <TbWifi className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Vehicle Edge Runtimes Connected</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Get started by adding your first Vehicle Edge Runtime device. Our setup wizard will guide you through the entire process.
                  </p>
                  <div className="space-y-3 max-w-sm mx-auto">
                    <Button
                      onClick={() => setShowSetupWizard(true)}
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <TbTool className="w-5 h-5" />
                      <span>Setup Your First Device</span>
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Works with Raspberry Pi, Linux PCs, and existing runtimes
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kits.map((kit) => (
                    <div
                      key={kit.kit_id}
                      onClick={() => setSelectedKit(kit)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedKit?.kit_id === kit.kit_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <TbDeviceDesktop className="w-5 h-5 text-primary" />
                          <h4 className="font-medium text-foreground">{kit.name}</h4>
                        </div>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kit.is_online ? 'online' : 'offline')}`}>
                          {getStatusIcon(kit.is_online ? 'online' : 'offline')}
                          <span>{kit.is_online ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>ID: {kit.kit_id}</p>
                        <p>Apps: {kit.noRunner}</p>
                        <p>Subscribers: {kit.noSubscriber}</p>
                        <p>Last seen: {new Date(kit.last_seen).toLocaleTimeString()}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {kit.support_apis.slice(0, 3).map((api) => (
                          <span key={api} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                            {api.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {kit.support_apis.length > 3 && (
                          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                            +{kit.support_apis.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats - Only show if we have kits */}
            {kits.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Running Apps</p>
                      <p className="text-2xl font-bold text-foreground">{kits.reduce((sum, kit) => sum + kit.noRunner, 0)}</p>
                    </div>
                    <TbActivity className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Subscribers</p>
                      <p className="text-2xl font-bold text-foreground">{kits.reduce((sum, kit) => sum + kit.noSubscriber, 0)}</p>
                    </div>
                    <TbRocket className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Online Runtimes</p>
                      <p className="text-2xl font-bold text-foreground">{kits.filter(kit => kit.is_online).length}/{kits.length}</p>
                    </div>
                    <TbServer className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {kits.length === 0 ? (
              <div className="rounded-lg border border-border p-6 text-center">
                <TbServer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Runtimes Available</h3>
                <p className="text-muted-foreground mb-6">
                  {connectionError ?
                    `Connection error: ${connectionError}. Make sure the Vehicle Edge Runtime is running on port 3090.` :
                    'You need to connect a Vehicle Edge Runtime before deploying applications.'}
                </p>
                <Button
                  onClick={() => connectionError ? handleReconnect() : setShowSetupWizard(true)}
                  className="mx-auto"
                >
                  <TbTool className="w-4 h-4 mr-2" />
                  {connectionError ? 'Reconnect' : 'Setup Vehicle Edge Runtime'}
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Deploy New Application</h3>

              {/* Application Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Application Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={deploymentConfig.type === 'python' ? 'default' : 'outline'}
                    onClick={() => setDeploymentConfig(prev => ({ ...prev, type: 'python' }))}
                    className="p-4 h-auto flex flex-col items-center"
                  >
                    <TbCode className="w-6 h-6 mb-2 text-primary" />
                    <p className="font-medium">Python Application</p>
                    <p className="text-sm text-muted-foreground">Run Python code in container</p>
                  </Button>
                  <Button
                    variant={deploymentConfig.type === 'binary' ? 'default' : 'outline'}
                    onClick={() => setDeploymentConfig(prev => ({ ...prev, type: 'binary' }))}
                    className="p-4 h-auto flex flex-col items-center"
                  >
                    <TbBinary className="w-6 h-6 mb-2 text-primary" />
                    <p className="font-medium">Binary Application</p>
                    <p className="text-sm text-muted-foreground">Execute pre-compiled binary</p>
                  </Button>
                </div>
              </div>

              {/* Code Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <TbUpload className="w-4 h-4 mr-1" />
                        Upload File
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeploymentConfig(prev => ({ ...prev, code: prototype?.code || '' }))}
                    >
                      <TbDownload className="w-4 h-4 mr-1" />
                      Use Prototype Code
                    </Button>
                  </div>
                </div>
                {deploymentConfig.type === 'python' ? (
                  <textarea
                    value={deploymentConfig.code}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full h-64 px-3 py-2 border border-border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="print('Hello Vehicle Edge Runtime!')&#10;import time&#10;while True:&#10;    print('Running...')&#10;    time.sleep(1)"
                  />
                ) : (
                  <Input
                    type="url"
                    value={deploymentConfig.code}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="https://example.com/app-binary"
                  />
                )}
              </div>

              {/* Configuration */}
              {deploymentConfig.type === 'python' && (
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Entry Point</label>
                    <Input
                      value={deploymentConfig.entryPoint}
                      onChange={(e) => setDeploymentConfig(prev => ({ ...prev, entryPoint: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Working Directory</label>
                    <Input
                      value="/app"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              )}

              {/* Resource Limits */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Resource Limits</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Memory Limit (MB)</label>
                    <Input
                      type="number"
                      value={deploymentConfig.resourceLimits.memory}
                      onChange={(e) => setDeploymentConfig(prev => ({
                        ...prev,
                        resourceLimits: { ...prev.resourceLimits, memory: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">CPU Limit (%)</label>
                    <Input
                      type="number"
                      value={deploymentConfig.resourceLimits.cpu}
                      onChange={(e) => setDeploymentConfig(prev => ({
                        ...prev,
                        resourceLimits: { ...prev.resourceLimits, cpu: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Deploy Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleDeployApp}
                  disabled={!selectedKit || !deploymentConfig.code || isDeploying || !selectedKit.is_online}
                >
                  {isDeploying ? (
                    <>
                      <TbRefresh className="w-5 h-5 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <TbRocket className="w-5 h-5 mr-2" />
                      Deploy to {selectedKit?.name}
                    </>
                  )}
                </Button>
              </div>

              {/* Deployment Result */}
              {deploymentResult && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  deploymentResult.status === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-start space-x-2">
                    {deploymentResult.status === 'success' ? (
                      <TbCheck className="w-5 h-5 mt-0.5" />
                    ) : (
                      <TbAlertTriangle className="w-5 h-5 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">
                        {deploymentResult.status === 'success' ? 'Deployment Successful' : 'Deployment Failed'}
                      </p>
                      <p className="text-sm">{deploymentResult.message}</p>
                      {deploymentResult.data && (
                        <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-x-auto">
                          {JSON.stringify(deploymentResult.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-6">
            {kits.length === 0 ? (
              <div className="rounded-lg border border-border p-6 text-center">
                <TbCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Runtime Available</h3>
                <p className="text-muted-foreground mb-6">
                  You need to connect a Vehicle Edge Runtime before viewing applications.
                </p>
                <Button
                  onClick={() => setShowSetupWizard(true)}
                  className="mx-auto"
                >
                  <TbTool className="w-4 h-4 mr-2" />
                  Setup Vehicle Edge Runtime
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Running Applications</h3>
                </div>
              <div className="divide-y divide-border">
                {runningApps.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <TbCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No applications deployed yet</p>
                    <Button
                      onClick={() => setActiveTab('deploy')}
                      className="mt-4"
                    >
                      Deploy First Application
                    </Button>
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
                            <h4 className="font-medium text-foreground">{app.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <TbCpu className="w-3 h-3" />
                              <span>{app.resources.cpu}%</span>
                            </div>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <TbProgress className="w-3 h-3" />
                              <span>{app.resources.memory}MB</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewConsole(app)}
                            title="View Console"
                          >
                            <TbTerminal className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={app.status === 'running' ? 'destructive' : 'ghost'}
                            size="icon"
                            onClick={() => app.status === 'running' ? handleStopApp(app.id) : null}
                            title={app.status === 'running' ? 'Stop Application' : 'Application already stopped'}
                          >
                            {app.status === 'running' ? <TbPlayerStop className="w-4 h-4" /> : <TbPlayerPlay className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
                  {selectedApp && (
                    <p className="text-sm text-muted-foreground">{selectedApp.name} - {selectedApp.id}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConsoleOutput([])}
                  >
                    <TbTrash className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedApp) {
                        handleViewConsole(selectedApp)
                      }
                    }}
                  >
                    <TbRefresh className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {consoleOutput.length === 0 ? (
                  <div className="text-center py-12">
                    <TbTerminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No console output available</p>
                    {selectedApp && (
                      <p className="text-sm text-muted-foreground mt-2">Select an application to view its console output</p>
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
            <div className="rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Runtime Settings</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Default Runtime</label>
                  <select
                    value={selectedKit?.kit_id || ''}
                    onChange={(e) => {
                      const kit = kits.find(k => k.kit_id === e.target.value)
                      setSelectedKit(kit || null)
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {kits.map((kit) => (
                      <option key={kit.kit_id} value={kit.kit_id}>
                        {kit.name} ({kit.is_online ? 'Online' : 'Offline'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">WebSocket URL</label>
                  <Input
                    value="ws://localhost:3002/runtime"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Vehicle Edge Runtime WebSocket endpoint</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Kit Manager URL</label>
                  <Input
                    value="ws://localhost:3090"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Kit Manager WebSocket endpoint for runtime communication</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Default Memory Limit (MB)</label>
                    <Input
                      type="number"
                      defaultValue="512"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Default CPU Limit (%)</label>
                    <Input
                      type="number"
                      defaultValue="50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-6xl h-[90vh] max-h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden border">
              <DaDeviceSetupWizard
                onClose={() => setShowSetupWizard(false)}
                onComplete={handleSetupWizardComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DaVehicleEdgeRuntimeDashboard