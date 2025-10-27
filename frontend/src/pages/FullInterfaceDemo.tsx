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

interface VehicleModel {
  id: string
  name: string
  version: string
  description: string
  signals: string[]
  apis: string[]
}

const FullInterfaceDemo: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null)
  const [tabs, setTabs] = useState<RegisteredTab[]>([])
  const [activeTab, setActiveTab] = useState<string>('sdv-code')
  const [isLoading, setIsLoading] = useState(true)

  // Mock vehicle models (this would come from backend in real app)
  const vehicleModels: VehicleModel[] = [
    {
      id: 'model-1',
      name: 'BMW X3 2024',
      version: 'v2.1.0',
      description: 'BMW X3 Electric Vehicle Model',
      signals: ['Vehicle.Speed', 'Vehicle.Engine.RPM', 'Vehicle.Battery.Level'],
      apis: ['VehicleService', 'BatteryAPI', 'DiagnosticsAPI']
    },
    {
      id: 'model-2', 
      name: 'Mercedes EQS',
      version: 'v1.5.2',
      description: 'Mercedes EQS Luxury Electric Vehicle',
      signals: ['Vehicle.Speed', 'Vehicle.Battery.Temperature', 'Vehicle.Range'],
      apis: ['MercedesConnect', 'ChargingAPI', 'NavigationAPI']
    },
    {
      id: 'model-3',
      name: 'Audi e-tron GT',
      version: 'v3.0.1', 
      description: 'Audi e-tron GT Performance Vehicle',
      signals: ['Vehicle.Speed', 'Vehicle.Performance.Mode', 'Vehicle.Suspension'],
      apis: ['AudiConnect', 'PerformanceAPI', 'SuspensionAPI']
    }
  ]

  // Built-in tabs (these exist in the real AutoWRX)
  const builtInTabs = [
    { id: 'journey', label: 'Journey', icon: '🗺️' },
    { id: 'flow', label: 'Flow', icon: '🔄' },
    { id: 'sdv-code', label: 'SDV Code', icon: '</>' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'homologation', label: 'Homologation', icon: '✅' },
  ]

  useEffect(() => {
    initializeSystem()
  }, [])

  useEffect(() => {
    if (selectedModel) {
      updateVehicleContext(selectedModel)
    }
  }, [selectedModel])

  const initializeSystem = async () => {
    try {
      console.log('🔄 Initializing full AutoWRX system...')
      
      // Initialize plugin manager
      await pluginManager.initialize()
      
      // Set default model
      setSelectedModel(vehicleModels[0])
      
      // Get plugin tabs
      setTimeout(() => {
        const pluginTabs = tabManager.getActiveTabs()
        setTabs(pluginTabs)
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('❌ System initialization failed:', error)
      setIsLoading(false)
    }
  }

  const updateVehicleContext = (model: VehicleModel) => {
    // Update global state with selected model data
    if (typeof window !== 'undefined' && (window as any).AutoWRXPluginAPI) {
      (window as any).AutoWRXPluginAPI.setGlobalState('vehicleModel', model)
      (window as any).AutoWRXPluginAPI.setGlobalState('vehicleSignals', {
        'Vehicle.Speed': Math.floor(Math.random() * 120),
        'Vehicle.Engine.RPM': Math.floor(Math.random() * 6000),
        'Vehicle.Battery.Level': Math.floor(Math.random() * 100),
        'Vehicle.Battery.Temperature': Math.floor(Math.random() * 40 + 20),
        'Vehicle.Range': Math.floor(Math.random() * 500 + 100),
        'Vehicle.Performance.Mode': ['Eco', 'Comfort', 'Sport', 'Sport+'][Math.floor(Math.random() * 4)],
        'Vehicle.Suspension': ['Soft', 'Medium', 'Hard'][Math.floor(Math.random() * 3)]
      })
      (window as any).AutoWRXPluginAPI.setGlobalState('vehicleApis', model.apis)
    }
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    
    // If it's a plugin tab, set it active in the tab manager
    const pluginTab = tabs.find(tab => tab.id.includes(tabId))
    if (pluginTab) {
      tabManager.setActiveTab(pluginTab.id)
    }
  }

  const renderTabContent = () => {
    // Handle built-in tabs
    if (builtInTabs.some(tab => tab.id === activeTab)) {
      switch (activeTab) {
        case 'journey':
          return (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">🗺️ Journey Planning</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-blue-800">Journey planning interface for {selectedModel?.name}</p>
                <p className="text-blue-600 mt-2">Plan routes, charging stops, and optimize energy consumption.</p>
              </div>
            </div>
          )
        case 'flow':
          return (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">🔄 Development Flow</h2>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-green-800">Development workflow for {selectedModel?.name}</p>
                <p className="text-green-600 mt-2">Manage development lifecycle and testing flows.</p>
              </div>
            </div>
          )
        case 'sdv-code':
          return (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">📝 SDV Code Editor</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Model: {selectedModel?.name}</div>
                  <div className="text-sm text-gray-600 mb-4">Language: PYTHON</div>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
                  <div># Vehicle Control Script for {selectedModel?.name}</div>
                  <div>import time</div>
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
                  <div className="ml-8">await self.Vehicle.Cabin.Door.Row1.DriverSide.IsOpen.set(False)</div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    🚀 Create Velocitas Project
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    📦 Deploy as EPAM service
                  </button>
                </div>
              </div>
            </div>
          )
        case 'dashboard':
          return (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">📊 Vehicle Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedModel?.signals.map((signal, index) => (
                  <div key={signal} className="bg-white border rounded-lg p-4">
                    <div className="text-sm text-gray-600">{signal}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor(Math.random() * 100)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        case 'homologation':
          return (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">✅ Homologation</h2>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <p className="text-yellow-800">Homologation and compliance testing for {selectedModel?.name}</p>
                <p className="text-yellow-600 mt-2">Verify vehicle compliance with regulations and standards.</p>
              </div>
            </div>
          )
        default:
          return <div>Tab content not found</div>
      }
    }

    // Handle plugin tabs
    const pluginTab = tabs.find(tab => tab.id.includes(activeTab) || tab.definition.label.toLowerCase().includes(activeTab))
    if (pluginTab) {
      return (
        <React.Suspense fallback={<div className="p-8">Loading plugin...</div>}>
          <pluginTab.component />
        </React.Suspense>
      )
    }

    return <div className="p-8">Tab not found</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl mb-4">🚗 Loading AutoWRX</div>
          <div className="text-gray-600">Initializing vehicle interface and plugin system...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-blue-900 text-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <img src="/imgs/logo-wide.png" alt="AutoWRX" className="h-8" />
            <div className="text-lg font-semibold">AutoWRX</div>
          </div>
          
          {/* Vehicle Model Selector */}
          <div className="flex items-center space-x-4">
            <select 
              value={selectedModel?.id || ''}
              onChange={(e) => {
                const model = vehicleModels.find(m => m.id === e.target.value)
                setSelectedModel(model || null)
              }}
              className="bg-blue-800 text-white border border-blue-700 rounded px-3 py-1"
            >
              {vehicleModels.map(model => (
                <option key={model.id} value={model.id}>
                  🚗 {model.name}
                </option>
              ))}
            </select>
            <div className="text-sm">
              <div>Model: {selectedModel?.name}</div>
              <div className="text-blue-300">Version: {selectedModel?.version}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-6">
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

          {/* Separator */}
          {tabs.length > 0 && (
            <div className="h-6 w-px bg-gray-300 mx-2" />
          )}

          {/* Plugin Tabs */}
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.definition.label.toLowerCase().replace(' ', '-'))}
              className={`px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab.includes(tab.definition.label.toLowerCase()) || activeTab.includes(tab.definition.id)
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.definition.icon && (
                <span className="mr-2">{tab.definition.icon}</span>
              )}
              {tab.definition.label}
              <span className="ml-1 text-xs bg-green-100 text-green-600 px-1 rounded">Plugin</span>
            </button>
          ))}

          {/* Plugin Indicator */}
          <div className="ml-auto text-sm text-gray-500">
            {tabs.length} plugin{tabs.length !== 1 ? 's' : ''} loaded
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Vehicle Info Bar */}
        <div className="bg-blue-50 border-b px-6 py-2">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">Active Model:</span> {selectedModel?.name} • 
              <span className="font-medium ml-2">APIs:</span> {selectedModel?.apis.length} available • 
              <span className="font-medium ml-2">Signals:</span> {selectedModel?.signals.length} active
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span>Connected</span>
              </div>
              <div className="text-gray-500">
                Last update: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="h-full">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default FullInterfaceDemo