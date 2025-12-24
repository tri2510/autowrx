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

export interface MockSignals {
  [signalPath: string]: number | boolean | string
}

export interface DeployRequest extends BaseMessage {
  type: 'deploy_request'
  code: string
  language: 'python' | 'binary'
  vehicleId?: string
  prototype: {
    id: string
    name: string
    description?: string
    version?: string
  }
  dependencies?: string[]
  options?: {
    mockMode?: boolean
    mockSignals?: MockSignals
  }
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
    version?: string
    status: string
    deploy_time: string
    auto_start?: boolean
    description?: string
    type: 'python' | 'binary'
    resources?: {
      cpu_limit?: string
      memory_limit?: string
    }
    container_id?: string
    pid?: number
    last_heartbeat?: string
    exit_code?: number
  }>
  stats?: {
    total: number
    running: number
    paused: number
    stopped: number
    error: number
  }
  total_count?: number
  running_count?: number
  paused_count?: number
  stopped_count?: number
  error_count?: number
}

export interface GetAppStatusRequest extends BaseMessage {
  type: 'get_app_status'
  appId: string
}

// Simplified app management interfaces - use appId directly
export interface RunAppRequest extends BaseMessage {
  type: 'run_app'
  appId: string
}

export interface StopAppRequest extends BaseMessage {
  type: 'stop_app'
  appId: string
}

export interface PauseAppRequest extends BaseMessage {
  type: 'pause_app'
  appId: string
}

export interface ResumeAppRequest extends BaseMessage {
  type: 'resume_app'
  appId: string
}

export interface UninstallAppRequest extends BaseMessage {
  type: 'uninstall_app'
  appId: string  // Use appId for uninstall_app
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
  DEFAULT_WEBSOCKET_URL: process.env.NODE_ENV === 'production'
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
  async connect(websocketUrl?: string): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      const url = websocketUrl || CONFIG.DEFAULT_WEBSOCKET_URL
      console.log(`🔗 Connecting to Vehicle Edge Runtime at ${url}`)

      this.ws = new WebSocket(url)
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

