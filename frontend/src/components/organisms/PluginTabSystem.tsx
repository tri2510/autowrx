// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { tabManager } from '@/core/tab-manager'
import { RegisteredTab } from '@/types/plugin.types'
import DaTabItem from '@/components/atoms/DaTabItem'

interface PluginTabSystemProps {
  className?: string
}

const PluginTabSystem: React.FC<PluginTabSystemProps> = ({ className = '' }) => {
  const location = useLocation()
  const [tabs, setTabs] = useState<RegisteredTab[]>([])
  const [activeTab, setActiveTab] = useState<RegisteredTab | null>(null)

  useEffect(() => {
    const updateTabs = () => {
      setTabs(tabManager.getActiveTabs())
      setActiveTab(tabManager.getActiveTab())
    }

    updateTabs()

    const unsubscribe = tabManager.addListener(updateTabs)
    return unsubscribe
  }, [])

  const handleTabClick = (tab: RegisteredTab) => {
    tabManager.setActiveTab(tab.id)
  }

  // Debug info
  console.log('PluginTabSystem render - tabs:', tabs.length, tabs)

  if (location.pathname.startsWith('/model/')) {
    return null
  }

  if (tabs.length === 0) {
    return (
      <div className={`plugin-tab-system ${className} bg-gray-100 p-2`}>
        <div className="text-sm text-gray-600">
          Plugin system loaded - no tabs registered yet
        </div>
      </div>
    )
  }

  return (
    <div className={`plugin-tab-system ${className}`}>
      <div className="tab-navigation border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Plugin Tabs">
          {tabs.map((tab) => (
            <div key={tab.id} className="px-1">
              <DaTabItem
                active={tab.isActive}
                onClick={() => handleTabClick(tab)}
                dataId={tab.id}
              >
                {tab.definition.icon && (
                  <span className="mr-2">{tab.definition.icon}</span>
                )}
                {tab.definition.label}
              </DaTabItem>
            </div>
          ))}
        </nav>
      </div>

      <div className="tab-content flex-1 overflow-hidden">
        {activeTab && (
          <div className="h-full">
            <React.Suspense fallback={<div className="p-4">Loading plugin...</div>}>
              <activeTab.component />
            </React.Suspense>
          </div>
        )}
      </div>
    </div>
  )
}

export default PluginTabSystem
