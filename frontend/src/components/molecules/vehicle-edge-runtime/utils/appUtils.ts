// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import type { VehicleApp } from '@/services/vehicleEdgeRuntimeDirect.service'

// Define RunningApp interface locally to avoid circular dependency
export interface RunningApp {
  id: string
  name: string
  type: 'python' | 'binary'
  status: 'running' | 'stopped' | 'error'
  startTime?: Date
  resources: {
    cpu: number
    memory: number
  }
  consoleOutput: string[]
}

// App transformation and utility functions

export const convertToRunningApp = (app: VehicleApp | any): RunningApp => {
  return {
    id: app.id || app.app_id || '',
    name: app.name || 'Unknown App',
    type: app.type || 'python',
    status: app.status || 'stopped',
    startTime: app.created_at ? new Date(app.created_at) : undefined,
    resources: {
      cpu: app.resources?.cpu || 0,
      memory: app.resources?.memory || 0
    },
    consoleOutput: []
  }
}

export const convertToExtendedVehicleApp = (app: any): VehicleApp & { lastStatusUpdate?: string } => {
  return {
    id: app.id || app.app_id || '',
    name: app.name || 'Unknown App',
    version: app.version || '1.0.0',
    type: app.type || 'python',
    status: app.status || 'installed',
    created_at: app.created_at || new Date().toISOString(),
    lastStatusUpdate: app.lastStatusUpdate || new Date().toISOString()
  }
}

export const generateAppId = (name: string): string => {
  return `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
}

export const validateAppName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= 50
}

export const formatUptime = (uptime: number): string => {
  if (uptime < 60) return `${uptime}s`
  if (uptime < 3600) return `${Math.floor(uptime / 60)}m ${uptime % 60}s`
  if (uptime < 86400) return `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
  return `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h`
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}