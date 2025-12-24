// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback, useRef } from 'react'

// Types for Mock Service messages
export type MockMode = 'echo-all' | 'echo-specific' | 'random' | 'static' | 'off'

export interface MockServiceStatus {
  running: boolean
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping'
  mode: MockMode
  image?: string
  containerId?: string
  appName?: string
  appId?: string
  uptime?: string
  cpu?: string
  memory?: string
  timestamp?: string
}

export interface MockServiceStartRequest {
  type: 'mock_service_start'
  id: string
  mode?: MockMode
  signals?: string[]
  kuksaHost?: string
  kuksaPort?: string
}

export interface MockServiceStopRequest {
  type: 'mock_service_stop'
  id: string
}

export interface MockServiceConfigureRequest {
  type: 'mock_service_configure'
  id: string
  mode: MockMode
  signals?: string[]
  kuksaHost?: string
  kuksaPort?: string
}

export interface MockServiceStatusRequest {
  type: 'mock_service_status'
  id: string
}

export interface MockServiceStatusResponse {
  type: 'mock_service_status' | 'mock_service_configured'
  id: string
  success?: boolean
  message?: string
  configured?: boolean
  status: MockServiceStatus
  timestamp: string
}

// Hook options
interface UseMockServiceOptions {
  wsUrl?: string
  reconnectInterval?: number
  reconnectAttempts?: number
  timeout?: number
}

// Return type for the hook
interface UseMockServiceReturn {
  status: MockServiceStatus | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  isLoading: boolean

  // Actions
  getStatus: () => Promise<MockServiceStatusResponse>
  startService: (mode?: MockMode, signals?: string[]) => Promise<MockServiceStatusResponse>
  stopService: () => Promise<MockServiceStatusResponse>
  configureService: (mode: MockMode, signals?: string[]) => Promise<MockServiceStatusResponse>

  // Utility
  disconnect: () => void
  reconnect: () => void
}

export const MOCK_MODE_DESCRIPTIONS: Record<MockMode, { title: string; description: string; icon: string }> = {
  'echo-all': {
    title: 'Echo All',
    description: 'Echoes all actuator target values to current values. Standard testing without vehicle hardware.',
    icon: '🔄'
  },
  'echo-specific': {
    title: 'Echo Specific',
    description: 'Echoes only specific signals. Test specific vehicle signals in isolation.',
    icon: '🎯'
  },
  'random': {
    title: 'Random',
    description: 'Generates random values for all signals. Simulate varying sensor data.',
    icon: '🎲'
  },
  'static': {
    title: 'Static',
    description: 'Sets static default values (no updates). Initialize signals to known states.',
    icon: '📌'
  },
  'off': {
    title: 'Off',
    description: 'Service runs but doesn\'t update any signals. Test with real hardware.',
    icon: '⏸️'
  }
}

const DEFAULT_MOCK_SIGNALS = [
  'Vehicle.Body.Lights.Beam.High.IsOn',
  'Vehicle.Body.Lights.Beam.Low.IsOn',
  'Vehicle.Body.Hood.IsOpen',
  'Vehicle.Body.Trunk.Rear.IsOpen',
  'Vehicle.ADAS.CruiseControl.SpeedSet'
]

export const useMockService = (options: UseMockServiceOptions = {}): UseMockServiceReturn => {
  const {
    wsUrl = 'ws://localhost:3002/runtime',
    reconnectInterval = 3000,
    reconnectAttempts = 5,
    timeout = 30000
  } = options

  const [status, setStatus] = useState<MockServiceStatus | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const responseHandlersRef = useRef(new Map<string, {
    resolve: (value: any) => void
    reject: (reason: any) => void
    timeout: NodeJS.Timeout
  }>())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Generate unique message IDs
  const generateId = () => `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Send WebSocket message with response handling
  const sendMessage = useCallback(async <T = any>(message: any): Promise<T> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not established')
    }

    const messageId = generateId()
    const messageWithId = { ...message, id: messageId }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        responseHandlersRef.current.delete(messageId)
        setIsLoading(false)
        reject(new Error('WebSocket request timeout'))
      }, timeout)

      // Store response handler
      responseHandlersRef.current.set(messageId, {
        resolve,
        reject,
        timeout: timeoutId
      })

      // Send message
      try {
        wsRef.current.send(JSON.stringify(messageWithId))
      } catch (sendError) {
        clearTimeout(timeoutId)
        responseHandlersRef.current.delete(messageId)
        setIsLoading(false)
        reject(new Error(`Failed to send WebSocket message: ${sendError}`))
      }
    })
  }, [timeout])

  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data)

      // Handle mock service status updates
      if (message.type === 'mock_service_status' || message.type === 'mock_service_configured') {
        setStatus(message.status || message)
        setIsLoading(false)

        // If there's a response handler waiting for this message
        if (message.id && responseHandlersRef.current.has(message.id)) {
          const handler = responseHandlersRef.current.get(message.id)!
          clearTimeout(handler.timeout)
          responseHandlersRef.current.delete(message.id)
          handler.resolve(message)
        }
      }
    } catch (parseError) {
      console.error('Failed to parse WebSocket message:', parseError)
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0

        console.log('Mock service WebSocket connected')

        // Get initial status
        getStatus()
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        wsRef.current = null

        // Clear all pending handlers
        responseHandlersRef.current.forEach(handler => {
          clearTimeout(handler.timeout)
          handler.reject(new Error('WebSocket connection closed'))
        })
        responseHandlersRef.current.clear()

        if (!event.wasClean && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`WebSocket connection lost, reconnecting (${reconnectAttemptsRef.current}/${reconnectAttempts})...`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
      }

      ws.onmessage = handleMessage

    } catch (connectionError) {
      setIsConnecting(false)
      setError(`Failed to connect: ${connectionError}`)
    }
  }, [wsUrl, handleMessage, reconnectInterval, reconnectAttempts])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Clear all pending handlers
    responseHandlersRef.current.forEach(handler => {
      clearTimeout(handler.timeout)
    })
    responseHandlersRef.current.clear()

    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  // Reconnect WebSocket
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    disconnect()
    setTimeout(connect, 100)
  }, [disconnect, connect])

  // Get mock service status
  const getStatus = useCallback(async (): Promise<MockServiceStatusResponse> => {
    return sendMessage<MockServiceStatusResponse>({
      type: 'mock_service_status',
      id: generateId()
    })
  }, [sendMessage])

  // Start mock service
  const startService = useCallback(async (
    mode: MockMode = 'echo-all',
    signals?: string[]
  ): Promise<MockServiceStatusResponse> => {
    setIsLoading(true)

    const request: MockServiceStartRequest = {
      type: 'mock_service_start',
      id: generateId(),
      mode,
      ...(signals && { signals })
    }

    return sendMessage<MockServiceStatusResponse>(request)
  }, [sendMessage])

  // Stop mock service
  const stopService = useCallback(async (): Promise<MockServiceStatusResponse> => {
    setIsLoading(true)

    return sendMessage<MockServiceStatusResponse>({
      type: 'mock_service_stop',
      id: generateId()
    })
  }, [sendMessage])

  // Configure mock service
  const configureService = useCallback(async (
    mode: MockMode,
    signals?: string[]
  ): Promise<MockServiceStatusResponse> => {
    setIsLoading(true)

    const request: MockServiceConfigureRequest = {
      type: 'mock_service_configure',
      id: generateId(),
      mode,
      ...(signals && { signals })
    }

    return sendMessage<MockServiceStatusResponse>(request)
  }, [sendMessage])

  // Auto-connect on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    status,
    isConnected,
    isConnecting,
    error,
    isLoading,

    getStatus,
    startService,
    stopService,
    configureService,

    disconnect,
    reconnect
  }
}

// Fallback hook for when WebSocket is not available
export const useMockServiceFallback = (): UseMockServiceReturn => {
  const [status, setStatus] = useState<MockServiceStatus | null>(null)
  const [error] = useState<string | null>('Mock service not available')
  const [isLoading, setIsLoading] = useState(false)

  const getStatus = async (): Promise<MockServiceStatusResponse> => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
    throw new Error('Mock service not available')
  }

  const startService = async (): Promise<MockServiceStatusResponse> => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
    throw new Error('Mock service not available')
  }

  const stopService = async (): Promise<MockServiceStatusResponse> => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
    throw new Error('Mock service not available')
  }

  const configureService = async (): Promise<MockServiceStatusResponse> => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
    throw new Error('Mock service not available')
  }

  return {
    status,
    isConnected: false,
    isConnecting: false,
    error,
    isLoading,

    getStatus,
    startService,
    stopService,
    configureService,

    disconnect: () => {},
    reconnect: () => {}
  }
}

export default useMockService
