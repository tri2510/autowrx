// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { PluginLoader, LoadedPlugin, PluginManifest, PluginInstance } from '@/types/plugin.types'

interface BundleOptions {
  baseUrl: string
  source?: 'local' | 'registry'
  bundleUrl?: string
}

class AutoWRXPluginLoader implements PluginLoader {
  private plugins: Map<string, LoadedPlugin> = new Map()
  private hotReloadWatchers: Map<string, () => void> = new Map()

  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    try {
      const manifestResponse = await fetch(`${pluginPath}/manifest.json`)
      const manifest: PluginManifest = await manifestResponse.json()

      const moduleResponse = await fetch(`${pluginPath}/${manifest.main}`)
      const moduleCode = await moduleResponse.text()

      return this.loadPluginFromBundle(manifest, moduleCode, {
        baseUrl: pluginPath,
        source: 'local'
      })
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error)
      throw error
    }
  }

  async loadPluginFromBundle(manifest: PluginManifest, bundleCode: string, options: BundleOptions): Promise<LoadedPlugin> {
    const pluginId = manifest.id
    try {
      const instance = this.instantiatePlugin(bundleCode)
      const loadedPlugin: LoadedPlugin = {
        manifest,
        instance,
        status: 'loaded',
        tabs: [],
        baseUrl: options.baseUrl,
        source: options.source,
        bundleUrl: options.bundleUrl
      }

      this.plugins.set(pluginId, loadedPlugin)

      await instance.activate()
      loadedPlugin.status = 'active'

      return loadedPlugin
    } catch (error) {
      console.error(`Failed to load plugin bundle for ${pluginId}:`, error)
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

    const pluginPath = plugin.baseUrl
    const source = plugin.source || 'local'

    await this.unloadPlugin(pluginId)

    if (source === 'local') {
      await this.loadPlugin(pluginPath)
    } else {
      if (!plugin.bundleUrl) {
        throw new Error(`Cannot reload registry plugin ${pluginId}: missing bundle URL`)
      }
      const bundleResponse = await fetch(plugin.bundleUrl)
      const bundleCode = await bundleResponse.text()
      await this.loadPluginFromBundle(plugin.manifest, bundleCode, {
        baseUrl: pluginPath,
        source: 'registry',
        bundleUrl: plugin.bundleUrl
      })
    }
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

  private instantiatePlugin(bundleCode: string): PluginInstance {
    const moduleFunction = new Function('exports', 'require', 'module', bundleCode)
    const moduleExports: any = {}
    const mockModule = { exports: moduleExports }

    moduleFunction.call(moduleExports, moduleExports, this.createMockRequire(), mockModule)

    const PluginClass = mockModule.exports.default || mockModule.exports
    return new PluginClass()
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
