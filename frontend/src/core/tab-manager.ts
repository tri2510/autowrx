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
      const pluginLoader = require('./plugin-loader').pluginLoader
      const plugins = pluginLoader.listPlugins()
      const plugin = plugins.find(p => p.manifest.id === pluginId)
      
      if (!plugin) {
        return React.createElement('div', { className: 'error' }, `Plugin ${pluginId} not found`)
      }

      const Component = plugin.instance.getComponent(componentName)
      if (!Component) {
        return React.createElement('div', { className: 'error' }, `Component ${componentName} not found in plugin ${pluginId}`)
      }

      return React.createElement(Component)
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