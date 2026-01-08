// React hook for Vehicle Edge Runtime WebSocket connection
import { useEffect, useRef, useCallback } from 'react'

export interface RuntimeMessage {
  type: string
  data?: any
  error?: string
}

export type MessageHandler = (message: RuntimeMessage) => void

export function useVehicleRuntime(websocketUrl: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const messageHandlersRef = useRef<Set<MessageHandler>>(new Set())
  const isConnectedRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!websocketUrl || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(websocketUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Vehicle Runtime] Connected')
        isConnectedRef.current = true
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as RuntimeMessage
          messageHandlersRef.current.forEach(handler => handler(message))
        } catch (error) {
          console.error('[Vehicle Runtime] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[Vehicle Runtime] WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('[Vehicle Runtime] Disconnected')
        isConnectedRef.current = false
        wsRef.current = null

        // Attempt reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[Vehicle Runtime] Attempting to reconnect...')
          connect()
        }, 3000)
      }
    } catch (error) {
      console.error('[Vehicle Runtime] Failed to connect:', error)
    }
  }, [websocketUrl])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    isConnectedRef.current = false
  }, [])

  // Send message through WebSocket
  const sendMessage = useCallback(<T = any>(message: T): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[Vehicle Runtime] Cannot send message: not connected')
    }
  }, [])

  // Register message handler
  const onMessage = useCallback((handler: MessageHandler) => {
    messageHandlersRef.current.add(handler)
    return () => {
      messageHandlersRef.current.delete(handler)
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (websocketUrl) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [websocketUrl, connect, disconnect])

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
    sendMessage,
    onMessage
  }
}
