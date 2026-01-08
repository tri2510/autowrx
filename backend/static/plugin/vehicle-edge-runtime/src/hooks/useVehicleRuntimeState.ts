// React hook for Vehicle Edge Runtime with real service connections
import { useState, useEffect, useCallback, useRef } from 'react'
import { VehicleRuntimeService, VehicleApp } from '../services/runtime.service'
import { KitManagerService, VehicleEdgeRuntimeKit } from '../services/kitManager.service'

interface VehicleRuntimeState {
  // Connection status
  isRuntimeConnected: boolean
  isKitManagerConnected: boolean

  // Devices
  kits: VehicleEdgeRuntimeKit[]
  selectedKit: VehicleEdgeRuntimeKit | null

  // Applications
  vehicleApps: VehicleApp[]
  isRefreshingApps: boolean

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
}

export function useVehicleRuntimeState(websocketUrl?: string, kitManagerUrl?: string): VehicleRuntimeState {
  const [isRuntimeConnected, setIsRuntimeConnected] = useState(false)
  const [isKitManagerConnected, setIsKitManagerConnected] = useState(false)
  const [kits, setKits] = useState<VehicleEdgeRuntimeKit[]>([])
  const [selectedKit, setSelectedKit] = useState<VehicleEdgeRuntimeKit | null>(null)
  const [vehicleApps, setVehicleApps] = useState<VehicleApp[]>([])
  const [isRefreshingApps, setIsRefreshingApps] = useState(false)
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

  // Connect to Vehicle Runtime
  const connectRuntime = useCallback(async () => {
    try {
      setConnectionError(null)
      await runtimeServiceRef.current?.connect()
      setIsRuntimeConnected(true)

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

    } catch (error) {
      console.error('[VehicleRuntime] Connection failed:', error)
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect to Vehicle Runtime')
      setIsRuntimeConnected(false)
    }
  }, [])

  // Connect to Kit Manager and fetch devices
  const connectKitManager = useCallback(async () => {
    try {
      setConnectionError(null)
      const kitManager = kitManagerServiceRef.current
      if (!kitManager) return

      const response = await kitManager.listKits()
      const kitsList = response.content || []

      setKits(kitsList)
      setIsKitManagerConnected(true)

      // Auto-select first online kit
      const onlineKits = kitsList.filter(k => k.is_online)
      if (onlineKits.length > 0 && !selectedKit) {
        setSelectedKit(onlineKits[0])
      }

      console.log('[KitManager] Loaded', kitsList.length, 'kits')
    } catch (error) {
      console.error('[KitManager] Connection failed:', error)
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect to Kit Manager')
      setIsKitManagerConnected(false)
    }
  }, [selectedKit])

  // Select a kit
  const selectKit = useCallback((kit: VehicleEdgeRuntimeKit) => {
    setSelectedKit(kit)
    console.log('[KitManager] Selected kit:', kit.name)

    // If runtime not connected, try to connect
    if (!isRuntimeConnected) {
      connectRuntime()
    }

    // Refresh apps for the selected kit
    refreshApps()
  }, [isRuntimeConnected, connectRuntime])

  // Refresh applications list
  const refreshApps = useCallback(async () => {
    if (!runtimeServiceRef.current?.isServiceConnected()) {
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
  }, [])

  // Start application
  const startApp = useCallback(async (appId: string) => {
    try {
      await runtimeServiceRef.current?.startApp(appId)
      await refreshApps()
    } catch (error) {
      console.error('[VehicleRuntime] Failed to start app:', error)
      throw error
    }
  }, [refreshApps])

  // Stop application
  const stopApp = useCallback(async (appId: string) => {
    try {
      await runtimeServiceRef.current?.stopApp(appId)
      await refreshApps()
    } catch (error) {
      console.error('[VehicleRuntime] Failed to stop app:', error)
      throw error
    }
  }, [refreshApps])

  // Uninstall application
  const uninstallApp = useCallback(async (appId: string) => {
    try {
      await runtimeServiceRef.current?.uninstallApp(appId)
      await refreshApps()
    } catch (error) {
      console.error('[VehicleRuntime] Failed to uninstall app:', error)
      throw error
    }
  }, [refreshApps])

  // Deploy new application
  const deployApp = useCallback(async (config: {
    name: string
    displayName?: string
    code: string
    dependencies?: string[]
  }): Promise<string> => {
    try {
      const appId = await runtimeServiceRef.current?.deployPythonApp(config)
      await refreshApps()
      return appId || 'unknown'
    } catch (error) {
      console.error('[VehicleRuntime] Failed to deploy app:', error)
      throw error
    }
  }, [refreshApps])

  return {
    isRuntimeConnected,
    isKitManagerConnected,
    kits,
    selectedKit,
    vehicleApps,
    isRefreshingApps,
    connectionError,
    connectRuntime,
    connectKitManager,
    selectKit,
    refreshApps,
    startApp,
    stopApp,
    uninstallApp,
    deployApp
  }
}
