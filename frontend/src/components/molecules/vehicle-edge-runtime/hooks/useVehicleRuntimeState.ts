// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback } from 'react'
import vehicleEdgeRuntimeDirectService, { VehicleApp, RuntimeState } from '@/services/vehicleEdgeRuntimeDirect.service'
import { convertToExtendedVehicleApp, convertToRunningApp, type RunningApp } from '../utils'

export interface VehicleRuntimeState {
  isRuntimeConnected: boolean
  runtimeState: RuntimeState | null
  vehicleApps: VehicleApp[]
  deployedRuntimeApps: any[]
  isRefreshingApps: boolean
  connectionError: string | null
}

export const useVehicleRuntimeState = () => {
  const [state, setState] = useState<VehicleRuntimeState>({
    isRuntimeConnected: false,
    runtimeState: null,
    vehicleApps: [],
    deployedRuntimeApps: [],
    isRefreshingApps: false,
    connectionError: null
  })

  const initializeVehicleRuntime = useCallback(async () => {
    try {
      console.log('🚀 Initializing Vehicle Edge Runtime connection...')
      const isConnected = vehicleEdgeRuntimeDirectService.isServiceConnected()
      setState(prev => ({ ...prev, isRuntimeConnected: isConnected }))

      if (isConnected) {
        // Get runtime state
        const stateResponse = await vehicleEdgeRuntimeDirectService.getRuntimeState()
        setState(prev => ({ ...prev, runtimeState: stateResponse }))

        // Get deployed apps
        const appsResponse = await vehicleEdgeRuntimeDirectService.getDeployedApps()
        const convertedApps = appsResponse.applications.map(app => ({
          ...convertToRunningApp(app),
          ...convertToExtendedVehicleApp(app)
        }))

        setState(prev => ({
          ...prev,
          vehicleApps: convertedApps,
          deployedRuntimeApps: appsResponse.applications
        }))

        console.log('✅ Vehicle Edge Runtime initialized successfully')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Vehicle Edge Runtime:', error)
      setState(prev => ({
        ...prev,
        connectionError: error instanceof Error ? error.message : 'Unknown error',
        isRuntimeConnected: false
      }))
    }
  }, [])

  const refreshApps = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshingApps: true }))
    try {
      console.log('🔄 Refreshing apps...')

      // Get deployed apps from direct runtime service
      const appsResponse = await vehicleEdgeRuntimeDirectService.getDeployedApps()
      const appsArray = Array.isArray(appsResponse?.applications) ? appsResponse.applications : []

      const convertedApps = appsArray.map((app: any) => ({
        ...convertToRunningApp(app),
        ...convertToExtendedVehicleApp(app)
      }))

      setState(prev => ({
        ...prev,
        vehicleApps: convertedApps,
        deployedRuntimeApps: appsArray
      }))

      console.log(`✅ Refreshed ${convertedApps.length} apps`)
    } catch (error) {
      console.error('❌ Failed to refresh apps:', error)
      setState(prev => ({
        ...prev,
        connectionError: error instanceof Error ? error.message : 'Unknown error'
      }))
    } finally {
      setState(prev => ({ ...prev, isRefreshingApps: false }))
    }
  }, [])

  const startApp = useCallback(async (appId: string) => {
    try {
      console.log(`▶️ Starting app: ${appId}`)
      await vehicleEdgeRuntimeDirectService.startApp(appId)
      await refreshApps()
      console.log(`✅ App started: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to start app ${appId}:`, error)
      throw error
    }
  }, [refreshApps])

  const stopApp = useCallback(async (appId: string) => {
    try {
      console.log(`⏹️ Stopping app: ${appId}`)
      await vehicleEdgeRuntimeDirectService.stopApp(appId)
      await refreshApps()
      console.log(`✅ App stopped: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to stop app ${appId}:`, error)
      throw error
    }
  }, [refreshApps])

  const pauseApp = useCallback(async (appId: string) => {
    try {
      console.log(`⏸️ Pausing app: ${appId}`)
      await vehicleEdgeRuntimeDirectService.pauseApp(appId)
      await refreshApps()
      console.log(`✅ App paused: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to pause app ${appId}:`, error)
      throw error
    }
  }, [refreshApps])

  const resumeApp = useCallback(async (appId: string) => {
    try {
      console.log(`▶️ Resuming app: ${appId}`)
      await vehicleEdgeRuntimeDirectService.resumeApp(appId)
      await refreshApps()
      console.log(`✅ App resumed: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to resume app ${appId}:`, error)
      throw error
    }
  }, [refreshApps])

  const uninstallApp = useCallback(async (appId: string) => {
    try {
      console.log(`🗑️ Uninstalling app: ${appId}`)
      await vehicleEdgeRuntimeDirectService.uninstallApp(appId)
      await refreshApps()
      console.log(`✅ App uninstalled: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to uninstall app ${appId}:`, error)
      throw error
    }
  }, [refreshApps])

  const deployApp = useCallback(async (appConfig: { name: string; code: string; vehicleId?: string }) => {
    try {
      console.log('🚀 Deploying app:', appConfig.name)
      const deployedAppId = await vehicleEdgeRuntimeDirectService.deployPythonApp(appConfig)
      await refreshApps()
      console.log(`✅ App deployed: ${deployedAppId}`)
      return deployedAppId
    } catch (error) {
      console.error(`❌ Failed to deploy app:`, error)
      throw error
    }
  }, [refreshApps])

  // Setup event listeners
  useEffect(() => {
    const setupEventListeners = () => {
      vehicleEdgeRuntimeDirectService.onDeployedAppsList((message) => {
        console.log('📨 Received deployed apps list:', message)
        const appsArray = Array.isArray(message?.applications) ? message.applications : []
        const convertedApps = appsArray.map((app: any) => ({
          ...convertToRunningApp(app),
          ...convertToExtendedVehicleApp(app)
        }))

        setState(prev => ({
          ...prev,
          vehicleApps: convertedApps,
          deployedRuntimeApps: appsArray
        }))
      })

      vehicleEdgeRuntimeDirectService.onAppStatus((message) => {
        console.log('📊 App status update:', message)
        // Update app status in local state
        setState(prev => ({
          ...prev,
          vehicleApps: prev.vehicleApps.map(app =>
            app.id === message.status?.app_id
              ? { ...app, status: message.status.state, lastStatusUpdate: new Date().toISOString() }
              : app
          )
        }))
      })

      vehicleEdgeRuntimeDirectService.onConsoleOutput((message) => {
        console.log('📟 Console output:', message)
        // Console output is handled by the useConsoleOutput hook
      })
    }

    setupEventListeners()
  }, [])

  return {
    ...state,
    initializeVehicleRuntime,
    refreshApps,
    startApp,
    stopApp,
    pauseApp,
    resumeApp,
    uninstallApp,
    deployApp
  }
}