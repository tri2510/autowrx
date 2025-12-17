// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Vehicle Edge Runtime Direct Connection Service
// Connects directly to Vehicle Edge Runtime WebSocket endpoint

import { v4 as uuidv4 } from 'uuid'

// Essential types moved from vehicleEdgeRuntime.service to avoid circular dependency

// Types based on API specification
export interface VehicleApp {
  id: string
  name: string
  version: string
  type: 'python' | 'binary'
  status: 'installed' | 'running' | 'stopped' | 'paused' | 'error' | 'starting'
  created_at: string
  python_deps?: string[]
  vehicle_signals?: string[]
  code?: string
  entryPoint?: string
  description?: string
  executionId?: string
  workingDir?: string
  env?: Record<string, string>
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
  availableMemory: number
  totalMemory: number
  cpuUsage: number
}

// Reuse additional types from the existing service
import type {
  AppLog,
  ConsoleOutput,
  SignalUpdate,
  VehicleSignal,
  BaseMessage,
  InstallAppRequest,
  ListAppsRequest,
  RunAppRequest,
  StopAppRequest,
  PauseAppRequest,
  ResumeAppRequest,
  UninstallAppRequest,
  GetAppLogsRequest,
  SubscribeConsoleRequest,
  UnsubscribeConsoleRequest,
  ConsoleStdinRequest,
  SubscribeSignalsRequest,
  GetSignalsRequest,
  WriteSignalsRequest,
  GetRuntimeStateRequest,
  PingRequest,
  AppInstalledResponse,
  AppsListResponse,
  PythonAppStartedResponse,
  AppStoppedResponse,
  AppLogsResponse,
  ConsoleSubscribedResponse,
  RuntimeStateResponse,
  PongResponse,
  ErrorResponse,
  VehicleRuntimeMessage
} from './vehicleEdgeRuntime.service'

// Additional types for direct connection
export interface ClientInfo {
  name: string
  version: string
  platform: string
}

// Direct connection specific interfaces (matching official spec)
export interface DirectSubscribeConsoleRequest extends BaseMessage {
  type: 'console_subscribe'
  appId: string
}

export interface DirectUnsubscribeConsoleRequest extends BaseMessage {
  type: 'console_unsubscribe'
  appId: string
}

export interface AppOutputRequest extends BaseMessage {
  type: 'app_output'
  appId: string
  lines?: number
}

// Real-time message types from the spec
export interface ConsoleOutputMessage {
  type: 'console_output'
  executionId: string
  output: string
  timestamp: string
}

export interface AppStatusUpdateMessage {
  type: 'app_status_update'
  appId: string
  executionId: string
  previousStatus: string
  currentStatus: string
  timestamp: string
}

export interface RegisterClientRequest extends BaseMessage {
  type: 'register_client'
  clientInfo: ClientInfo
}

export interface DeployRequest extends BaseMessage {
  type: 'deploy_request'
  code: string
  prototype: {
    id: string
    name: string
    description?: string
    version?: string
  }
  vehicleId?: string
  language: 'python' | 'binary'
}

export interface ListDeployedAppsRequest extends BaseMessage {
  type: 'list_deployed_apps'
}

export interface AppLogRequest extends BaseMessage {
  type: 'app_log'
  appId: string
  lines?: number
}

export interface DeployRequestResponse {
  type: 'deploy_request-response'
  id?: string
  executionId?: string
  appId?: string
  status: 'started' | 'error'
  result?: string
  isDone?: boolean
  code?: number
  kit_id?: string
  timestamp?: string
}

export interface ListDeployedAppsResponse {
  type: 'list_deployed_apps-response'
  id?: string
  applications: Array<{
    app_id: string
    name: string
    status: string
    deploy_time: number
    resources?: {
      cpu?: number
      memory?: number
    }
  }>
}

export interface GetAppStatusRequest extends BaseMessage {
  type: 'get_app_status'
  appId: string
}

export interface AppStatusResponse {
  type: 'get_app_status-response'
  id?: string
  status: {
    app_id: string
    state: string
    uptime: number
    resources?: {
      cpu: number
      memory: number
    }
  }
}

