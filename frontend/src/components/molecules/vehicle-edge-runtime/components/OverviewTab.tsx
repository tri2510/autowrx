// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import {
  TbAlertTriangle,
  TbPlugConnected,
  TbPlug,
  TbRefresh,
  TbPlus,
  TbWifi,
  TbTool,
  TbDeviceDesktop,
  TbActivity,
  TbRocket,
  TbServer,
  TbCheck,
  TbX
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { VehicleEdgeRuntimeKit } from '@/services/kitManager.service'

interface OverviewTabProps {
  // Connection State
  connectionError: string | null
  isConnected: boolean
  isKitManagerConnected: boolean
  
  // Kit Management
  kits: VehicleEdgeRuntimeKit[]
  selectedKit: VehicleEdgeRuntimeKit | null
  showOfflineDevices: boolean
  autoRefreshEnabled: boolean
  lastRefreshTime: Date | null
  
  // Actions
  onRefreshKits: () => void
  onToggleAutoRefresh: () => void
  onToggleShowOfflineDevices: () => void
  onReconnect: () => void
  onShowSetupWizard: () => void
  onSelectKit: (kit: VehicleEdgeRuntimeKit) => void
  
  // Runtime State
  runningAppsCount: number
  subscribersCount: number
}

const OverviewTab: FC<OverviewTabProps> = ({
  connectionError,
  isConnected,
  isKitManagerConnected,
  kits,
  selectedKit,
  showOfflineDevices,
  autoRefreshEnabled,
  lastRefreshTime,
  onRefreshKits,
  onToggleAutoRefresh,
  onToggleShowOfflineDevices,
  onReconnect,
  onShowSetupWizard,
  onSelectKit,
  runningAppsCount,
  subscribersCount
}) => {
  const getStatusColor = (status: 'online' | 'offline') => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100'
      case 'offline':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getStatusIcon = (status: 'online' | 'offline') => {
    switch (status) {
      case 'online':
        return <TbCheck className="w-3 h-3" />
      case 'offline':
        return <TbX className="w-3 h-3" />
      default:
        return <TbAlertTriangle className="w-3 h-3" />
    }
  }

  const filteredKits = showOfflineDevices 
    ? kits 
    : kits.filter(kit => kit.is_online)

  return (
    <div className="space-y-6">
      {/* Connection Status Message */}
      {connectionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center space-x-2">
            <TbAlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">Kit-Manager Connection Failed</h4>
              <p className="text-sm text-red-700">
                The Vehicle Edge Runtime service cannot connect to the kit-manager service on port 3090.
                Please ensure the kit-manager Docker container is running: <code className="bg-red-100 px-1 rounded">docker ps | grep kit-manager</code>
              </p>
              <p className="text-sm text-red-600 mt-1">
                Error: {connectionError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Device Status Message */}
      {!connectionError && isKitManagerConnected && selectedKit && !selectedKit.is_online && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center space-x-2">
            <TbAlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">Vehicle Edge Runtime Device Offline</h4>
              <p className="text-sm text-yellow-700">
                The selected Vehicle Edge Runtime device (<strong>{selectedKit.name}</strong>) is currently offline.
                Please ensure the device is powered on and connected to the network.
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                Kit ID: {selectedKit.kit_id} | Last seen: {selectedKit.last_seen ? new Date(selectedKit.last_seen).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Runtime Selection */}
      <div className="rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Vehicle Edge Runtimes {isConnected ? <TbPlugConnected className="w-5 h-5 text-green-500 ml-2" /> : <TbPlug className="w-5 h-5 text-yellow-500 ml-2" />}
            {lastRefreshTime && (
              <span className="text-sm text-muted-foreground ml-2">
                Last refresh: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onRefreshKits}
              variant="outline"
              size="sm"
              title="Refresh kits"
            >
              <TbRefresh className="w-4 h-4" />
            </Button>
            <Button
              onClick={onToggleAutoRefresh}
              variant={autoRefreshEnabled ? "default" : "outline"}
              size="sm"
              title={autoRefreshEnabled ? "Disable auto-refresh" : "Enable auto-refresh"}
            >
              {autoRefreshEnabled ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button
              onClick={onToggleShowOfflineDevices}
              variant={showOfflineDevices ? "default" : "outline"}
              size="sm"
              title={showOfflineDevices ? "Hide offline devices" : "Show offline devices"}
            >
              {showOfflineDevices ? "Show All" : "Online Only"}
            </Button>
            {connectionError && (
              <Button
                onClick={onReconnect}
                variant="outline"
                size="sm"
                title="Reconnect to Kit Manager"
              >
                Reconnect
              </Button>
            )}
            <Button
              onClick={onShowSetupWizard}
              className="flex items-center space-x-2"
            >
              <TbPlus className="w-4 h-4" />
              <span>Add Device</span>
            </Button>
          </div>
        </div>

        {connectionError ? (
          <div className="text-center py-12">
            <TbAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{connectionError}</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Make sure the Vehicle Edge Runtime is running on port 3090
              </p>
              <Button
                onClick={onRefreshKits}
                className="mx-auto"
              >
                <TbRefresh className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="text-center py-12">
            <TbWifi className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {showOfflineDevices ? "No Vehicle Edge Runtimes Connected" : "No Online Vehicle Edge Runtimes"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {showOfflineDevices
                ? "Get started by adding your first Vehicle Edge Runtime device. Our setup wizard will guide you through the entire process."
                : "All connected devices are currently offline. Click 'Show All' to view offline devices or add new devices."
              }
            </p>
            <div className="space-y-3 max-w-sm mx-auto">
              <Button
                onClick={onShowSetupWizard}
                className="w-full flex items-center justify-center space-x-2"
              >
                <TbTool className="w-5 h-5" />
                <span>Setup Your First Device</span>
              </Button>
              <div className="text-xs text-muted-foreground">
                Works with Raspberry Pi, Linux PCs, and existing runtimes
              </div>
              {!showOfflineDevices && kits.length > 0 && (
                <Button
                  onClick={onToggleShowOfflineDevices}
                  variant="outline"
                  className="w-full"
                >
                  Show Offline Devices ({kits.length})
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKits.map((kit) => (
              <div
                key={kit.kit_id}
                onClick={() => onSelectKit(kit)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedKit?.kit_id === kit.kit_id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <TbDeviceDesktop className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground">{kit.name}</h4>
                      <p className="text-xs text-muted-foreground">ID: [{kit.kit_id.substring(0, 4).toUpperCase()}]</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kit.is_online ? 'online' : 'offline')}`}>
                    {getStatusIcon(kit.is_online ? 'online' : 'offline')}
                    <span>{kit.is_online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Apps: {kit.noRunner}</p>
                  <p>Subscribers: {kit.noSubscriber}</p>
                  <p>Last seen: {new Date(kit.last_seen).toLocaleTimeString()}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {kit.support_apis.slice(0, 3).map((api) => (
                    <span key={api} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {api.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {kit.support_apis.length > 3 && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      +{kit.support_apis.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats - Only show if we have kits */}
      {kits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running Apps</p>
                <p className="text-2xl font-bold text-foreground">
                  {runningAppsCount}
                  {!showOfflineDevices && kits.filter(kit => !kit.is_online).length > 0 && (
                    <span className="text-xs text-muted-foreground block">
                      +{kits.filter(kit => !kit.is_online).reduce((sum, kit) => sum + kit.noRunner, 0)} offline
                    </span>
                  )}
                </p>
              </div>
              <TbActivity className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-bold text-foreground">
                  {subscribersCount}
                  {!showOfflineDevices && kits.filter(kit => !kit.is_online).length > 0 && (
                    <span className="text-xs text-muted-foreground block">
                      +{kits.filter(kit => !kit.is_online).reduce((sum, kit) => sum + kit.noSubscriber, 0)} offline
                    </span>
                  )}
                </p>
              </div>
              <TbRocket className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {showOfflineDevices ? "Total Runtimes" : "Online Runtimes"}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {showOfflineDevices ? kits.length : kits.filter(kit => kit.is_online).length}
                  {showOfflineDevices && (
                    <span className="text-xs text-muted-foreground block">
                      {kits.filter(kit => kit.is_online).length} online
                    </span>
                  )}
                </p>
              </div>
              <TbServer className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OverviewTab