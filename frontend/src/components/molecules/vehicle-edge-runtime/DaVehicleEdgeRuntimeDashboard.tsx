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
  TbPlayerPause,
  TbRefresh,
  TbTrash,
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
  TbArrowUp,
  TbTool,
  TbWifi,
  TbPlug,
  TbPlugConnected,
  TbShoppingCart,
  TbStar,
  TbClock,
  TbCategory,
  TbFilter,
  TbSquare,
  TbSquareRotated,
  TbPackage,
  TbLoader,
  TbHelp,
  TbEye,
  TbEyeOff,
  TbColumns1
} from 'react-icons/tb'
import useSocketIO from '@/hooks/useSocketIO'
import DaDeviceSetupWizard from './DaDeviceSetupWizard'
import DashboardHeader from './components/DashboardHeader'
import DashboardTabs from './components/DashboardTabs'
import SplitPanelLayout from './components/SplitPanelLayout'
import OverviewTab from './components/OverviewTab'
import SettingsTab from './components/SettingsTab'
import ApplicationsTab from './components/ApplicationsTab'
import SmartDeploymentWorkflow from './components/SmartDeploymentWorkflow'
import DockerCommandDisplay from './components/DockerCommandDisplay'
import DockerConfigDisplay from './components/DockerConfigDisplay'
import {
  useDashboardState,
  useKitManagerState,
  useVehicleRuntimeState,
  useDeployment,
  useMarketplaceApps
} from './hooks'
import { MarketplaceApp } from './hooks/useMarketplaceApps'
import kitManagerService, { VehicleEdgeRuntimeKit, KitManagerMessage } from '@/services/kitManager.service'
import vehicleEdgeRuntimeService from '@/services/vehicleEdgeRuntime.service'
import vehicleEdgeRuntimeDirectService, { VehicleApp, RuntimeState } from '@/services/vehicleEdgeRuntimeDirect.service'

// Extended VehicleApp interface with additional properties
interface ExtendedVehicleApp extends VehicleApp {
  lastStatusUpdate?: string
}
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/atoms/card'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import { DetectedDevice } from '@/utils/networkDiscovery'

interface RunningApp {
  id: string
  name: string
  type: 'python' | 'binary' | 'mock-service'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'deploy-apps' | 'marketplace' | 'apps' | 'settings'>('overview')
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [kits, setKits] = useState<VehicleEdgeRuntimeKit[]>([])
  const [selectedKit, setSelectedKit] = useState<VehicleEdgeRuntimeKit | null>(null)
  const [runningApps, setRunningApps] = useState<RunningApp[]>([])
  const [selectedApp, setSelectedApp] = useState<RunningApp | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [currentDeployment, setCurrentDeployment] = useState<{
    appId?: string
    executionId?: string
    canStop: boolean
  } | null>(null)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Deployment type persistence state
  const [selectedDeploymentType, setSelectedDeploymentType] = useState<'python' | 'binary' | 'docker'>('python')
  const [showDeploymentTypeSelector, setShowDeploymentTypeSelector] = useState(true)
  const [deploymentConfig, setDeploymentConfig] = useState({
    type: 'python' as 'python' | 'binary',
    code: prototype?.code || `import time
import asyncio

print("🚗 Vehicle Edge Runtime Application")
print("=" * 50)

try:
    for i in range(60):  # 60 cycles = 10 minutes (10 seconds each)
        print(f"📡 Processing cycle {i + 1}/60")
        print(f"⏰ Timestamp: {time.strftime('%H:%M:%S')}")

        await asyncio.sleep(10)  # 10 seconds per cycle

        print(f"✅ Cycle {i + 1} completed")
        print("-" * 30)

    print("🎉 Application completed successfully!")
    print("📊 Total runtime: 10 minutes")

except Exception as e:
    print(f"❌ Error: {e}")

print("📊 Application execution finished")`,
    entryPoint: 'main.py',
    envVars: {} as Record<string, string>,
    resourceLimits: {
      memory: 512,
      cpu: 50
    }
  })
  const [showOfflineDevices, setShowOfflineDevices] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [marketplaceApps, setMarketplaceApps] = useState<MarketplaceApp[]>([])
  const [selectedMarketplaceApp, setSelectedMarketplaceApp] = useState<MarketplaceApp | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isDeployingApp, setIsDeployingApp] = useState(false)
  const [expandedDockerCommands, setExpandedDockerCommands] = useState<Set<string>>(new Set())
  const [vehicleApps, setVehicleApps] = useState<ExtendedVehicleApp[]>([])
  const [deployedRuntimeApps, setDeployedRuntimeApps] = useState<any[]>([])
  const [isRefreshingApps, setIsRefreshingApps] = useState(false)
  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null)
  const [isRuntimeConnected, setIsRuntimeConnected] = useState(false)
  const [isKitManagerConnected, setIsKitManagerConnected] = useState(false)
  const [customAppName, setCustomAppName] = useState('your-vehicle-app')

    const fileInputRef = useRef<HTMLInputElement>(null)
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Initialize Vehicle Edge Runtime connection
  useEffect(() => {
    const initializeVehicleRuntime = async () => {
      if (!selectedKit) return

      try {
        setConnectionError(null)
        console.log(`Connecting to Vehicle Edge Runtime via kit-manager for kit: ${selectedKit.kit_id}`)

        // Disconnect existing connection if any
        vehicleEdgeRuntimeService.disconnect()

        // Connect to the runtime through kit-manager
        await vehicleEdgeRuntimeService.connect(selectedKit.kit_id)
        vehicleEdgeRuntimeService.setSelectedKit(selectedKit.kit_id)

        const isConnected = vehicleEdgeRuntimeService.isConnected()

        setIsKitManagerConnected(isConnected)
        // Runtime is only truly connected if kit-manager is connected AND selected device is online
        setIsRuntimeConnected(isConnected && selectedKit?.is_online || false)
        setupVehicleRuntimeEventListeners()

        // Show connection status to user
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ Connected via kit-manager to ${selectedKit.name}`,
          `[${new Date().toLocaleTimeString()}] 📱 Kit ID: ${selectedKit.kit_id.substring(0, 4).toUpperCase()}`
        ])

        // Wait a moment for connection to fully establish
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Get initial runtime state and apps - but only if connected
        if (vehicleEdgeRuntimeDirectService.isServiceConnected()) {
          try {
            const stateResponse = await vehicleEdgeRuntimeDirectService.getRuntimeState()
            setRuntimeState(stateResponse.runtimeState as any)
          } catch (stateError) {
            console.warn('Failed to get runtime state:', stateError)
          }

          try {
            const appsResponse = await vehicleEdgeRuntimeDirectService.getDeployedApps()
            // Convert the response format to match what the dashboard expects
            const convertedApps = appsResponse.applications.map(app => ({
              id: app.app_id,
              name: app.name,
              version: '1.0.0',
              type: 'python' as const,
              status: app.status as VehicleApp['status'] || 'running',
              created_at: new Date(app.deploy_time).toISOString(),
              executionId: app.app_id
            }))
            setVehicleApps(convertedApps)
          } catch (appsError) {
            console.warn('Failed to get apps list:', appsError)
            setVehicleApps([])
          }
        } else {
          console.warn('Service not connected, skipping initial data fetch')
          setVehicleApps([])
        }

      } catch (error) {
        console.error('Failed to connect to Vehicle Edge Runtime:', error)
        setConnectionError(
          error instanceof Error ? error.message : 'Failed to connect to Vehicle Edge Runtime'
        )
        setIsRuntimeConnected(false)

        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ❌ Failed to connect to Vehicle Edge Runtime`,
          `[${new Date().toLocaleTimeString()}] 📱 Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        ])
      }
    }

    if (selectedKit && selectedKit.is_online) {
      initializeVehicleRuntime()
    }

    return () => {
      vehicleEdgeRuntimeService.removeAllListeners()
      vehicleEdgeRuntimeService.disconnect()
    }
  }, [selectedKit])

  // Initialize Vehicle Edge Runtime connection when kit is selected
  useEffect(() => {
    const initializeRuntimeConnection = async () => {
      if (!selectedKit || !isKitManagerConnected) return

      try {
        setConnectionError(null)
        console.log('Connecting to Vehicle Edge Runtime through Kit Manager...')

        // Disconnect existing connection if any
        vehicleEdgeRuntimeDirectService.disconnect()

        // Request Vehicle Edge Runtime WebSocket connection from Kit Manager
        try {
          const websocketUrl = await kitManagerService.requestVehicleRuntimeWebSocket(selectedKit.kit_id)
          console.log(`🔗 Got WebSocket URL from Kit Manager: ${websocketUrl}`)

          // Connect to Vehicle Edge Runtime using the WebSocket URL from Kit Manager
          await vehicleEdgeRuntimeDirectService.connect(websocketUrl)
        } catch (websocketError) {
          console.warn('Failed to get WebSocket URL from Kit Manager, falling back to direct connection:', websocketError)
          // Fallback to direct connection if Kit Manager doesn't support WebSocket proxying
          await vehicleEdgeRuntimeDirectService.connect()
        }

        const isConnected = vehicleEdgeRuntimeDirectService.isServiceConnected()
        setIsRuntimeConnected(isConnected)

        if (isConnected) {
          setupDirectRuntimeEventListeners()

          // Show connection status to user
          setConsoleOutput(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ✅ Connected to Vehicle Edge Runtime`,
            `[${new Date().toLocaleTimeString()}] 🚗 Runtime: ${selectedKit.name}`
          ])

          // Get initial apps list
          try {
            await refreshApps()
          } catch (appsError) {
            console.warn('Failed to get apps list:', appsError)
          }
        }

      } catch (error) {
        console.error('Failed to connect to Vehicle Edge Runtime:', error)
        setConnectionError(
          error instanceof Error ? error.message : 'Failed to connect to Vehicle Edge Runtime'
        )
        setIsRuntimeConnected(false)

        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ❌ Failed to connect to Vehicle Edge Runtime`,
          `[${new Date().toLocaleTimeString()}] 🔗 Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        ])
      }
    }

    initializeRuntimeConnection()

    return () => {
      vehicleEdgeRuntimeDirectService.removeAllListeners()
      vehicleEdgeRuntimeDirectService.disconnect()
    }
  }, [selectedKit, isKitManagerConnected])

  // Update runtime connection status when selected kit changes
  useEffect(() => {
    // Runtime is only connected if kit-manager is connected AND selected device is online
    setIsRuntimeConnected(isKitManagerConnected && selectedKit?.is_online || false)
  }, [selectedKit, isKitManagerConnected])

  // Auto-refresh applications when connected
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null

    // Set up auto-refresh if connection is active
    if (isRuntimeConnected && selectedKit) {
      console.log('🔄 Setting up auto-refresh for applications (10s interval)')

      // Set up periodic refresh
      refreshInterval = setInterval(() => {
        refreshApps()
      }, 10000) // Refresh every 10 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        console.log('🔄 Stopped auto-refresh for applications')
      }
    }
  }, [isRuntimeConnected, selectedKit])

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

    // Listen for broadcast messages (console output, etc.)
    kitManagerService.onBroadcast((message) => {
      handleBroadcastMessage(message)
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

  // Setup Vehicle Edge Runtime event listeners
  const setupVehicleRuntimeEventListeners = () => {
    // Listen for console output from running apps
    vehicleEdgeRuntimeService.onConsoleOutput((message) => {
      const timestamp = new Date().toLocaleTimeString()
      setConsoleOutput(prev => [
        ...prev,
        `[${timestamp}] [${message.stream.toUpperCase()}] ${message.data}`
      ])
    })

    // Listen for signal updates (can be displayed in real-time)
    vehicleEdgeRuntimeService.onSignalUpdate((message) => {
      const timestamp = new Date().toLocaleTimeString()
      setConsoleOutput(prev => [
        ...prev,
        `[${timestamp}] [SIGNAL] ${message.path}: ${message.value}`
      ])
    })
  }

  // Setup Direct Vehicle Edge Runtime event listeners
  const setupDirectRuntimeEventListeners = () => {
    // Listen for console output from running apps
    vehicleEdgeRuntimeDirectService.onConsoleOutput((message: any) => {
      const timestamp = new Date().toLocaleTimeString()
      // Handle both ConsoleOutput and ConsoleOutputMessage types
      const output = message.data || message.output || ''
      setConsoleOutput(prev => [
        ...prev,
        `[${timestamp}] [STDOUT] ${output}`
      ])

      // Update current deployment if it matches
      if (currentDeployment && currentDeployment.appId) {
        setCurrentDeployment(prev => prev ? {
          ...prev,
          appId: message.executionId || prev.appId
        } : null)
      }
    })

    // Listen for signal updates (can be displayed in real-time)
    vehicleEdgeRuntimeDirectService.onSignalUpdate((message: any) => {
      const timestamp = new Date().toLocaleTimeString()

      // Handle both SignalUpdate types - single signal or multiple updates
      if (message.updates) {
        // Multiple updates in one message
        Object.entries(message.updates).forEach(([signal, value]) => {
          setConsoleOutput(prev => [
            ...prev,
            `[${timestamp}] [SIGNAL] ${signal}: ${value}`
          ])
        })
      } else {
        // Single signal update
        const signalName = message.path || 'unknown'
        const signalValue = message.value
        setConsoleOutput(prev => [
          ...prev,
          `[${timestamp}] [SIGNAL] ${signalName}: ${signalValue}`
        ])
      }
    })

    // Listen for app status updates for real-time sync
    vehicleEdgeRuntimeDirectService.onAppStatus((message: any) => {
      console.log('🔄 Real-time app status update:', message)

      // Update the specific app in vehicleApps state
      setVehicleApps(prev => prev.map(app =>
        app.id === message.appId ? {
          ...app,
          status: message.currentStatus as VehicleApp['status'],
          lastStatusUpdate: new Date().toISOString()
        } : app
      ))

      // Log status change
      const timestamp = new Date().toLocaleTimeString()
      setConsoleOutput(prev => [
        ...prev,
        `[${timestamp}] [STATUS] ${message.appId}: ${message.previousStatus} → ${message.currentStatus}`
      ])
    })

    // Listen for list_deployed_apps-response updates
    vehicleEdgeRuntimeDirectService.onDeployedAppsList((message: any) => {
      console.log('📋 Apps list updated:', message)

      if (message.applications && Array.isArray(message.applications)) {
        // Convert to VehicleApp format - use simplified API mapping
        const convertedApps = message.applications.map((app: any) => ({
          id: app.app_id,  // Use app_id directly from runtime response
          name: app.name || `App ${app.app_id}`,
          version: app.version || '1.0.0',
          type: (app.type as VehicleApp['type']) || 'python',  // Preserve type from backend
          status: app.status as VehicleApp['status'] || 'running',
          created_at: app.deploy_time ? new Date(app.deploy_time).toISOString() : new Date().toISOString(),
          executionId: app.app_id,  // Same as id with simplified API
          description: app.description
        }))

        setVehicleApps(convertedApps)
        setDeployedRuntimeApps(message.applications)
      }
    })
    vehicleEdgeRuntimeDirectService.onDeployedAppsList((response) => {
      console.log('Deployed apps list:', response)
      // Convert to RunningApp format
      const runningApps: RunningApp[] = response.applications.map(app => ({
        id: app.app_id,
        name: app.name,
        type: (app.type as RunningApp['type']) || 'python',
        status: app.status as 'running' | 'stopped' | 'error',
        startTime: new Date(app.deploy_time),
        resources: {
          cpu: parseInt(app.resources?.cpu_limit?.replace('%', '') || '0'),
          memory: parseInt(app.resources?.memory_limit?.replace('MB', '') || '0')
        },
        consoleOutput: []
      }))
      setRunningApps(runningApps)
    })

    // Listen for app status updates
    vehicleEdgeRuntimeDirectService.onAppStatus((response: any) => {
      const timestamp = new Date().toLocaleTimeString()
      setConsoleOutput(prev => [
        ...prev,
        `[${timestamp}] [STATUS] App ${response.status.app_id}: ${response.status.state}`
      ])

      // Update running apps - fix response object property access
      setRunningApps(prev => prev.map(app =>
        app.id === response.status.app_id
          ? {
              ...app,
              status: response.status.state as 'running' | 'stopped' | 'error',
              // Use the nested resources object if it exists, otherwise use defaults
              cpu: `${response.status.resources?.cpu || 0}%`,
              memory: `${response.status.resources?.memory || 0}MB`
            }
          : app
      ))
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
      setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message.data.output}`])
    }
  }

  // Handle broadcast messages from kits (console output, logs, etc.)
  const handleBroadcastMessage = (message: any) => {
    const timestamp = new Date().toLocaleTimeString()

    // Add console output
    if (message.data?.output || message.data?.log) {
      const output = message.data?.output || message.data?.log
      setConsoleOutput(prev => [...prev, `[${timestamp}] ${output}`])
    }

    // Handle application status updates
    if (message.cmd === 'app_status' && message.data) {
      const { appId, status } = message.data
      setRunningApps(prev =>
        prev.map(app =>
          app.id === appId ? { ...app, status, lastSeen: new Date() } : app
        )
      )
    }

    // Handle application output
    if (message.cmd === 'app_output' && message.data) {
      const { appId, output } = message.data
      const appName = runningApps.find(app => app.id === appId)?.name || 'Unknown App'
      setConsoleOutput(prev => [...prev, `[${timestamp}] [${appName}] ${output}`])
    }
  }

  
  const handleSetupWizardComplete = (deviceInfo: any) => {
    // Refresh kits list after setup wizard completes
    kitManagerService.requestKits()
    setShowSetupWizard(false)
    setActiveTab('overview')
  }

  useEffect(() => {
    // Auto-select first online kit if none selected or if current selection is offline
    const onlineKits = kits.filter(kit => kit.is_online)

    if (!selectedKit && onlineKits.length > 0) {
      setSelectedKit(onlineKits[0])
    } else if (selectedKit && !selectedKit.is_online && onlineKits.length > 0) {
      // If selected kit goes offline, switch to an online one
      setSelectedKit(onlineKits[0])
    } else if (selectedKit && !selectedKit.is_online && onlineKits.length === 0) {
      // If no online kits available and selected one is offline, clear selection
      setSelectedKit(null)
    }
  }, [kits, selectedKit])

  // Auto-refresh mechanism
  useEffect(() => {
    if (autoRefreshEnabled && isConnected) {
      // Set up auto-refresh every 30 seconds
      autoRefreshIntervalRef.current = setInterval(() => {
        handleRefreshKits()
      }, 30000)

      // Initial refresh when enabled
      handleRefreshKits()
    } else {
      // Clear interval when disabled
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
        autoRefreshIntervalRef.current = null
      }
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [autoRefreshEnabled, isConnected])

  // Filter kits based on showOfflineDevices setting
  const filteredKits = showOfflineDevices ? kits : kits.filter(kit => kit.is_online)

  // Initialize mock marketplace data
  useEffect(() => {
    const mockMarketplaceApps: MarketplaceApp[] = [
      {
        id: 'vehicle-diagnostics',
        name: 'Vehicle Diagnostics Monitor',
        description: 'Real-time vehicle health monitoring with diagnostic trouble code reading and predictive maintenance alerts.',
        category: 'Diagnostics',
        version: '2.1.0',
        author: 'AutoTech Solutions',
        rating: 4.5,
        downloads: 15234,
        price: 'free',
        icon: '🚗',
        tags: ['OBD-II', 'Diagnostics', 'Real-time'],
        size: '2.4 MB',
        lastUpdated: '2024-12-01',
        type: 'python',
        code: `import obd
import time
from datetime import datetime

class VehicleDiagnostics:
    def __init__(self):
        self.connection = obd.OBD()

    def monitor_health(self):
        while True:
            if self.connection.is_connected():
                # Monitor critical parameters
                rpm = self.connection.query(obd.commands.RPM)
                speed = self.connection.query(obd.commands.SPEED)
                temp = self.connection.query(obd.commands.COOLANT_TEMP)

                print(f"RPM: {rpm.value.magnitude}, Speed: {speed.value.magnitude}, Temp: {temp.value.magnitude}")
            time.sleep(1)

if __name__ == "__main__":
    monitor = VehicleDiagnostics()
    monitor.monitor_health()`,
        entryPoint: 'main.py',
        requirements: ['python-obd>=0.7.0', 'psutil>=5.9.0']
      },
      {
        id: 'fleet-tracker',
        name: 'Fleet Management Tracker',
        description: 'Advanced fleet tracking with route optimization, fuel efficiency monitoring, and driver behavior analysis.',
        category: 'Fleet Management',
        version: '3.0.2',
        author: 'FleetLogic',
        rating: 4.8,
        downloads: 28956,
        price: 'paid',
        icon: '📊',
        tags: ['GPS', 'Analytics', 'Optimization'],
        size: '5.1 MB',
        lastUpdated: '2024-11-28',
        type: 'python',
        code: `import gps
import json
from datetime import datetime

class FleetTracker:
    def __init__(self):
        self.session = gps.gps(mode=gps.WATCH_ENABLE)

    def track_vehicle(self, vehicle_id):
        while True:
            report = self.session.next()
            if report.keys() >= {'lat', 'lon', 'speed'}:
                data = {
                    'vehicle_id': vehicle_id,
                    'timestamp': datetime.now().isoformat(),
                    'latitude': report['lat'],
                    'longitude': report['lon'],
                    'speed': report['speed']
                }
                print(json.dumps(data))
        time.sleep(5)`,
        entryPoint: 'tracker.py',
        requirements: ['gps3>=0.6.0', 'requests>=2.31.0']
      },
      {
        id: 'telemetry-collector',
        name: 'Telemetry Data Collector',
        description: 'High-performance CAN bus data collection and streaming for vehicle telemetry analysis.',
        category: 'Data Collection',
        version: '1.5.4',
        author: 'AutoData Systems',
        rating: 4.3,
        downloads: 8765,
        price: 'free',
        icon: '📡',
        tags: ['CAN Bus', 'Telemetry', 'Streaming'],
        size: '1.8 MB',
        lastUpdated: '2024-11-15',
        type: 'binary',
        requirements: []
      },
      {
        id: 'collision-detector',
        name: 'Collision Detection System',
        description: 'AI-powered collision detection using accelerometer and camera data with automatic emergency response.',
        category: 'Safety',
        version: '4.2.1',
        author: 'SafeDrive AI',
        rating: 4.9,
        downloads: 45123,
        price: 'paid',
        icon: '🛡️',
        tags: ['AI', 'Safety', 'Emergency'],
        size: '8.7 MB',
        lastUpdated: '2024-12-05',
        type: 'python',
        code: `import cv2
import numpy as np
from tensorflow.keras.models import load_model

class CollisionDetector:
    def __init__(self):
        self.model = load_model('collision_model.h5')
        self.cap = cv2.VideoCapture(0)

    def detect_collision(self):
        while True:
            ret, frame = self.cap.read()
            if ret:
                processed = cv2.resize(frame, (224, 224))
                prediction = self.model.predict(np.expand_dims(processed, axis=0))

                if prediction[0][0] > 0.8:
                    print("COLLISION DETECTED!")
                    self.send_emergency_alert()

    def send_emergency_alert(self):
        # Send alert to emergency services
        print("Emergency alert sent!")

if __name__ == "__main__":
    detector = CollisionDetector()
    detector.detect_collision()`,
        entryPoint: 'collision_detector.py',
        requirements: ['opencv-python>=4.8.0', 'tensorflow>=2.13.0', 'numpy>=1.24.0']
      },
      {
        id: 'climate-controller',
        name: 'Smart Climate Controller',
        description: 'Intelligent climate control system with passenger comfort optimization and energy efficiency.',
        category: 'Comfort',
        version: '2.0.8',
        author: 'ComfortTech',
        rating: 4.1,
        downloads: 5432,
        price: 'free',
        icon: '🌡️',
        tags: ['Climate', 'Comfort', 'Efficiency'],
        size: '1.2 MB',
        lastUpdated: '2024-11-20',
        type: 'python',
        code: `import time
from sensors import TempSensor, HumiditySensor

class ClimateController:
    def __init__(self):
        self.temp_sensor = TempSensor()
        self.humidity_sensor = HumiditySensor()
        self.target_temp = 22  # Target temperature in Celsius

    def regulate_climate(self):
        while True:
            current_temp = self.temp_sensor.read()
            humidity = self.humidity_sensor.read()

            if current_temp < self.target_temp - 1:
                self.activate_heater()
            elif current_temp > self.target_temp + 1:
                self.activate_cooler()
            else:
                self.maintain_temperature()

            print(f"Temp: {current_temp}°C, Humidity: {humidity}%")
            time.sleep(30)`,
        entryPoint: 'climate.py',
        requirements: ['RPi.GPIO>=0.7.1', 'sensors>=1.0.0']
      },
      {
        id: 'route-optimizer',
        name: 'AI Route Optimizer',
        description: 'Machine learning-based route optimization considering traffic, weather, and vehicle constraints.',
        category: 'Navigation',
        version: '3.5.0',
        author: 'NavAI Solutions',
        rating: 4.6,
        downloads: 32109,
        price: 'paid',
        icon: '🗺️',
        tags: ['Navigation', 'AI', 'Traffic'],
        size: '6.2 MB',
        lastUpdated: '2024-12-03',
        type: 'python',
        code: `import requests
import json
from datetime import datetime

class RouteOptimizer:
    def __init__(self):
        self.api_key = "your_api_key"

    def optimize_route(self, start, end, constraints=None):
        """Optimize route considering traffic and weather"""
        url = f"https://api.routing-service.com/optimize"

        payload = {
            'start': start,
            'end': end,
            'constraints': constraints or {},
            'real_time_data': True
        }

        response = requests.post(url, json=payload)
        if response.status_code == 200:
            route = response.json()
            print(f"Optimized route: {route['distance']}km, ETA: {route['eta']}")
            return route
        return None

if __name__ == "__main__":
    optimizer = RouteOptimizer()
    optimizer.optimize_route("New York", "Boston")`,
        entryPoint: 'router.py',
        requirements: ['requests>=2.31.0', 'geopy>=2.4.0', 'pandas>=2.1.0']
      }
    ]

    setMarketplaceApps(mockMarketplaceApps)
  }, [])

  // Filter marketplace apps based on category and search
  const filteredMarketplaceApps = marketplaceApps.filter(app => {
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(marketplaceApps.map(app => app.category)))]

  const handleDeployMarketplaceApp = async (app: MarketplaceApp) => {
    if (!selectedKit || !app) return

    setIsDeployingApp(true)
    setDeploymentResult(null)

    try {
      const timestamp = new Date().toLocaleTimeString()
      setConsoleOutput(prev => [...prev,
        `[${timestamp}] 🛒 Starting deployment from marketplace: ${app.name}`,
        `[${timestamp}] 📦 App version: ${app.version}`,
        `[${timestamp}] 👨‍💻 Author: ${app.author}`,
        `[${timestamp}] 🏷️ Category: ${app.category}`,
        `[${timestamp}] 📊 Rating: ${app.rating}/5 (${app.downloads} downloads)`,
        `[${timestamp}] 💰 Price: ${app.price}`,
        `[${timestamp}] 📏 Size: ${app.size}`
      ])

      // Handle different app types
      if (app.type === 'docker') {
        // Docker app deployment
        setConsoleOutput(prev => [...prev,
          `[${timestamp}] 🐳 Deploying Docker container: ${app.name}`,
          `[${timestamp}] 📦 Docker Image: ${app.dockerImage}`,
          `[${timestamp}] 🔌 Ports: ${app.dockerPorts?.join(', ') || 'None'}`
        ])

        if (!app.dockerCommand || app.dockerCommand.length === 0) {
          throw new Error('Docker command not specified for Docker app')
        }

        // Create Docker deployment request using the same format as SmartDeploymentWorkflow
        const dockerDeploymentRequest = {
          type: 'deploy_request',
          id: `deploy-docker-${app.id}-${Date.now()}`,
          prototype: {
            id: `VEA-${app.id}`,
            name: app.name,
            type: 'docker', // ⭐ CRITICAL: MUST be "docker"
            description: app.description,
            config: {
              dockerCommand: app.dockerCommand // ⭐ CRITICAL: MUST be array
            }
          },
          vehicleId: selectedKit?.kit_id || 'default-vehicle'
        }

        console.log('🐳 Sending Docker deployment request:', dockerDeploymentRequest)

        // Send the Docker deployment request
        await handleDeployment(dockerDeploymentRequest)

        setConsoleOutput(prev => [...prev,
          `[${timestamp}] 🐳 Docker deployment request sent to ${selectedKit?.name}`,
          `[${timestamp}] 🔄 Container will appear as "${app.name}" in Applications tab`
        ])

      } else if (app.type === 'binary') {
        // Binary app deployment
        setConsoleOutput(prev => [...prev,
          `[${timestamp}] 📦 Binary deployment - downloading ${app.name}...`,
          `[${timestamp}] ⚠️ Binary deployment requires additional setup`
        ])

        // Simulate binary deployment
        await new Promise(resolve => setTimeout(resolve, 2000))

        setConsoleOutput(prev => [...prev,
          `[${timestamp}] 📤 Binary deployment request sent to ${selectedKit.name}`
        ])

      } else {
        // Python app deployment
        let finalCode = app.code || ''

        // Convert Python code to Vehicle App format
        if (finalCode) {
          try {
            const convertResponse = await kitManagerService.convertCode({ code: finalCode })
            if (convertResponse.status === 'OK') {
              finalCode = convertResponse.content
              setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Code converted to Vehicle App format`])
            }
          } catch (convertError) {
            setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠️ Code conversion failed, using original code`])
            console.warn('Code conversion failed:', convertError)
          }
        }

        // Deploy the application
        await kitManagerService.deployApp(
          selectedKit.kit_id,
          finalCode || '',
          app.name
        )
      }

      setConsoleOutput(prev => [...prev,
        `[${timestamp}] 🎉 ${app.name} deployed successfully to ${selectedKit.name}!`,
        `[${timestamp}] 🔄 Switching to Applications tab to view deployed app...`
      ])

      // Switch to apps tab to view deployed app
      setActiveTab('apps')

    } catch (error) {
      console.error('Marketplace deployment failed:', error)
      const timestamp = new Date().toLocaleTimeString()
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Marketplace deployment failed'
      })
      setConsoleOutput(prev => [...prev, `[${timestamp}] ❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setIsDeployingApp(false)
    }
  }

  const handleToggleDockerCommand = (appId: string) => {
    setExpandedDockerCommands(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appId)) {
        newSet.delete(appId)
      } else {
        newSet.add(appId)
      }
      return newSet
    })
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Data Collection': '📊',
      'Safety': '🛡️',
      'Efficiency': '⚡',
      'Navigation': '🗺️',
      'Entertainment': '🎵',
      'Diagnostics': '🔧',
      'Communication': '📡',
      'Infrastructure': '🏗️',
      'Monitoring': '📈'
    }
    return icons[category] || '📱'
  }

  const handleDeployment = async (deployment: any) => {
    // Handle smart deployment
    try {
      const timestamp = new Date().toLocaleTimeString()

      // Check if this is a Docker app deployment request
      if (deployment.type === 'deploy_request' && deployment.prototype?.type === 'docker') {
        console.log('🐳 Detected Docker app deployment request')

        setConsoleOutput(prev => [...prev,
          `[${timestamp}] 🐳 Starting Docker app deployment...`,
          `[${timestamp}] 📦 App ID: ${deployment.prototype.id}`,
          `[${timestamp}] 📦 App Name: ${deployment.prototype.name}`,
          `[${timestamp}] 📋 Docker Command: ${deployment.prototype.config?.dockerCommand?.join(' ')}`,
          `[${timestamp}] 🚗 Target runtime: ${selectedKit?.name}`
        ])

        // Send Docker deployment request directly using sendMessage
        const response = await vehicleEdgeRuntimeDirectService.sendMessage(deployment)

        console.log('📥 Docker deployment response:', response)
        console.log('📥 Response keys:', response ? Object.keys(response) : 'null')

        // Backend returns success if no error field is present
        if (response && typeof response === 'object' && !response.error && !response.type?.includes('error')) {
          setConsoleOutput(prev => [...prev,
            `[${new Date().toLocaleTimeString()}] ✅ Docker container deployed and started successfully: ${response.executionId || response.id || 'N/A'}`,
            `[${new Date().toLocaleTimeString()}] 🚗 Runtime: ${selectedKit?.name}`,
            `[${new Date().toLocaleTimeString()}] 🐳 Container ID: ${response.containerId || 'pending'}`
          ])
        } else {
          const errorMsg = response?.error || response?.result || 'Unknown error'
          console.error('❌ Docker deployment response indicates error:', errorMsg)
          throw new Error(`Docker deployment failed: ${errorMsg}`)
        }

        // Refresh the apps list
        try {
          await refreshApps()
        } catch (error) {
          console.warn('Failed to refresh apps list:', error)
        }

        // Don't switch to apps tab - keep user on deploy tab to continue deploying
        // setActiveTab('apps')
        return
      }

      // Handle regular Python/Binary app deployment
      const appName = deployment.name || deployment.id
      const appId = deployment.id  // Send ID as-is, backend will add VEA- prefix

      // Log deployment info based on deployment type
      const isBinaryDeployment = deployment.type === 'deploy_request' && deployment.prototype?.type === 'binary'
      const codeLength = deployment.code ? deployment.code.length : (deployment.binary ? deployment.binary.length : 0)
      const dependencies = deployment.dependencies || []
      const deploymentInfo = isBinaryDeployment
        ? `[${timestamp}] 📦 Binary size: ${(deployment.binary?.length || 0) / 1024} KB (base64 encoded)`
        : `[${timestamp}] 📝 Code length: ${codeLength} characters`

      setConsoleOutput(prev => [...prev,
        `[${timestamp}] 🚀 Starting smart deployment of ${deployment.type} app...`,
        `[${timestamp}] 📦 App ID: ${appId}`,
        `[${timestamp}] 📦 App Name: ${appName}`,
        deploymentInfo,
        !isBinaryDeployment && dependencies.length > 0 ? `[${timestamp}] 📦 Dependencies: ${dependencies.join(', ')}` : null,
        `[${timestamp}] 🚗 Target runtime: ${selectedKit?.name}`
      ].filter(Boolean))

      // Deploy using the appropriate method based on deployment type
      let deployedAppId: string
      if (isBinaryDeployment) {
        // Use sendMessage for binary deployments
        deployedAppId = await vehicleEdgeRuntimeDirectService.sendMessage(deployment)
      } else {
        // Use deployPythonApp for Python deployments
        deployedAppId = await vehicleEdgeRuntimeDirectService.deployPythonApp({
          name: appId, // Use the user's ID as the app identifier
          displayName: appName, // Use the display name for UI
          code: deployment.code,
          vehicleId: 'default-vehicle',
          dependencies: dependencies // Pass dependencies to backend
        })
      }

      setConsoleOutput(prev => [...prev,
        `[${new Date().toLocaleTimeString()}] ✅ App deployed and started successfully: ${deployedAppId}`,
        `[${new Date().toLocaleTimeString()}] 🚗 Runtime: ${selectedKit?.name}`
      ])

      // Refresh the apps list
      try {
        await refreshApps()
      } catch (error) {
        console.warn('Failed to refresh apps list:', error)
      }

      // Don't switch to apps tab - keep user on deploy tab to continue deploying
      // setActiveTab('apps')

    } catch (error) {
      console.error('Deployment failed:', error)
      const timestamp = new Date().toLocaleTimeString()
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Deployment failed'
      })
      setConsoleOutput(prev => [...prev, `[${timestamp}] ❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }

  const handleDeployApp = async () => {
    setIsDeploying(true)
    setDeploymentResult(null)

    try {
      const timestamp = new Date().toLocaleTimeString()
      // Validate application name
      if (!customAppName.trim()) {
        throw new Error('Application identifier is required')
      }
      const appName = customAppName.trim()
      const finalCode = deploymentConfig.code
      // Use the user-provided name as the app ID directly
      const appId = appName

      // Unified deployment using Vehicle Edge Runtime API
      if (!selectedKit) {
        throw new Error('No runtime selected for deployment')
      }

      if (!isRuntimeConnected) {
        throw new Error('Runtime not connected')
      }

      setConsoleOutput(prev => [...prev,
        `[${timestamp}] 🚀 Starting deployment of ${deploymentConfig.type} app...`,
        `[${timestamp}] 📦 App name: ${appName}`,
        `[${timestamp}] 📝 Code length: ${finalCode.length} characters`,
        `[${timestamp}] 🚗 Target runtime: ${selectedKit.name}`
      ])

      // Set current deployment for tracking
      setCurrentDeployment({
        appId: appId,
        canStop: true
      })

      console.log('🚀 Dashboard Debug before deployment:')
      console.log('  - appName:', appName)
      console.log('  - customAppName:', customAppName)

      // Deploy using unified Vehicle Edge Runtime service
      const deployedAppId = await vehicleEdgeRuntimeDirectService.deployPythonApp({
        name: appId, // Use user-provided app ID
        code: finalCode,
        vehicleId: 'default-vehicle'
      })

      setConsoleOutput(prev => [...prev,
        `[${new Date().toLocaleTimeString()}] ✅ App deployed and started successfully: ${deployedAppId}`,
        `[${new Date().toLocaleTimeString()}] 🚗 Runtime: ${selectedKit.name}`
      ])

      // Update current deployment with execution info
      setCurrentDeployment(prev => prev ? {
        ...prev,
        appId: deployedAppId
      } : null)

      // Refresh the apps list
      try {
        await refreshApps()
      } catch (error) {
        console.warn('Failed to refresh apps list:', error)
      }

      setDeploymentResult({
        status: 'success',
        message: `App ${appName} deployed and started successfully`,
        data: { appId: deployedAppId }
      })

      // Clear current deployment on success
      setCurrentDeployment(null)

      // Don't switch to apps tab - keep user on deploy tab to continue deploying
      // setActiveTab('apps')
    } catch (error) {
      console.error('Deployment failed:', error)
      const timestamp = new Date().toLocaleTimeString()
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Deployment failed'
      })
      setConsoleOutput(prev => [...prev,
        `[${timestamp}] ❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])

      // Clear current deployment on error
      setCurrentDeployment(null)
    } finally {
      setIsDeploying(false)
    }
  }

  const handleStopDeployment = async () => {
    if (!currentDeployment || !currentDeployment.appId) return

    try {
      const timestamp = new Date().toLocaleTimeString()
      setConsoleOutput(prev => [...prev, `[${timestamp}] 🛑 Stopping deployment of ${currentDeployment.appId}...`])

      // Stop the current deployment
      await vehicleEdgeRuntimeService.stopApp(currentDeployment.appId)

      setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Deployment stopped successfully`])

      // Reset deployment state
      setIsDeploying(false)
      setCurrentDeployment(null)
      setDeploymentResult({
        status: 'success',
        message: 'Deployment stopped by user'
      })

      // Update app list
      const appsResponse = await vehicleEdgeRuntimeService.listApps()
      setVehicleApps(appsResponse.apps)
    } catch (error) {
      console.error('Failed to stop deployment:', error)
      const timestamp = new Date().toLocaleTimeString()
      setConsoleOutput(prev => [...prev,
        `[${timestamp}] ❌ Failed to stop deployment: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])

      // Still reset state even if stop failed
      setIsDeploying(false)
      setCurrentDeployment(null)
      setDeploymentResult({
        status: 'error',
        message: `Failed to stop deployment: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const handleRetryDeployment = async () => {
    // Clear previous result and retry deployment
    setDeploymentResult(null)
    setCurrentDeployment(null)
    await handleDeployApp()
  }

  
  const handleViewConsole = (app: VehicleApp) => {
    setConsoleOutput([`Console output for ${app.name}:`, `Status: ${app.status}`, `Type: ${app.type}`])
    setActiveTab('console')

    if (app.executionId && isRuntimeConnected) {
      // Subscribe to console output for this specific app
      vehicleEdgeRuntimeService.subscribeConsole(app.executionId)
      setConsoleOutput(prev => [...prev, `Subscribed to console output for ${app.name} (ID: ${app.executionId})`])
    }
  }

  // Refresh applications list
  const refreshApps = async () => {
    console.log('🔄 refreshApps called!')
    console.log('📊 selectedKit:', selectedKit)
    console.log('🔌 isRuntimeConnected:', isRuntimeConnected)
    console.log('⚡ isRuntimeConnected:', isRuntimeConnected)

    if (!selectedKit || !isRuntimeConnected) {
      console.log('❌ Early return: No selected kit or no connections')
      return
    }

    console.log('✅ Proceeding with app refresh...')
    setIsRefreshingApps(true)
    try {
      // Use direct connection for app listing
      if (isRuntimeConnected) {
        console.log('🚀 Getting deployed apps list')
        // Use direct connection service
        const appsResponse = await vehicleEdgeRuntimeDirectService.getDeployedApps()
        console.log('📊 Deployed apps from direct service:', appsResponse)
        console.log('📈 Applications array length:', appsResponse.applications?.length || 0)

        // Use applications field from response
        const appsArray = appsResponse.applications || []
        console.log('📋 Using apps array:', appsArray)

        // Extract statistics from apps array
        const stats = {
          total: appsArray.length,
          running: appsArray.filter(app => app.status === 'running').length,
          paused: appsArray.filter(app => app.status === 'paused').length,
          stopped: appsArray.filter(app => app.status === 'stopped').length,
          error: appsArray.filter(app => app.status === 'error').length
        }
        console.log('📊 Enhanced stats:', stats)

        // Convert to VehicleApp format - NO STATUS FILTERING (display ALL apps)
        // Use app_id as both ID and name for consistency with deployment
        const convertedApps = appsArray.map((app: any) => ({
          id: app.app_id,  // Use app_id directly from runtime response
          name: app.app_id,  // Use app_id as the display name to match deployment ID
          version: app.version || '1.0.0',
          type: (app.type as VehicleApp['type']) || 'python',
          status: app.status as VehicleApp['status'] || 'running',
          created_at: app.deploy_time ? new Date(app.deploy_time).toISOString() : new Date().toISOString(),
          executionId: app.app_id,  // Same as id with simplified API
          // Additional fields from enhanced API
          container_id: app.container_id,
          pid: app.pid,
          exit_code: app.exit_code,
          resources: app.resources
        }))

        console.log('✅ Converted ALL apps (no status filtering):', convertedApps)
        console.log('📈 App status breakdown:', {
          total: convertedApps.length,
          running: convertedApps.filter(app => app.status === 'running').length,
          paused: convertedApps.filter(app => app.status === 'paused').length,
          stopped: convertedApps.filter(app => app.status === 'stopped').length,
          error: convertedApps.filter(app => app.status === 'error').length,
          installed: convertedApps.filter(app => app.status === 'installed').length,
          starting: convertedApps.filter(app => app.status === 'starting').length
        })

        setVehicleApps(convertedApps)
        setDeployedRuntimeApps(appsArray)

        // Update statistics state
        if (stats) {
          setRuntimeState(prev => prev ? { ...prev, appStats: stats } : null)
        }
      } else {
        console.log('🔌 Using KIT MANAGER connection path')
        // Use kit manager service
        console.log('🔌 Kit Manager: Calling listApps...')
        const appsResponse = await vehicleEdgeRuntimeService.listApps()
        console.log('📊 Kit Manager apps response:', appsResponse)
        console.log('📈 Kit Manager apps count:', appsResponse.apps?.length || 0)

        // NO STATUS FILTERING - display ALL apps from kit manager as well
        const apps = appsResponse.apps || []
        console.log('✅ Kit Manager apps (no filtering):', apps)
        console.log('📈 Kit Manager status breakdown:', {
          total: apps.length,
          running: apps.filter(app => app.status === 'running').length,
          paused: apps.filter(app => app.status === 'paused').length,
          stopped: apps.filter(app => app.status === 'stopped').length,
          error: apps.filter(app => app.status === 'error').length,
          installed: apps.filter(app => app.status === 'installed').length,
          starting: apps.filter(app => app.status === 'starting').length
        })

        setVehicleApps(apps)
      }
    } catch (error) {
      console.error('❌ ERROR: Failed to refresh apps:', error)
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available')
      setVehicleApps([])
      setDeployedRuntimeApps([])
    } finally {
      console.log('🏁 refreshApps finished')
      setIsRefreshingApps(false)
    }
  }

  // Refresh apps when switching to apps tab (ensures deployed apps are visible)
  useEffect(() => {
    if (activeTab === 'apps' && isRuntimeConnected && selectedKit) {
      const timer = setTimeout(() => {
        refreshApps()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [activeTab])

  // Application lifecycle management functions
  const handleStartApp = async (appId: string) => {
    try {
      // Check connection status first
      if (!vehicleEdgeRuntimeDirectService.isConnected) {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Cannot start app ${appId}: Not connected to Vehicle Edge Runtime`
        ])
        return
      }

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Starting application: ${appId}`
      ])

      await vehicleEdgeRuntimeDirectService.startApp(appId)

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Start command sent for application: ${appId}`
      ])

      // Refresh apps list to get updated status
      await refreshApps()
    } catch (error) {
      console.error('Failed to start app:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Provide user-friendly error messages
      if (errorMessage.includes('timeout')) {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Failed to start app ${appId}: Request timed out. Please check your connection and try again.`
        ])
      } else if (errorMessage.includes('Not connected')) {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Failed to start app ${appId}: Connection lost. Please reconnect to the runtime.`
        ])
      } else {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Failed to start app ${appId}: ${errorMessage}`
        ])
      }
    }
  }

  const handleStopApp = async (appId: string) => {
    try {
      // Check connection status first
      if (!vehicleEdgeRuntimeDirectService.isConnected) {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Cannot stop app ${appId}: Not connected to Vehicle Edge Runtime`
        ])
        return
      }

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Stopping application: ${appId}`
      ])

      await vehicleEdgeRuntimeDirectService.stopApp(appId)

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Application ${appId} stopped successfully`
      ])

      // Update local state immediately for responsive UI
      setVehicleApps(prev => prev.map(app =>
        app.id === appId ? { ...app, status: 'stopped' as const } : app
      ))

      // Refresh apps list to get updated status
      await refreshApps()
    } catch (error) {
      console.error('Failed to stop app:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Provide user-friendly error messages
      if (errorMessage.includes('timeout')) {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Failed to stop app ${appId}: Request timed out. Please check your connection and try again.`
        ])
      } else if (errorMessage.includes('Not connected')) {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Failed to stop app ${appId}: Connection lost. Please reconnect to the runtime.`
        ])
      } else {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [ERROR] Failed to stop app ${appId}: ${errorMessage}`
        ])
      }
    }
  }

  const handlePauseApp = async (appId: string) => {
    try {
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Pausing application: ${appId}`
      ])

      await vehicleEdgeRuntimeDirectService.pauseApp(appId)

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Application ${appId} paused successfully`
      ])

      // Update local state immediately for responsive UI
      setVehicleApps(prev => prev.map(app =>
        app.id === appId ? { ...app, status: 'paused' as const } : app
      ))

      // Refresh apps list to get updated status
      await refreshApps()
    } catch (error) {
      console.error('Failed to pause app:', error)
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to pause app ${appId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])
    }
  }

  const handleResumeApp = async (appId: string) => {
    try {
      // Find the current app state
      const app = vehicleApps.find(a => a.id === appId)
      if (!app) {
        throw new Error('Application not found')
      }

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Starting application: ${appId} (current status: ${app.status})`
      ])

      // Based on runtime analysis:
      // - If app is 'paused' -> use resume_app (same executionId, keeps container state)
      // - If app is 'stopped' or 'error' -> use run_app (new executionId, complete redeploy)

      if (app.status === 'paused') {
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [INFO] App is paused, resuming container (keeping same executionId)`
        ])

        // Use resume_app for paused apps (keeps same executionId)
        await vehicleEdgeRuntimeDirectService.resumeApp(appId)

        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SUCCESS] Application ${appId} resumed successfully`
        ])

        // Update local state immediately for responsive UI
        setVehicleApps(prev => prev.map(a =>
          a.id === appId ? { ...a, status: 'running' as const } : a
        ))
      } else {
        // For 'stopped' or 'error' apps, use run_app (gets new executionId)
        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [INFO] App is ${app.status}, starting fresh deployment (new executionId will be created)`
        ])

        await vehicleEdgeRuntimeDirectService.startApp(appId)

        setConsoleOutput(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SUCCESS] Application ${appId} started successfully`
        ])

        // Note: run_app creates new executionId, so we must refresh to get updated data
      }

      // Always refresh apps list to get the latest executionId and status
      await refreshApps()
    } catch (error) {
      console.error('Failed to start/resume app:', error)
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to start/resume app ${appId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])
    }
  }

  const handleUninstallApp = async (appId: string) => {
    if (!confirm('Are you sure you want to uninstall this application? This action cannot be undone.')) {
      return
    }

    try {
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Uninstalling application: ${appId}`
      ])

      await vehicleEdgeRuntimeDirectService.uninstallApp(appId)

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Application ${appId} uninstalled successfully`
      ])

      // Remove app from local state immediately for responsive UI
      setVehicleApps(prev => prev.filter(app => app.id !== appId))

      // Refresh apps list to get updated status
      await refreshApps()
    } catch (error) {
      console.error('Failed to uninstall app:', error)
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to uninstall app ${appId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])
    }
  }

  const handleRestartApp = async (appId: string) => {
    try {
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Restarting application: ${appId}`
      ])

      await vehicleEdgeRuntimeDirectService.restartApp(appId)

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Application ${appId} restarted successfully`
      ])

      // Refresh apps list to get updated status
      await refreshApps()
    } catch (error) {
      console.error('Failed to restart app:', error)
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to restart app ${appId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])
    }
  }

  const handleRefreshKits = async () => {
    try {
      // Update last refresh time
      setLastRefreshTime(new Date())

      // Request fresh kits list via WebSocket
      kitManagerService.requestKits()

      // Also fetch via REST as backup
      const kitsResponse = await kitManagerService.listKits()
      if (kitsResponse.status === 'OK') {
        setKits(kitsResponse.content)
      }
    } catch (error) {
      console.error('Failed to refresh kits:', error)
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

  const clearConsole = () => {
    setConsoleOutput([])
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
      // Connection states
      case 'online':
        return <TbCheck className="w-4 h-4 text-green-500" />
      case 'offline':
        return <TbX className="w-4 h-4 text-red-500" />
      case 'connecting':
        return <TbLoader className="w-4 h-4 text-yellow-500 animate-spin" />

      // Application states
      case 'running':
        return <TbPlayerPlay className="w-4 h-4 text-green-500" />
      case 'paused':
        return <TbPlayerPause className="w-4 h-4 text-yellow-500" />
      case 'stopped':
        return <TbPlayerStop className="w-4 h-4 text-gray-500" />
      case 'error':
        return <TbAlertTriangle className="w-4 h-4 text-red-500" />
      case 'installed':
        return <TbPackage className="w-4 h-4 text-blue-500" />
      case 'starting':
        return <TbLoader className="w-4 h-4 text-blue-500 animate-spin" />

      default:
        return <TbHelp className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <DashboardHeader
        selectedKit={selectedKit}
        isRuntimeConnected={isRuntimeConnected}
        isKitManagerConnected={isKitManagerConnected}
        connectionError={connectionError}
        kits={kits}
        onKitSelect={setSelectedKit}
        onSetupRuntime={() => setActiveTab('overview')}
      />

      <DashboardTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        runningAppsCount={runningApps.length}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            // Connection State
            connectionError={connectionError}
            isConnected={isConnected}
            isKitManagerConnected={isKitManagerConnected}
            
            // Kit Management
            kits={kits}
            selectedKit={selectedKit}
            showOfflineDevices={showOfflineDevices}
            autoRefreshEnabled={autoRefreshEnabled}
            lastRefreshTime={lastRefreshTime}
            
            // Actions
            onRefreshKits={handleRefreshKits}
            onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            onToggleShowOfflineDevices={() => setShowOfflineDevices(!showOfflineDevices)}
            onReconnect={handleReconnect}
            onShowSetupWizard={() => setShowSetupWizard(true)}
            onSelectKit={setSelectedKit}
            
            // Runtime State
            runningAppsCount={runningApps.length}
            subscribersCount={filteredKits.reduce((sum, kit) => sum + kit.noSubscriber, 0)}
          />
        )}

        {activeTab === 'deploy-apps' && (
          <SplitPanelLayout
            leftPanel={
              <SmartDeploymentWorkflow
                selectedKit={selectedKit}
                isRuntimeConnected={isRuntimeConnected}
                deployedApps={deployedRuntimeApps}
                onDeploy={handleDeployment}
                isDeploying={isDeploying}
                selectedDeploymentType={selectedDeploymentType}
                onDeploymentTypeChange={setSelectedDeploymentType}
                showTypeSelector={showDeploymentTypeSelector}
                onShowTypeSelectorChange={setShowDeploymentTypeSelector}
              />
            }
            rightPanel={
              <ApplicationsTab
                selectedKit={selectedKit}
                isRuntimeConnected={isRuntimeConnected}
                connectionError={connectionError}
                vehicleApps={vehicleApps}
                runtimeState={runtimeState}
                isRefreshingApps={isRefreshingApps}
                onRefreshApps={refreshApps}
                onStartApp={handleStartApp}
                onStopApp={handleStopApp}
                onPauseApp={handlePauseApp}
                onResumeApp={handleResumeApp}
                onRestartApp={handleRestartApp}
                onUninstallApp={handleUninstallApp}
                onViewConsole={handleViewConsole}
                onDeployNewApp={() => setActiveTab('deploy-apps')}
                onSelectTab={(tab: string) => setActiveTab(tab as any)}
              />
            }
            leftPanelBadgeCount={0}
            rightPanelBadgeCount={vehicleApps.length}
          />
        )}

        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Marketplace Header */}
            <div className="bg-background rounded-xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <TbShoppingCart className="w-6 h-6 text-muted-foreground" />
                    <h3 className="text-xl font-semibold text-foreground">digital.auto Marketplace</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Discover and deploy vehicle applications from the digital.auto ecosystem</p>
                </div>
                <div className="hidden sm:flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">{filteredMarketplaceApps.length}</div>
                    <div className="text-xs text-muted-foreground">Available Apps</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {filteredMarketplaceApps.filter(app => app.type === 'docker').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Docker Apps</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {filteredMarketplaceApps.filter(app => app.type === 'python').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Python Apps</div>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search apps by name, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <TbFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <TbX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'All' : category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Runtime Check */}
            {!selectedKit && kits.length > 0 ? (
              <div className="rounded-lg border border-border p-6 text-center bg-yellow-50 border-yellow-200">
                <TbAlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Runtime Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Please select a Vehicle Edge Runtime from the header to deploy apps from the marketplace.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <TbArrowUp className="w-4 h-4" />
                  <span>Select a runtime from the dropdown in the header above</span>
                </div>
              </div>
            ) : !selectedKit && kits.length === 0 ? (
              <div className="rounded-lg border border-border p-6 text-center bg-yellow-50 border-yellow-200">
                <TbAlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Runtime Available</h3>
                <p className="text-muted-foreground mb-6">
                  You need to connect a Vehicle Edge Runtime before deploying apps from the marketplace.
                </p>
                <Button
                  onClick={() => setActiveTab('overview')}
                  className="mx-auto"
                >
                  <TbTool className="w-4 h-4 mr-2" />
                  Setup Vehicle Edge Runtime
                </Button>
              </div>
            ) : (
              <>
                {/* Apps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMarketplaceApps.map((app) => (
                    <Card key={app.id} className="group relative hover:shadow-md transition-shadow duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`text-3xl p-2 rounded-lg ${
                              app.type === 'docker'
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              {app.type === 'docker' ? '🐳' : app.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg hover:text-primary transition-colors">
                                {app.name}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                by {app.author}
                              </CardDescription>

                              {/* Category and Difficulty Tags */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                  {getCategoryIcon(app.category)} {app.category}
                                </span>
                                {app.difficulty && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    app.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                    app.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  }`}>
                                    {app.difficulty}
                                  </span>
                                )}
                                {app.estimatedTime && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted">
                                    <TbClock className="w-3 h-3 mr-1" />
                                    {app.estimatedTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* App Type Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            app.type === 'docker'
                              ? 'bg-green-600'
                              : 'bg-blue-600'
                          }`}>
                            {app.type === 'docker' ? '🐳 Docker' : '🐍 Python'}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">{app.description}</p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-border">
                          <div>
                            <div className="flex items-center justify-center space-x-1 text-yellow-500">
                              <TbStar className="w-3 h-3 fill-current" />
                              <span className="font-medium text-sm">{app.rating}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Rating</div>
                          </div>
                          <div>
                            <div className="flex items-center justify-center space-x-1 text-blue-500">
                              <TbDownload className="w-3 h-3" />
                              <span className="font-medium text-sm">{app.downloads.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Downloads</div>
                          </div>
                          <div>
                            <div className="flex items-center justify-center space-x-1 text-purple-500">
                              <TbPackage className="w-3 h-3" />
                              <span className="font-medium text-sm">{app.size}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Size</div>
                          </div>
                        </div>

                        {/* Docker Configuration Display */}
                        {app.type === 'docker' && (
                          <DockerConfigDisplay
                            app={app}
                            showConfig={expandedDockerCommands.has(app.id)}
                            onToggleConfig={() => handleToggleDockerCommand(app.id)}
                          />
                        )}
                      </CardContent>

                      <CardFooter className="space-y-2">
                        <Button
                          onClick={() => handleDeployMarketplaceApp(app)}
                          disabled={!selectedKit || !selectedKit.is_online || isDeployingApp}
                          className="w-full"
                          variant={app.type === 'docker' ? 'default' : 'secondary'}
                        >
                          {isDeployingApp ? (
                            <>
                              <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
                              Deploying...
                            </>
                          ) : (
                            <>
                              <TbRocket className="w-4 h-4 mr-2" />
                              {app.type === 'docker' ? 'Deploy Docker' : 'Deploy Python'}
                            </>
                          )}
                        </Button>

                        {!selectedKit?.is_online && selectedKit && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 text-center flex items-center justify-center">
                            <TbAlertTriangle className="w-3 h-3 mr-1" />
                            Runtime is offline - deployment may fail
                          </p>
                        )}

                        {!selectedKit && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 text-center flex items-center justify-center">
                            <TbDeviceDesktop className="w-3 h-3 mr-1" />
                            Select a runtime to deploy
                          </p>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {/* No Apps Found */}
                {filteredMarketplaceApps.length === 0 && (
                  <div className="text-center py-12 bg-background rounded-xl border border-dashed">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <TbShoppingCart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Apps Found</h3>
                    <p className="text-muted-foreground mb-6">
                      No apps found matching your criteria.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory('all')
                        }}
                        variant="outline"
                      >
                        Clear Filters
                      </Button>
                      <Button
                        onClick={() => setActiveTab('deploy-apps')}
                      >
                        Create Custom App
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'apps' && (
          <ApplicationsTab
            selectedKit={selectedKit}
            isRuntimeConnected={isRuntimeConnected}
            connectionError={connectionError}
            vehicleApps={vehicleApps}
            runtimeState={runtimeState}
            isRefreshingApps={isRefreshingApps}
            onRefreshApps={refreshApps}
            onStartApp={handleStartApp}
            onStopApp={handleStopApp}
            onPauseApp={handlePauseApp}
            onResumeApp={handleResumeApp}
            onRestartApp={handleRestartApp}
            onUninstallApp={handleUninstallApp}
            onViewConsole={handleViewConsole}
            onDeployNewApp={() => setActiveTab('deploy')}
            onSelectTab={(tab: string) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            kits={kits}
            selectedKit={selectedKit}
            onSelectKit={setSelectedKit}
          />
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