// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Vehicle Edge Runtime v2.0 API Service
// Updated to work with Kit-Manager architecture instead of direct runtime connection

import { v4 as uuidv4 } from 'uuid'
import kitManagerService from './kitManager.service'

// Types based on API specification
export interface VehicleApp {
  id: string
  name: string
  version: string
  type: 'python' | 'binary'
  status: 'installed' | 'running' | 'stopped' | 'paused' | 'error'
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
  resources: {
    cpu: string
    memory: string
    disk: string
  }
}

export interface RuntimeInfo {
  kit_id: string
  data: {
    lsOfRunner: Array<{
      executionId: string
      appId: string
      status: string
    }>
    lsOfApiSubscriber: Array<{
      subscriptionId: string
      apis: string[]
      from: number
    }>
  }
}

export interface AppLog {
  id: number
  timestamp: string
  level: string
  message: string
  source: string
}

export interface ConsoleOutput {
  type: 'console_output'
  executionId: string
  stream: 'stdout' | 'stderr'
  data: string
  timestamp: string
  id?: string
}

export interface SignalUpdate {
  type: 'signal_update'
  subscriptionId: string
  path: string
  value: any
  timestamp: string
  id?: string
}

export interface VehicleSignal {
  path: string
  access: 'read' | 'write'
}

// Base message interface for all API messages
export interface BaseMessage {
  id?: string
  type: string
  timestamp?: string
  [key: string]: any  // Allow additional properties for different message types
}

// Request messages
export interface InstallAppRequest extends BaseMessage {
  type: 'install_app'
  appData: {
    id: string
    name: string
    version?: string
    description?: string
    type: 'python' | 'binary'
    code: string
    entryPoint?: string
    python_deps?: string[]
    vehicle_signals?: string[]
  }
}

export interface ListAppsRequest extends BaseMessage {
  type: 'list_apps'
  filters?: {
    status?: string
    type?: string
  }
}

export interface RunAppRequest extends BaseMessage {
  type: 'run_python_app'
  appId: string
  env?: Record<string, string>
  workingDir?: string
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
  appId: string
}

export interface GetAppStatusRequest extends BaseMessage {
  type: 'get_app_status'
  appId: string
}

export interface GetAppLogsRequest extends BaseMessage {
  type: 'get_app_logs'
  appId: string
  options?: {
    limit?: number
    level?: string
    since?: string
  }
}

export interface SubscribeConsoleRequest extends BaseMessage {
  type: 'console_subscribe'
  executionId: string
}

export interface UnsubscribeConsoleRequest extends BaseMessage {
  type: 'console_unsubscribe'
  executionId: string
}

export interface ConsoleStdinRequest extends BaseMessage {
  type: 'console_stdin'
  executionId: string
  input: string
}

export interface SubscribeSignalsRequest extends BaseMessage {
  type: 'subscribe_apis'
  apis: VehicleSignal[]
}

export interface GetSignalsRequest extends BaseMessage {
  type: 'get_signals_value'
  apis: string[]
}

export interface WriteSignalsRequest extends BaseMessage {
  type: 'write_signals_value'
  data: Record<string, any>
}

export interface GetRuntimeStateRequest extends BaseMessage {
  type: 'report_runtime_state'
}

export interface GetRuntimeInfoRequest extends BaseMessage {
  type: 'get_runtime_info'
}

export interface PingRequest extends BaseMessage {
  type: 'ping'
}

// Response messages
export interface AppInstalledResponse {
  type: 'app_installed'
  id?: string
  appId: string
  name: string
  appType: string
  status: string
  appDir: string
  timestamp: string
}

export interface AppsListResponse {
  type: 'apps_list'
  id?: string
  apps: VehicleApp[]
  count: number
  filters: any
  timestamp: string
}

export interface PythonAppStartedResponse {
  type: 'python_app_started'
  id?: string
  executionId: string
  appId: string
  status: string
  timestamp: string
}

export interface AppStoppedResponse {
  type: 'app_stopped'
  id?: string
  appId: string
  executionId: string
  status: string
  exitCode: number
  timestamp: string
}

export interface AppStatusResponse {
  type: 'app_status'
  id?: string
  status: {
    appId: string
    state: string
    uptime: number
    cpu: string
    memory: string
    startTime: string
  }
  timestamp: string
}

export interface AppLogsResponse {
  type: 'app_logs'
  id?: string
  appId: string
  logs: AppLog[]
  options: any
  timestamp: string
}

export interface ConsoleSubscribedResponse {
  type: 'console_subscribed'
  id?: string
  clientId: string
  executionId: string
  timestamp: string
}

export interface RuntimeStateResponse {
  type: 'runtime_state_response'
  id?: string
  runtimeState: RuntimeState
  timestamp: string
}

export interface PongResponse {
  type: 'pong'
  id?: string
  timestamp: string
}

export interface ErrorResponse {
  type: 'error'
  id?: string
  error: string
  code: string
  timestamp: string
}

// Union type for all possible response messages
export type VehicleRuntimeMessage =
  | AppInstalledResponse
  | AppsListResponse
  | PythonAppStartedResponse
  | AppStoppedResponse
  | AppStatusResponse
  | AppLogsResponse
  | ConsoleSubscribedResponse
  | RuntimeStateResponse
  | PongResponse
  | ErrorResponse
  | ConsoleOutput
  | SignalUpdate

class VehicleEdgeRuntimeService {
  private isKitManagerConnected = false
  private selectedKitId: string | null = null
  private messageHandlers = new Map<string, (message: VehicleRuntimeMessage) => void>()

  constructor() {
    // Initialize service without mock data
  }

