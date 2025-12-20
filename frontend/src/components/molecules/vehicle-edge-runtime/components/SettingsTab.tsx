// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { Input } from '@/components/atoms/input'
import { VehicleEdgeRuntimeKit } from '@/services/kitManager.service'

interface SettingsTabProps {
  kits: VehicleEdgeRuntimeKit[]
  selectedKit: VehicleEdgeRuntimeKit | null
  onSelectKit: (kit: VehicleEdgeRuntimeKit | null) => void
}

const SettingsTab: FC<SettingsTabProps> = ({
  kits,
  selectedKit,
  onSelectKit
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Runtime Settings</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Default Runtime</label>
            <select
              value={selectedKit?.kit_id || ''}
              onChange={(e) => {
                const kit = kits.find(k => k.kit_id === e.target.value)
                onSelectKit(kit || null)
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {kits.map((kit) => (
                <option key={kit.kit_id} value={kit.kit_id}>
                  {kit.name} ({kit.is_online ? 'Online' : 'Offline'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">WebSocket URL</label>
            <Input
              value="ws://localhost:3002/runtime"
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground mt-1">Vehicle Edge Runtime WebSocket endpoint</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Kit Manager URL</label>
            <Input
              value="ws://localhost:3090"
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground mt-1">Kit Manager WebSocket endpoint for runtime communication</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default Memory Limit (MB)</label>
              <Input
                type="number"
                defaultValue="512"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default CPU Limit (%)</label>
              <Input
                type="number"
                defaultValue="50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab