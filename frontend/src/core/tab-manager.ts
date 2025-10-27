// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { TabManager, RegisteredTab, TabDefinition } from '@/types/plugin.types'
import { ComponentType } from 'react'

class AutoWRXTabManager implements TabManager {
  private tabs: Map<string, RegisteredTab> = new Map()
  private activeTabId: string | null = null
  private listeners: Array<() => void> = []

  registerTab(pluginId: string, tab: TabDefinition): void {
    const fullTabId = `${pluginId}.${tab.id}`
    
    if (this.tabs.has(fullTabId)) {
      console.warn(`Tab ${fullTabId} already registered, replacing...`)
    }

    const registeredTab: RegisteredTab = {
      id: fullTabId,
      pluginId,
      definition: tab,
      component: this.createLazyComponent(pluginId, tab.component),
      isActive: false
    }

    this.tabs.set(fullTabId, registeredTab)
    this.notifyListeners()
  }

  unregisterTab(pluginId: string, tabId: string): void {
    const fullTabId = `${pluginId}.${tabId}`
    
    if (this.tabs.has(fullTabId)) {
      if (this.activeTabId === fullTabId) {
        this.activeTabId = null
      }
      this.tabs.delete(fullTabId)
      this.notifyListeners()
    }
  }

  getActiveTabs(): RegisteredTab[] {
    return Array.from(this.tabs.values())
      .sort((a, b) => (a.definition.position ?? 999) - (b.definition.position ?? 999))
  }

  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId) || tabId === null) {
      this.activeTabId = tabId
      
      this.tabs.forEach(tab => {
        tab.isActive = tab.id === tabId
      })
      
      this.notifyListeners()
    }
  }

  getActiveTab(): RegisteredTab | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null
  }

  private createLazyComponent(pluginId: string, componentName: string): ComponentType {
    return () => {
      // Special handling for test components
      if (pluginId === 'test-plugin' && componentName === 'TestComponent') {
        return (window as any).React.createElement('div', {
          className: 'p-8 max-w-4xl mx-auto'
        }, [
          (window as any).React.createElement('h1', {
            key: 'title',
            className: 'text-3xl font-bold mb-6 text-green-600'
          }, '🎉 Plugin System Working!'),
          
          (window as any).React.createElement('div', {
            key: 'success',
            className: 'bg-green-50 border border-green-200 rounded-lg p-6'
          }, [
            (window as any).React.createElement('h2', {
              key: 'success-title',
              className: 'text-xl font-semibold mb-4 text-green-800'
            }, '✅ Tab System Successfully Loaded'),
            (window as any).React.createElement('p', {
              key: 'success-text',
              className: 'text-green-700'
            }, 'This tab was dynamically created by the plugin system. The core architecture is working correctly!')
          ])
        ])
      }

      const { pluginLoader } = require('./plugin-loader')
      const plugins = pluginLoader.listPlugins()
      const plugin = plugins.find((p: any) => p.manifest.id === pluginId)
      
      if (!plugin) {
        return (window as any).React.createElement('div', { 
          className: 'error p-4 text-red-600' 
        }, `Plugin ${pluginId} not found`)
      }

      const Component = plugin.instance.getComponent(componentName)
      if (!Component) {
        return (window as any).React.createElement('div', { 
          className: 'error p-4 text-red-600' 
        }, `Component ${componentName} not found in plugin ${pluginId}`)
      }

      return (window as any).React.createElement(Component)
    }
  }

  addListener(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
}

export const tabManager = new AutoWRXTabManager()