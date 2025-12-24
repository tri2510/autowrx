// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { Button } from '@/components/atoms/button'
import {
  TbSquareRotated,
  TbRocket,
  TbApps
} from 'react-icons/tb'

type ViewMode = 'balanced' | 'deploy-focus' | 'manage-focus'

interface SplitPanelToolbarProps {
  currentViewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
  isLeftCollapsed: boolean
  isRightCollapsed: boolean
}

const SplitPanelToolbar: FC<SplitPanelToolbarProps> = ({
  currentViewMode,
  onViewModeChange,
  onToggleLeftPanel,
  onToggleRightPanel,
  isLeftCollapsed,
  isRightCollapsed
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
      <div className="text-sm text-muted-foreground">
        View Mode
      </div>
      <div className="flex items-center space-x-2">
        {/* View Mode Presets */}
        <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
          <Button
            variant={currentViewMode === 'balanced' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('balanced')}
            title="Balanced view (50/50)"
            className="h-7 px-2"
          >
            <TbSquareRotated className="w-4 h-4" />
          </Button>
          <Button
            variant={currentViewMode === 'deploy-focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('deploy-focus')}
            title="Deploy focus (70/30)"
            className="h-7 px-2"
          >
            <TbRocket className="w-4 h-4" />
          </Button>
          <Button
            variant={currentViewMode === 'manage-focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('manage-focus')}
            title="Manage focus (30/70)"
            className="h-7 px-2"
          >
            <TbApps className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SplitPanelToolbar
