// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { TbServer, TbWifi, TbPlug, TbPlugConnected, TbAlertTriangle, TbCheck, TbRefresh } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'

interface ConnectionStatusPanelProps {
  isKitManagerConnected: boolean
  isRuntimeConnected: boolean
  selectedKit: any
  connectionError: string | null
  onReconnect: () => void
  onRefreshKits: () => void
  isRefreshing: boolean
}

const ConnectionStatusPanel: FC<ConnectionStatusPanelProps> = ({
  isKitManagerConnected,
  isRuntimeConnected,
  selectedKit,
  connectionError,
  onReconnect,
  onRefreshKits,
  isRefreshing
}) => {
  const getStatusColor = (connected: boolean) =>
    connected ? 'text-green-600' : 'text-red-600'

  const getStatusBg = (connected: boolean) =>
    connected ? 'bg-green-100' : 'bg-red-100'

  const getStatusIcon = (connected: boolean) =>
    connected ? <TbCheck className="w-4 h-4" /> : <TbAlertTriangle className="w-4 h-4" />

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TbServer className="w-5 h-5" />
          Connection Status
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={onRefreshKits}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <TbRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={onReconnect}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <TbRefresh className="w-4 h-4" />
            Reconnect
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kit Manager Status */}
        <div className={`p-4 rounded-lg ${getStatusBg(isKitManagerConnected)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={getStatusColor(isKitManagerConnected)}>
                {getStatusIcon(isKitManagerConnected)}
              </div>
              <div>
                <div className="font-medium text-gray-900">Kit Manager</div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <TbWifi className="w-3 h-3" />
                  {isKitManagerConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Edge Runtime Status */}
        <div className={`p-4 rounded-lg ${getStatusBg(isRuntimeConnected)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={getStatusColor(isRuntimeConnected)}>
                {getStatusIcon(isRuntimeConnected)}
              </div>
              <div>
                <div className="font-medium text-gray-900">Vehicle Edge Runtime</div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  {isRuntimeConnected ? (
                    <><TbPlugConnected className="w-3 h-3" /> Connected</>
                  ) : (
                    <><TbPlug className="w-3 h-3" /> Disconnected</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Kit Info */}
      {selectedKit && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">Selected Device</div>
                <div className="text-sm text-gray-600">
                  {selectedKit.name} • {selectedKit.kit_id}
                </div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedKit.is_online
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedKit.is_online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      )}

      {/* Connection Error */}
      {connectionError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <TbAlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-900">Connection Error</div>
              <div className="text-sm text-red-700 mt-1">{connectionError}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectionStatusPanel