// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, ReactNode } from 'react'
import { Button } from '@/components/atoms/button'
import { TbChevronRight, TbChevronLeft } from 'react-icons/tb'

interface PanelWrapperProps {
  children: ReactNode
  isCollapsed: boolean
  onToggleCollapse: () => void
  title: string
  icon: ReactNode
  badgeCount?: number
}

const PanelWrapper: FC<PanelWrapperProps> = ({
  children,
  isCollapsed,
  onToggleCollapse,
  title,
  icon,
  badgeCount
}) => {
  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          {icon}
          {!isCollapsed && (
            <>
              <h3 className="font-semibold text-foreground text-sm">{title}</h3>
              {badgeCount !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {badgeCount}
                </span>
              )}
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          title={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <TbChevronRight className="w-4 h-4" />
          ) : (
            <TbChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Panel Content */}
      <div className={`
        flex-1 overflow-y-auto
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
      `}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export default PanelWrapper