// Configuration
const CONFIG = {
  WEBSOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'wss://your-production-domain.com/runtime'
    : 'ws://localhost:3002/runtime',

  HEALTH_CHECK_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com/health'
    : 'http://localhost:3003/health',

  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  CONSOLE_BUFFER_SIZE: 1000
}

class VehicleEdgeRuntimeDirectService {
  private ws: WebSocket | null = null
  private isConnected = false
  private isConnecting = false
  private reconnectAttempts = 0
  private messageHandlers = new Map<string, (message: VehicleRuntimeMessage | any) => void>()
  private pendingRequests = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>()
  private consoleBuffer = new Map<string, Array<{ timestamp: string; output: string; type: string }>>()
  private signalValues = new Map<string, { value: any; timestamp: string }>()

  constructor() {
    this.initializeEventHandlers()
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      console.log(`🔗 Connecting to Vehicle Edge Runtime at ${CONFIG.WEBSOCKET_URL}`)

      this.ws = new WebSocket(CONFIG.WEBSOCKET_URL)
      await this.waitForConnection()

      // Register client after connection
      await this.registerClient()

      this.isConnected = true
      this.isConnecting = false
      this.reconnectAttempts = 0

      console.log('✅ Connected to Vehicle Edge Runtime')

    } catch (error) {
      this.isConnecting = false
      this.isConnected = false
      console.error('❌ Failed to connect to Vehicle Edge Runtime:', error)
      this.handleReconnection()
      throw error
    }
  }

  disconnect(): void {
    this.isConnected = false
    this.isConnecting = false

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // Clear all pending requests
    this.pendingRequests.forEach(request => {
      clearTimeout(request.timeout)
      request.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()

    console.log('🔌 Disconnected from Vehicle Edge Runtime')
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 5000)

      this.ws.onopen = () => {
        clearTimeout(timeout)
        this.setupEventHandlers()
        resolve()
      }

      this.ws.onerror = (error) => {
        clearTimeout(timeout)
        reject(new Error('WebSocket connection failed'))
      }
    })
  }

  private initializeEventHandlers(): void {
    // This will be called after WebSocket is created
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('🔌 WebSocket connection closed')
      this.isConnected = false
      this.handleReconnection()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnected = false
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++
      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS}`)

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }, CONFIG.RECONNECT_INTERVAL * this.reconnectAttempts)
    } else {
      console.error('❌ Max reconnection attempts reached')
    }
  }

  private async registerClient(): Promise<void> {
    const request: RegisterClientRequest = {
      type: 'register_client',
      id: 'register-' + Date.now(),
      clientInfo: {
        name: 'Vehicle Management Dashboard',
        version: '1.0.0',
        platform: 'web'
      }
    }

    this.sendMessage(request)
  }

  // Message handling
  private async sendMessage(request: BaseMessage): Promise<any> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to Vehicle Edge Runtime')
    }

    // Add ID if not provided
    if (!request.id) {
      request.id = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request.id!)
        reject(new Error('Request timeout'))
      }, 10000)

      this.pendingRequests.set(request.id!, { resolve, reject, timeout })

      try {
        this.ws!.send(JSON.stringify(request))
      } catch (error) {
        clearTimeout(timeout)
        this.pendingRequests.delete(request.id!)
        reject(error)
      }
    })
  }

  private handleMessage(message: any): void {
    console.log('📨 Received message:', message.type)

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

    // Handle broadcast messages
    this.routeMessage(message)
  }

  private routeMessage(message: any): void {
    // Console output
    if (message.type === 'console_output') {
      this.handleConsoleOutput(message)
      const handler = this.messageHandlers.get('console_output')
      if (handler) handler(message)
      return
    }

    // Signal updates
    if (message.type === 'signal_update') {
      this.handleSignalUpdate(message)
      const handler = this.messageHandlers.get('signal_update')
      if (handler) handler(message)
      return
    }

    // Other message types
    const handler = this.messageHandlers.get(message.type)
    if (handler) handler(message)
  }

  private handleConsoleOutput(message: any): void {
    const buffer = this.getBuffer(message.executionId)
    buffer.push({
      timestamp: message.timestamp || new Date().toISOString(),
      output: message.output || message.data || '',
      type: message.stream || 'stdout'
    })

    // Limit buffer size
    if (buffer.length > CONFIG.CONSOLE_BUFFER_SIZE) {
      buffer.shift()
    }
  }

  private handleSignalUpdate(message: any): void {
    if (message.updates) {
      Object.entries(message.updates).forEach(([signal, value]) => {
        this.signalValues.set(signal, {
          value,
          timestamp: message.timestamp || new Date().toISOString()
        })
      })
    }
  }

  private getBuffer(executionId: string): Array<{ timestamp: string; output: string; type: string }> {
    if (!this.consoleBuffer.has(executionId)) {
      this.consoleBuffer.set(executionId, [])
    }
    return this.consoleBuffer.get(executionId)!
  }

  // Application deployment methods
  async deployPythonApp(appConfig: {
    id: string
    name: string
    code: string
    description?: string
    version?: string
    vehicleId?: string
  }): Promise<string> {
    const request: DeployRequest = {
      type: 'deploy_request',
      id: 'deploy-' + Date.now(),
      code: appConfig.code,
      prototype: {
        id: appConfig.id,
        name: appConfig.name,
        description: appConfig.description,
        version: appConfig.version || '1.0.0'
      },
      vehicleId: appConfig.vehicleId || 'default-vehicle',
      language: 'python'
    }

    const response: DeployRequestResponse = await this.sendMessage(request)

    if (response.status === 'started') {
      console.log(`✅ App deployment started: ${response.appId}`)

      // Start monitoring console output
      if (response.appId) {
        await this.subscribeToConsole(response.appId)
      }

      return response.appId || 'unknown'
    } else {
      throw new Error(`Deployment failed: ${response.result}`)
    }
  }

  async getDeployedApps(): Promise<ListDeployedAppsResponse> {
    return new Promise((resolve, reject) => {
      const requestId = 'list-apps-' + Date.now()
      const request: ListDeployedAppsRequest = {
        type: 'list_deployed_apps',
        id: requestId
      }

      console.log('🚀 Starting getDeployedApps request:', requestId)

      // Set up a longer timeout for the entire operation
      const timeout = setTimeout(() => {
        this.messageHandlers.delete('list_deployed_apps-response')
        console.error('❌ getDeployedApps timeout after 30 seconds')
        reject(new Error('getDeployedApps timeout'))
      }, 30000) // Extended timeout to 30 seconds

      // Set up a one-time handler for the response
      const handleResponse = (message: any) => {
        console.log('📨 Received message:', message.type, 'ID:', message.id, 'Expected ID:', requestId)

        // More flexible ID matching - accept if type matches OR ID matches
        if (message.type === 'list_deployed_apps-response') {
          clearTimeout(timeout)
          this.messageHandlers.delete('list_deployed_apps-response')
          console.log('✅ Received deployed apps response:', message)
          console.log('📊 Apps count in response:', message.applications?.length || 0)
          resolve(message)
        }
      }

      this.messageHandlers.set('list_deployed_apps-response', handleResponse)

      // Ensure connection is stable before sending
      if (!this.isConnected || !this.ws) {
        clearTimeout(timeout)
        this.messageHandlers.delete('list_deployed_apps-response')
        console.error('❌ Not connected to Vehicle Edge Runtime')
        reject(new Error('Not connected to Vehicle Edge Runtime'))
        return
      }

      // Check WebSocket ready state
      if (this.ws.readyState !== WebSocket.OPEN) {
        clearTimeout(timeout)
        this.messageHandlers.delete('list_deployed_apps-response')
        console.error('❌ WebSocket not open, readyState:', this.ws.readyState)
        reject(new Error(`WebSocket not open, readyState: ${this.ws.readyState}`))
        return
      }

      // Send the request
      try {
        this.ws.send(JSON.stringify(request))
        console.log('📤 Sent list_deployed_apps request:', requestId)
        console.log('🔗 WebSocket state after send:', this.ws.readyState)
      } catch (error) {
        clearTimeout(timeout)
        this.messageHandlers.delete('list_deployed_apps-response')
        console.error('❌ Failed to send request:', error)
        reject(error)
      }
    })
  }

  async getAppStatus(appId: string): Promise<AppStatusResponse> {
    const request: GetAppStatusRequest = {
      type: 'get_app_status',
      id: 'status-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  async stopApp(appId: string): Promise<any> {
    const request: StopAppRequest = {
      type: 'stop_app',
      id: 'stop-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  async pauseApp(appId: string): Promise<any> {
    const request: PauseAppRequest = {
      type: 'pause_app',
      id: 'pause-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  async resumeApp(appId: string): Promise<any> {
    const request: ResumeAppRequest = {
      type: 'resume_app',
      id: 'resume-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  async uninstallApp(appId: string): Promise<any> {
    const request: UninstallAppRequest = {
      type: 'uninstall_app',
      id: 'uninstall-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  // Console methods
  async subscribeToConsole(appId: string): Promise<ConsoleSubscribedResponse> {
    const request: DirectSubscribeConsoleRequest = {
      type: 'console_subscribe',
      id: 'console-sub-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  async unsubscribeFromConsole(appId: string): Promise<any> {
    const request: DirectUnsubscribeConsoleRequest = {
      type: 'console_unsubscribe',
      id: 'console-unsub-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  async getAppOutput(appId: string, lines: number = 100): Promise<any> {
    const request: AppOutputRequest = {
      type: 'app_output',
      id: 'output-' + Date.now(),
      appId,
      lines
    }

    return this.sendMessage(request)
  }

  async getConsoleOutput(appId: string): Promise<Array<{ timestamp: string; output: string; type: string }>> {
    return this.getBuffer(appId)
  }

  // Vehicle signal methods
  async subscribeToSignals(signals: string[]): Promise<any> {
    // Convert string signal names to VehicleSignal format
    const vehicleSignals: VehicleSignal[] = signals.map(signal => ({
      path: signal,
      access: 'read' as const
    }))

    const request: SubscribeSignalsRequest = {
      type: 'subscribe_apis',
      id: 'signal-sub-' + Date.now(),
      apis: vehicleSignals
    }

    return this.sendMessage(request)
  }

  async getSignalValues(signals: string[]): Promise<any> {
    const request: GetSignalsRequest = {
      type: 'get_signals_value',
      id: 'get-signals-' + Date.now(),
      apis: signals
    }

    return this.sendMessage(request)
  }

  async writeSignalValues(signals: Record<string, any>): Promise<any> {
    const request: WriteSignalsRequest = {
      type: 'write_signals_value',
      id: 'write-signals-' + Date.now(),
      data: signals
    }

    return this.sendMessage(request)
  }

  async getSignalValue(signal: string): Promise<{ value: any; timestamp: string } | null> {
    return this.signalValues.get(signal) || null
  }

  // Runtime management
  async getRuntimeState(): Promise<RuntimeStateResponse> {
    const request: GetRuntimeStateRequest = {
      type: 'report_runtime_state',
      id: 'runtime-state-' + Date.now()
    }

    return this.sendMessage(request)
  }

  async ping(): Promise<PongResponse> {
    const request: PingRequest = {
      type: 'ping',
      id: 'ping-' + Date.now()
    }

    return this.sendMessage(request)
  }

  // Event listeners
  onConsoleOutput(callback: (message: ConsoleOutput) => void): void {
    this.messageHandlers.set('console_output', callback)
  }

  onSignalUpdate(callback: (message: SignalUpdate) => void): void {
    this.messageHandlers.set('signal_update', callback)
  }

  onAppStatus(callback: (message: AppStatusResponse) => void): void {
    this.messageHandlers.set('get_app_status-response', callback)
  }

  onDeployedAppsList(callback: (message: ListDeployedAppsResponse) => void): void {
    this.messageHandlers.set('list_deployed_apps-response', callback)
  }

  // Connection status
  isServiceConnected(): boolean {
    return this.isConnected
  }

  isServiceConnecting(): boolean {
    return this.isConnecting
  }

  // Cleanup
  removeAllListeners(): void {
    this.messageHandlers.clear()
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(CONFIG.HEALTH_CHECK_URL)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
const vehicleEdgeRuntimeDirectService = new VehicleEdgeRuntimeDirectService()

export default vehicleEdgeRuntimeDirectService
export { VehicleEdgeRuntimeDirectService }