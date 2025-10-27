// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { AutoWRXPluginAPI, TabDefinition, VehicleData, DialogOptions } from '@/types/plugin.types'
import { tabManager } from './tab-manager'

class AutoWRXPluginAPIImpl implements AutoWRXPluginAPI {
  private currentPluginId: string = ''

  setCurrentPlugin(pluginId: string): void {
    this.currentPluginId = pluginId
  }

  registerTab(tab: TabDefinition): void {
    if (!this.currentPluginId) {
      throw new Error('No active plugin context')
    }
    tabManager.registerTab(this.currentPluginId, tab)
  }

  unregisterTab(tabId: string): void {
    if (!this.currentPluginId) {
      throw new Error('No active plugin context')
    }
    tabManager.unregisterTab(this.currentPluginId, tabId)
  }

  navigate(path: string): void {
    if (typeof window !== 'undefined' && (window as any).reactNavigate) {
      (window as any).reactNavigate(path)
    } else {
      console.warn('Navigation not available in current context')
    }
  }

  getCurrentPath(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }
    return '/'
  }

  getGlobalState(): any {
    if (typeof window !== 'undefined' && (window as any).autoWRXGlobalState) {
      return (window as any).autoWRXGlobalState
    }
    return {}
  }

  setGlobalState(key: string, value: any): void {
    if (typeof window !== 'undefined') {
      if (!(window as any).autoWRXGlobalState) {
        (window as any).autoWRXGlobalState = {}
      }
      (window as any).autoWRXGlobalState[key] = value
    }
  }

  getVehicleData(): VehicleData {
    const globalState = this.getGlobalState()
    return {
      signals: globalState.vehicleSignals || {},
      apis: globalState.vehicleApis || [],
      model: globalState.currentModel || globalState.vehicleModel || null
    }
  }

  subscribeToVehicleUpdates(callback: (data: VehicleData) => void): void {
    if (typeof window !== 'undefined') {
      if (!(window as any).vehicleUpdateCallbacks) {
        (window as any).vehicleUpdateCallbacks = []
      }
      (window as any).vehicleUpdateCallbacks.push(callback)
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    if (typeof window !== 'undefined' && (window as any).reactToast) {
      (window as any).reactToast({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: message,
        variant: type === 'error' ? 'destructive' : 'default'
      })
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`)
    }
  }

  async showDialog(options: DialogOptions): Promise<boolean> {
    if (typeof window !== 'undefined') {
      return window.confirm(`${options.title}\n\n${options.message}`)
    }
    return false
  }

  async getStorage(key: string): Promise<any> {
    const storageKey = `plugin_${this.currentPluginId}_${key}`
    try {
      const value = localStorage.getItem(storageKey)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  async setStorage(key: string, value: any): Promise<void> {
    const storageKey = `plugin_${this.currentPluginId}_${key}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set plugin storage:', error)
    }
  }
}

export const pluginAPI = new AutoWRXPluginAPIImpl()