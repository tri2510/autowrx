// Type definitions for Vehicle Edge Runtime plugin

export interface VehicleApp {
  id: string
  name: string
  type: 'python' | 'binary' | 'docker' | 'mock-service'
  status: 'running' | 'stopped' | 'paused' | 'error' | 'installed' | 'starting'
  created_at: string
  executionId?: string
  container_id?: string
  pid?: number
  exit_code?: number
  resources?: {
    cpu_limit?: string
    memory_limit?: string
    cpu_usage?: string
    memory_usage?: string
  }
}

export interface VehicleEdgeRuntimeKit {
  kit_id: string
  name: string
  is_online: boolean
  noSubscriber: number
  description?: string
}

export interface DeploymentConfig {
  type: 'python' | 'binary' | 'docker'
  code: string
  entryPoint?: string
  envVars?: Record<string, string>
  resourceLimits?: {
    memory: number
    cpu: number
  }
}

export interface PluginAPI {
  updateModel?: (updates: any) => Promise<any>
  updatePrototype?: (updates: any) => Promise<any>
}

export interface PluginProps {
  data?: {
    model?: any
    prototype?: any
  }
  config?: {
    plugin_id?: string
  }
  api?: PluginAPI
}
