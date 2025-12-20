// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import {
  TbServer,
  TbPlugConnected,
  TbPlug,
  TbAlertTriangle
} from 'react-icons/tb'
import { VehicleEdgeRuntimeKit } from '@/services/kitManager.service'
import { Button } from '@/components/atoms/button'

interface DashboardHeaderProps {
  selectedKit: VehicleEdgeRuntimeKit | null
  isRuntimeConnected: boolean
  isKitManagerConnected: boolean
  connectionError: string | null
  kits: VehicleEdgeRuntimeKit[]
  onKitSelect: (kit: VehicleEdgeRuntimeKit | null) => void
  onSetupRuntime: () => void
}

const DashboardHeader: FC<DashboardHeaderProps> = ({
  selectedKit,
  isRuntimeConnected,
  isKitManagerConnected,
  connectionError,
  kits,
  onKitSelect,
  onSetupRuntime
}) => {
  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TbServer className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Vehicle Edge Runtime</h2>
            <p className="text-muted-foreground">Deploy and manage vehicle applications</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-3">
          {selectedKit && (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-background">
              <TbPlugConnected className="w-4 h-4" />
              <div className={`w-2 h-2 rounded-full ${
                isRuntimeConnected
                  ? 'bg-green-500'
                  : isKitManagerConnected && selectedKit && !selectedKit.is_online
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {isRuntimeConnected
                  ? 'Runtime Connected'
                  : isKitManagerConnected && selectedKit && !selectedKit.is_online
                    ? 'Runtime Offline'
                  : isKitManagerConnected
                    ? 'Kit Manager Connected'
                    : 'Disconnected'
                }
              </span>
              {connectionError && (
                <span className="text-xs text-red-500 ml-2">
                  ({connectionError})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Persistent Runtime Selector */}
        <div className="flex items-center space-x-4">
          {kits.length > 0 ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">Runtime:</span>
              <select
                value={selectedKit?.kit_id || ''}
                onChange={(e) => {
                  const kit = kits.find(k => k.kit_id === e.target.value)
                  onKitSelect(kit || null)
                }}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]"
              >
                <option value="">Select Runtime...</option>
                {kits.filter(kit => kit.is_online).map((kit) => (
                  <option key={kit.kit_id} value={kit.kit_id}>
                    {kit.name} [{kit.kit_id.substring(0, 4).toUpperCase()}]
                  </option>
                ))}
              </select>
              {selectedKit && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${selectedKit.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${selectedKit.is_online ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedKit.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <TbAlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>No runtimes available</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onSetupRuntime}
                className="ml-2"
              >
                Setup Runtime
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardHeader