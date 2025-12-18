// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import {
  TbPlayerPlay,
  TbPlayerStop,
  TbPlayerPause,
  TbPlayerTrackNext,
  TbRefresh,
  TbTerminal,
  TbLoader,
  TbInfo,
  TbCheck,
  TbX,
  TbAlertTriangle,
  TbClock
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import type { VehicleApp } from '@/services/vehicleEdgeRuntimeDirect.service'

interface AppLifecycleControlPanelProps {
  apps: VehicleApp[]
  isRefreshing: boolean
  onStartApp: (appId: string) => Promise<void>
  onStopApp: (appId: string) => Promise<void>
  onRestartApp: (appId: string) => Promise<void>
  onPauseApp: (appId: string) => Promise<void>
  onResumeApp: (appId: string) => Promise<void>
  onRefresh: () => void
  onViewConsole: (app: VehicleApp) => void
}

const AppLifecycleControlPanel: FC<AppLifecycleControlPanelProps> = ({
  apps,
  isRefreshing,
  onStartApp,
  onStopApp,
  onRestartApp,
  onPauseApp,
  onResumeApp,
  onRefresh,
  onViewConsole
}) => {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <TbCheck className="w-4 h-4 text-green-600" />
      case 'stopped':
      case 'installed':
        return <TbX className="w-4 h-4 text-red-600" />
      case 'paused':
        return <TbPlayerPause className="w-4 h-4 text-yellow-600" />
      case 'starting':
      case 'stopping':
        return <TbLoader className="w-4 h-4 text-blue-600 animate-spin" />
      case 'error':
        return <TbAlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <TbInfo className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'stopped':
      case 'installed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'starting':
      case 'stopping':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailableActions = (app: VehicleApp) => {
    const actions = []

    switch (app.status.toLowerCase()) {
      case 'running':
        actions.push(
          { action: 'stop', label: 'Stop', icon: TbPlayerStop, variant: 'destructive' as const },
          { action: 'pause', label: 'Pause', icon: TbPlayerPause, variant: 'outline' as const },
          { action: 'restart', label: 'Restart', icon: TbPlayerTrackNext, variant: 'outline' as const }
        )
        break
      case 'stopped':
      case 'installed':
        actions.push(
          { action: 'start', label: 'Start', icon: TbPlayerPlay, variant: 'default' as const }
        )
        break
      case 'paused':
        actions.push(
          { action: 'resume', label: 'Resume', icon: TbPlayerPlay, variant: 'default' as const },
          { action: 'stop', label: 'Stop', icon: TbPlayerStop, variant: 'destructive' as const }
        )
        break
      case 'starting':
      case 'stopping':
        // No actions available during transitions
        break
      case 'error':
        actions.push(
          { action: 'start', label: 'Start', icon: TbPlayerPlay, variant: 'default' as const },
          { action: 'stop', label: 'Stop', icon: TbPlayerStop, variant: 'destructive' as const }
        )
        break
      default:
        actions.push(
          { action: 'start', label: 'Start', icon: TbPlayerPlay, variant: 'default' as const },
          { action: 'stop', label: 'Stop', icon: TbPlayerStop, variant: 'destructive' as const }
        )
    }

    return actions
  }

  const handleAction = async (action: string, appId: string) => {
    try {
      switch (action) {
        case 'start':
          await onStartApp(appId)
          break
        case 'stop':
          await onStopApp(appId)
          break
        case 'restart':
          await onRestartApp(appId)
          break
        case 'pause':
          await onPauseApp(appId)
          break
        case 'resume':
          await onResumeApp(appId)
          break
        default:
          console.warn('Unknown action:', action)
      }
    } catch (error) {
      console.error(`Failed to ${action} app ${appId}:`, error)
    }
  }

  const formatDuration = (created_at: string) => {
    const created = new Date(created_at)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else {
      const diffHours = Math.floor(diffMins / 60)
      return `${diffHours}h${diffMins % 60 > 0 ? ` ${diffMins % 60}m` : ''} ago`
    }
  }

  if (apps.length === 0 && !isRefreshing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TbTerminal className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Running</h3>
          <p className="text-gray-600 mb-6">
            Deploy your first application to see it here.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={onRefresh} variant="outline" disabled={isRefreshing}>
              {isRefreshing ? (
                <TbLoader className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TbRefresh className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Application Lifecycle Control</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {apps.length} apps
            </span>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <TbLoader className="w-4 h-4 animate-spin" />
            ) : (
              <TbRefresh className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Apps List */}
      <div className="divide-y divide-gray-200">
        {apps.map((app) => (
          <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              {/* App Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900 truncate">{app.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                    <span className="mr-1">{getStatusIcon(app.status)}</span>
                    {app.status}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {app.type}
                  </span>
                  {app.version && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      v{app.version}
                    </span>
                  )}
                </div>

                {/* App Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    {app.created_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TbClock className="w-3 h-3" />
                        <span>Created: {formatDuration(app.created_at)}</span>
                      </div>
                    )}
                    {app.executionId && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Execution ID:</span>
                        <code className="ml-1 text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {app.executionId.substring(0, 12)}...
                        </code>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {app.python_deps && app.python_deps.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Dependencies:</span> {app.python_deps.length}
                      </div>
                    )}
                    {app.vehicle_signals && app.vehicle_signals.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Vehicle Signals:</span> {app.vehicle_signals.length}
                      </div>
                    )}
                  </div>
                </div>

                {app.description && (
                  <p className="text-sm text-gray-600 mb-4">{app.description}</p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {getAvailableActions(app).map(({ action, label, icon: Icon, variant }) => (
                    <Button
                      key={action}
                      onClick={() => handleAction(action, app.id)}
                      variant={variant}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </Button>
                  ))}

                  <div className="ml-2 border-l border-gray-300 pl-2">
                    <Button
                      onClick={() => onViewConsole(app)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      <TbTerminal className="w-3 h-3" />
                      Console
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Quick Actions:</span> Start, Stop, Restart, Pause, Resume applications
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Running
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Stopped
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Paused
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLifecycleControlPanel