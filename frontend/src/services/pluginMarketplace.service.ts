import { pluginManager } from '@/core/plugin-manager'
import { PluginManifest } from '@/types/plugin.types'

export interface CatalogPluginDescriptor {
  id: string
  name: string
  version: string
  description: string
  author: string
  summary?: string
  tags?: string[]
  status?: string
  homepage?: string
}

export interface InstalledPluginDescriptor {
  id: string
  manifest: PluginManifest
  baseUrl: string
  installedAt?: string | null
}

export interface PluginTabUpdate {
  id: string
  label?: string
  icon?: string
  path?: string
  component?: string
  position?: number
  permissions?: string[]
  create?: boolean
}

export interface PluginUpdateRequest {
  name?: string
  description?: string
  summary?: string
  version?: string
  author?: string
  tags?: string[]
  permissions?: string[]
  activationEvents?: string[]
  tabs?: PluginTabUpdate[]
}

export async function fetchCatalog(): Promise<CatalogPluginDescriptor[]> {
  const response = await fetch('/api/plugins/catalog', {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch plugin catalog: ${response.statusText}`)
  }

  const payload = await response.json()
  if (!payload || !Array.isArray(payload.plugins)) {
    return []
  }

  return payload.plugins as CatalogPluginDescriptor[]
}

export async function fetchInstalled(): Promise<InstalledPluginDescriptor[]> {
  const response = await fetch('/api/plugins/installed', {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch installed plugins: ${response.statusText}`)
  }

  const payload = await response.json()
  if (!payload || !Array.isArray(payload.plugins)) {
    return []
  }

  return payload.plugins as InstalledPluginDescriptor[]
}

export async function installFromCatalog(pluginId: string): Promise<void> {
  await pluginManager.installFromCatalog(pluginId)
}

export async function uninstall(pluginId: string): Promise<void> {
  await pluginManager.uninstallInstalledPlugin(pluginId)
}

export async function uploadPlugin(file: File): Promise<void> {
  await pluginManager.installPlugin(file)
}

export async function updatePlugin(pluginId: string, updates: PluginUpdateRequest): Promise<InstalledPluginDescriptor> {
  const response = await fetch(`/api/plugins/${pluginId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    throw new Error(`Failed to update plugin: ${response.statusText}`)
  }

  const payload = await response.json()
  if (!payload || !payload.plugin) {
    throw new Error('Invalid plugin update response')
  }

  return payload.plugin as InstalledPluginDescriptor
}
