// Vehicle Edge Runtime Service - Socket.IO connection to Kit Manager
// Based on original implementation from feature/270-new-deployment-extension
// Kit Manager protocol: emit 'messageToKit', receive 'messageToKit-kitReply'

import { io as ioClient } from 'socket.io-client'

export interface VehicleApp {
  app_id: string
  name: string
  version?: string
  status: string
  deploy_time: string
  type: 'python' | 'binary'
  resources?: {
    cpu_limit?: string
    memory_limit?: string
  }
  container_id?: string
  pid?: number
  exit_code?: number
}

export interface RuntimeState {
  runtimeId: string
  status: string
  uptime: number
  version: string
  runningApplications: Array<{
    executionId: string
    appId: string
    status: string
    uptime: number
  }>
}

type MessageHandler = (message: any) => void;

export class VehicleRuntimeService {
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
    private kitId?: string  // Target edge device ID
  ) {
    // Ensure URL uses https (Socket.IO will handle the WebSocket upgrade)
    if (websocketUrl.startsWith('ws://') || websocketUrl.startsWith('wss://')) {
      this.websocketUrl = websocketUrl.replace(/^wss?:\/\//, 'https://')
    }
  }

  // Set the target kit ID
  setKitId(kitId: string): void {
    this.kitId = kitId
    console.log('[VehicleRuntime] Target kit ID set to:', kitId)
  }

  async connect(): Promise<void> {
    if (this.isConnected || (this.socket && this.socket.connected)) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('[VehicleRuntime] Connecting to Socket.IO:', this.websocketUrl)

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
          console.log('[VehicleRuntime] ✅ Connected to Kit Manager')
          resolve()
        })

        this.socket.on('connect_error', (error: any) => {
          clearTimeout(connectionTimeout)
          console.error('[VehicleRuntime] Socket.IO connection error:', error)
          reject(new Error('Socket.IO connection failed: ' + error.message))
        })

        this.socket.on('disconnect', () => {
          console.log('[VehicleRuntime] Socket.IO disconnected')
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
    console.log('[VehicleRuntime] Disconnected')
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    // Listen for kit replies
    this.socket.on('messageToKit-kitReply', (message: any) => {
      this.handleMessage(message)
    })

    // Listen for broadcasts
    this.socket.on('broadcastToClient', (message: any) => {
      this.handleMessage(message)
    })

    console.log('[VehicleRuntime] Event handlers registered')
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
      return Promise.reject(new Error('Not connected to Kit Manager'))
    }

    if (!this.kitId) {
      return Promise.reject(new Error('No kit ID set. Call setKitId() first.'))
    }

    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId)
        reject(new Error('Request timeout'))
      }, 15000) // 15 second timeout

      this.pendingRequests.set(messageId, { resolve, reject, timeout })

      // Kit Manager format: use cmd for Kit Manager, but also include type for edge runtime
      // Kit Manager will forward the message to the edge device which expects 'type'
      const message = {
        id: messageId,
        cmd,
        to_kit_id: this.kitId,
        type: cmd,  // Edge runtime expects 'type' field
        ...data  // Spread data fields directly, not wrapped
      }

      console.log('[VehicleRuntime] Sending command:', cmd, 'to kit:', this.kitId)
      console.log('[VehicleRuntime] Message:', message)

      try {
        this.socket.emit('messageToKit', message)
      } catch (error) {
        clearTimeout(timeout)
        this.pendingRequests.delete(messageId)
        reject(error)
      }
    })
  }

  // Application management methods
  async deployPythonApp(config: {
    name: string
    displayName?: string
    code: string
    dependencies?: string[]
  }): Promise<string> {
    // Match DaRuntimeConnector format exactly
    const data = {
      disable_code_convert: true,
      code: config.code,
      prototype: {
        id: config.name,
        name: config.displayName || config.name,
        description: `Python application: ${config.name}`,
        version: '1.0.0'
      },
      language: 'python',
      vehicleId: 'default-vehicle',
      dependencies: config.dependencies || []
    }

    console.log('[VehicleRuntime] Deploying app with code length:', config.code?.length)
    const response = await this.sendCommand('deploy_request', data)

    if (response.status === 'started' || response.result === 'success') {
      return response.appId || response.executionId || response.app_id || config.name
    } else {
      throw new Error(response.result || response.message || 'Deployment failed')
    }
  }

  async getDeployedApps(): Promise<{ applications: VehicleApp[] }> {
    // Use the original command format: type instead of cmd
    const response = await this.sendCommand('list_deployed_apps', {})

    // Map the response to our expected format
    if (response.applications && Array.isArray(response.applications)) {
      return {
        applications: response.applications.map((app: any) => ({
          app_id: app.app_id || app.appId || app.name,
          name: app.name || app.app_name || 'Unknown',
          status: app.status || 'unknown',
          type: app.type || 'python',
          deploy_time: app.deploy_time || app.startTime || new Date().toISOString()
        }))
      }
    }

    return { applications: [] }
  }

  async startApp(appId: string): Promise<any> {
    return this.sendCommand('run_app', { appId })
  }

  async stopApp(appId: string): Promise<any> {
    return this.sendCommand('stop_app', { appId })
  }

  async pauseApp(appId: string): Promise<any> {
    // Kit Manager may not have pause command
    return this.sendCommand('pause_app', { appId })
  }

  async resumeApp(appId: string): Promise<any> {
    // Kit Manager may not have resume command
    return this.sendCommand('resume_app', { appId })
  }

  async uninstallApp(appId: string): Promise<any> {
    // Kit Manager may not have uninstall command
    return this.sendCommand('uninstall_app', { appId })
  }

  async getRuntimeState(): Promise<RuntimeState> {
    return this.sendCommand('get-runtime-info', {})
  }

  // Console subscription methods
  async subscribeConsole(appId: string): Promise<void> {
    await this.sendCommand('console_subscribe', { appId })
  }

  async unsubscribeConsole(appId: string): Promise<void> {
    await this.sendCommand('console_unsubscribe', { appId })
  }

  async getAppOutput(appId: string, lines: number = 100): Promise<any> {
    return this.sendCommand('app_output', { appId, lines })
  }

  // Event listeners
  onConsoleOutput(callback: (message: any) => void): void {
    this.messageHandlers.set('console_output', callback)
  }

  onAppStatus(callback: (message: any) => void): void {
    this.messageHandlers.set('app_status_update', callback)
  }

  onDeployedAppsList(callback: (message: any) => void): void {
    this.messageHandlers.set('list_deployed_apps-response', callback)
  }

  // Connection status
  isServiceConnected(): boolean {
    return this.isConnected
  }

  removeAllListeners(): void {
    this.messageHandlers.clear()
  }

  // Service deployment methods
  async deployKuksaServer(): Promise<string> {
    const data = {
      prototype: {
        id: 'VEA-kuksa-databroker',
        name: 'KUKSA Databroker',
        type: 'docker',
        description: 'Eclipse KUKSA Vehicle Signal Databroker',
        config: {
          dockerCommand: [
            'run', '-d',
            '--name', 'VEA-kuksa-databroker',
            '--network', 'host',
            '-p', '55555:55555',
            '-p', '8090:8090',
            'ghcr.io/eclipse-kuksa/kuksa-databroker:0.4.4',
            '--insecure'
          ]
        }
      },
      vehicle_id: 'default-vehicle'
    }

    const response = await this.sendCommand('deploy_request', data)

    const isSuccess = !response ||
      (typeof response === 'object' && !response.error && response.type !== 'error')

    if (isSuccess) {
      return response?.executionId || response?.id || 'VEA-kuksa-databroker'
    } else {
      throw new Error(response?.error || response?.result || 'KUKSA deployment failed')
    }
  }

  async deployMockService(mode: 'echo-all' | 'echo-specific' = 'echo-all', signals?: string[]): Promise<string> {
    const data = { mode, ...(signals && { signals }) }
    const response = await this.sendCommand('mock_service_start', data)

    const isSuccess = !response ||
      response.success === true ||
      (typeof response === 'object' && !response.error && response.type !== 'error')

    if (isSuccess) {
      return response?.status?.appId || response?.id || 'VEA-mock-service'
    } else {
      throw new Error(response?.error || response?.message || 'Mock service deployment failed')
    }
  }
}
