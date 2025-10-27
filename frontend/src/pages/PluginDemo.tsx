// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { pluginManager } from '@/core/plugin-manager'
import { tabManager } from '@/core/tab-manager'
import { RegisteredTab } from '@/types/plugin.types'

const PluginDemo: React.FC = () => {
  const [tabs, setTabs] = useState<RegisteredTab[]>([])
  const [activeTab, setActiveTab] = useState<RegisteredTab | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializePlugins()
  }, [])

  const initializePlugins = async () => {
    try {
      console.log('🔄 Initializing plugin system...')
      
      // Initialize plugin manager
      await pluginManager.initialize()
      
      // Let's also manually add a test tab for demonstration
      const testTab = {
        id: 'test-tab',
        label: 'Test Tab',
        icon: '🧪',
        path: '/test',
        component: 'TestComponent',
        position: 1
      }
      
      // Add test tab directly
      tabManager.registerTab('test-plugin', testTab)
      
      // Wait a bit for plugins to load
      setTimeout(() => {
        const availableTabs = tabManager.getActiveTabs()
        console.log('📋 Available tabs:', availableTabs)
        setTabs(availableTabs)
        
        if (availableTabs.length > 0) {
          setActiveTab(availableTabs[0])
          tabManager.setActiveTab(availableTabs[0].id)
        }
        
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('❌ Plugin initialization failed:', error)
      setIsLoading(false)
    }
  }

  const handleTabClick = (tab: RegisteredTab) => {
    setActiveTab(tab)
    tabManager.setActiveTab(tab.id)
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-xl">🔄 Loading Plugin System...</div>
        <div className="text-gray-600 mt-2">Please check console for details</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold py-4">🔌 AutoWRX Plugin System Demo</h1>
        </div>
      </div>

      {tabs.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ No Plugins Loaded
            </h2>
            <p className="text-yellow-700 mb-4">
              The plugin system is running but no plugins are currently loaded.
            </p>
            <div className="text-sm text-yellow-600">
              <p className="mb-2">Expected plugin location:</p>
              <code className="bg-yellow-100 px-2 py-1 rounded">
                /frontend/public/plugins/demo-plugin/
              </code>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-4" aria-label="Plugin Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    tab.isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.definition.icon && (
                    <span className="mr-2">{tab.definition.icon}</span>
                  )}
                  {tab.definition.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white min-h-96">
            {activeTab && (
              <React.Suspense fallback={<div className="p-8">Loading plugin...</div>}>
                <activeTab.component />
              </React.Suspense>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PluginDemo