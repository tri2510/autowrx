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
  TbHelp
} from 'react-icons/tb'
import useSocketIO from '@/hooks/useSocketIO'
import DaDeviceSetupWizard from './DaDeviceSetupWizard'
import kitManagerService, { VehicleEdgeRuntimeKit, KitManagerMessage } from '@/services/kitManager.service'
import vehicleEdgeRuntimeService from '@/services/vehicleEdgeRuntime.service'
import vehicleEdgeRuntimeDirectService, { VehicleApp, RuntimeState } from '@/services/vehicleEdgeRuntimeDirect.service'

// Extended VehicleApp interface with additional properties
interface ExtendedVehicleApp extends VehicleApp {
  lastStatusUpdate?: string
}
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

interface MarketplaceApp {
  id: string
  name: string
  description: string
  category: string
  version: string
  author: string
  rating: number
  downloads: number
  price: 'free' | 'paid'
  icon: string
  tags: string[]
  size: string
  lastUpdated: string
  code?: string
  entryPoint?: string
  type: 'python' | 'binary'
  requirements: string[]
}

interface VehicleEdgeRuntimeDashboardProps {
  onClose: () => void
  prototype?: any
}

const DaVehicleEdgeRuntimeDashboard: FC<VehicleEdgeRuntimeDashboardProps> = ({
  onClose,
  prototype
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deploy' | 'marketplace' | 'apps' | 'console' | 'settings'>('overview')
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
  const [vehicleApps, setVehicleApps] = useState<ExtendedVehicleApp[]>([])
  const [deployedRuntimeApps, setDeployedRuntimeApps] = useState<any[]>([])
  const [isRefreshingApps, setIsRefreshingApps] = useState(false)
  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null)
  const [isRuntimeConnected, setIsRuntimeConnected] = useState(false)
  const [isKitManagerConnected, setIsKitManagerConnected] = useState(false)
  const [customAppName, setCustomAppName] = useState('your-vehicle-app')

  const consoleEndRef = useRef<HTMLDivElement>(null)
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

        // Get initial runtime state and apps
        try {
          const stateResponse = await vehicleEdgeRuntimeDirectService.getRuntimeState()
          setRuntimeState(stateResponse.runtimeState as RuntimeState)
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
        // Convert to VehicleApp format
        const convertedApps = message.applications.map((app: any) => ({
          id: app.app_id || app.id,
          name: app.name || `App ${app.app_id || app.id}`,
          version: app.version || '1.0.0',
          type: 'python' as const,
          status: app.status as VehicleApp['status'] || 'running',
          created_at: app.deploy_time ? new Date(app.deploy_time).toISOString() : new Date().toISOString(),
          executionId: app.app_id || app.id || app.executionId
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
        type: 'python' as const,
        status: app.status as 'running' | 'stopped' | 'error',
        startTime: new Date(app.deploy_time),
        resources: {
          cpu: app.resources?.cpu || 0,
          memory: app.resources?.memory || 0
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

      let finalCode = app.code || ''

      // If it's a binary app, we'll handle it differently
      if (app.type === 'binary') {
        // For binary apps, we would typically download the binary
        // For now, we'll show a message indicating binary deployment
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
        `[${timestamp}] 🔄 Switching to Console tab to monitor deployment...`
      ])

      // Switch to console tab to monitor the deployment
      setActiveTab('console')

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
      const appId = `app-${Date.now()}`

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
        name: appName,
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

      // Switch to console tab to monitor the app
      setActiveTab('console')
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
        const convertedApps = appsArray.map((app: any) => ({
          id: app.app_id || app.id,
          name: app.name || `App ${app.app_id || app.id}`,
          version: app.version || '1.0.0',
          type: (app.type as VehicleApp['type']) || 'python',
          status: app.status as VehicleApp['status'] || 'running',
          created_at: app.deploy_time ? new Date(app.deploy_time).toISOString() : new Date().toISOString(),
          executionId: app.app_id || app.id || app.executionId,
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

  // Application lifecycle management functions
  const handleStartApp = async (appId: string) => {
    try {
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Starting application: ${appId}`
      ])

      // Use the correct API format: manage_app with app_id and action: "start"
      await vehicleEdgeRuntimeDirectService.startApp(appId)

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Start command sent for application: ${appId}`
      ])

      // Refresh apps list to get updated status
      await refreshApps()
    } catch (error) {
      console.error('Failed to start app:', error)
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to start app ${appId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])
    }
  }

  const handleStopApp = async (appId: string) => {
    try {
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
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to stop app ${appId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])
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
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ACTION] Resuming application: ${appId}`
      ])

      await vehicleEdgeRuntimeDirectService.resumeApp(appId)

      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Application ${appId} resumed successfully`
      ])

      // Update local state immediately for responsive UI
      setVehicleApps(prev => prev.map(app =>
        app.id === appId ? { ...app, status: 'running' as const } : app
      ))

      // Refresh apps list to get updated status
      await refreshApps()
    } catch (error) {
      console.error('Failed to resume app:', error)
      setConsoleOutput(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to resume app ${appId}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TbServer className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Vehicle Edge Runtime</h2>
              <p className="text-muted-foreground">Deploy and manage vehicle applications</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            {selectedKit && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-background">
                <TbPlugConnected className="w-4 h-4" />
                <div className={`w-2 h-2 rounded-full ${
                  isRuntimeConnected
                    ? 'bg-green-500'
                    : isKitManagerConnected && selectedKit && !selectedKit.is_online
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {isRuntimeConnected
                    ? 'Runtime Connected'
                    : isKitManagerConnected && selectedKit && !selectedKit.is_online
                      ? 'Runtime Offline'
                    : isKitManagerConnected
                      ? 'Kit Manager Connected'
                      : 'Disconnected'
                  }
                </span>
                {connectionError && (
                  <span className="text-xs text-red-500 ml-2">
                    ({connectionError})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Persistent Runtime Selector */}
          <div className="flex items-center space-x-4">
            {kits.length > 0 ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">Runtime:</span>
                <select
                  value={selectedKit?.kit_id || ''}
                  onChange={(e) => {
                    const kit = kits.find(k => k.kit_id === e.target.value)
                    setSelectedKit(kit || null)
                  }}
                  className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]"
                >
                  <option value="">Select Runtime...</option>
                  {kits.filter(kit => kit.is_online).map((kit) => (
                    <option key={kit.kit_id} value={kit.kit_id}>
                      {kit.name} [{kit.kit_id.substring(0, 4).toUpperCase()}]
                    </option>
                  ))}
                </select>
                {selectedKit && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedKit.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${selectedKit.is_online ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedKit.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <TbAlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>No runtimes available</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  className="ml-2"
                >
                  Setup Runtime
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: TbDeviceDesktop },
            { id: 'deploy', label: 'Deploy', icon: TbRocket },
            { id: 'marketplace', label: 'Marketplace', icon: TbShoppingCart },
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
            {/* Connection Status Message */}
            {connectionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <TbAlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-medium text-red-800">Kit-Manager Connection Failed</h4>
                    <p className="text-sm text-red-700">
                      The Vehicle Edge Runtime service cannot connect to the kit-manager service on port 3090.
                      Please ensure the kit-manager Docker container is running: <code className="bg-red-100 px-1 rounded">docker ps | grep kit-manager</code>
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Error: {connectionError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Device Status Message */}
            {!connectionError && isKitManagerConnected && selectedKit && !selectedKit.is_online && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center space-x-2">
                  <TbAlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Vehicle Edge Runtime Device Offline</h4>
                    <p className="text-sm text-yellow-700">
                      The selected Vehicle Edge Runtime device (<strong>{selectedKit.name}</strong>) is currently offline.
                      Please ensure the device is powered on and connected to the network.
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Kit ID: {selectedKit.kit_id} | Last seen: {selectedKit.last_seen ? new Date(selectedKit.last_seen).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Runtime Selection */}
            <div className="rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Vehicle Edge Runtimes {isConnected ? <TbPlugConnected className="w-5 h-5 text-green-500 ml-2" /> : <TbPlug className="w-5 h-5 text-yellow-500 ml-2" />}
                  {lastRefreshTime && (
                    <span className="text-sm text-muted-foreground ml-2">
                      Last refresh: {lastRefreshTime.toLocaleTimeString()}
                    </span>
                  )}
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
                  <Button
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    variant={autoRefreshEnabled ? "default" : "outline"}
                    size="sm"
                    title={autoRefreshEnabled ? "Disable auto-refresh" : "Enable auto-refresh"}
                  >
                    {autoRefreshEnabled ? "Auto-refresh ON" : "Auto-refresh OFF"}
                  </Button>
                  <Button
                    onClick={() => setShowOfflineDevices(!showOfflineDevices)}
                    variant={showOfflineDevices ? "default" : "outline"}
                    size="sm"
                    title={showOfflineDevices ? "Hide offline devices" : "Show offline devices"}
                  >
                    {showOfflineDevices ? "Show All" : "Online Only"}
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
              ) : filteredKits.length === 0 ? (
                <div className="text-center py-12">
                  <TbWifi className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {showOfflineDevices ? "No Vehicle Edge Runtimes Connected" : "No Online Vehicle Edge Runtimes"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {showOfflineDevices
                      ? "Get started by adding your first Vehicle Edge Runtime device. Our setup wizard will guide you through the entire process."
                      : "All connected devices are currently offline. Click 'Show All' to view offline devices or add new devices."
                    }
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
                    {!showOfflineDevices && kits.length > 0 && (
                      <Button
                        onClick={() => setShowOfflineDevices(true)}
                        variant="outline"
                        className="w-full"
                      >
                        Show Offline Devices ({kits.length})
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredKits.map((kit) => (
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
                          <div>
                            <h4 className="font-medium text-foreground">{kit.name}</h4>
                            <p className="text-xs text-muted-foreground">ID: [{kit.kit_id.substring(0, 4).toUpperCase()}]</p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kit.is_online ? 'online' : 'offline')}`}>
                          {getStatusIcon(kit.is_online ? 'online' : 'offline')}
                          <span>{kit.is_online ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
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
                      <p className="text-2xl font-bold text-foreground">
                        {filteredKits.reduce((sum, kit) => sum + kit.noRunner, 0)}
                        {!showOfflineDevices && kits.filter(kit => !kit.is_online).length > 0 && (
                          <span className="text-xs text-muted-foreground block">
                            +{kits.filter(kit => !kit.is_online).reduce((sum, kit) => sum + kit.noRunner, 0)} offline
                          </span>
                        )}
                      </p>
                    </div>
                    <TbActivity className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Subscribers</p>
                      <p className="text-2xl font-bold text-foreground">
                        {filteredKits.reduce((sum, kit) => sum + kit.noSubscriber, 0)}
                        {!showOfflineDevices && kits.filter(kit => !kit.is_online).length > 0 && (
                          <span className="text-xs text-muted-foreground block">
                            +{kits.filter(kit => !kit.is_online).reduce((sum, kit) => sum + kit.noSubscriber, 0)} offline
                          </span>
                        )}
                      </p>
                    </div>
                    <TbRocket className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {showOfflineDevices ? "Total Runtimes" : "Online Runtimes"}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {showOfflineDevices ? kits.length : kits.filter(kit => kit.is_online).length}
                        {showOfflineDevices && (
                          <span className="text-xs text-muted-foreground block">
                            {kits.filter(kit => kit.is_online).length} online
                          </span>
                        )}
                      </p>
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

              {/* App Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Application Identifier</label>
                <Input
                  type="text"
                  value={customAppName}
                  onChange={(e) => {
                    const value = e.target.value.trim()
                    if (value.length > 0) {
                      setCustomAppName(value)
                    }
                  }}
                  placeholder={prototype?.name || 'your-vehicle-app'}
                  className="w-full"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter a unique identifier for your application. Default: your-vehicle-app
                </p>
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
                      onClick={() => setDeploymentConfig(prev => ({ ...prev, code: `import time, datetime

DURATION = 1200
INTERVAL = 30

start = time.time()
while time.time() - start < DURATION:
    elapsed = time.time() - start
    if int(elapsed) % INTERVAL == 0:
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] Elapsed: {elapsed:.0f}s")
    time.sleep(1)

print("\\nDone.")` }))}
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

              {/* Deployment Status */}
              {isDeploying && currentDeployment && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TbRefresh className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Deploying application {currentDeployment.appId ? `(${currentDeployment.appId})` : '...'}
                    </span>
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      You can stop the deployment at any time.
                    </span>
                  </div>
                </div>
              )}

              {/* Deploy Button Section */}
              <div className="flex justify-end items-center space-x-3">
                {deploymentResult?.status === 'error' && !isDeploying && (
                  <Button
                    onClick={handleRetryDeployment}
                    variant="outline"
                    disabled={!selectedKit || !deploymentConfig.code || !selectedKit.is_online || !isRuntimeConnected}
                    title="Retry the deployment"
                  >
                    <TbSquareRotated className="w-5 h-5 mr-2" />
                    Retry Deployment
                  </Button>
                )}

                {isDeploying && currentDeployment ? (
                  <Button
                    onClick={handleStopDeployment}
                    variant="destructive"
                    title="Stop current deployment"
                  >
                    <TbSquare className="w-5 h-5 mr-2" />
                    Stop Deployment
                  </Button>
                ) : (
                  <Button
                    onClick={handleDeployApp}
                    disabled={!selectedKit || !isRuntimeConnected || !deploymentConfig.code || isDeploying || !selectedKit.is_online}
                    title={
                      !deploymentConfig.code
                        ? 'Enter code to deploy'
                        : !selectedKit
                        ? 'Select a runtime to deploy'
                        : !isRuntimeConnected
                        ? 'Vehicle Edge Runtime not connected'
                        : !selectedKit.is_online
                        ? 'Selected runtime is offline'
                        : 'Deploy application to Vehicle Edge Runtime'
                    }
                  >
                    <TbRocket className="w-5 h-5 mr-2" />
                    Deploy to Runtime
                  </Button>
                )}
              </div>

              {/* Deployment Result */}
              {deploymentResult && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  deploymentResult.status === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {deploymentResult.status === 'success' ? (
                        <TbCheck className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TbAlertTriangle className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {deploymentResult.status === 'success' ? 'Deployment Successful' : 'Deployment Failed'}
                        </p>
                        <p className="text-sm mt-1">{deploymentResult.message}</p>
                        {deploymentResult.data && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer hover:underline">View deployment details</summary>
                            <pre className="mt-1 text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
                              {JSON.stringify(deploymentResult.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    {deploymentResult.status === 'error' && !isDeploying && (
                      <Button
                        onClick={handleRetryDeployment}
                        variant="outline"
                        size="sm"
                        className="ml-3 mt-1"
                      >
                        <TbSquareRotated className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Marketplace Header */}
            <div className="rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Digital Auto Marketplace</h3>
                  <p className="text-muted-foreground">Discover and deploy vehicle applications from the Digital Auto ecosystem</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <TbShoppingCart className="w-4 h-4" />
                  <span>{filteredMarketplaceApps.length} apps available</span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search apps by name, description, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10"
                    />
                    <TbFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMarketplaceApps.map((app) => (
                    <div key={app.id} className="bg-white border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      {/* App Card Header */}
                      <div className="p-6 border-b border-border">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-3xl">{app.icon}</div>
                            <div>
                              <h4 className="font-semibold text-foreground">{app.name}</h4>
                              <p className="text-sm text-muted-foreground">by {app.author}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            app.price === 'free'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {app.price === 'free' ? 'FREE' : 'PAID'}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{app.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {app.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                          {app.tags.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              +{app.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* App Card Details */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <TbStar className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{app.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <TbDownload className="w-4 h-4" />
                            <span>{app.downloads.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Version {app.version}</span>
                          <span>{app.size}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{app.category}</span>
                          <div className="flex items-center space-x-1">
                            <TbClock className="w-3 h-3" />
                            <span>Updated {app.lastUpdated}</span>
                          </div>
                        </div>

                        {/* Deploy Button */}
                        <Button
                          onClick={() => handleDeployMarketplaceApp(app)}
                          disabled={!selectedKit || !selectedKit.is_online || isDeployingApp}
                          className="w-full mt-4"
                        >
                          {isDeployingApp ? (
                            <>
                              <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
                              Deploying...
                            </>
                          ) : (
                            <>
                              <TbRocket className="w-4 h-4 mr-2" />
                              Deploy to {selectedKit?.name || 'Runtime'}
                            </>
                          )}
                        </Button>

                        {!selectedKit?.is_online && selectedKit && (
                          <p className="text-xs text-orange-600 text-center">
                            Runtime is offline - deployment may fail
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* No Apps Found */}
                {filteredMarketplaceApps.length === 0 && (
                  <div className="text-center py-12">
                    <TbShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No apps found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your search terms or category filter.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('all')
                      }}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-6">
            {!selectedKit ? (
              <div className="rounded-lg border border-border p-6 text-center">
                <TbCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Runtime Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Please select a Vehicle Edge Runtime from the header to view applications.
                </p>
              </div>
            ) : !isRuntimeConnected ? (
              <div className="rounded-lg border border-border p-6 text-center">
                <TbServer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Runtime Not Connected</h3>
                <p className="text-muted-foreground mb-6">
                  {connectionError || 'Failed to connect to Vehicle Edge Runtime'}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mx-auto"
                >
                  <TbRefresh className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-foreground">Applications ({vehicleApps.length})</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshApps}
                      disabled={isRefreshingApps}
                      title="Refresh applications list"
                    >
                      <TbRefresh className={`w-4 h-4 mr-1 ${isRefreshingApps ? 'animate-spin' : ''}`} />
                      {isRefreshingApps ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                  {runtimeState && (
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>CPU: {runtimeState.resources.cpu}</span>
                      <span>Memory: {runtimeState.resources.memory}</span>
                      <span>Uptime: {Math.floor(runtimeState.uptime / 60)}m</span>
                    </div>
                  )}
                </div>
              <div className="divide-y divide-border">
                {vehicleApps.length === 0 ? (
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
                  vehicleApps.map((app) => (
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
                              <span>Version: {app.version}</span>
                              {app.created_at && <span>Created: {new Date(app.created_at).toLocaleString()}</span>}
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {getStatusIcon(app.status)}
                                <span>{app.status}</span>
                              </div>
                              {app.lastStatusUpdate && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <TbClock className="w-3 h-3" />
                                  <span>Updated: {new Date(app.lastStatusUpdate).toLocaleTimeString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right text-sm">
                            {app.vehicle_signals && app.vehicle_signals.length > 0 && (
                              <div className="flex items-center space-x-1 text-muted-foreground">
                                <TbActivity className="w-3 h-3" />
                                <span>{app.vehicle_signals.length} signals</span>
                              </div>
                            )}
                            {app.python_deps && app.python_deps.length > 0 && (
                              <div className="flex items-center space-x-1 text-muted-foreground">
                                <TbDownload className="w-3 h-3" />
                                <span>{app.python_deps.length} deps</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewConsole(app)}
                            title="View Console"
                          >
                            <TbTerminal className="w-4 h-4" />
                          </Button>

                          {/* Start button - for stopped, installed, and error apps */}
                          {(app.status === 'stopped' || app.status === 'installed' || app.status === 'error') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleStartApp(app.id)}
                              title={`Start ${app.status} Application`}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <TbPlayerPlay className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Resume button - for paused apps */}
                          {app.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleResumeApp(app.id)}
                              title="Resume Application"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <TbPlayerPlay className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Pause button - for running apps */}
                          {app.status === 'running' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handlePauseApp(app.id)}
                              title="Pause Application"
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            >
                              <TbPlayerPause className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Restart button - for running and paused apps */}
                          {(app.status === 'running' || app.status === 'paused') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRestartApp(app.id)}
                              title="Restart Application"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <TbRefresh className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Stop button - for running and paused apps */}
                          {(app.status === 'running' || app.status === 'paused') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleStopApp(app.id)}
                              title="Stop Application"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TbPlayerStop className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Uninstall/Remove button - for all apps except starting */}
                          {app.status !== 'starting' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUninstallApp(app.id)}
                              title="Uninstall Application"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <TbTrash className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Disabled indicator for starting apps */}
                          {app.status === 'starting' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled
                              title="Application is starting..."
                              className="opacity-50 cursor-not-allowed"
                            >
                              <TbLoader className="w-4 h-4 animate-spin" />
                            </Button>
                          )}
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
                    onClick={clearConsole}
                  >
                    <TbTrash className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedApp) {
                        // Convert RunningApp to VehicleApp for console viewing
                        const vehicleApp: VehicleApp = {
                          id: selectedApp.id,
                          name: selectedApp.name,
                          version: '1.0.0',
                          type: selectedApp.type as 'python' | 'binary',
                          status: selectedApp.status as VehicleApp['status'],
                          created_at: selectedApp.startTime ? selectedApp.startTime.toISOString() : new Date().toISOString()
                        }
                        handleViewConsole(vehicleApp)
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
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                    {consoleOutput.map((line, index) => {
                      // Parse timestamp if it exists at the start
                      const timestampMatch = line.match(/^\[([\d:]+\s*[AP]M)\]\s*(.+)/)
                      if (timestampMatch) {
                        return (
                          <div key={index} className="mb-1">
                            <span className="text-gray-500">[{timestampMatch[1]}]</span>{' '}
                            <span className={
                              // Color coding based on content
                              timestampMatch[2].includes('🚀') ? 'text-blue-400' :
                              timestampMatch[2].includes('✅') ? 'text-green-400' :
                              timestampMatch[2].includes('❌') || timestampMatch[2].includes('⚠️') ? 'text-yellow-400' :
                              timestampMatch[2].includes('📦') || timestampMatch[2].includes('📝') ? 'text-blue-300' :
                              timestampMatch[2].includes('📤') ? 'text-cyan-400' :
                              'text-green-300'
                            }>{timestampMatch[2]}</span>
                          </div>
                        )
                      } else {
                        // Fallback for lines without timestamp
                        return (
                          <div key={index} className="mb-1 text-green-300">
                            {line}
                          </div>
                        )
                      }
                    })}
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