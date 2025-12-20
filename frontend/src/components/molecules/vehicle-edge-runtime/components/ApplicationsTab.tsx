// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useRef, useEffect } from 'react'
import {
  TbCode,
  TbBinary,
  TbTerminal,
  TbPlayerPlay,
  TbPlayerStop,
  TbPlayerPause,
  TbRefresh,
  TbTrash,
  TbLoader,
  TbActivity,
  TbDownload,
  TbClock,
  TbChevronDown,
  TbChevronRight,
  TbEye,
  TbEyeOff,
  TbSquare
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { VehicleApp, RuntimeState } from '@/services/vehicleEdgeRuntimeDirect.service'
import { VehicleEdgeRuntimeKit } from '@/services/kitManager.service'
import { useMultiAppConsole } from '../hooks/useMultiAppConsole'

interface ApplicationsTabProps {
  selectedKit: VehicleEdgeRuntimeKit | null
  isRuntimeConnected: boolean
  connectionError: string | null
  vehicleApps: VehicleApp[]
  runtimeState: RuntimeState | null
  isRefreshingApps: boolean
  onRefreshApps: () => void
  onStartApp: (appId: string) => Promise<void>
  onStopApp: (appId: string) => Promise<void>
  onPauseApp: (appId: string) => Promise<void>
  onResumeApp: (appId: string) => Promise<void>
  onRestartApp: (appId: string) => Promise<void>
  onUninstallApp: (appId: string) => Promise<void>
  onViewConsole: (app: VehicleApp) => void
  onDeployNewApp: () => void
  onSelectTab: (tab: string) => void
}

const ApplicationsTab: FC<ApplicationsTabProps> = ({
  selectedKit,
  isRuntimeConnected,
  connectionError,
  vehicleApps,
  runtimeState,
  isRefreshingApps,
  onRefreshApps,
  onStartApp,
  onStopApp,
  onPauseApp,
  onResumeApp,
  onRestartApp,
  onUninstallApp,
  onViewConsole,
  onDeployNewApp,
  onSelectTab
}) => {
  const {
    appConsoleStates,
    expandedApps,
    toggleAppConsole,
    getAppMessages,
    clearAppConsole
  } = useMultiAppConsole()

  const consoleEndRefs = useRef<{ [appId: string]: HTMLDivElement | null }>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'stopped':
        return 'text-gray-600 bg-gray-100'
      case 'paused':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'starting':
        return 'text-blue-600 bg-blue-100'
      case 'installed':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <TbSquare className="w-3 h-3" />
      case 'stopped':
        return <TbPlayerStop className="w-3 h-3" />
      case 'paused':
        return <TbPlayerPause className="w-3 h-3" />
      case 'error':
        return <TbTrash className="w-3 h-3" />
      case 'starting':
        return <TbLoader className="w-3 h-3" />
      case 'installed':
        return <TbDownload className="w-3 h-3" />
      default:
        return <TbSquare className="w-3 h-3" />
    }
  }

  
  const formatConsoleMessage = (message: any) => {
    const timestamp = new Date(message.timestamp).toLocaleTimeString()
    
    return (
      <div key={message.id} className="mb-1">
        <span className="text-gray-500">[{timestamp}]</span>{' '}
        <span className={
          // Color coding based on content and message type
          message.type === 'stderr' ? 'text-red-400' :
          message.type === 'system' ? 'text-yellow-400' :
          message.output.includes('🚀') ? 'text-blue-400' :
          message.output.includes('✅') ? 'text-green-400' :
          message.output.includes('❌') || message.output.includes('⚠️') ? 'text-yellow-400' :
          message.output.includes('📦') || message.output.includes('📝') ? 'text-blue-300' :
          message.output.includes('📤') ? 'text-cyan-400' :
          'text-green-300'
        }>{message.output}</span>
      </div>
    )
  }

  if (!selectedKit) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <TbCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Runtime Selected</h3>
        <p className="text-muted-foreground mb-6">
          Please select a Vehicle Edge Runtime from the header to view applications.
        </p>
      </div>
    )
  }

  if (!isRuntimeConnected) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <TbCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Runtime Not Connected</h3>
        <p className="text-muted-foreground mb-6">
          {connectionError || 'Failed to connect to Vehicle Edge Runtime'}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="mx-auto"
        >
          <TbRefresh className="w-4 h-4 mr-2" />
          Reconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">Applications ({vehicleApps.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshApps}
              disabled={isRefreshingApps}
              title="Refresh applications list"
            >
              <TbRefresh className={`w-4 h-4 mr-1 ${isRefreshingApps ? 'animate-spin' : ''}`} />
              {isRefreshingApps ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {runtimeState && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Runtime: {runtimeState.status}</span>
              <span>Apps: {runtimeState.runningApplications?.length || 0}</span>
              <span>Uptime: {Math.floor(runtimeState.uptime / 60)}m</span>
            </div>
          )}
        </div>

        <div className="divide-y divide-border">
          {vehicleApps.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <TbCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No applications deployed yet</p>
              <Button onClick={onDeployNewApp} className="mt-4">
                Deploy First Application
              </Button>
            </div>
          ) : (
            vehicleApps.map((app) => (
              <div key={app.id} className="border-b border-border last:border-b-0">
                {/* App Header Row */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${app.type === 'python' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {app.type === 'python' ? <TbCode className="w-5 h-5" /> : <TbBinary className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-foreground">{app.name}</h4>
                          <button
                            onClick={() => toggleAppConsole(app.id)}
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {expandedApps.has(app.id) ? (
                              <>
                                <TbEyeOff className="w-4 h-4" />
                                <span>Hide Console</span>
                              </>
                            ) : (
                              <>
                                <TbTerminal className="w-4 h-4" />
                                <span>View Console</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>Type: {app.type}</span>
                          <span>Version: {app.version}</span>
                          {app.created_at && <span>Created: {new Date(app.created_at).toLocaleString()}</span>}
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            <span>{app.status}</span>
                          </div>
                          {app.lastStatusUpdate && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <TbClock className="w-3 h-3" />
                              <span>Updated: {new Date(app.lastStatusUpdate).toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        {app.vehicle_signals && app.vehicle_signals.length > 0 && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <TbActivity className="w-3 h-3" />
                            <span>{app.vehicle_signals.length} signals</span>
                          </div>
                        )}
                        {app.python_deps && app.python_deps.length > 0 && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <TbDownload className="w-3 h-3" />
                            <span>{app.python_deps.length} deps</span>
                          </div>
                        )}
                      </div>

                      {/* Start button - for stopped, installed, and error apps */}
                      {(app.status === 'stopped' || app.status === 'installed' || app.status === 'error') && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onStartApp(app.id)}
                          title={`Start ${app.status} Application`}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <TbPlayerPlay className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Resume button - for paused apps */}
                      {app.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onResumeApp(app.id)}
                          title="Resume Application"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <TbPlayerPlay className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Pause button - for running apps */}
                      {app.status === 'running' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onPauseApp(app.id)}
                          title="Pause Application"
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <TbPlayerPause className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Restart button - for running and paused apps */}
                      {(app.status === 'running' || app.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onRestartApp(app.id)}
                          title="Restart Application"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <TbRefresh className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Stop button - for running and paused apps */}
                      {(app.status === 'running' || app.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onStopApp(app.id)}
                          title="Stop Application"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TbPlayerStop className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Uninstall/Remove button - for all apps except starting */}
                      {app.status !== 'starting' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUninstallApp(app.id)}
                          title="Uninstall Application"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <TbTrash className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Disabled indicator for starting apps */}
                      {app.status === 'starting' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          title="Application is starting..."
                          className="opacity-50 cursor-not-allowed"
                        >
                          <TbLoader className="w-4 h-4 animate-spin" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Console Section */}
                  {expandedApps.has(app.id) && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-foreground flex items-center space-x-2">
                          <TbTerminal className="w-4 h-4" />
                          <span>Console Output - {app.name}</span>
                          {appConsoleStates[app.id]?.isSubscribed ? (
                            <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">Connected</span>
                          ) : (
                            <span className="text-xs text-yellow-500 bg-yellow-100 px-2 py-1 rounded-full">Connecting...</span>
                          )}
                        </h5>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearAppConsole(app.id)}
                          >
                            <TbTrash className="w-4 h-4 mr-1" />
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      {getAppMessages(app.id).length === 0 ? (
                        <div className="text-center py-8 bg-gray-900 rounded-lg">
                          <TbTerminal className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Connecting to console...</p>
                          <p className="text-gray-500 text-xs mt-1">Output will appear here once the console is connected</p>
                        </div>
                      ) : (
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                          {getAppMessages(app.id).map(message => formatConsoleMessage(message))}
                          <div ref={el => consoleEndRefs.current[app.id] = el} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicationsTab