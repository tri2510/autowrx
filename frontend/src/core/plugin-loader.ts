// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { PluginLoader, LoadedPlugin, PluginManifest, PluginInstance } from '@/types/plugin.types'

class AutoWRXPluginLoader implements PluginLoader {
  private plugins: Map<string, LoadedPlugin> = new Map()
  private hotReloadWatchers: Map<string, () => void> = new Map()

  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    try {
      const manifestResponse = await fetch(`${pluginPath}/manifest.json`)
      const manifest: PluginManifest = await manifestResponse.json()

      const moduleResponse = await fetch(`${pluginPath}/${manifest.main}`)
      const moduleCode = await moduleResponse.text()
      
      const moduleFunction = new Function('exports', 'require', 'module', moduleCode)
      const moduleExports: any = {}
      const mockModule = { exports: moduleExports }

      moduleFunction.call(moduleExports, moduleExports, this.createMockRequire(), mockModule)

      // Get the exported class from module.exports (set by plugin code)
      const PluginClass = mockModule.exports.default || mockModule.exports
      const instance: PluginInstance = new PluginClass()

      const loadedPlugin: LoadedPlugin = {
        manifest,
        instance,
        status: 'loaded',
        tabs: []
      }

      this.plugins.set(manifest.id, loadedPlugin)
      
      await instance.activate()
      loadedPlugin.status = 'active'

      return loadedPlugin
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error)
      throw error
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    try {
      await plugin.instance.deactivate()
      this.plugins.delete(pluginId)
      
      if (this.hotReloadWatchers.has(pluginId)) {
        this.hotReloadWatchers.get(pluginId)?.()
        this.hotReloadWatchers.delete(pluginId)
      }
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error)
      throw error
    }
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    const pluginPath = `/plugins/${pluginId}`
    await this.unloadPlugin(pluginId)
    await this.loadPlugin(pluginPath)
  }

  listPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  enableHotReload(pluginId: string): void {
    if (this.hotReloadWatchers.has(pluginId)) {
      return
    }

    if (typeof window !== 'undefined' && 'WebSocket' in window) {
      const ws = new WebSocket(`ws://localhost:8080/plugin-reload/${pluginId}`)
      
      ws.onmessage = async (event) => {
        if (event.data === 'reload') {
          console.log(`Hot reloading plugin: ${pluginId}`)
          try {
            await this.reloadPlugin(pluginId)
            console.log(`Plugin ${pluginId} reloaded successfully`)
          } catch (error) {
            console.error(`Failed to hot reload plugin ${pluginId}:`, error)
          }
        }
      }

      const cleanup = () => {
        ws.close()
      }

      this.hotReloadWatchers.set(pluginId, cleanup)
    }
  }

  private createMockRequire() {
    return (moduleId: string) => {
      if (moduleId === 'react') {
        return (window as any).React || require('react')
      }
      if (moduleId === 'react-dom') {
        return (window as any).ReactDOM || require('react-dom')
      }
      
      throw new Error(`Module ${moduleId} not available in plugin context`)
    }
  }
}

// Use window-level singleton to persist across HMR reloads
function getPluginLoaderSingleton(): AutoWRXPluginLoader {
  if (typeof window !== 'undefined') {
    if (!(window as any).__pluginLoader) {
      ;(window as any).__pluginLoader = new AutoWRXPluginLoader()
    }
    return (window as any).__pluginLoader
  }
  // Fallback for SSR
  return new AutoWRXPluginLoader()
}

export const pluginLoader = getPluginLoaderSingleton()