  // Method to accept external WebSocket connection (from Kit Manager)
  setExternalWebSocket(websocket: WebSocket): void {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = websocket
    this.setupEventHandlers()
    this.isConnected = true
    this.isConnecting = false
    this.reconnectAttempts = 0

    console.log('✅ Using external WebSocket connection for Vehicle Edge Runtime')

    // Register client after connection - but wait a moment for WebSocket to be ready
    setTimeout(() => {
      this.registerClient()
    }, 100)
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
    // Only register if connected
    if (!this.isConnected) {
      console.log('⚠️ Not connected yet, skipping client registration')
      return
    }

    const request: RegisterClientRequest = {
      type: 'register_client',
      id: 'register-' + Date.now(),
      clientInfo: {
        name: 'Vehicle Management Dashboard',
        version: '1.0.0',
        platform: 'web'
      }
    }

    // Send directly without await since registration is fire-and-forget
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(request))
      console.log('✅ Client registration sent')
    } else {
      console.warn('⚠️ WebSocket not ready for client registration')
    }
  }

  // Message handling
  async sendMessage(request: BaseMessage): Promise<any> {
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
      }, 5000) // Reduced timeout to fail faster

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
    name: string
    code: string
    vehicleId?: string
    displayName?: string  // Optional display name for UI
    dependencies?: string[]  // Optional list of dependencies to install
    options?: {
      mockMode?: boolean
      mockSignals?: MockSignals
    }
  }): Promise<string> {
    // Use the provided name as the app ID
    const appId = appConfig.name
    const displayName = appConfig.displayName || appId
    const dependencies = appConfig.dependencies || []
    const options = appConfig.options

    console.log('🚀 Smart Deploy Request Debug:')
    console.log('  - appConfig.name (ID):', appConfig.name)
    console.log('  - appConfig.displayName:', appConfig.displayName)
    console.log('  - appConfig.dependencies:', dependencies)
    console.log('  - appConfig.options:', options)
    console.log('  - app ID (prototype.id):', appId)
    console.log('  - display name (prototype.name):', displayName)

    const request: DeployRequest = {
      type: 'deploy_request',
      id: 'deploy-' + Date.now(),
      code: appConfig.code,
      vehicleId: appConfig.vehicleId || 'default-vehicle',
      language: 'python',
      prototype: {
        id: appId,
        name: displayName, // Use the display name for UI
        description: `Python application: ${displayName}`,
        version: '1.0.0'
      },
      dependencies: dependencies, // Include dependencies in the request
      ...(options && { options }) // Include options if provided
    }

    console.log('📦 Sending deployment request with dependencies:', dependencies)
    if (options) {
      console.log('🧪 Mock mode enabled:', options.mockMode)
      if (options.mockSignals) {
        console.log('🎭 Mock signals:', options.mockSignals)
      }
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
    const request: ListDeployedAppsRequest = {
      type: 'list_deployed_apps'
    }

    console.log('🚀 Starting getDeployedApps request')

    try {
      const response = await this.sendMessage(request)
      console.log('✅ Received deployed apps response:', response)
      console.log('📊 Apps count in response:', response.applications?.length || 0)
      return response
    } catch (error) {
      console.error('❌ Failed to get deployed apps:', error)
      throw error
    }
  }

  async getAppStatus(appId: string): Promise<AppStatusResponse> {
    const request: GetAppStatusRequest = {
      type: 'get_app_status',
      id: 'status-' + Date.now(),
      appId
    }

    return this.sendMessage(request)
  }

  // Simplified app management methods - use appId directly
  async startApp(appId: string): Promise<any> {
    try {
      const request: RunAppRequest = {
        type: 'run_app',
        appId  // Direct mapping - what you send = what you use
      }

      console.log('🚀 Starting app request (simplified API):', request)
      return await this.sendMessage(request)
    } catch (error) {
      console.error('❌ Failed to start app:', error)
      throw error
    }
  }

  async stopApp(appId: string): Promise<any> {
    try {
      const request: StopAppRequest = {
        type: 'stop_app',
        appId  // Direct mapping - what you send = what you use
      }

      console.log('⏹️ Stopping app request (simplified API):', request)
      return await this.sendMessage(request)
    } catch (error) {
      console.error('❌ Failed to stop app:', error)
      throw error
    }
  }

  async pauseApp(appId: string): Promise<any> {
    try {
      const request: PauseAppRequest = {
        type: 'pause_app',
        appId  // Direct mapping - what you send = what you use
      }

      console.log('⏸️ Pausing app request (simplified API):', request)
      return await this.sendMessage(request)
    } catch (error) {
      console.error('❌ Failed to pause app:', error)
      throw error
    }
  }

  async resumeApp(appId: string): Promise<any> {
    try {
      const request: ResumeAppRequest = {
        type: 'resume_app',
        appId  // Direct mapping - what you send = what you use
      }

      console.log('▶️ Resuming app request (simplified API):', request)
      return await this.sendMessage(request)
    } catch (error) {
      console.error('❌ Failed to resume app:', error)
      throw error
    }
  }

  // Restart app functionality (stop + start)
  async restartApp(appId: string): Promise<any> {
    try {
      console.log('🔄 Restarting app:', appId)

      // Check connection first
      if (!this.isConnected) {
        throw new Error('Not connected to Vehicle Edge Runtime')
      }

      // First stop the app
      await this.stopApp(appId)

      // Wait a bit for stop to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Then start the app
      await this.startApp(appId)

      console.log('✅ App restarted successfully:', appId)
    } catch (error) {
      console.error('❌ Failed to restart app:', error)
      throw error
    }
  }

  async uninstallApp(appId: string): Promise<any> {
    try {
      const request: UninstallAppRequest = {
        type: 'uninstall_app',
        appId  // Use appId for uninstall_app (as specified)
      }

      console.log('🗑️ Uninstalling app request (simplified API):', request)
      return await this.sendMessage(request)
    } catch (error) {
      console.error('❌ Failed to uninstall app:', error)
      throw error
    }
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