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
  private installedCache: Map<string, InstalledPluginRecord> = new Map()

  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('🔌 Initializing plugin system...')
    await this.exposeGlobalAPI()
    await this.loadBuiltInPlugins()
    await this.loadUserPlugins()
    
    this.initialized = true
    console.log('✅ Plugin system initialized')
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
      const installed = await this.fetchInstalledPlugins()
      this.installedCache.clear()
      installed.forEach((plugin) => this.installedCache.set(plugin.id, plugin))
      await this.syncInstalledPlugins(installed)
    } catch (error) {
      console.error('Failed to load installed plugins:', error)
    }
  }

  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    const plugin = await pluginLoader.loadPlugin(pluginPath)
    
    pluginAPI.setCurrentPlugin(plugin.manifest.id)
    
    try {
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
    const installedIds = new Set(installed.map((plugin) => plugin.id))
    const currentlyLoaded = pluginLoader.listPlugins()

    for (const loaded of currentlyLoaded) {
      if (!installedIds.has(loaded.manifest.id)) {
        await this.unloadPlugin(loaded.manifest.id)
      }
    }

    const updatedLoaded = pluginLoader.listPlugins()

    for (const plugin of installed) {
      const alreadyLoaded = updatedLoaded.find((loaded) => loaded.manifest.id === plugin.id)
      if (!alreadyLoaded) {
        await this.loadPlugin(plugin.baseUrl)
      }
    }
  }
}

export const pluginManager = new PluginManager()
