import { PluginManifest } from '@/types/plugin.types'

export interface ExtensionVersionSummary {
  version: string
  state: 'draft' | 'released' | 'deprecated'
  permissions?: string[]
  channel?: string
}

export interface ExtensionSummary {
  id: string
  providerId: string
  name: string
  summary?: string
  description?: string
  tags?: string[]
  latestVersion?: string
  channel?: string
  versions?: ExtensionVersionSummary[]
}

export interface ExtensionVersionInfo {
  version: string
  state: 'draft' | 'released' | 'deprecated'
  bundleUrl: string
  integrity?: string
  permissions?: string[]
  engine?: Record<string, string>
  channel?: string
  changelog?: string
  manifest?: PluginManifest
}

export async function fetchRegistryCatalog(params: Record<string, string> = {}): Promise<ExtensionSummary[]> {
  const query = new URLSearchParams(params)
  const response = await fetch(`/api/extensions/catalog?${query.toString()}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch extension catalog: ${response.statusText}`)
  }

  const payload = await response.json()
  return (payload?.items || []) as ExtensionSummary[]
}

export async function fetchRegistryExtension(extensionId: string): Promise<any> {
  const response = await fetch(`/api/extensions/${extensionId}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch extension ${extensionId}: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchRegistryVersion(extensionId: string, version: string = 'latest'): Promise<ExtensionVersionInfo> {
  const response = await fetch(`/api/extensions/${extensionId}/versions/${version}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch version ${version} for ${extensionId}: ${response.statusText}`)
  }

  return response.json() as Promise<ExtensionVersionInfo>
}
