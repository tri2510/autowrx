// AOS Cloud Deployment Service - Socket.IO connection to Docker build service
// Based on vehicle-edge-runtime runtime.service.ts pattern

import { io as ioClient } from 'socket.io-client'
import type { AosApp, BuildRequest, BuildResponse, DeploymentStatus } from '../types'

type MessageHandler = (message: any) => void

export class AosService {
  private socket: any = null
  private isConnected = false
  private messageHandlers = new Map<string, MessageHandler>()
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout: any
  }>()

  constructor(
    private websocketUrl: string = 'https://kit.digitalauto.tech',
    private targetId?: string  // Target edge device or build container ID
  ) {
    // Ensure URL uses https for Socket.IO (handles WebSocket upgrade)
    if (websocketUrl.startsWith('ws://') || websocketUrl.startsWith('wss://')) {
      this.websocketUrl = websocketUrl.replace(/^wss?:\/\//, 'https://')
    }
  }

  // Set the target ID (edge device or container)
  setTargetId(targetId: string): void {
    this.targetId = targetId
    console.log('[AosService] Target ID set to:', targetId)
  }

  async connect(): Promise<void> {
    if (this.isConnected || (this.socket && this.socket.connected)) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('[AosService] Connecting to Socket.IO:', this.websocketUrl)

        this.socket = ioClient(this.websocketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout)
          this.isConnected = true
          this.setupEventHandlers()
          console.log('[AosService] Connected to AOS Service')
          resolve()
        })

        this.socket.on('connect_error', (error: any) => {
          clearTimeout(connectionTimeout)
          console.error('[AosService] Socket.IO connection error:', error)
          reject(new Error('Socket.IO connection failed: ' + error.message))
        })

        this.socket.on('disconnect', () => {
          console.log('[AosService] Socket.IO disconnected')
          this.isConnected = false
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.isConnected = false
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    // Clear pending requests
    this.pendingRequests.forEach(request => {
      clearTimeout(request.timeout)
      request.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()
    console.log('[AosService] Disconnected')
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    // Listen for kit replies (Kit Manager protocol)
    this.socket.on('messageToKit-kitReply', (message: any) => {
      this.handleMessage(message)
    })

    // Listen for broadcasts
    this.socket.on('broadcastToClient', (message: any) => {
      this.handleMessage(message)
    })

    // Listen for AOS-specific events
    this.socket.on('aos-build-progress', (message: any) => {
      const handler = this.messageHandlers.get('aos-build-progress')
      if (handler) handler(message)
    })

    this.socket.on('aos-deploy-status', (message: any) => {
      const handler = this.messageHandlers.get('aos-deploy-status')
      if (handler) handler(message)
    })

    console.log('[AosService] Event handlers registered')
  }

  private handleMessage(message: any): void {
    // Handle pending requests
    if (message.id && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!
      clearTimeout(request.timeout)
      this.pendingRequests.delete(message.id)

      if (message.type === 'error' || message.error) {
        request.reject(new Error(message.error || 'Unknown error'))
      } else {
        request.resolve(message)
      }
      return
    }

    // Route broadcast messages by type
    if (message.type) {
      const handler = this.messageHandlers.get(message.type)
      if (handler) {
        handler(message)
      }
    }
  }

  private sendCommand(cmd: string, data: any = {}): Promise<any> {
    if (!this.isConnected || !this.socket) {
      return Promise.reject(new Error('Not connected to AOS Service'))
    }

    const messageId = 'aos-msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId)
        reject(new Error('Request timeout'))
      }, 60000) // 60 second timeout for builds

      this.pendingRequests.set(messageId, { resolve, reject, timeout })

      // Kit Manager format
      const message = {
        id: messageId,
        cmd,
        to_kit_id: this.targetId || 'default',
        type: cmd,
        ...data
      }

      console.log('[AosService] Sending command:', cmd)
      console.log('[AosService] Message:', message)

      try {
        this.socket.emit('messageToKit', message)
      } catch (error) {
        clearTimeout(timeout)
        this.pendingRequests.delete(messageId)
        reject(error)
      }
    })
  }

  // Build and deploy AOS application
  async buildAndDeploy(request: BuildRequest): Promise<BuildResponse> {
    const data = {
      name: request.name,
      displayName: request.displayName || request.name,
      cppCode: request.cppCode,
      yamlConfig: request.yamlConfig,
      language: 'cpp',
      vehicleId: 'default-vehicle'
    }

    console.log('[AosService] Building app with code length:', request.cppCode?.length)
    const response = await this.sendCommand('aos_build_deploy', data)

    if (response.status === 'started' || response.result === 'success' || response.status === 'building' || response.status === 'success') {
      return {
        status: response.status || 'building',
        appId: response.appId || response.executionId || response.app_id || request.name,
        executionId: response.executionId || response.appId || request.name,
        message: response.message || 'Build started'
      }
    } else {
      throw new Error(response.result || response.message || response.error || 'Build failed')
    }
  }

  // Get deployed AOS applications
  async getDeployedApps(): Promise<{ applications: AosApp[] }> {
    const response = await this.sendCommand('aos_list_apps', {})

    if (response.applications && Array.isArray(response.applications)) {
      return {
        applications: response.applications.map((app: any) => ({
          app_id: app.app_id || app.appId || app.name,
          name: app.name || app.app_name || 'Unknown',
          status: app.status || 'unknown',
          type: 'cpp',
          deploy_time: app.deploy_time || app.startTime || new Date().toISOString(),
          config: app.config
        }))
      }
    }

    return { applications: [] }
  }

  // Start an AOS application
  async startApp(appId: string): Promise<any> {
    return this.sendCommand('aos_start_app', { appId })
  }

  // Stop an AOS application
  async stopApp(appId: string): Promise<any> {
    return this.sendCommand('aos_stop_app', { appId })
  }

  // Restart an AOS application
  async restartApp(appId: string): Promise<any> {
    return this.sendCommand('aos_restart_app', { appId })
  }

  // Uninstall an AOS application
  async uninstallApp(appId: string): Promise<any> {
    return this.sendCommand('aos_uninstall_app', { appId })
  }

  // Console subscription methods
  async subscribeConsole(appId: string): Promise<void> {
    await this.sendCommand('aos_console_subscribe', { appId })
  }

  async unsubscribeConsole(appId: string): Promise<void> {
    await this.sendCommand('aos_console_unsubscribe', { appId })
  }

  async getAppOutput(appId: string, lines: number = 100): Promise<any> {
    return this.sendCommand('aos_app_output', { appId, lines })
  }

  // Event listeners
  onConsoleOutput(callback: (message: any) => void): void {
    this.messageHandlers.set('aos_console_output', callback)
  }

  onBuildProgress(callback: (message: any) => void): void {
    this.messageHandlers.set('aos-build-progress', callback)
  }

  onDeployStatus(callback: (message: any) => void): void {
    this.messageHandlers.set('aos-deploy-status', callback)
  }

  onAppStatus(callback: (message: any) => void): void {
    this.messageHandlers.set('aos_app_status_update', callback)
  }

  // Connection status
  isServiceConnected(): boolean {
    return this.isConnected
  }

  removeAllListeners(): void {
    this.messageHandlers.clear()
  }
}
