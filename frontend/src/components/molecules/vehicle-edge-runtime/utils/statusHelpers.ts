// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Status utility functions for Vehicle Edge Runtime Dashboard

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'text-green-600'
    case 'stopped':
      return 'text-red-600'
    case 'paused':
      return 'text-yellow-600'
    case 'starting':
      return 'text-blue-600'
    case 'installed':
      return 'text-purple-600'
    case 'error':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export const getStatusBgColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'bg-green-100'
    case 'stopped':
      return 'bg-red-100'
    case 'paused':
      return 'bg-yellow-100'
    case 'starting':
      return 'bg-blue-100'
    case 'installed':
      return 'bg-purple-100'
    case 'error':
      return 'bg-red-100'
    default:
      return 'bg-gray-100'
  }
}

export const getStatusIcon = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'running':
      return '▶️'
    case 'stopped':
      return '⏹️'
    case 'paused':
      return '⏸️'
    case 'starting':
      return '⏳'
    case 'installed':
      return '✅'
    case 'error':
      return '❌'
    default:
      return '⚫'
  }
}

// Add the missing function
export const formatUptime = (uptime: number): string => {
  if (uptime < 60) return `${uptime}s`
  if (uptime < 3600) return `${Math.floor(uptime / 60)}m ${uptime % 60}s`
  if (uptime < 86400) return `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
  return `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h`
}