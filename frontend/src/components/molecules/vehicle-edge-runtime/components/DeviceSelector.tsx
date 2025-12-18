// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { TbDeviceDesktop, TbWifi, TbWifiOff, TbRefresh, TbFilter } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import type { VehicleEdgeRuntimeKit } from '@/services/kitManager.service'

interface DeviceSelectorProps {
  kits: VehicleEdgeRuntimeKit[]
  selectedKit: VehicleEdgeRuntimeKit | null
  showOfflineDevices: boolean
  isRefreshing: boolean
  onSelectKit: (kit: VehicleEdgeRuntimeKit) => void
  onToggleShowOffline: () => void
  onRefresh: () => void
}

const DeviceSelector: FC<DeviceSelectorProps> = ({
  kits,
  selectedKit,
  showOfflineDevices,
  isRefreshing,
  onSelectKit,
  onToggleShowOffline,
  onRefresh
}) => {
  const filteredKits = showOfflineDevices ? kits : kits.filter(kit => kit.is_online)
  const onlineKits = kits.filter(kit => kit.is_online)
  const offlineKits = kits.filter(kit => !kit.is_online)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TbDeviceDesktop className="w-5 h-5" />
          Vehicle Edge Devices
          <span className="text-sm font-normal text-gray-500">
            ({onlineKits.length} online, {offlineKits.length} offline)
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleShowOffline}
            variant={showOfflineDevices ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
          >
            <TbFilter className="w-4 h-4" />
            {showOfflineDevices ? 'Hide Offline' : 'Show Offline'}
          </Button>
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <TbRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {filteredKits.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {showOfflineDevices ? (
              <TbWifiOff className="w-8 h-8 text-gray-400" />
            ) : (
              <TbWifi className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {showOfflineDevices ? 'No Devices Found' : 'No Online Devices'}
          </h3>
          <p className="text-gray-600 mb-4">
            {showOfflineDevices
              ? 'No vehicle edge devices have been discovered yet.'
              : 'No online devices available. Connect a device to get started.'
            }
          </p>
          {showOfflineDevices && onlineKits.length > 0 && (
            <Button
              onClick={onToggleShowOffline}
              variant="outline"
              className="flex items-center gap-1 mx-auto"
            >
              <TbWifi className="w-4 h-4" />
              Show Online Devices ({onlineKits.length})
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map((kit) => (
            <div
              key={kit.kit_id}
              onClick={() => onSelectKit(kit)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedKit?.kit_id === kit.kit_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!kit.is_online ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    kit.is_online ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <h4 className="font-medium text-gray-900">{kit.name}</h4>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  kit.is_online
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {kit.is_online ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">ID:</span> {kit.kit_id}
                </div>
                {kit.description && (
                  <div>
                    <span className="font-medium">Description:</span> {kit.description}
                  </div>
                )}
                {kit.last_seen && (
                  <div>
                    <span className="font-medium">Last Seen:</span>{' '}
                    {new Date(kit.last_seen).toLocaleString()}
                  </div>
                )}
                {kit.description && (
                  <div className="text-xs text-gray-500 mt-2">
                    {kit.description}
                  </div>
                )}
              </div>

              {selectedKit?.kit_id === kit.kit_id && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-blue-700 font-medium">
                    ✓ Selected Device
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Device Selection Info */}
      {selectedKit && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TbDeviceDesktop className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Selected Device</div>
                <div className="text-sm text-blue-700">
                  {selectedKit.name} • {selectedKit.kit_id}
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedKit.is_online
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedKit.is_online ? 'Ready for Deployment' : 'Device Offline'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeviceSelector