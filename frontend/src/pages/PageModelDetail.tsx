// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { pluginManager } from '@/core/plugin-manager'
import { tabManager } from '@/core/tab-manager'
import { RegisteredTab } from '@/types/plugin.types'

interface VehicleModel {
  id: string
  name: string
  version: string
  description: string
  language: string
  apis: string[]
  signals: string[]
}

const PageModelDetail: React.FC = () => {
  const { model_id } = useParams()
  const [model, setModel] = useState<VehicleModel | null>(null)
  const [activeTab, setActiveTab] = useState('sdv-code')
  const [pluginTabs, setPluginTabs] = useState<RegisteredTab[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock model data (in real app, this would come from API)
  const mockModels: Record<string, VehicleModel> = {
    'bmw-x3-2024': {
      id: 'bmw-x3-2024',
      name: 'BMW X3 2024',
      version: 'v2.1.0',
      description: 'BMW X3 Electric Vehicle Model with Advanced Driver Assistance',
      language: 'PYTHON',
      apis: ['VehicleService', 'BatteryAPI', 'DiagnosticsAPI', 'NavigationAPI'],
      signals: [
        'Vehicle.Body.Trunk.Rear.IsOpen',
        'Vehicle.Cabin.Door.Row1.DriverSide.IsOpen',
        'Vehicle.Cabin.Door.Row1.PassengerSide.IsOpen',
        'Vehicle.Cabin.Seat.Row1.DriverSide.Position',
        'Vehicle.Cabin.Seat.Row1.PassengerSide.Position'
      ]
    }
  }

  // Built-in tabs that match the actual AutoWRX interface
  const builtInTabs = [
    { id: 'journey', label: 'Journey', icon: '🗺️' },
    { id: 'flow', label: 'Flow', icon: '🔄' },
    { id: 'sdv-code', label: 'SDV Code', icon: '</>' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'homologation', label: 'Homologation', icon: '✅' }
  ]

  useEffect(() => {
    initializeModelPage()
  }, [model_id])

  const initializeModelPage = async () => {
    try {
      // Load model data
      const currentModel = model_id ? mockModels[model_id] : mockModels['bmw-x3-2024']
      setModel(currentModel)

      // Initialize plugin system
      await pluginManager.initialize()

      // Update vehicle context for plugins
      if (typeof window !== 'undefined' && (window as any).AutoWRXPluginAPI && currentModel) {
        const api = (window as any).AutoWRXPluginAPI
        api.setGlobalState('currentModel', currentModel)
        api.setGlobalState('vehicleSignals', generateMockSignalData(currentModel))
        api.setGlobalState('vehicleApis', currentModel.apis)
      }

      // Get plugin tabs immediately after initialization
      const tabs = tabManager.getActiveTabs()
      console.log('🔌 Plugin tabs loaded:', tabs)
      setPluginTabs(tabs)
      setIsLoading(false)

    } catch (error) {
      console.error('Failed to initialize model page:', error)
      setIsLoading(false)
    }
  }

  const generateMockSignalData = (vehicleModel: VehicleModel) => {
    const signals: Record<string, any> = {}
    vehicleModel.signals.forEach(signal => {
      if (signal.includes('IsOpen')) {
        signals[signal] = Math.random() > 0.5
      } else if (signal.includes('Position')) {
        signals[signal] = Math.floor(Math.random() * 10)
      } else if (signal.includes('Speed')) {
        signals[signal] = Math.floor(Math.random() * 120)
      } else if (signal.includes('Temperature')) {
        signals[signal] = Math.floor(Math.random() * 40 + 20)
      } else {
        signals[signal] = Math.floor(Math.random() * 100)
      }
    })
    return signals
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    
    // If it's a plugin tab, activate it in the tab manager
    const pluginTab = pluginTabs.find(tab => tab.id.includes(tabId))
    if (pluginTab) {
      tabManager.setActiveTab(pluginTab.id)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'journey':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Journey Planning</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">Plan and optimize vehicle routes for {model?.name}</p>
            </div>
          </div>
        )

      case 'flow':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Development Flow</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">Manage development workflow for {model?.name}</p>
            </div>
          </div>
        )

      case 'sdv-code':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button className="bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <span>⭐</span>
                  <span>SDV ProtoPilot</span>
                </button>
                <button className="border border-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <span>📂</span>
                  <span>Create Velocitas Project</span>
                </button>
                <button className="border border-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Deploy as EPAM service</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span>Language: <strong>{model?.language}</strong></span>
                <button className="text-blue-600">Used APIs</button>
                <button className="text-blue-600">COVESA Signals</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Code Editor */}
              <div className="lg:col-span-3">
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-4 py-2 text-white text-sm">
                    main.py
                  </div>
                  <div className="p-4 text-green-400 font-mono text-sm">
                    <div className="text-gray-400"># Vehicle Control Application for {model?.name}</div>
                    <div className="mt-2">import time</div>
                    <div>import asyncio</div>
                    <div>import signal</div>
                    <div className="mt-2">from sdv.vdb.reply import DataPointReply</div>
                    <div>from sdv.vehicle_app import VehicleApp</div>
                    <div>from vehicle import Vehicle, vehicle</div>
                    <div className="mt-2">class TestApp(VehicleApp):</div>
                    <div className="ml-4">def __init__(self, vehicle_client: Vehicle):</div>
                    <div className="ml-8">super().__init__()</div>
                    <div className="ml-8">self.Vehicle = vehicle_client</div>
                    <div className="mt-2 ml-4">async def reset_all(self):</div>
                    {model?.signals.slice(0, 5).map((signal, index) => (
                      <div key={signal} className="ml-8">
                        await self.Vehicle.{signal.replace('Vehicle.', '').replace(/\./g, '.')}.set({
                          signal.includes('IsOpen') ? 'False' : '0'
                        })
                      </div>
                    ))}
                    <div className="mt-2 ml-4">async def on_start(self):</div>
                    <div className="ml-8">await self.reset_all()</div>
                    <div className="ml-8">await asyncio.sleep(2)</div>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="space-y-6">
                {/* COVESA Signals */}
                <div>
                  <h3 className="font-semibold mb-3">COVESA:</h3>
                  <div className="space-y-2 text-sm">
                    {model?.signals.map(signal => (
                      <div key={signal} className="text-gray-600">
                        {signal}
                      </div>
                    ))}
                  </div>
                </div>

                {/* V2C APIs */}
                <div>
                  <h3 className="font-semibold mb-3">V2C:</h3>
                  <div className="space-y-2 text-sm">
                    {model?.apis.map(api => (
                      <div key={api} className="text-gray-600">
                        {api}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'dashboard':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Vehicle Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {model?.signals.map(signal => (
                <div key={signal} className="bg-white border rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">
                    {signal.split('.').pop()}
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {signal.includes('IsOpen') ? 
                      (Math.random() > 0.5 ? 'Open' : 'Closed') : 
                      Math.floor(Math.random() * 100)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'homologation':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Homologation</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Vehicle compliance and certification for {model?.name}</p>
            </div>
          </div>
        )

      default:
        // Check for plugin tabs
        const pluginTab = pluginTabs.find(tab => 
          activeTab.includes(tab.definition.label.toLowerCase()) || 
          tab.definition.id === activeTab
        )
        if (pluginTab) {
          return (
            <React.Suspense fallback={<div className="p-6">Loading plugin...</div>}>
              <pluginTab.component />
            </React.Suspense>
          )
        }
        return <div className="p-6">Tab not found</div>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading Model...</div>
          <div className="text-gray-600">Initializing {model?.name}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white">
      {/* Model Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{model?.name}</h1>
            <p className="text-gray-600">{model?.description}</p>
          </div>
          <div className="text-sm text-gray-500">
            Version: {model?.version}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {/* Built-in Tabs */}
          {builtInTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          {/* Plugin Tabs */}
          {pluginTabs.length > 0 && (
            <>
              <div className="w-px bg-gray-300 mx-2 my-2" />
              {pluginTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.definition.id)}
                  className={`px-4 py-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.definition.id || activeTab.includes(tab.definition.label.toLowerCase())
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.definition.icon && (
                    <span className="mr-2">{tab.definition.icon}</span>
                  )}
                  {tab.definition.label}
                  <span className="ml-1 text-xs bg-green-100 text-green-600 px-1 rounded">
                    Plugin
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Plugin Status */}
          <div className="ml-auto flex items-center text-xs text-gray-500 px-4 py-3">
            {pluginTabs.length} plugin{pluginTabs.length !== 1 ? 's' : ''} loaded
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default PageModelDetail