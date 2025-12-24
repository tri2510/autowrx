// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback, useRef } from 'react'

// Types for WebSocket messages
export interface MockSignals {
  [signalPath: string]: number | boolean | string
}

export interface SmartDeploymentRequest {
  type: 'smart_deploy'
  id: string
  name?: string
  type: 'python' | 'binary'
  code: string
  dependencies?: string[]
  signals?: (string | { path: string; access: string; rate_hz?: number })[]
  kuksa_config?: {
    server?: string
    tls?: { ca_cert?: string }
  }
  environment?: 'production' | 'staging' | 'development'
  options?: {
    mockMode?: boolean
    mockSignals?: MockSignals
  }
}

export interface DependencyDetectionRequest {
  type: 'detect_dependencies'
  code: string
  language?: 'python' | 'binary'
}

export interface SignalValidationRequest {
  type: 'validate_signals'
  signals: (string | { path: string; access: string; rate_hz?: number })[]
}

export interface DeploymentStatusRequest {
  type: 'get_deployment_status'
  app_id: string
}

// Response types
export interface SmartDeploymentResponse {
  type: 'smart_deploy-response'
  id: string
  app_id: string
  status: 'success'
  auto_detected_dependencies: string[]
  signal_validation: {
    valid: Array<{ path: string; access: string; rate_hz?: number }>
    invalid: Array<{ path: string; access: string; rate_hz?: number }>
    warnings: string[]
    total: number
  }
  deployment_id: string
  timestamp: string
}

export interface DependencyDetectionResponse {
  type: 'dependencies_detected'
  id: string
  language: string
  dependencies: string[]
  count: number
  timestamp: string
}

export interface SignalValidationResponse {
  type: 'signals_validated'
  id: string
  validation: {
    valid: Array<{ path: string; access: string; rate_hz?: number }>
    invalid: Array<{ path: string; access: string; rate_hz?: number }>
    warnings: string[]
    total: number
  }
  timestamp: string
}

export interface DeploymentStatusResponse {
  type: 'deployment_status'
  id: string
  app_id: string
  app: {
    id: string
    name: string
    type: string
    status: string
    created_at: string
    python_deps: string[]
    vehicle_signals: string[]
  }
  runtime_state: {
    app_id: string
    current_state: 'running' | 'stopped' | 'error'
    container_id: string
    last_heartbeat: string
  }
  dependencies: Array<{
    name: string
    version: string
    status: 'installed' | 'failed' | 'installing'
  }>
  recent_logs: Array<{
    timestamp: string
    level: 'info' | 'warn' | 'error'
    message: string
  }>
  timestamp: string
}

export interface DeploymentProgressMessage {
  type: 'deployment_progress'
  app_id: string
  stage: 'installing_dependencies' | 'installing_dependency' | 'starting_application'
  details: {
    dependency?: string
    current?: number
    total?: number
    progress?: number
  }
  timestamp: string
}

export interface WebSocketError {
  type: 'error'
  id: string
  error: string
  app_id?: string
  suggestions?: string[]
  timestamp: string
}

export type WebSocketMessage = 
  | SmartDeploymentResponse
  | DependencyDetectionResponse
  | SignalValidationResponse
  | DeploymentStatusResponse
  | DeploymentProgressMessage
  | WebSocketError

// Hook options
interface UseSmartDeploymentOptions {
  wsUrl?: string
  reconnectInterval?: number
  reconnectAttempts?: number
  timeout?: number
}

// Return type for the hook
interface UseSmartDeploymentReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  
  // Smart deployment
  deploySmart: (deployment: SmartDeploymentRequest) => Promise<SmartDeploymentResponse>
  
  // Dependency detection
  detectDependencies: (code: string, language?: 'python' | 'binary') => Promise<DependencyDetectionResponse>
  
  // Signal validation
  validateSignals: (signals: (string | { path: string; access: string; rate_hz?: number })[]) => Promise<SignalValidationResponse>
  
  // Deployment status
  getDeploymentStatus: (appId: string) => Promise<DeploymentStatusResponse>
  
  // Real-time progress
  onDeploymentProgress: (callback: (progress: DeploymentProgressMessage) => void) => void
  removeProgressListener: (callback: (progress: DeploymentProgressMessage) => void) => void
  
  // Utility methods
  disconnect: () => void
  reconnect: () => void
}

