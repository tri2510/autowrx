// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { TbArrowRight, TbRocket, TbApps } from 'react-icons/tb'
import PanelWrapper from './PanelWrapper'
import SplitPanelToolbar from './SplitPanelToolbar'

interface SplitPanelLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  leftPanelBadgeCount?: number
  rightPanelBadgeCount?: number
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
  className?: string
}

type CollapsedPanel = 'left' | 'right' | 'none'
type ViewMode = 'balanced' | 'deploy-focus' | 'manage-focus'

const SplitPanelLayout: FC<SplitPanelLayoutProps> = ({
  leftPanel,
  rightPanel,
  leftPanelBadgeCount,
  rightPanelBadgeCount,
  defaultLeftWidth = 45,
  minLeftWidth = 30,
  maxLeftWidth = 70,
  className = ''
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const [collapsedPanel, setCollapsedPanel] = useState<CollapsedPanel>('none')
  const [viewMode, setViewMode] = useState<ViewMode>('balanced')

  const containerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  // Handle resizer drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }, [])

  // Handle resizer drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Constrain within min/max bounds
    const constrainedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth))
    setLeftWidth(constrainedWidth)
  }, [isDragging, minLeftWidth, maxLeftWidth])

  // Handle resizer drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Toggle panel collapse
  const togglePanel = useCallback((panel: 'left' | 'right') => {
    if (collapsedPanel === panel) {
      setCollapsedPanel('none')
      setViewMode('balanced')
    } else {
      setCollapsedPanel(panel)
      setViewMode(panel === 'left' ? 'manage-focus' : 'deploy-focus')
    }
  }, [collapsedPanel])

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    switch (mode) {
      case 'balanced':
        setCollapsedPanel('none')
        setLeftWidth(50)
        break
      case 'deploy-focus':
        setCollapsedPanel('right')
        setLeftWidth(70)
        break
      case 'manage-focus':
        setCollapsedPanel('left')
        setLeftWidth(30)
        break
    }
  }, [])

  // Calculate actual panel widths
  const getLeftPanelWidth = () => {
    if (collapsedPanel === 'left') return 5  // Collapsed to narrow strip
    if (collapsedPanel === 'right') return 95
    return leftWidth
  }

  const getRightPanelWidth = () => {
    if (collapsedPanel === 'right') return 5
    if (collapsedPanel === 'left') return 95
    return 100 - leftWidth
  }

  // Effect for mouse events during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      {/* Toolbar */}
      <SplitPanelToolbar
        currentViewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onToggleLeftPanel={() => togglePanel('left')}
        onToggleRightPanel={() => togglePanel('right')}
        isLeftCollapsed={collapsedPanel === 'left'}
        isRightCollapsed={collapsedPanel === 'right'}
      />

      {/* Panels Container */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left Panel - Deploy */}
        <div
          style={{ width: `${getLeftPanelWidth()}%` }}
          className="transition-all duration-300 ease-in-out overflow-hidden"
        >
          <PanelWrapper
            isCollapsed={collapsedPanel === 'left'}
            onToggleCollapse={() => togglePanel('left')}
            title="Deploy"
            icon={<TbRocket className="w-5 h-5" />}
            badgeCount={leftPanelBadgeCount}
          >
            {leftPanel}
          </PanelWrapper>
        </div>

        {/* Resizer (only show when neither panel is collapsed) */}
        {collapsedPanel === 'none' && (
          <div
            ref={resizerRef}
            onMouseDown={handleMouseDown}
            className={`
              w-1 bg-border hover:bg-primary cursor-col-resize
              transition-colors duration-200 relative z-10
              flex-shrink-0
              ${isDragging ? 'bg-primary' : ''}
            `}
          >
            {/* Visual handle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                            w-6 h-8 bg-primary rounded-full flex items-center justify-center
                            opacity-0 hover:opacity-100 transition-opacity
                            shadow-lg">
              <TbArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        {/* Right Panel - Applications */}
        <div
          style={{ width: `${getRightPanelWidth()}%` }}
          className="transition-all duration-300 ease-in-out overflow-hidden"
        >
          <PanelWrapper
            isCollapsed={collapsedPanel === 'right'}
            onToggleCollapse={() => togglePanel('right')}
            title="Applications"
            icon={<TbApps className="w-5 h-5" />}
            badgeCount={rightPanelBadgeCount}
          >
            {rightPanel}
          </PanelWrapper>
        </div>
      </div>
    </div>
  )
}

export default SplitPanelLayout
