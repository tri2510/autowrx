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
import { LoadedPlugin } from '@/types/plugin.types'

class PluginManager {
  private initialized = false

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
    const userPlugins = [
      '/plugins/demo-plugin',
      '/plugins/vehicle-monitor', 
      '/plugins/my-first-plugin'
    ]

    console.log(`🔍 Starting to load ${userPlugins.length} user plugins...`)
    let loadedCount = 0
    let errorCount = 0

    for (const pluginPath of userPlugins) {
      try {
        console.log(`📦 Loading user plugin: ${pluginPath}`)
        await this.loadPlugin(pluginPath)
        loadedCount++
        console.log(`✅ User plugin loaded: ${pluginPath}`)
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to load user plugin ${pluginPath}:`, error)
        if (error instanceof Error) {
          console.error(`   Error details: ${error.message}`)
          console.error(`   Stack trace:`, error.stack)
        }
      }
    }

    console.log(`📊 Plugin loading summary: ${loadedCount} loaded, ${errorCount} failed`)
    
    // Store plugin count for debugging
    if (typeof window !== 'undefined') {
      (window as any).pluginLoadStatus = { loaded: loadedCount, failed: errorCount, total: userPlugins.length }
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