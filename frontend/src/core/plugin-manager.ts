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

type InstalledPluginRecord = {
  id: string
  manifest: PluginManifest
  baseUrl: string
}

class PluginManager {
  private initialized = false
  private initializationPromise: Promise<void> | null = null
  private installedCache: Map<string, InstalledPluginRecord> = new Map()

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

    this.installedCache.set(plugin.id, plugin)
    await this.loadPlugin(plugin.baseUrl)
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
    try {
      await this.unloadPlugin(pluginId)
    } catch (error) {
      console.warn('Failed to unload plugin after uninstall:', error)
    }
  }

  async refreshInstalledPlugins(): Promise<void> {
    const installed = await this.fetchInstalledPlugins()
    this.installedCache.clear()
    installed.forEach((plugin) => this.installedCache.set(plugin.id, plugin))
    await this.syncInstalledPlugins(installed)
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

    return payload.plugins as InstalledPluginRecord[]
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
