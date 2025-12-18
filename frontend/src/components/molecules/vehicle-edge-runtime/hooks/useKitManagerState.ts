// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback } from 'react'
import kitManagerService, { VehicleEdgeRuntimeKit, KitManagerMessage } from '@/services/kitManager.service'
import { useSocketIO } from '@/hooks/useSocketIO'
import { WEBSOCKET_CONFIG } from '../utils'

export interface KitManagerState {
  kits: VehicleEdgeRuntimeKit[]
  selectedKit: VehicleEdgeRuntimeKit | null
  isKitManagerConnected: boolean
  showOfflineDevices: boolean
  connectionError: string | null
  isRefreshing: boolean
}

export const useKitManagerState = () => {
  const { connected: kitManagerWsConnected } = useSocketIO()
  // For direct runtime connection, we'll check the service directly
  const directWsConnected = false // Simplified for now

  const [state, setState] = useState<KitManagerState>({
    kits: [],
    selectedKit: null,
    isKitManagerConnected: false,
    showOfflineDevices: false,
    connectionError: null,
    isRefreshing: false
  })

  const initializeKitManager = useCallback(async () => {
    try {
      console.log('🚀 Initializing Kit Manager connection...')
      setState(prev => ({ ...prev, isRefreshing: true }))

      const kitsResponse = await kitManagerService.listKits()
      const kits = Array.isArray(kitsResponse?.kits) ? kitsResponse.kits : []

      setState(prev => ({
        ...prev,
        kits,
        isKitManagerConnected: true,
        connectionError: null,
        isRefreshing: false
      }))

      // Auto-select first online kit
      const onlineKits = kits.filter((kit: VehicleEdgeRuntimeKit) => kit.is_online)
      if (onlineKits.length > 0 && !state.selectedKit) {
        setState(prev => ({ ...prev, selectedKit: onlineKits[0] }))
        console.log(`✅ Auto-selected kit: ${onlineKits[0].name}`)
      }

      console.log(`✅ Kit Manager initialized with ${kits.length} kits`)
    } catch (error) {
      console.error('❌ Failed to initialize Kit Manager:', error)
      setState(prev => ({
        ...prev,
        isKitManagerConnected: false,
        connectionError: error instanceof Error ? error.message : 'Unknown error',
        isRefreshing: false
      }))
    }
  }, [state.selectedKit])

  const refreshKits = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }))
    try {
      console.log('🔄 Refreshing kits...')
      const kitsResponse = await kitManagerService.listKits()
      const kits = Array.isArray(kitsResponse?.kits) ? kitsResponse.kits : []

      setState(prev => ({
        ...prev,
        kits,
        isRefreshing: false
      }))

      console.log(`✅ Refreshed ${kits.length} kits`)
    } catch (error) {
      console.error('❌ Failed to refresh kits:', error)
      setState(prev => ({
        ...prev,
        connectionError: error instanceof Error ? error.message : 'Unknown error',
        isRefreshing: false
      }))
    }
  }, [])

  const selectKit = useCallback((kit: VehicleEdgeRuntimeKit | null) => {
    setState(prev => ({ ...prev, selectedKit: kit }))
    if (kit) {
      console.log(`🎯 Selected kit: ${kit.name}`)
    }
  }, [])

  const toggleShowOfflineDevices = useCallback(() => {
    setState(prev => ({ ...prev, showOfflineDevices: !prev.showOfflineDevices }))
  }, [])

  const initializeRuntimeConnection = useCallback(async (kit: VehicleEdgeRuntimeKit) => {
    try {
      console.log(`🔗 Initializing runtime connection for kit: ${kit.name}`)

      // Request WebSocket connection from Kit Manager
      const websocketUrl = await kitManagerService.requestVehicleRuntimeWebSocket(kit.kit_id)

      // Use the WebSocket URL to connect directly to Vehicle Edge Runtime
      await kitManagerService.connectToVehicleRuntime(kit.kit_id)

      console.log(`✅ Runtime connection initialized for kit: ${kit.name}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to initialize runtime connection for kit ${kit.name}:`, error)
      setState(prev => ({
        ...prev,
        connectionError: error instanceof Error ? error.message : 'Failed to connect to runtime'
      }))
      return false
    }
  }, [])

  const reconnect = useCallback(async () => {
    try {
      console.log('🔄 Reconnecting to Kit Manager...')
      await kitManagerService.connect()
      await initializeKitManager()
      console.log('✅ Reconnected to Kit Manager')
    } catch (error) {
      console.error('❌ Failed to reconnect:', error)
      setState(prev => ({
        ...prev,
        connectionError: error instanceof Error ? error.message : 'Reconnection failed'
      }))
    }
  }, [initializeKitManager])

  // Setup Kit Manager event listeners
  useEffect(() => {
    const setupKitManagerEventListeners = () => {
      // Listen for kit status updates
      if (kitManagerWsConnected) {
        console.log('📡 Setting up Kit Manager event listeners')
      }
    }

    setupKitManagerEventListeners()
  }, [kitManagerWsConnected])

  // Handle WebSocket connection changes
  useEffect(() => {
    const isAnyConnected = kitManagerWsConnected || directWsConnected
    if (isAnyConnected !== state.isKitManagerConnected) {
      setState(prev => ({ ...prev, isKitManagerConnected: isAnyConnected }))
    }
  }, [kitManagerWsConnected, directWsConnected, state.isKitManagerConnected])

  // Auto-initialize on mount
  useEffect(() => {
    initializeKitManager()
  }, [initializeKitManager])

  // Auto-refresh interval
  useEffect(() => {
    if (state.isKitManagerConnected && !state.isRefreshing) {
      const interval = setInterval(() => {
        refreshKits()
      }, WEBSOCKET_CONFIG.PING_INTERVAL)

      return () => clearInterval(interval)
    }
  }, [state.isKitManagerConnected, state.isRefreshing, refreshKits])

  return {
    ...state,
    initializeKitManager,
    refreshKits,
    selectKit,
    toggleShowOfflineDevices,
    initializeRuntimeConnection,
    reconnect
  }
}