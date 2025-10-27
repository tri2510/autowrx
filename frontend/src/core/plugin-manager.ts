// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { pluginLoader } from './plugin-loader'
import { tabManager } from './tab-manager'
import { pluginAPI } from './plugin-api'
import { LoadedPlugin } from '@/types/plugin.types'

class PluginManager {
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    this.exposeGlobalAPI()
    await this.loadBuiltInPlugins()
    await this.loadUserPlugins()
    
    this.initialized = true
  }

  private exposeGlobalAPI(): void {
    if (typeof window !== 'undefined') {
      (window as any).AutoWRXPluginAPI = pluginAPI
    }
  }

  private async loadBuiltInPlugins(): Promise<void> {
    const builtInPlugins = [
      '/plugins/journey-plugin',
      '/plugins/flow-plugin',
      '/plugins/sdv-code-plugin',
      '/plugins/dashboard-plugin',
      '/plugins/homologation-plugin'
    ]

    for (const pluginPath of builtInPlugins) {
      try {
        await this.loadPlugin(pluginPath)
      } catch (error) {
        console.warn(`Failed to load built-in plugin ${pluginPath}:`, error)
      }
    }
  }

  private async loadUserPlugins(): Promise<void> {
    try {
      const response = await fetch('/api/plugins')
      const userPlugins = await response.json()

      for (const plugin of userPlugins) {
        try {
          await this.loadPlugin(plugin.path)
        } catch (error) {
          console.error(`Failed to load user plugin ${plugin.path}:`, error)
        }
      }
    } catch (error) {
      console.warn('No user plugins API available')
    }
  }

  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    const plugin = await pluginLoader.loadPlugin(pluginPath)
    
    pluginAPI.setCurrentPlugin(plugin.manifest.id)
    
    if (plugin.manifest.tabs) {
      for (const tab of plugin.manifest.tabs) {
        tabManager.registerTab(plugin.manifest.id, tab)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      pluginLoader.enableHotReload(plugin.manifest.id)
    }

    return plugin
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
      let response: Response

      if (typeof pluginData === 'string') {
        response = await fetch('/api/plugins/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: pluginData })
        })
      } else {
        const formData = new FormData()
        formData.append('plugin', pluginData)
        response = await fetch('/api/plugins/install', {
          method: 'POST',
          body: formData
        })
      }

      if (!response.ok) {
        throw new Error(`Installation failed: ${response.statusText}`)
      }

      const result = await response.json()
      await this.loadPlugin(result.path)
    } catch (error) {
      console.error('Plugin installation failed:', error)
      throw error
    }
  }
}

export const pluginManager = new PluginManager()