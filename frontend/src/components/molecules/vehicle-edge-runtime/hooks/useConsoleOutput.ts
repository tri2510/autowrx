// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useRef, useCallback } from 'react'
import vehicleEdgeRuntimeDirectService from '@/services/vehicleEdgeRuntimeDirect.service'
import { CONSOLE_BUFFER_SIZE, MAX_CONSOLE_LINES } from '../utils'

export interface ConsoleMessage {
  timestamp: string
  output: string
  type: 'stdout' | 'stderr' | 'system'
  appId?: string
  executionId?: string
}

export interface ConsoleState {
  consoleOutput: ConsoleMessage[]
  selectedAppId: string | null
  isSubscribed: boolean
  subscriptionError: string | null
}

export const useConsoleOutput = () => {
  const [state, setState] = useState<ConsoleState>({
    consoleOutput: [],
    selectedAppId: null,
    isSubscribed: false,
    subscriptionError: null
  })

  const consoleEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRefs = useRef<Set<string>>(new Set())

  const addConsoleMessage = useCallback((message: ConsoleMessage) => {
    setState(prev => {
      const newOutput = [...prev.consoleOutput, message]
      // Keep only the last MAX_CONSOLE_LINES messages
      if (newOutput.length > MAX_CONSOLE_LINES) {
        return {
          ...prev,
          consoleOutput: newOutput.slice(-MAX_CONSOLE_LINES)
        }
      }
      return { ...prev, consoleOutput: newOutput }
    })
  }, [])

  const clearConsole = useCallback(() => {
    setState(prev => ({ ...prev, consoleOutput: [] }))
  }, [])

  const subscribeToConsole = useCallback(async (appId: string) => {
    try {
      console.log(`📟 Subscribing to console for app: ${appId}`)

      // Unsubscribe from previous app if any
      if (state.selectedAppId && state.selectedAppId !== appId) {
        await unsubscribeFromConsole(state.selectedAppId)
      }

      await vehicleEdgeRuntimeDirectService.subscribeToConsole(appId)
      subscriptionRefs.current.add(appId)

      setState(prev => ({
        ...prev,
        selectedAppId: appId,
        isSubscribed: true,
        subscriptionError: null
      }))

      // Get existing console output
      try {
        const appOutput = await vehicleEdgeRuntimeDirectService.getAppOutput(appId, 100)
        if (appOutput?.output) {
          const existingMessages: ConsoleMessage[] = Array.isArray(appOutput.output)
            ? appOutput.output.map((line: string, index: number) => ({
                timestamp: new Date(Date.now() - (appOutput.output.length - index) * 1000).toISOString(),
                output: line,
                type: 'stdout' as const,
                appId
              }))
            : [{
                timestamp: new Date().toISOString(),
                output: appOutput.output,
                type: 'stdout' as const,
                appId
              }]

          setState(prev => ({
            ...prev,
            consoleOutput: existingMessages
          }))
        }
      } catch (outputError) {
        console.warn('Could not fetch existing console output:', outputError)
      }

      console.log(`✅ Subscribed to console for app: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to subscribe to console for app ${appId}:`, error)
      setState(prev => ({
        ...prev,
        subscriptionError: error instanceof Error ? error.message : 'Subscription failed'
      }))
    }
  }, [state.selectedAppId])

  const unsubscribeFromConsole = useCallback(async (appId: string) => {
    try {
      console.log(`📟 Unsubscribing from console for app: ${appId}`)
      await vehicleEdgeRuntimeDirectService.unsubscribeFromConsole(appId)
      subscriptionRefs.current.delete(appId)

      if (state.selectedAppId === appId) {
        setState(prev => ({
          ...prev,
          selectedAppId: null,
          isSubscribed: false
        }))
      }

      console.log(`✅ Unsubscribed from console for app: ${appId}`)
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from console for app ${appId}:`, error)
    }
  }, [state.selectedAppId])

  const addSystemMessage = useCallback((message: string) => {
    addConsoleMessage({
      timestamp: new Date().toISOString(),
      output: message,
      type: 'system'
    })
  }, [addConsoleMessage])

  // Auto-scroll to bottom of console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.consoleOutput])

  // Setup console output event listener
  useEffect(() => {
    const setupConsoleListener = () => {
      vehicleEdgeRuntimeDirectService.onConsoleOutput((message) => {
        const consoleMessage: ConsoleMessage = {
          timestamp: message.timestamp || new Date().toISOString(),
          output: message.output || message.data || '',
          type: message.stream === 'stderr' ? 'stderr' : 'stdout',
          appId: message.appId || message.executionId,
          executionId: message.executionId
        }

        // Only add messages for the currently subscribed app or broadcast messages
        if (!state.selectedAppId || consoleMessage.appId === state.selectedAppId || !consoleMessage.appId) {
          addConsoleMessage(consoleMessage)
        }
      })
    }

    setupConsoleListener()
  }, [state.selectedAppId, addConsoleMessage])

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionRefs.current.forEach(appId => {
        vehicleEdgeRuntimeDirectService.unsubscribeFromConsole(appId).catch(error => {
          console.warn(`Failed to cleanup console subscription for ${appId}:`, error)
        })
      })
      subscriptionRefs.current.clear()
    }
  }, [])

  return {
    ...state,
    consoleEndRef,
    addConsoleMessage,
    clearConsole,
    subscribeToConsole,
    unsubscribeFromConsole,
    addSystemMessage
  }
}