export const useSmartDeployment = (options: UseSmartDeploymentOptions = {}): UseSmartDeploymentReturn => {
  const {
    wsUrl = 'ws://localhost:3002/runtime',
    reconnectInterval = 3000,
    reconnectAttempts = 5,
    timeout = 30000
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const responseHandlersRef = useRef(new Map<string, {
    resolve: (value: any) => void
    reject: (reason: any) => void
    timeout: NodeJS.Timeout
  }>())
  
  const progressListenersRef = useRef(new Set<(progress: DeploymentProgressMessage) => void>())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  
  // Generate unique message IDs
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
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
        reject(new Error(`Failed to send WebSocket message: ${sendError}`))
      }
    })
  }, [timeout])
  
  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle progress messages (no ID expected)
      if (message.type === 'deployment_progress') {
        progressListenersRef.current.forEach(callback => {
          try {
            callback(message as DeploymentProgressMessage)
          } catch (callbackError) {
            console.error('Progress listener error:', callbackError)
          }
        })
        return
      }
      
      // Handle responses with IDs
      if (message.id && responseHandlersRef.current.has(message.id)) {
        const handler = responseHandlersRef.current.get(message.id)!
        clearTimeout(handler.timeout)
        responseHandlersRef.current.delete(message.id)
        
        if (message.type === 'error') {
          handler.reject(message)
        } else {
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
        
        console.log('Smart deployment WebSocket connected')
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
  
  // Smart deployment method
  const deploySmart = useCallback(async (deployment: SmartDeploymentRequest): Promise<SmartDeploymentResponse> => {
    return sendMessage<SmartDeploymentResponse>(deployment)
  }, [sendMessage])
  
  // Dependency detection method
  const detectDependencies = useCallback(async (
    code: string, 
    language: 'python' | 'binary' = 'python'
  ): Promise<DependencyDetectionResponse> => {
    return sendMessage<DependencyDetectionResponse>({
      type: 'detect_dependencies',
      code,
      language
    })
  }, [sendMessage])
  
  // Signal validation method
  const validateSignals = useCallback(async (
    signals: (string | { path: string; access: string; rate_hz?: number })[]
  ): Promise<SignalValidationResponse> => {
    return sendMessage<SignalValidationResponse>({
      type: 'validate_signals',
      signals
    })
  }, [sendMessage])
  
  // Deployment status method
  const getDeploymentStatus = useCallback(async (appId: string): Promise<DeploymentStatusResponse> => {
    return sendMessage<DeploymentStatusResponse>({
      type: 'get_deployment_status',
      app_id: appId
    })
  }, [sendMessage])
  
  // Progress listener management
  const onDeploymentProgress = useCallback((callback: (progress: DeploymentProgressMessage) => void) => {
    progressListenersRef.current.add(callback)
    return () => {
      progressListenersRef.current.delete(callback)
    }
  }, [])
  
  const removeProgressListener = useCallback((callback: (progress: DeploymentProgressMessage) => void) => {
    progressListenersRef.current.delete(callback)
  }, [])
  
  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
  
  return {
    isConnected,
    isConnecting,
    error,
    
    deploySmart,
    detectDependencies,
    validateSignals,
    getDeploymentStatus,
    
    onDeploymentProgress,
    removeProgressListener,
    
    disconnect,
    reconnect
  }
}

// Fallback hook for when WebSocket is not available
export const useSmartDeploymentFallback = (): UseSmartDeploymentReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error] = useState<string | null>('Smart deployment service not available')

  const deploySmart = async (): Promise<SmartDeploymentResponse> => {
    throw new Error('Smart deployment service not available')
  }

  const detectDependencies = async (code: string): Promise<DependencyDetectionResponse> => {
    // Basic client-side dependency detection
    const imports = code.match(/(?:import\s+(\w+)|from\s+(\w+)\s+import)/g) || []
    const dependencies = imports.map(imp => {
      const match = imp.match(/(?:import\s+(\w+)|from\s+(\w+)\s+import)/)
      return match ? (match[1] || match[2]) : ''
    }).filter(dep => dep && !['os', 'sys', 'time', 'json'].includes(dep))

    return {
      type: 'dependencies_detected',
      id: 'fallback',
      language: 'python',
      dependencies: [...new Set(dependencies)],
      count: dependencies.length,
      timestamp: new Date().toISOString()
    }
  }

  const validateSignals = async (signals: string[]): Promise<SignalValidationResponse> => {
    const validSignals = ['Vehicle.Speed', 'Vehicle.Location', 'Vehicle.FuelLevel']
    
    const valid = signals
      .filter(signal => validSignals.includes(signal))
      .map(signal => ({ path: signal, access: 'subscribe' }))
    
    const invalid = signals
      .filter(signal => !validSignals.includes(signal))
      .map(signal => ({ path: signal, access: 'subscribe' }))

    return {
      type: 'signals_validated',
      id: 'fallback',
      validation: {
        valid,
        invalid,
        warnings: invalid.length > 0 ? ['Using fallback signal validation'] : [],
        total: signals.length
      },
      timestamp: new Date().toISOString()
    }
  }

  const getDeploymentStatus = async (): Promise<DeploymentStatusResponse> => {
    throw new Error('Smart deployment service not available')
  }

  return {
    isConnected,
    isConnecting,
    error,
    
    deploySmart,
    detectDependencies,
    validateSignals,
    getDeploymentStatus,
    
    onDeploymentProgress: () => {},
    removeProgressListener: () => {},
    
    disconnect: () => {},
    reconnect: () => {}
  }
}

export default useSmartDeployment