// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { pluginLoader } from './plugin-loader'
import { tabManager } from './tab-manager'
import { pluginAPI } from './plugin-api'
import { LoadedPlugin, PluginManifest } from '@/types/plugin.types'

export type InstalledPluginRecord = {
  id: string
  manifest: PluginManifest
  baseUrl: string
  source?: 'local' | 'registry'
  version?: string
  bundleUrl?: string
  integrity?: string
  installedAt?: string | null
}

const DYNAMIC_INSTALL_STORAGE_KEY = 'autowrx-registry-installs'

async function verifyBundleIntegrity(bundleCode: string, integrity?: string): Promise<void> {
  if (!integrity) {
    return
  }

  const [algToken, hash] = integrity.split('-')
  if (!algToken || !hash) {
    throw new Error('Invalid integrity format')
  }

  if (typeof window === 'undefined' || !(window.crypto?.subtle)) {
    console.warn('Web Crypto not available; skipping integrity verification')
    return
  }

  const normalizedAlg = algToken.toLowerCase() === 'sha256' ? 'SHA-256'
    : algToken.toLowerCase() === 'sha384' ? 'SHA-384'
      : algToken.toLowerCase() === 'sha512' ? 'SHA-512'
        : null

  if (!normalizedAlg) {
    console.warn(`Unsupported integrity algorithm: ${algToken}; skipping verification`)
    return
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(bundleCode)
  const digestBuffer = await window.crypto.subtle.digest(normalizedAlg, data)
  const digestArray = Array.from(new Uint8Array(digestBuffer))
  const digestHex = digestArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  if (digestHex !== hash.toLowerCase()) {
    throw new Error('Bundle integrity check failed')
  }
}

class PluginManager {
  private initialized = false
  private initializationPromise: Promise<void> | null = null
  private installedCache: Map<string, InstalledPluginRecord> = new Map()

  private async activatePlugin(manifest: PluginManifest, loadAction: () => Promise<LoadedPlugin>): Promise<LoadedPlugin> {
    pluginAPI.setCurrentPlugin(manifest.id)
    try {
      const loaded = await loadAction()

      if (manifest.tabs) {
        for (const tab of manifest.tabs) {
          tabManager.registerTab(manifest.id, tab)
        }
      }

      if (process.env.NODE_ENV === 'development' && loaded.source !== 'registry') {
        pluginLoader.enableHotReload(manifest.id)
      }

      return loaded
    } finally {
      pluginAPI.setCurrentPlugin('')
    }
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      console.log('🔌 Plugin system already initialized, skipping...')
      return
    }

    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      console.log('🔌 Plugin system initialization in progress, waiting...')
      return this.initializationPromise
    }

    console.log('🔌 Initializing plugin system...')

    // Create initialization promise and store it
    this.initializationPromise = this.doInitialize()

    try {
      await this.initializationPromise
    } finally {
      this.initializationPromise = null
    }
  }

  private async doInitialize(): Promise<void> {
    try {
      await this.exposeGlobalAPI()
      await this.loadBuiltInPlugins()
      await this.loadUserPlugins()

      this.initialized = true

      // Defensive checks for pluginLoader and tabManager
      const loadedCount = (pluginLoader && typeof pluginLoader.listPlugins === 'function')
        ? pluginLoader.listPlugins().length
        : 0
      const tabCount = (tabManager && typeof tabManager.getActiveTabs === 'function')
        ? tabManager.getActiveTabs().length
        : 0

      console.log(`✅ Plugin system initialized: ${loadedCount} plugins loaded, ${tabCount} tabs registered`)

      // Expose for debugging
      try {
        if (typeof window !== 'undefined') {
          console.log('🔍 Exposing plugin managers to window...')
          ;(window as any).pluginManager = this
          ;(window as any).tabManager = tabManager
          console.log('✅ Managers exposed to window')
        }
      } catch (exposeError) {
        console.error('❌ Failed to expose managers:', exposeError)
      }
    } catch (error) {
      console.error('❌ Failed to initialize plugin system:', error)
      console.error('❌ Error stack:', (error as Error).stack)
      this.initialized = false
      throw error
    }
  }

  private async exposeGlobalAPI(): Promise<void> {
    if (typeof window !== 'undefined') {
      (window as any).AutoWRXPluginAPI = pluginAPI
      // Expose React for plugins
      ;(window as any).React = React
      console.log('✅ Global API and React exposed for plugins')
    }
  }

  private async loadBuiltInPlugins(): Promise<void> {
    // Built-in plugins are handled by user plugins for now
    console.log('📦 Built-in plugins: None currently')
  }

  private async loadUserPlugins(): Promise<void> {
    try {
      console.log('🔌 Fetching installed plugins from API...')
      const installed = await this.fetchInstalledPlugins()
      console.log(`🔌 Found ${installed.length} installed plugins:`, installed)
      this.installedCache.clear()
      installed.forEach((plugin) => this.installedCache.set(plugin.id, plugin))
      console.log('🔌 Syncing installed plugins...')
      await this.syncInstalledPlugins(installed)
      console.log('✅ Plugin sync complete')
    } catch (error) {
      console.error('❌ Failed to load installed plugins:', error)
    }
  }

  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    // First, fetch the manifest to get the plugin ID
    const manifestResponse = await fetch(`${pluginPath}/manifest.json`)
    const manifest = await manifestResponse.json()

    // Set plugin context BEFORE loading (so activate() can use it)
    pluginAPI.setCurrentPlugin(manifest.id)

    try {
      const plugin = await pluginLoader.loadPlugin(pluginPath)

      if (plugin.manifest.tabs) {
        for (const tab of plugin.manifest.tabs) {
          tabManager.registerTab(plugin.manifest.id, tab)
        }
      }

      if (process.env.NODE_ENV === 'development') {
        pluginLoader.enableHotReload(plugin.manifest.id)
      }

      return plugin
    } finally {
      pluginAPI.setCurrentPlugin('')
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = pluginLoader.listPlugins().find(p => p.manifest.id === pluginId)
    if (plugin) {
      for (const tab of plugin.tabs) {
        tabManager.unregisterTab(pluginId, tab.definition.id)
      }
    }
    
    await pluginLoader.unloadPlugin(pluginId)
  }

  getLoadedPlugins(): LoadedPlugin[] {
    return pluginLoader.listPlugins()
  }

  getInstalledPlugins(): InstalledPluginRecord[] {
    return Array.from(this.installedCache.values())
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    const record = this.installedCache.get(pluginId)
    if (!record) {
      throw new Error(`Plugin ${pluginId} is not installed`)
    }
    const source = record.source || 'local'

    await this.unloadPlugin(pluginId)

    if (source === 'registry') {
      await this.loadRegistryPlugin(record)
    } else {
      await this.loadPlugin(record.baseUrl)
    }
  }

  async installPlugin(pluginData: File | string): Promise<void> {
    try {
      if (typeof pluginData === 'string') {
        await this.installFromCatalog(pluginData)
        return
      }

      const formData = new FormData()
      formData.append('plugin', pluginData)
      const response = await fetch('/api/plugins/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Plugin upload failed: ${response.statusText}`)
      }

      const payload = await response.json()
      if (payload?.plugin?.manifest?.id) {
        await this.installFromCatalog(payload.plugin.manifest.id)
      }
    } catch (error) {
      console.error('Plugin installation failed:', error)
      throw error
    }
  }

  async installFromCatalog(pluginId: string): Promise<void> {
    const response = await fetch('/api/plugins/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pluginId }),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Installation failed: ${response.statusText}`)
    }

    const payload = await response.json()
    const plugin = payload?.plugin
    if (!plugin?.baseUrl) {
      throw new Error('Invalid install response: missing baseUrl')
    }

    const record: InstalledPluginRecord = {
      ...plugin,
      source: 'local',
      installedAt: plugin.installedAt || new Date().toISOString()
    }

    this.installedCache.set(record.id, record)
    await this.loadPlugin(record.baseUrl)
  }

  async uninstallInstalledPlugin(pluginId: string): Promise<void> {
    const response = await fetch(`/api/plugins/${pluginId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to uninstall plugin: ${response.statusText}`)
    }

    this.installedCache.delete(pluginId)
    this.persistDynamicInstalls()
    try {
      await this.unloadPlugin(pluginId)
    } catch (error) {
      console.warn('Failed to unload plugin after uninstall:', error)
    }
  }

  async installFromRegistry(extensionId: string, version: string = 'latest'): Promise<void> {
    const response = await fetch(`/api/extensions/${extensionId}/versions/${version}`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to install extension ${extensionId}: ${response.statusText}`)
    }

    const payload = await response.json()
    if (!payload?.bundleUrl || !payload?.manifest) {
      throw new Error('Registry response missing bundle or manifest')
    }

    const manifest: PluginManifest = payload.manifest
    const bundleResponse = await fetch(payload.bundleUrl)
    if (!bundleResponse.ok) {
      throw new Error(`Failed to download bundle: ${bundleResponse.statusText}`)
    }

    const bundleCode = await bundleResponse.text()
    await verifyBundleIntegrity(bundleCode, payload.integrity)
    const baseUrl = `registry://${manifest.id}@${payload.version || 'latest'}`

    await this.activatePlugin(manifest, () => pluginLoader.loadPluginFromBundle(manifest, bundleCode, {
      baseUrl,
      source: 'registry',
      bundleUrl: payload.bundleUrl
    }))

    const record: InstalledPluginRecord = {
      id: manifest.id,
      manifest,
      baseUrl,
      source: 'registry',
      version: payload.version,
      bundleUrl: payload.bundleUrl,
      integrity: payload.integrity,
      installedAt: new Date().toISOString()
    }

    this.installedCache.set(record.id, record)
    this.persistDynamicInstalls()
  }

  async uninstallRegistryPlugin(pluginId: string): Promise<void> {
    this.installedCache.delete(pluginId)
    this.persistDynamicInstalls()
    try {
      await this.unloadPlugin(pluginId)
    } catch (error) {
      console.warn('Failed to unload registry plugin:', error)
    }
  }

  async refreshInstalledPlugins(): Promise<void> {
    const installed = await this.fetchInstalledPlugins()
    this.installedCache.clear()
    installed.forEach((plugin) => this.installedCache.set(plugin.id, plugin))
    await this.syncInstalledPlugins(installed)
    await this.restoreDynamicInstalls()
  }

  private async fetchInstalledPlugins(): Promise<InstalledPluginRecord[]> {
    const response = await fetch('/api/plugins/installed', {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch installed plugins: ${response.statusText}`)
    }

    const payload = await response.json()
    if (!payload || !Array.isArray(payload.plugins)) {
      return []
    }

    return (payload.plugins as InstalledPluginRecord[]).map((plugin) => ({
      ...plugin,
      source: 'local'
    }))
  }

  private getDynamicInstalls(): InstalledPluginRecord[] {
    return Array.from(this.installedCache.values()).filter((plugin) => plugin.source === 'registry')
  }

  private persistDynamicInstalls(): void {
    if (typeof window === 'undefined') {
      return
    }
    try {
      const dynamic = this.getDynamicInstalls()
      window.localStorage.setItem(DYNAMIC_INSTALL_STORAGE_KEY, JSON.stringify(dynamic))
    } catch (error) {
      console.warn('Failed to persist dynamic installs:', error)
    }
  }

  private async restoreDynamicInstalls(): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(DYNAMIC_INSTALL_STORAGE_KEY)
    if (!stored) {
      return
    }

    try {
      const dynamicInstalls: InstalledPluginRecord[] = JSON.parse(stored)
      for (const record of dynamicInstalls) {
        if (!record || !record.id || !record.bundleUrl || !record.manifest) {
          continue
        }
        this.installedCache.set(record.id, record)
        try {
          await this.loadRegistryPlugin(record, { skipPersist: true })
        } catch (error) {
          console.error('Failed to restore registry plugin:', error)
        }
      }
    } catch (error) {
      console.warn('Failed to parse dynamic installs:', error)
    }
  }

  private async loadRegistryPlugin(record: InstalledPluginRecord, options: { skipPersist?: boolean } = {}): Promise<void> {
    if (!record.bundleUrl) {
      throw new Error(`Registry plugin ${record.id} missing bundle URL`)
    }

    try {
      const bundleResponse = await fetch(record.bundleUrl)
      if (!bundleResponse.ok) {
        throw new Error(`Failed to download bundle for ${record.id}: ${bundleResponse.statusText}`)
      }
      const bundleCode = await bundleResponse.text()
      await verifyBundleIntegrity(bundleCode, record.integrity)

      await this.activatePlugin(record.manifest, () => pluginLoader.loadPluginFromBundle(record.manifest, bundleCode, {
        baseUrl: record.baseUrl,
        source: 'registry',
        bundleUrl: record.bundleUrl
      }))

      if (!options.skipPersist) {
        this.persistDynamicInstalls()
      }
    } catch (error) {
      this.notifyRegistryError(record.id, error)
      throw error
    }
  }

  private notifyRegistryError(pluginId: string, error: unknown): void {
    if (typeof window === 'undefined') {
      return
    }
    const message = error instanceof Error ? error.message : 'Unknown registry plugin error'
    window.dispatchEvent(new CustomEvent('autowrx-registry-plugin-error', {
      detail: {
        pluginId,
        message
      }
    }))
  }

  private async syncInstalledPlugins(installed: InstalledPluginRecord[]): Promise<void> {
    console.log('🔄 Starting plugin sync...')
    const installedIds = new Set(installed.map((plugin) => plugin.id))
    const currentlyLoaded = pluginLoader.listPlugins()
    console.log(`📊 Currently loaded: ${currentlyLoaded.length}, Installed: ${installed.length}`)

    for (const loaded of currentlyLoaded) {
      if (!installedIds.has(loaded.manifest.id)) {
        console.log(`❌ Unloading plugin: ${loaded.manifest.id}`)
        await this.unloadPlugin(loaded.manifest.id)
      }
    }

    const updatedLoaded = pluginLoader.listPlugins()

    for (const plugin of installed) {
      const alreadyLoaded = updatedLoaded.find((loaded) => loaded.manifest.id === plugin.id)
      if (!alreadyLoaded) {
        console.log(`⏳ Loading plugin: ${plugin.id} from ${plugin.baseUrl}`)
        await this.loadPlugin(plugin.baseUrl)
        console.log(`✅ Loaded plugin: ${plugin.id}`)
      } else {
        console.log(`✓ Plugin already loaded: ${plugin.id}`)
      }
    }
  }
}

// Use window-level singleton to persist across HMR reloads
function getPluginManagerSingleton(): PluginManager {
  if (typeof window !== 'undefined') {
    if (!(window as any).__pluginManager) {
      console.log('🔌 Creating new PluginManager singleton')
      ;(window as any).__pluginManager = new PluginManager()
    } else {
      console.log('🔌 Reusing existing PluginManager singleton')
    }
    return (window as any).__pluginManager
  }
  // Fallback for SSR
  return new PluginManager()
}

export const pluginManager = getPluginManagerSingleton()
