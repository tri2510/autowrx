// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ComponentType } from 'react'

export interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  id: string
  summary?: string
  tags?: string[]
  
  tabs: TabDefinition[]
  activationEvents: string[]
  permissions: string[]
  main: string
  dependencies?: Record<string, string>
}

export interface TabDefinition {
  id: string
  label: string
  icon?: string
  path: string
  component: string
  position?: number
  permissions?: string[]
}

export interface RegisteredTab {
  id: string
  pluginId: string
  definition: TabDefinition
  component: ComponentType
  isActive: boolean
}

export interface LoadedPlugin {
  manifest: PluginManifest
  instance: PluginInstance
  status: 'loaded' | 'active' | 'error' | 'disabled'
  tabs: RegisteredTab[]
  baseUrl: string
}

export interface PluginInstance {
  activate(): Promise<void>
  deactivate(): Promise<void>
  getComponent(componentName: string): ComponentType | null
}

export interface VehicleData {
  signals: Record<string, any>
  apis: any[]
  model: any
}

export interface DialogOptions {
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'question'
  buttons?: string[]
}

export interface AutoWRXPluginAPI {
  registerTab(tab: TabDefinition): void
  unregisterTab(tabId: string): void
  
  navigate(path: string): void
  getCurrentPath(): string
  
  getGlobalState(): any
  setGlobalState(key: string, value: any): void
  
  getVehicleData(): VehicleData
  subscribeToVehicleUpdates(callback: (data: VehicleData) => void): void
  
  showToast(message: string, type?: 'success' | 'error' | 'info'): void
  showDialog(options: DialogOptions): Promise<boolean>
  
  getStorage(key: string): Promise<any>
  setStorage(key: string, value: any): Promise<void>
}

export interface PluginLoader {
  loadPlugin(pluginPath: string): Promise<LoadedPlugin>
  unloadPlugin(pluginId: string): Promise<void>
  reloadPlugin(pluginId: string): Promise<void>
  listPlugins(): LoadedPlugin[]
  enableHotReload(pluginId: string): void
}

export interface TabManager {
  registerTab(pluginId: string, tab: TabDefinition): void
  unregisterTab(pluginId: string, tabId: string): void
  getActiveTabs(): RegisteredTab[]
  setActiveTab(tabId: string): void
  getActiveTab(): RegisteredTab | null
}
