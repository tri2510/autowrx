// Vehicle Edge Runtime Service - Real WebSocket connection
// Based on original implementation from feature/270-new-deployment-extension

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
  private ws: WebSocket | null = null
  private isConnected = false
  private messageHandlers = new Map<string, MessageHandler>()
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }>()

  constructor(private websocketUrl: string = 'ws://localhost:3002/runtime') {}

  async connect(): Promise<void> {
    if (this.isConnected || this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.websocketUrl)

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 5000)

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout)
          this.isConnected = true
          this.setupEventHandlers()
          this.registerClient()
          console.log('[VehicleRuntime] Connected to', this.websocketUrl)
          resolve()
        }

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          reject(new Error('WebSocket connection failed'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.isConnected = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
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
    if (!this.ws) return

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('[VehicleRuntime] Failed to parse message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('[VehicleRuntime] Connection closed')
      this.isConnected = false
    }

    this.ws.onerror = (error) => {
      console.error('[VehicleRuntime] WebSocket error:', error)
      this.isConnected = false
    }
  }

  private async registerClient(): Promise<void> {
    const request = {
      type: 'register_client',
      id: 'register-' + Date.now(),
      clientInfo: {
        name: 'Vehicle Edge Runtime Plugin',
        version: '1.0.0',
        platform: 'web'
      }
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(request))
      console.log('[VehicleRuntime] Client registered')
    }
  }

  private handleMessage(message: any): void {
    // Handle pending requests
    if (message.id && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!
      clearTimeout(request.timeout)
      this.pendingRequests.delete(message.id)

      if (message.type === 'error') {
        request.reject(new Error(message.error || 'Unknown error'))
      } else {
        request.resolve(message)
      }
      return
    }

    // Route broadcast messages
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message)
    }
  }

  private sendMessage(request: any): Promise<any> {
    if (!this.isConnected || !this.ws) {
      return Promise.reject(new Error('Not connected to Vehicle Runtime'))
    }

    // Add ID if not provided
    if (!request.id) {
      request.id = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request.id)
        reject(new Error('Request timeout'))
      }, 10000)

      this.pendingRequests.set(request.id, { resolve, reject, timeout })

      try {
        this.ws!.send(JSON.stringify(request))
      } catch (error) {
        clearTimeout(timeout)
        this.pendingRequests.delete(request.id)
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
    const request = {
      type: 'deploy_request',
      code: config.code,
      language: 'python' as const,
      vehicleId: 'default-vehicle',
      prototype: {
        id: config.name,
        name: config.displayName || config.name,
        description: `Python application: ${config.name}`,
        version: '1.0.0'
      },
      dependencies: config.dependencies || []
    }

    const response = await this.sendMessage(request)

    if (response.status === 'started') {
      return response.appId || response.executionId || 'unknown'
    } else {
      throw new Error(response.result || 'Deployment failed')
    }
  }

  async getDeployedApps(): Promise<{ applications: VehicleApp[] }> {
    const request = {
      type: 'list_deployed_apps'
    }

    return this.sendMessage(request)
  }

  async startApp(appId: string): Promise<any> {
    return this.sendMessage({
      type: 'run_app',
      appId
    })
  }

  async stopApp(appId: string): Promise<any> {
    return this.sendMessage({
      type: 'stop_app',
      appId
    })
  }

  async pauseApp(appId: string): Promise<any> {
    return this.sendMessage({
      type: 'pause_app',
      appId
    })
  }

  async resumeApp(appId: string): Promise<any> {
    return this.sendMessage({
      type: 'resume_app',
      appId
    })
  }

  async uninstallApp(appId: string): Promise<any> {
    return this.sendMessage({
      type: 'uninstall_app',
      appId
    })
  }

  async getRuntimeState(): Promise<RuntimeState> {
    const request = {
      type: 'report_runtime_state'
    }

    return this.sendMessage(request)
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
}
