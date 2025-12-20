// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useRef, useCallback } from 'react'
import vehicleEdgeRuntimeDirectService from '@/services/vehicleEdgeRuntimeDirect.service'
import { MAX_CONSOLE_LINES } from '../utils'

export interface AppConsoleMessage {
  id: string
  timestamp: string
  output: string
  type: 'stdout' | 'stderr' | 'system'
}

export interface AppConsoleState {
  [appId: string]: {
    messages: AppConsoleMessage[]
    isSubscribed: boolean
    isExpanded: boolean
    lastUpdated: number
  }
}

interface UseMultiAppConsoleReturn {
  appConsoleStates: AppConsoleState
  expandedApps: Set<string>
  toggleAppConsole: (appId: string) => void
  getAppMessages: (appId: string) => AppConsoleMessage[]
  clearAppConsole: (appId: string) => void
  subscribeToAppConsole: (appId: string) => Promise<void>
  unsubscribeFromAppConsole: (appId: string) => Promise<void>
}

export const useMultiAppConsole = (): UseMultiAppConsoleReturn => {
  const [appConsoleStates, setAppConsoleStates] = useState<AppConsoleState>({})
  const consoleEndRefs = useRef<{ [appId: string]: HTMLDivElement | null }>({})

  const addAppMessage = useCallback((appId: string, message: Omit<AppConsoleMessage, 'id'>) => {
    setAppConsoleStates(prev => {
      const appState = prev[appId] || {
        messages: [],
        isSubscribed: false,
        isExpanded: false,
        lastUpdated: 0
      }

      const newMessage: AppConsoleMessage = {
        ...message,
        id: `${appId}-${Date.now()}-${Math.random()}`
      }

      const updatedMessages = [...appState.messages, newMessage]
      
      // Keep only the last MAX_CONSOLE_LINES messages per app
      const trimmedMessages = updatedMessages.length > MAX_CONSOLE_LINES 
        ? updatedMessages.slice(-MAX_CONSOLE_LINES)
        : updatedMessages

      return {
        ...prev,
        [appId]: {
          ...appState,
          messages: trimmedMessages,
          lastUpdated: Date.now()
        }
      }
    })
  }, [])

  const toggleAppConsole = useCallback((appId: string) => {
    setAppConsoleStates(prev => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {
          messages: [],
          isSubscribed: false,
          isExpanded: false,
          lastUpdated: 0
        }),
        isExpanded: !prev[appId]?.isExpanded
      }
    }))

    // Subscribe/unsubscribe when expanding/collapsing
    if (!appConsoleStates[appId]?.isExpanded) {
      // We're expanding - subscribe to console
      subscribeToAppConsole(appId)
    } else {
      // We're collapsing - unsubscribe from console
      unsubscribeFromAppConsole(appId)
    }
  }, [appConsoleStates])

  const getAppMessages = useCallback((appId: string) => {
    return appConsoleStates[appId]?.messages || []
  }, [appConsoleStates])

  const clearAppConsole = useCallback((appId: string) => {
    setAppConsoleStates(prev => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {
          messages: [],
          isSubscribed: false,
          isExpanded: false,
          lastUpdated: 0
        }),
        messages: []
      }
    }))
  }, [])

  const subscribeToAppConsole = useCallback(async (appId: string) => {
    try {
      console.log(`📟 Subscribing to console for app: ${appId}`)

      // Check if already subscribed
      if (appConsoleStates[appId]?.isSubscribed) {
        console.log(`Already subscribed to app ${appId}`)
        return
      }

      await vehicleEdgeRuntimeDirectService.subscribeToConsole(appId)
      
      setAppConsoleStates(prev => ({
        ...prev,
        [appId]: {
          ...(prev[appId] || {
            messages: [],
            isExpanded: false,
            lastUpdated: 0
          }),
          isSubscribed: true
        }
      }))

      // Get existing console output for this app
      try {
        const appOutput = await vehicleEdgeRuntimeDirectService.getAppOutput(appId, 100)
        if (appOutput?.output) {
          const existingMessages: AppConsoleMessage[] = Array.isArray(appOutput.output)
            ? appOutput.output.map((line: string, index: number) => ({
                id: `${appId}-existing-${index}`,
                timestamp: new Date(Date.now() - (appOutput.output.length - index) * 1000).toISOString(),
                output: line,
                type: 'stdout' as const
              }))
            : [{
                id: `${appId}-existing-0`,
                timestamp: new Date().toISOString(),
                output: appOutput.output,
                type: 'stdout' as const
              }]

          existingMessages.forEach(message => {
            addAppMessage(appId, message)
          })
        }
      } catch (outputError) {
        console.warn('Could not fetch existing console output:', outputError)
        // Add a system message to show console is ready
        addAppMessage(appId, {
          timestamp: new Date().toISOString(),
          output: '📟 Console connected - waiting for application output...',
          type: 'system'
        })
      }

      console.log(`✅ Subscribed to console for app: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to subscribe to console for app ${appId}:`, error)
      addAppMessage(appId, {
        timestamp: new Date().toISOString(),
        output: `❌ Failed to connect to console: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'system'
      })
    }
  }, [appConsoleStates, addAppMessage])

  const unsubscribeFromAppConsole = useCallback(async (appId: string) => {
    try {
      console.log(`📟 Unsubscribing from console for app: ${appId}`)
      await vehicleEdgeRuntimeDirectService.unsubscribeFromConsole(appId)
      
      setAppConsoleStates(prev => ({
        ...prev,
        [appId]: {
          ...(prev[appId] || {
            messages: [],
            isExpanded: false,
            lastUpdated: 0
          }),
          isSubscribed: false
        }
      }))

      console.log(`✅ Unsubscribed from console for app: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from console for app ${appId}:`, error)
    }
  }, [])

  // Setup global console output listener that routes messages to the correct apps
  useEffect(() => {
    const setupConsoleListener = () => {
      vehicleEdgeRuntimeDirectService.onConsoleOutput((message) => {
        const appId = message.appId || message.executionId
        
        if (appId && appConsoleStates[appId]?.isSubscribed) {
          // Route to specific app
          addAppMessage(appId, {
            timestamp: message.timestamp || new Date().toISOString(),
            output: message.output || message.data || '',
            type: message.stream === 'stderr' ? 'stderr' : 'stdout'
          })
        }
      })
    }

    setupConsoleListener()
  }, [appConsoleStates, addAppMessage])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.keys(appConsoleStates).forEach(appId => {
        if (appConsoleStates[appId]?.isSubscribed) {
          unsubscribeFromAppConsole(appId).catch(error => {
            console.warn(`Failed to cleanup console subscription for ${appId}:`, error)
          })
        }
      })
    }
  }, [appConsoleStates, unsubscribeFromAppConsole])

  // Auto-scroll to bottom for expanded consoles
  useEffect(() => {
    Object.keys(consoleEndRefs.current).forEach(appId => {
      const ref = consoleEndRefs.current[appId]
      if (ref && appConsoleStates[appId]?.isExpanded) {
        ref.scrollIntoView({ behavior: 'smooth' })
      }
    })
  }, [appConsoleStates])

  const expandedApps = new Set(
    Object.entries(appConsoleStates)
      .filter(([_, state]) => state.isExpanded)
      .map(([appId, _]) => appId)
  )

  return {
    appConsoleStates,
    expandedApps,
    toggleAppConsole,
    getAppMessages,
    clearAppConsole,
    subscribeToAppConsole,
    unsubscribeFromAppConsole
  }
}