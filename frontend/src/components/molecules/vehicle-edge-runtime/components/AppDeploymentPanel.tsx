// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useRef } from 'react'
import { TbRocket, TbUpload, TbCode, TbPlayerPlay, TbX, TbLoader } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { PROTOTYPE_APPS } from '../utils'

interface AppDeploymentPanelProps {
  onDeploy: (config: { name: string; code: string; vehicleId?: string }) => Promise<string>
  isDeploying: boolean
  onStopDeployment: () => void
  selectedKit: any
}

const AppDeploymentPanel: FC<AppDeploymentPanelProps> = ({
  onDeploy,
  isDeploying,
  onStopDeployment,
  selectedKit
}) => {
  const [activeTab, setActiveTab] = useState<'prototype' | 'custom'>('prototype')
  const [selectedPrototype, setSelectedPrototype] = useState(PROTOTYPE_APPS[0])
  const [customAppName, setCustomAppName] = useState('your-vehicle-app')
  const [customCode, setCustomCode] = useState('')
  const [vehicleId, setVehicleId] = useState('default-vehicle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDeployApp = async () => {
    try {
      // Validate application name for custom apps
      if (activeTab === 'custom' && !customAppName.trim()) {
        throw new Error('Application name is required')
      }

      const config = activeTab === 'prototype'
        ? {
            name: selectedPrototype.name,
            code: selectedPrototype.code || '',
            vehicleId
          }
        : {
            name: customAppName.trim(),
            code: customCode,
            vehicleId
          }

      console.log('🚀 Dashboard Debug before deployment:')
      console.log('  - appName:', config.name)
      console.log('  - vehicleId:', config.vehicleId)

      await onDeploy(config)
    } catch (error) {
      console.error('❌ Deployment failed:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCustomCode(content)
        if (!customAppName) {
          setCustomAppName(file.name.replace(/\.[^/.]+$/, ''))
        }
      }
      reader.readAsText(file)
    }
  }

  const canDeploy = () => {
    if (!selectedKit?.is_online) return false
    if (activeTab === 'prototype') return true
    return customAppName.trim().length > 0 && customCode.trim().length > 0
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TbRocket className="w-5 h-5" />
          Deploy Application
        </h3>
      </div>

      {!selectedKit?.is_online && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <TbX className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-900">Device Offline</div>
              <div className="text-sm text-yellow-700">
                The selected device is offline. Please select an online device to deploy applications.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('prototype')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'prototype'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Prototype Apps
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Custom Code
        </button>
      </div>

      {/* Vehicle ID Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle ID
        </label>
        <Input
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          placeholder="default-vehicle"
          className="max-w-md"
        />
        <p className="text-sm text-gray-500 mt-1">
          Specify which vehicle this app should run on
        </p>
      </div>

      {activeTab === 'prototype' ? (
        /* Prototype Apps Tab */
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a Prototype Application
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROTOTYPE_APPS.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedPrototype(app)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPrototype.id === app.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{app.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      app.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{app.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{app.category}</span>
                    <span>{app.estimatedTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedPrototype && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Code Preview
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {selectedPrototype.code?.substring(0, 1000)}
                  {selectedPrototype.code && selectedPrototype.code.length > 1000 && '\n... (truncated)'}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Custom Code Tab */
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Name
            </label>
            <Input
              value={customAppName}
              onChange={(e) => {
                const value = e.target.value.trim()
                if (value.length > 0) {
                  setCustomAppName(value)
                }
              }}
              placeholder="your-vehicle-app"
              className="max-w-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Code
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TbUpload className="w-4 h-4" />
                  Upload Python File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".py,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="# Enter your Python code here&#10;&#10;def main():&#10;    print('Hello from Vehicle Edge Runtime!')&#10;&#10;if __name__ == '__main__':&#10;    main()"
                className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                spellCheck={false}
              />
              <p className="text-sm text-gray-500">
                Upload a Python file or paste your code directly. The main function will be executed automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleDeployApp}
            disabled={!canDeploy() || isDeploying}
            className="flex items-center gap-2"
          >
            {isDeploying ? (
              <>
                <TbLoader className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <TbRocket className="w-4 h-4" />
                Deploy Application
              </>
            )}
          </Button>

          {isDeploying && (
            <Button
              onClick={onStopDeployment}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TbX className="w-4 h-4" />
              Stop Deployment
            </Button>
          )}
        </div>

        {!canDeploy() && !isDeploying && (
          <p className="text-sm text-gray-500 mt-2">
            {selectedKit?.is_online
              ? activeTab === 'custom'
                ? 'Please provide an app name and code to deploy.'
                : 'Please select a prototype app to deploy.'
              : 'Please select an online device to deploy applications.'
            }
          </p>
        )}
      </div>
    </div>
  )
}

export default AppDeploymentPanel