// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useRef } from 'react'
import { TbRocket, TbCode, TbPlay, TbTerminal, TbLoader, TbBolt } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'

interface QuickDeployPanelProps {
  onDeployAndRun: (config: { code: string; language: string; name: string }) => Promise<string>
  isDeploying: boolean
}

const QuickDeployPanel: FC<QuickDeployPanelProps> = ({ onDeployAndRun, isDeploying }) => {
  const [appName, setAppName] = useState('quick-app')
  const [code, setCode] = useState(`# Quick Vehicle App
# Deploy and run instantly!

def main():
    print("🚀 Vehicle Edge Runtime App Started!")
    print("Hello from your vehicle application!")

    # Your app logic here
    for i in range(5):
        print(f"Processing... {i + 1}")

if __name__ == "__main__":
    main()`)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleQuickDeploy = async () => {
    if (!appName.trim()) {
      alert('Please enter an app name')
      return
    }

    if (!code.trim()) {
      alert('Please enter some code')
      return
    }

    try {
      const result = await onDeployAndRun({
        code: code.trim(),
        language: 'python',
        name: appName.trim()
      })
      console.log('✅ Quick deploy successful:', result)

      // Reset form on success
      setAppName('quick-app')
      setCode(`# Quick Vehicle App
# Deploy and run instantly!

def main():
    print("🚀 Vehicle Edge Runtime App Started!")
    print("Hello from your vehicle application!")

    # Your app logic here
    for i in range(5):
        print(f"Processing... {i + 1}")

if __name__ == "__main__":
    main()`)

    } catch (error) {
      console.error('❌ Quick deploy failed:', error)
      alert(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCode(content)
        if (!appName || appName === 'quick-app') {
          setAppName(file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-'))
        }
      }
      reader.readAsText(file)
    }
  }

  const canDeploy = appName.trim().length > 0 && code.trim().length > 0 && !isDeploying

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <TbBolt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Deploy & Run</h3>
            <p className="text-sm text-gray-600">Deploy and run your app instantly</p>
          </div>
        </div>
        {isDeploying && (
          <div className="flex items-center gap-2 text-blue-600">
            <TbLoader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Deploying...</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* App Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            App Name
          </label>
          <Input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="my-vehicle-app"
            className="max-w-md"
            disabled={isDeploying}
          />
        </div>

        {/* Code Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Python Code
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={isDeploying}
                className="text-xs"
              >
                <TbRocket className="w-3 h-3 mr-1" />
                Upload File
              </Button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Enter your Python code here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
              spellCheck={false}
              disabled={isDeploying}
            />
            <div className="absolute top-2 right-2 text-xs text-gray-400">
              {code.split('\n').length} lines
            </div>
          </div>
        </div>

        {/* Quick Templates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Templates
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCode(`# Hello World App
def main():
    print("Hello Vehicle!")
    print("This app is running on Vehicle Edge Runtime")

if __name__ == "__main__":
    main()`)}
              disabled={isDeploying}
              className="text-xs h-auto py-2"
            >
              <TbCode className="w-3 h-3 mr-1" />
              Hello World
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCode(`# Counter App
import time

def main():
    print("🚀 Counter App Started")
    counter = 0

    for i in range(10):
        counter += 1
        print(f"Count: {counter}")
        time.sleep(1)

    print("✅ Counter App Finished")

if __name__ == "__main__":
    main()`)}
              disabled={isDeploying}
              className="text-xs h-auto py-2"
            >
              <TbTerminal className="w-3 h-3 mr-1" />
              Counter
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCode(`# Data Processing App
import json
from datetime import datetime

def main():
    print("📊 Data Processing App")

    # Sample data
    sensor_data = [
        {"sensor": "temperature", "value": 23.5, "unit": "°C"},
        {"sensor": "speed", "value": 45.2, "unit": "km/h"},
        {"sensor": "battery", "value": 85, "unit": "%"}
    ]

    print(f"Processing {len(sensor_data)} sensor readings...")

    for data in sensor_data:
        print(f"📡 {data['sensor']}: {data['value']} {data['unit']}")

    print("✅ Data processing complete")

if __name__ == "__main__":
    main()`)}
              disabled={isDeploying}
              className="text-xs h-auto py-2"
            >
              <TbPlay className="w-3 h-3 mr-1" />
              Data Processing
            </Button>
          </div>
        </div>

        {/* Deploy Button */}
        <div className="flex items-center justify-center pt-4">
          <Button
            onClick={handleQuickDeploy}
            disabled={!canDeploy}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-3"
          >
            {isDeploying ? (
              <>
                <TbLoader className="w-5 h-5 mr-2 animate-spin" />
                Deploying & Running...
              </>
            ) : (
              <>
                <TbRocket className="w-5 h-5 mr-2" />
                Deploy & Run App
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="text-sm text-blue-600">
          <p className="font-medium mb-1">💡 Quick Tips:</p>
          <ul className="space-y-1 text-xs ml-4">
            <li>• Your app will be deployed and started automatically</li>
            <li>• Use the Console tab to view real-time output</li>
            <li>• Apps can be managed from the Applications tab</li>
            <li>• Upload Python files or use quick templates to get started</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default QuickDeployPanel