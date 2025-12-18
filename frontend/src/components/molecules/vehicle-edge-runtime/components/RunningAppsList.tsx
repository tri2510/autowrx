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
  TbSquare,
  TbTrash,
  Terminal,
  Eye,
  Loader,
  Clock,
  Cpu,
  Memory
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import type { VehicleApp } from '@/services/vehicleEdgeRuntimeDirect.service'
import { getStatusColor, getStatusBg, getStatusIcon, formatUptime } from '../utils'

interface RunningAppsListProps {
  apps: VehicleApp[]
  isRefreshing: boolean
  onStartApp: (appId: string) => void
  onStopApp: (appId: string) => void
  onPauseApp: (appId: string) => void
  onResumeApp: (appId: string) => void
  onUninstallApp: (appId: string) => void
  onViewConsole: (app: VehicleApp) => void
  onRefresh: () => void
}

const RunningAppsList: FC<RunningAppsListProps> = ({
  apps,
  isRefreshing,
  onStartApp,
  onStopApp,
  onPauseApp,
  onResumeApp,
  onUninstallApp,
  onViewConsole,
  onRefresh
}) => {
  const getStatusActions = (status: string, appId: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return (
          <>
            <Button
              onClick={() => onStopApp(appId)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <TbPlayerStop className="w-4 h-4" />
              Stop
            </Button>
            <Button
              onClick={() => onPauseApp(appId)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <TbPlayerPause className="w-4 h-4" />
              Pause
            </Button>
          </>
        )
      case 'stopped':
        return (
          <>
            <Button
              onClick={() => onStartApp(appId)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <TbPlayerPlay className="w-4 h-4" />
              Start
            </Button>
            <Button
              onClick={() => onUninstallApp(appId)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <TbTrash className="w-4 h-4" />
              Uninstall
            </Button>
          </>
        )
      case 'paused':
        return (
          <>
            <Button
              onClick={() => onResumeApp(appId)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <TbSquare className="w-4 h-4" />
              Resume
            </Button>
          </>
        )
      default:
        return (
          <Button
            onClick={() => onStartApp(appId)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <TbPlayerPlay className="w-4 h-4" />
            Start
          </Button>
        )
    }
  }

  if (apps.length === 0 && !isRefreshing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Terminal className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Deployed</h3>
          <p className="text-gray-600 mb-4">
            Get started by deploying your first vehicle edge application.
          </p>
          <Button onClick={onRefresh} variant="outline" className="flex items-center gap-1 mx-auto">
            <TbPlayerPlay className="w-4 h-4" />
            Deploy App
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Running Applications
          <span className="text-sm font-normal text-gray-500">
            ({apps.length} total)
          </span>
        </h3>
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          {isRefreshing ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <TbPlayerStop className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {apps.map((app) => (
          <div
            key={app.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full ${
                    app.status === 'running' ? 'bg-green-500' :
                    app.status === 'stopped' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <h4 className="text-base font-medium text-gray-900 truncate">
                    {app.name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(app.status)} ${getStatusColor(app.status)}`}>
                    <span className="mr-1">{getStatusIcon(app.status)}</span>
                    {app.status}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {app.type}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Version: {app.version}
                    </span>
                    {app.created_at && (
                      <span className="flex items-center gap-1">
                        <TbPlayerPlay className="w-3 h-3" />
                        Created: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {app.description && (
                  <p className="text-sm text-gray-600 mb-3">{app.description}</p>
                )}

                {/* Resource Usage */}
                {(app.status === 'running' || app.executionId) && (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      CPU: 0%
                    </span>
                    <span className="flex items-center gap-1">
                      <Memory className="w-3 h-3" />
                      Memory: 128MB
                    </span>
                    {app.executionId && (
                      <span className="text-xs text-gray-400">
                        ID: {app.executionId.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="flex items-center gap-2">
                  {getStatusActions(app.status, app.id)}
                </div>
                <Button
                  onClick={() => onViewConsole(app)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Console
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RunningAppsList