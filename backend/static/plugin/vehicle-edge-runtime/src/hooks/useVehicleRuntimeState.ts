// React hook for Vehicle Edge Runtime with real service connections
import { useState, useEffect, useCallback, useRef } from 'react'
import { VehicleRuntimeService, VehicleApp } from '../services/runtime.service'
import { KitManagerService, VehicleEdgeRuntimeKit } from '../services/kitManager.service'

export interface ConsoleLine {
  stream: 'stdout' | 'stderr'
  content: string
  timestamp: string
}

interface VehicleRuntimeState {
  // Connection status
  isRuntimeConnected: boolean
  isKitManagerConnected: boolean
  isKitManagerLoading: boolean
  kitManagerError: string | null

  // Devices
  kits: VehicleEdgeRuntimeKit[]
  selectedKit: VehicleEdgeRuntimeKit | null

  // Applications
  vehicleApps: VehicleApp[]
  isRefreshingApps: boolean

  // Console output per app
  appConsoleOutputs: Record<string, ConsoleLine[]>

  // Service deployment
  isDeployingKuksa: boolean
  isDeployingMock: boolean

  // Errors
  connectionError: string | null

  // Actions
  connectRuntime: () => Promise<void>
  connectKitManager: () => Promise<void>
  selectKit: (kit: VehicleEdgeRuntimeKit) => void
  refreshApps: () => Promise<void>
  startApp: (appId: string) => Promise<void>
  stopApp: (appId: string) => Promise<void>
  uninstallApp: (appId: string) => Promise<void>
  deployApp: (config: { name: string; displayName?: string; code: string; dependencies?: string[] }) => Promise<string>
  deployKuksa: () => Promise<string>
  deployMock: (mode?: 'echo-all' | 'echo-specific', signals?: string[]) => Promise<string>
  subscribeAppConsole: (appId: string) => Promise<void>
  unsubscribeAppConsole: (appId: string) => Promise<void>
}

export function useVehicleRuntimeState(websocketUrl?: string, kitManagerUrl?: string): VehicleRuntimeState {
  const [isRuntimeConnected, setIsRuntimeConnected] = useState(false)
  const [isKitManagerConnected, setIsKitManagerConnected] = useState(false)
  const [isKitManagerLoading, setIsKitManagerLoading] = useState(false)
  const [kitManagerError, setKitManagerError] = useState<string | null>(null)
  const [kits, setKits] = useState<VehicleEdgeRuntimeKit[]>([])
  const [selectedKit, setSelectedKit] = useState<VehicleEdgeRuntimeKit | null>(null)
  const [vehicleApps, setVehicleApps] = useState<VehicleApp[]>([])
  const [isRefreshingApps, setIsRefreshingApps] = useState(false)
  const [appConsoleOutputs, setAppConsoleOutputs] = useState<Record<string, ConsoleLine[]>>({})
  const [isDeployingKuksa, setIsDeployingKuksa] = useState(false)
  const [isDeployingMock, setIsDeployingMock] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Service instances
  const runtimeServiceRef = useRef<VehicleRuntimeService | null>(null)
  const kitManagerServiceRef = useRef<KitManagerService | null>(null)

  // Initialize services
  useEffect(() => {
    runtimeServiceRef.current = new VehicleRuntimeService(websocketUrl)
    kitManagerServiceRef.current = new KitManagerService(kitManagerUrl)

    // Cleanup on unmount
    return () => {
      runtimeServiceRef.current?.disconnect()
    }
  }, [websocketUrl, kitManagerUrl])

  // Connect to Vehicle Runtime via Kit Manager WebSocket proxy
  const connectRuntime = useCallback(async () => {
    try {
      setConnectionError(null)
      console.log('[VehicleRuntime] Connecting to WebSocket:', websocketUrl)

      await runtimeServiceRef.current?.connect()
      setIsRuntimeConnected(true)

      console.log('[VehicleRuntime] ✅ Connected via Kit Manager proxy')

      // Setup event listeners
      const runtime = runtimeServiceRef.current
      if (!runtime) return

      // Listen for app status updates
      runtime.onAppStatus((message) => {
        console.log('[VehicleRuntime] App status update:', message)
        setVehicleApps(prev => prev.map(app =>
          app.app_id === message.appId
            ? { ...app, status: message.currentStatus }
            : app
        ))
      })

      // Listen for deployed apps list updates
      runtime.onDeployedAppsList((message) => {
        console.log('[VehicleRuntime] Deployed apps list:', message)
        const appsArray = Array.isArray(message?.applications) ? message.applications : []
        setVehicleApps(appsArray)
      })

      // Listen for console output
      runtime.onConsoleOutput((message) => {
        console.log('[VehicleRuntime] Console output:', message)
        const appId = message.executionId || message.appId
        if (appId && message.output) {
          setAppConsoleOutputs(prev => ({
            ...prev,
            [appId]: [
              ...(prev[appId] || []),
              {
                stream: message.stream || 'stdout',
                content: message.output,
                timestamp: message.timestamp || new Date().toISOString()
              }
            ].slice(-500) // Keep last 500 lines per app
          }))
        }
      })

    } catch (error) {
      console.warn('[VehicleRuntime] WebSocket connection failed (Kit Manager proxy may not have /runtime endpoint):', error)
      setIsRuntimeConnected(false)
    }
  }, [websocketUrl])

  // Connect to Kit Manager and fetch devices
  const connectKitManager = useCallback(async () => {
    setIsKitManagerLoading(true)
    setKitManagerError(null)

    try {
      const kitManager = kitManagerServiceRef.current
      if (!kitManager) {
        setKitManagerError('Kit Manager service not initialized')
        setIsKitManagerConnected(false)
        setIsKitManagerLoading(false)
        return
      }

      console.log('[KitManager] Connecting to', kitManager.getBaseUrl())

      const response = await kitManager.listKits()
      const kitsList = response.content || []

      setKits(kitsList)
      setIsKitManagerConnected(true)
      setKitManagerError(null)

      // Auto-select first online Edge-Runtime kit
      const onlineEdgeRuntimeKits = kitsList.filter(k => k.is_online && k.name.includes('Edge-Runtime'))
      if (onlineEdgeRuntimeKits.length > 0 && !selectedKit) {
        const kit = onlineEdgeRuntimeKits[0]
        setSelectedKit(kit)
        runtimeServiceRef.current?.setKitId(kit.kit_id)
        console.log('[KitManager] Auto-selected kit:', kit.name, 'kit_id:', kit.kit_id)
      }

      console.log('[KitManager] ✅ Connected - Loaded', kitsList.length, 'kits', `(${onlineEdgeRuntimeKits.length} Edge-Runtime online)`)
    } catch (error) {
      console.error('[KitManager] ❌ Connection failed:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to Kit Manager'
      setKitManagerError(errorMsg)
      setIsKitManagerConnected(false)
    } finally {
      setIsKitManagerLoading(false)
    }
  }, [selectedKit])

  // Refresh applications list
  const refreshApps = useCallback(async () => {
    if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
      console.warn('[VehicleRuntime] Not connected, skipping refresh')
      return
    }

    setIsRefreshingApps(true)
    try {
      const response = await runtimeServiceRef.current.getDeployedApps()
      const appsArray = Array.isArray(response?.applications) ? response.applications : []
      setVehicleApps(appsArray)
      console.log('[VehicleRuntime] Refreshed', appsArray.length, 'apps')
    } catch (error) {
      console.error('[VehicleRuntime] Failed to refresh apps:', error)
      setConnectionError(error instanceof Error ? error.message : 'Failed to refresh apps')
    } finally {
      setIsRefreshingApps(false)
    }
  }, [isRuntimeConnected])

  // Select a kit
  const selectKit = useCallback((kit: VehicleEdgeRuntimeKit) => {
    setSelectedKit(kit)
    // Set the kit ID for runtime service to know where to send commands
    runtimeServiceRef.current?.setKitId(kit.kit_id)
    // Clear state for the new runtime
    setVehicleApps([])
    setAppConsoleOutputs({})
    console.log('[KitManager] Selected kit:', kit.name, 'kit_id:', kit.kit_id, 'online:', kit.is_online)
  }, [])

  // Periodic refresh for applications (every 10 seconds when runtime is connected)
  useEffect(() => {
    // Only refresh if we have an online Edge-Runtime kit selected
    if (!isRuntimeConnected) return

    // Initial refresh
    refreshApps()

    // Set up interval
    const interval = setInterval(() => {
      refreshApps()
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [isRuntimeConnected, selectedKit]) // Trigger when selectedKit changes

  // Start application
  const startApp = useCallback(async (appId: string) => {
    if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
      throw new Error('Not connected to Vehicle Runtime')
    }

    try {
      await runtimeServiceRef.current.startApp(appId)
      await refreshApps()
    } catch (error) {
      console.error('[VehicleRuntime] Failed to start app:', error)
      throw error
    }
  }, [isRuntimeConnected, refreshApps])

  // Stop application
  const stopApp = useCallback(async (appId: string) => {
    if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
      throw new Error('Not connected to Vehicle Runtime')
    }

    try {
      await runtimeServiceRef.current.stopApp(appId)
      await refreshApps()
    } catch (error) {
      console.error('[VehicleRuntime] Failed to stop app:', error)
      throw error
    }
  }, [isRuntimeConnected, refreshApps])

  // Uninstall application
  const uninstallApp = useCallback(async (appId: string) => {
    if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
      throw new Error('Not connected to Vehicle Runtime')
    }

    try {
      await runtimeServiceRef.current.uninstallApp(appId)
      await refreshApps()
    } catch (error) {
      console.error('[VehicleRuntime] Failed to uninstall app:', error)
      throw error
    }
  }, [isRuntimeConnected, refreshApps])

  // Deploy new application
  const deployApp = useCallback(async (config: {
    name: string
    displayName?: string
    code: string
    dependencies?: string[]
  }): Promise<string> => {
    if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
      throw new Error('Not connected to Vehicle Runtime')
    }

    try {
      const appId = await runtimeServiceRef.current.deployPythonApp(config)
      await refreshApps()
      return appId || 'unknown'
    } catch (error) {
      console.error('[VehicleRuntime] Failed to deploy app:', error)
      throw error
    }
  }, [isRuntimeConnected, refreshApps])

  // Deploy KUKSA server
  const deployKuksa = useCallback(async (): Promise<string> => {
    setIsDeployingKuksa(true)
    try {
      const appId = await runtimeServiceRef.current?.deployKuksaServer()
      await refreshApps()
      return appId || 'VEA-kuksa-databroker'
    } catch (error) {
      console.error('[VehicleRuntime] Failed to deploy KUKSA:', error)
      throw error
    } finally {
      setIsDeployingKuksa(false)
    }
  }, [refreshApps])

  // Deploy Mock service
  const deployMock = useCallback(async (mode: 'echo-all' | 'echo-specific' = 'echo-all', signals?: string[]): Promise<string> => {
    setIsDeployingMock(true)
    try {
      const appId = await runtimeServiceRef.current?.deployMockService(mode, signals)
      await refreshApps()
      return appId || 'VEA-mock-service'
    } catch (error) {
      console.error('[VehicleRuntime] Failed to deploy Mock service:', error)
      throw error
    } finally {
      setIsDeployingMock(false)
    }
  }, [refreshApps])

  // Subscribe to app console output
  const subscribeAppConsole = useCallback(async (appId: string): Promise<void> => {
    try {
      await runtimeServiceRef.current?.subscribeConsole(appId)
      // Initialize with empty array for this app
      setAppConsoleOutputs(prev => ({
        ...prev,
        [appId]: []
      }))
      // Fetch initial console output
      const output = await runtimeServiceRef.current?.getAppOutput(appId, 100)
      if (output?.output && Array.isArray(output.output)) {
        setAppConsoleOutputs(prev => ({
          ...prev,
          [appId]: output.output.slice(-500).map((line: any) => ({
            stream: line.stream || 'stdout',
            content: line.output || line.content || '',
            timestamp: line.timestamp || new Date().toISOString()
          }))
        }))
      }
    } catch (error) {
      console.error('[VehicleRuntime] Failed to subscribe to console:', error)
      // Ensure we have an empty array even on error
      setAppConsoleOutputs(prev => ({
        ...prev,
        [appId]: []
      }))
    }
  }, [])

  // Unsubscribe from app console output
  const unsubscribeAppConsole = useCallback(async (appId: string): Promise<void> => {
    try {
      await runtimeServiceRef.current?.unsubscribeConsole(appId)
    } catch (error) {
      console.error('[VehicleRuntime] Failed to unsubscribe from console:', error)
    }
  }, [])

  // Clear console output for an app
  const clearAppConsole = useCallback((appId: string) => {
    setAppConsoleOutputs(prev => ({ ...prev, [appId]: [] }))
  }, [])

  return {
    isRuntimeConnected,
    isKitManagerConnected,
    isKitManagerLoading,
    kitManagerError,
    kits,
    selectedKit,
    vehicleApps,
    isRefreshingApps,
    appConsoleOutputs,
    isDeployingKuksa,
    isDeployingMock,
    connectionError,
    connectRuntime,
    connectKitManager,
    selectKit,
    refreshApps,
    startApp,
    stopApp,
    uninstallApp,
    deployApp,
    deployKuksa,
    deployMock,
    subscribeAppConsole,
    unsubscribeAppConsole,
    clearAppConsole
  }
}
