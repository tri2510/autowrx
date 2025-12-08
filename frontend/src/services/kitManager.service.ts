// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { io, Socket } from 'socket.io-client'

export interface VehicleEdgeRuntimeKit {
  socket_id: string
  kit_id: string
  name: string
  last_seen: number
  is_online: boolean
  noRunner: number
  noSubscriber: number
  support_apis: string[]
  desc: string
}

export interface VehicleEdgeRuntimeClient {
  username: string
  user_id: string
  domain: string
  last_seen: number
  is_online: boolean
}

export interface KitManagerMessage {
  request_from?: string
  kit_id: string
  status: string
  message: string
  data?: any
  timestamp: number
}

export interface DeploymentRequest {
  to_kit_id: string
  cmd: string
  code?: string
  prototype?: {
    name: string
  }
  disable_code_convert?: boolean
  [key: string]: any
}

export interface ConvertCodeRequest {
  code: string
}

export interface ConvertCodeResponse {
  status: string
  message: string
  content: string
}

export interface ListKitsResponse {
  status: string
  message: string
  content: VehicleEdgeRuntimeKit[]
}

export interface ListClientsResponse {
  status: string
  message: string
  content: VehicleEdgeRuntimeClient[]
}

class KitManagerService {
  private socket: Socket | null = null
  private baseUrl: string
  private kits: VehicleEdgeRuntimeKit[] = []
  private clients: VehicleEdgeRuntimeClient[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(baseUrl: string = 'http://localhost:3090') {
    this.baseUrl = baseUrl
  }

  // REST API Methods
  async listKits(): Promise<ListKitsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/listAllKits`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch kits:', error)
      throw error
    }
  }

  async listClients(): Promise<ListClientsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/listAllClient`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      throw error
    }
  }

  async convertCode(request: ConvertCodeRequest): Promise<ConvertCodeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/convertCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to convert code:', error)
      throw error
    }
  }

  // WebSocket Methods
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      try {
        this.socket = io(this.baseUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        })

        this.socket.on('connect', () => {
          console.log('Connected to Kit Manager')
          this.reconnectAttempts = 0
          this.registerClient()
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('Connection failed:', error.message)
          this.reconnectAttempts++
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`))
          }
        })

        this.socket.on('disconnect', (reason) => {
          console.warn('Disconnected from Kit Manager:', reason)
        })

        // Setup default event handlers
        this.setupDefaultEventHandlers()
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('unregister_client')
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupDefaultEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('list-all-kits-result', (kits: VehicleEdgeRuntimeKit[]) => {
      this.kits = kits
      console.log('Kits updated:', kits)
    })

    this.socket.on('list-all-hw-result', (hwKits: any[]) => {
      console.log('Hardware kits updated:', hwKits)
    })

    this.socket.on('messageToKit-kitReply', (reply: KitManagerMessage) => {
      console.log('Kit message reply:', reply)
    })

    this.socket.on('broadcastToClient', (message: any) => {
      console.log('Broadcast from kit:', message)
    })

    this.socket.on('messageToSyncerHw-kitReply', (reply: any) => {
      console.log('Hardware kit reply:', reply)
    })
  }

  private registerClient(): void {
    if (!this.socket) return

    const timestamp = Date.now()
    this.socket.emit('register_client', {
      username: 'vehicle_edge_runtime_frontend',
      user_id: `frontend_${timestamp}`,
      domain: 'web',
    })
  }

  // Real-time methods
  requestKits(): void {
    this.socket?.emit('list-all-kits')
  }

  requestHardwareKits(): void {
    this.socket?.emit('list-all-syncer_hw')
  }

  subscribeToKit(kitId: string): void {
    this.socket?.emit('clientSubscribeToKit', { kit_id: kitId })
  }

  unsubscribeFromKit(kitId: string): void {
    this.socket?.emit('clientUnsubscribeToKit', { kit_id: kitId })
  }

  sendMessageToKit(request: DeploymentRequest): void {
    this.socket?.emit('messageToKit', request)
  }

  sendMessageToHardwareKit(kitId: string, cmd: string, data: any = {}): void {
    this.socket?.emit('messageToSyncerHw', {
      to_kit_id: kitId,
      cmd: cmd,
      ...data,
    })
  }

  // Deployment helpers
  async deployApp(kitId: string, code: string, appName: string, disableCodeConvert = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to Kit Manager'))
        return
      }

      // Set up one-time listener for the response
      const handleResponse = (reply: KitManagerMessage) => {
        if (reply.kit_id === kitId) {
          this.socket?.off('messageToKit-kitReply', handleResponse)

          if (reply.status === 'OK' || reply.status === 'SUCCESS') {
            resolve()
          } else {
            reject(new Error(reply.message || 'Deployment failed'))
          }
        }
      }

      this.socket.on('messageToKit-kitReply', handleResponse)

      // Send deployment request
      this.sendMessageToKit({
        to_kit_id: kitId,
        cmd: 'deploy_n_run',
        code: code,
        prototype: { name: appName },
        disable_code_convert: disableCodeConvert,
      })

      // Set timeout
      setTimeout(() => {
        this.socket?.off('messageToKit-kitReply', handleResponse)
        reject(new Error('Deployment timeout'))
      }, 30000) // 30 seconds timeout
    })
  }

  async deployCodeOnly(kitId: string, code: string, appName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to Kit Manager'))
        return
      }

      const handleResponse = (reply: KitManagerMessage) => {
        if (reply.kit_id === kitId) {
          this.socket?.off('messageToKit-kitReply', handleResponse)

          if (reply.status === 'OK' || reply.status === 'SUCCESS') {
            resolve()
          } else {
            reject(new Error(reply.message || 'Deployment failed'))
          }
        }
      }

      this.socket.on('messageToKit-kitReply', handleResponse)

      this.sendMessageToKit({
        to_kit_id: kitId,
        cmd: 'deploy_request',
        code: code,
        prototype: { name: appName },
        disable_code_convert: false,
      })

      setTimeout(() => {
        this.socket?.off('messageToKit-kitReply', handleResponse)
        reject(new Error('Deployment timeout'))
      }, 30000)
    })
  }

  // Custom command sending
  sendCustomCommand(kitId: string, command: string, data: any = {}): void {
    this.sendMessageToKit({
      to_kit_id: kitId,
      cmd: 'custom_command',
      ...data,
    })
  }

  // Getters
  getKits(): VehicleEdgeRuntimeKit[] {
    return this.kits
  }

  getClients(): VehicleEdgeRuntimeClient[] {
    return this.clients
  }

  getOnlineKits(): VehicleEdgeRuntimeKit[] {
    return this.kits.filter(kit => kit.is_online)
  }

  getKitById(kitId: string): VehicleEdgeRuntimeKit | undefined {
    return this.kits.find(kit => kit.kit_id === kitId)
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Event listeners for external components
  onKitsUpdate(callback: (kits: VehicleEdgeRuntimeKit[]) => void): void {
    this.socket?.on('list-all-kits-result', callback)
  }

  onKitMessage(callback: (message: KitManagerMessage) => void): void {
    this.socket?.on('messageToKit-kitReply', callback)
  }

  onBroadcast(callback: (message: any) => void): void {
    this.socket?.on('broadcastToClient', callback)
  }

  onConnect(callback: () => void): void {
    this.socket?.on('connect', callback)
  }

  onDisconnect(callback: (reason: string) => void): void {
    this.socket?.on('disconnect', callback)
  }

  onConnectError(callback: (error: Error) => void): void {
    this.socket?.on('connect_error', callback)
  }

  // Cleanup
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }
}

// Export singleton instance
const kitManagerService = new KitManagerService()

export default kitManagerService
export { KitManagerService }