  // Connection management
  async connect(kitId?: string): Promise<void> {
    try {
      // Connect to kit-manager first
      await kitManagerService.connect()
      this.isKitManagerConnected = true

      // Setup event handlers for real-time messages
      this.setupKitManagerEventHandlers()

      if (kitId) {
        this.selectedKitId = kitId
        console.log(`Vehicle Edge Runtime service connected via kit-manager for kit: ${kitId}`)
      }

      console.log('✅ Vehicle Edge Runtime service connected via kit-manager')

    } catch (error) {
      console.error('❌ Kit-manager connection failed:', error)
      this.isKitManagerConnected = false
      throw new Error(`Failed to connect to kit-manager: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  disconnect(): void {
    this.isKitManagerConnected = false
    this.selectedKitId = null
    kitManagerService.removeAllListeners()
    kitManagerService.disconnect()
  }

  // Handle real-time messages from kit-manager
  private setupKitManagerEventHandlers(): void {
    // Listen for console output from kits
    kitManagerService.onKitMessage((message) => {
      if (message.data?.output || message.data?.log) {
        const timestamp = new Date().toLocaleTimeString()
        const output = message.data?.output || message.data?.log

        // Trigger console output handlers
        const handler = this.messageHandlers.get('console_output')
        if (handler) {
          handler({
            type: 'console_output',
            executionId: 'unknown',
            stream: 'stdout',
            data: output,
            timestamp: new Date().toISOString()
          } as ConsoleOutput)
        }
      }
    })

    // Listen for broadcast messages (console output, etc.)
    kitManagerService.onBroadcast((message) => {
      const timestamp = new Date().toLocaleTimeString()

      // Add console output
      if (message.data?.output || message.data?.log) {
        const output = message.data?.output || message.data?.log
        const handler = this.messageHandlers.get('console_output')
        if (handler) {
          handler({
            type: 'console_output',
            executionId: 'unknown',
            stream: 'stdout',
            data: output,
            timestamp: new Date().toISOString()
          } as ConsoleOutput)
        }
      }
    })
  }

  // Application lifecycle methods
  async installApp(appData: InstallAppRequest['appData']): Promise<AppInstalledResponse> {
    if (!this.selectedKitId) {
      throw new Error('No kit selected for deployment')
    }

    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Deploy through kit-manager using WebSocket
    try {
      await kitManagerService.deployApp(this.selectedKitId, appData.code || '', appData.name)

      return {
        type: 'app_installed',
        appId: appData.id,
        name: appData.name,
        appType: appData.type,
        status: 'installed',
        appDir: `/tmp/${appData.id}`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listApps(filters?: ListAppsRequest['filters']): Promise<AppsListResponse> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // For now, return empty list since kit-manager doesn't have app listing endpoint
    // This would need to be implemented in the kit-manager backend
    return {
      type: 'apps_list',
      apps: [],
      count: 0,
      filters: filters || {},
      timestamp: new Date().toISOString()
    }
  }

  async runApp(appId: string, options?: Omit<RunAppRequest, 'type' | 'appId' | 'id' | 'timestamp'>): Promise<PythonAppStartedResponse> {
    if (!this.selectedKitId) {
      throw new Error('No kit selected for app execution')
    }

    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Send run command through kit-manager
    try {
      await kitManagerService.sendMessageToKit({
        to_kit_id: this.selectedKitId,
        cmd: 'run_app',
        appId,
        ...options
      })

      const executionId = `exec-${Date.now()}`
      return {
        type: 'python_app_started',
        executionId,
        appId,
        status: 'running',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw new Error(`Failed to start app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async stopApp(appId: string): Promise<AppStoppedResponse> {
    if (!this.selectedKitId) {
      throw new Error('No kit selected for app control')
    }

    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Send stop command through kit-manager
    try {
      await kitManagerService.sendMessageToKit({
        to_kit_id: this.selectedKitId,
        cmd: 'stop_app',
        appId
      })

      const executionId = `exec-${Date.now()}`
      return {
        type: 'app_stopped',
        executionId,
        appId,
        status: 'stopped',
        exitCode: 0,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw new Error(`Failed to stop app: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async pauseApp(appId: string): Promise<any> {
    if (!this.selectedKitId) {
      throw new Error('No kit selected for app control')
    }

    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Send pause command through kit-manager
    await kitManagerService.sendMessageToKit({
      to_kit_id: this.selectedKitId,
      cmd: 'pause_app',
      appId
    })
    return { success: true }
  }

  async resumeApp(appId: string): Promise<any> {
    if (!this.selectedKitId) {
      throw new Error('No kit selected for app control')
    }

    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Send resume command through kit-manager
    await kitManagerService.sendMessageToKit({
      to_kit_id: this.selectedKitId,
      cmd: 'resume_app',
      appId
    })
    return { success: true }
  }

  async uninstallApp(appId: string): Promise<any> {
    if (!this.selectedKitId) {
      throw new Error('No kit selected for app control')
    }

    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Send uninstall command through kit-manager
    await kitManagerService.sendMessageToKit({
      to_kit_id: this.selectedKitId,
      cmd: 'uninstall_app',
      appId
    })
    return { success: true }
  }

  async getAppStatus(appId: string): Promise<AppStatusResponse> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Get status through kit-manager (would need backend implementation)
    return {
      type: 'app_status',
      status: {
        appId,
        state: 'unknown',
        uptime: 0,
        cpu: 'unknown',
        memory: 'unknown',
        startTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
  }

  async getAppLogs(appId: string, options?: GetAppLogsRequest['options']): Promise<AppLogsResponse> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Get logs through kit-manager (would need backend implementation)
    return {
      type: 'app_logs',
      appId,
      logs: [],
      options: options || {},
      timestamp: new Date().toISOString()
    }
  }

  // Console methods
  async subscribeConsole(executionId: string): Promise<ConsoleSubscribedResponse> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    if (!this.selectedKitId) {
      throw new Error('No kit selected for console subscription')
    }

    // Subscribe through kit-manager
    try {
      await kitManagerService.subscribeToKit(this.selectedKitId)
      return {
        type: 'console_subscribed',
        clientId: 'browser-client',
        executionId,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw new Error(`Failed to subscribe to console: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async unsubscribeConsole(executionId: string): Promise<any> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Implementation since kit-manager doesn't have this endpoint
    console.log(`Unsubscribing from console for ${executionId}`)
    return { success: true }
  }

  async sendConsoleInput(executionId: string, input: string): Promise<any> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    if (!this.selectedKitId) {
      throw new Error('No kit selected for console input')
    }

    // Send input through kit-manager if supported
    try {
      await kitManagerService.sendMessageToKit({
        to_kit_id: this.selectedKitId,
        cmd: 'console_stdin',
        executionId,
        input
      })
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to send console input: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Vehicle signal methods
  async subscribeSignals(apis: VehicleSignal[]): Promise<any> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Signal subscription would need to be implemented in kit-manager
    console.log('Subscribing to signals:', apis)
    return { success: true, message: 'Signal subscription initiated' }
  }

  async getSignalValues(apis: string[]): Promise<any> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Signal value retrieval would need to be implemented in kit-manager
    console.log('Getting signal values:', apis)
    return {}
  }

  async writeSignalValues(data: Record<string, any>): Promise<any> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Signal value writing would need to be implemented in kit-manager
    console.log('Writing signal values:', data)
    return { success: true, message: 'Signal values written' }
  }

  // Runtime management
  async getRuntimeState(): Promise<RuntimeStateResponse> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Get runtime state through kit-manager (this would need backend implementation)
    return {
      type: 'runtime_state_response',
      runtimeState: {
        runtimeId: this.selectedKitId || 'unknown',
        status: 'running',
        uptime: 0,
        version: '2.0.0',
        runningApplications: [],
        resources: {
          cpu: 'Unknown',
          memory: 'Unknown',
          disk: 'Unknown'
        }
      },
      timestamp: new Date().toISOString()
    }
  }

  async getRuntimeInfo(): Promise<RuntimeInfo> {
    if (!this.isKitManagerConnected) {
      throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
    }

    // Get runtime info through kit-manager (would need backend implementation)
    return {
      kit_id: this.selectedKitId || 'unknown',
      data: {
        lsOfRunner: [],
        lsOfApiSubscriber: []
      }
    }
  }

  async ping(): Promise<PongResponse> {
    // Ping through kit-manager connection status
    if (this.isKitManagerConnected) {
      return {
        type: 'pong',
        timestamp: new Date().toISOString()
      }
    }

    throw new Error('Kit-manager is not connected. Please ensure the kit-manager service is running on port 3090.')
  }

  // Event listeners
  onConsoleOutput(callback: (message: ConsoleOutput) => void): void {
    this.messageHandlers.set('console_output', (message: VehicleRuntimeMessage) => {
      if (message.type === 'console_output') {
        callback(message as ConsoleOutput)
      }
    })
  }

  onSignalUpdate(callback: (message: SignalUpdate) => void): void {
    this.messageHandlers.set('signal_update', (message: VehicleRuntimeMessage) => {
      if (message.type === 'signal_update') {
        callback(message as SignalUpdate)
      }
    })
  }

  // Connection status
  isConnected(): boolean {
    return this.isKitManagerConnected
  }

  isConnecting(): boolean {
    return false // Kit-manager connects instantly
  }

  getSelectedKit(): string | null {
    return this.selectedKitId
  }

  setSelectedKit(kitId: string): void {
    this.selectedKitId = kitId
  }

  // Cleanup
  removeAllListeners(): void {
    this.messageHandlers.clear()
  }
}

// Export singleton instance
const vehicleEdgeRuntimeService = new VehicleEdgeRuntimeService()

export default vehicleEdgeRuntimeService
export { VehicleEdgeRuntimeService }