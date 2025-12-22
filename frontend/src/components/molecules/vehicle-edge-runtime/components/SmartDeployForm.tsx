// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { TbCode, TbBinary, TbRocket, TbLoader, TbPlus, TbX, TbDownload } from 'react-icons/tb'
import EnhancedDependencyManager from './EnhancedDependencyManager'

export interface SmartDeployment {
  id: string
  name: string
  type: 'python' | 'binary'
  code: string
  dependencies: string[]
  signals: string[]
  environment: 'production' | 'staging' | 'development'
}

export interface Signal {
  path: string
  access: 'subscribe' | 'get'
  rate_hz?: number
}

export interface SignalValidation {
  valid: Signal[]
  invalid: Signal[]
  warnings: string[]
  total: number
}

interface SmartDeployFormProps {
  onSubmit: (deployment: SmartDeployment) => void
  isDeploying: boolean
  detectedDependencies?: string[]
  signalValidation?: SignalValidation
  onDetectDependencies?: (code: string) => void
  onValidateSignals?: (signals: string[]) => void
}

const SmartDeployForm: FC<SmartDeployFormProps> = ({
  onSubmit,
  isDeploying,
  detectedDependencies = [],
  signalValidation,
  onDetectDependencies,
  onValidateSignals
}) => {
  const [formData, setFormData] = useState<SmartDeployment>({
    id: 'speed-provider',
    name: 'Speed Provider',
    type: 'python',
    code: `# speed_provider.py

from kuksa_client.grpc import VSSClient
from kuksa_client.grpc import Datapoint
import time
import os

# --- Configuration ---
# Use the host's IP as seen from the container
SERVER_HOST = os.environ.get('KUKSA_HOST', '172.17.0.4')
SERVER_PORT = 55555
VSS_PATH_SPEED = 'Vehicle.Speed'
LOOP_INTERVAL = 1.0  # seconds

def main():
    """
    Connects to KUKSA and continuously feeds speed data.
    """
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print(f"Provider: Connected to KUKSA at {SERVER_HOST}:{SERVER_PORT}")
            print("Provider: Starting to feed data...")

            # Loop to simulate speed changes
            while True:
                for speed in range(0, 101, 5):  # Accelerate
                    client.set_current_values({
                        VSS_PATH_SPEED: Datapoint(speed),
                    })
                    print(f"Provider: Feeding Vehicle.Speed to {speed} km/h")
                    time.sleep(LOOP_INTERVAL)

                for speed in range(100, -1, -5):  # Decelerate
                    client.set_current_values({
                        VSS_PATH_SPEED: Datapoint(speed),
                    })
                    print(f"Provider: Feeding Vehicle.Speed to {speed} km/h")
                    time.sleep(LOOP_INTERVAL)

    except ConnectionRefusedError:
        print(f"Provider: Connection failed. Is KUKSA running on the host at {SERVER_HOST}:{SERVER_PORT}?")
    except Exception as e:
        print(f"Provider: An unexpected error occurred: {e}")
    finally:
        print("Provider: Finished.")

if __name__ == "__main__":
    main()`,
    dependencies: [],
    signals: ['Vehicle.Speed'],
    environment: 'development'
  })

  const [newSignal, setNewSignal] = useState('')
  const [allDependencies, setAllDependencies] = useState<string[]>(detectedDependencies)

  // Sync allDependencies with detectedDependencies when they change
  useEffect(() => {
    setAllDependencies(prev => {
      const manualDeps = prev.filter(dep => !detectedDependencies.includes(dep))
      return [...detectedDependencies, ...manualDeps]
    })
  }, [detectedDependencies])

  const handleInputChange = useCallback((field: keyof SmartDeployment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field === 'code' && onDetectDependencies) {
      const timeoutId = setTimeout(() => {
        onDetectDependencies(value)
      }, 500)
      return () => clearTimeout(timeoutId)
    }

    if (field === 'signals' && onValidateSignals) {
      const timeoutId = setTimeout(() => {
        onValidateSignals(value)
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [onDetectDependencies, onValidateSignals])

  // Handle dependency changes from the enhanced manager
  const handleDependenciesChange = useCallback((dependencies: string[]) => {
    setAllDependencies(dependencies)
    // Store manual dependencies separately for form submission
    const manualDeps = dependencies.filter(dep => !detectedDependencies.includes(dep))
    handleInputChange('dependencies', manualDeps)
  }, [detectedDependencies, handleInputChange])

  const addSignal = useCallback(() => {
    if (newSignal.trim() && !formData.signals.includes(newSignal.trim())) {
      handleInputChange('signals', [...formData.signals, newSignal.trim()])
      setNewSignal('')
      if (onValidateSignals) {
        onValidateSignals([...formData.signals, newSignal.trim()])
      }
    }
  }, [newSignal, formData.signals, handleInputChange, onValidateSignals])

  const removeSignal = useCallback((signal: string) => {
    const newSignals = formData.signals.filter(s => s !== signal)
    handleInputChange('signals', newSignals)
    if (onValidateSignals) {
      onValidateSignals(newSignals)
    }
  }, [formData.signals, handleInputChange, onValidateSignals])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id.trim() || !formData.code.trim()) {
      return
    }
    // Include all dependencies (detected + manual) in submission
    const submissionData = {
      ...formData,
      dependencies: allDependencies
    }
    onSubmit(submissionData)
  }, [formData, allDependencies, onSubmit])

  const isFormValid = formData.id.trim() && formData.code.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbRocket className="w-5 h-5" />
            <span>Application Details</span>
          </CardTitle>
          <CardDescription>
            Configure your vehicle edge application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="app-id" className="text-sm font-medium">Application ID *</label>
              <Input
                id="app-id"
                placeholder="my-vehicle-app"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="app-name" className="text-sm font-medium">Display Name</label>
              <Input
                id="app-name"
                placeholder="My Vehicle App"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="app-type" className="text-sm font-medium">Application Type</label>
              <Select value={formData.type} onValueChange={(value: 'python' | 'binary') => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">
                    <div className="flex items-center space-x-2">
                      <TbCode className="w-4 h-4" />
                      <span>Python</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="binary">
                    <div className="flex items-center space-x-2">
                      <TbBinary className="w-4 h-4" />
                      <span>Binary</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="environment" className="text-sm font-medium">Environment</label>
              <Select value={formData.environment} onValueChange={(value: 'production' | 'staging' | 'development') => handleInputChange('environment', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbCode className="w-5 h-5" />
            <span>Application Code</span>
          </CardTitle>
          <CardDescription>
            Paste your application code below. Dependencies will be auto-detected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Application Code *</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInputChange('code', `# kuksa_test.py
from kuksa_client.grpc import VSSClient
from kuksa_client.grpc import Datapoint
import time

# Test KUKSA connection
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 55555

def main():
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print("✅ Connected to KUKSA Databroker")

            # Test setting speed value
            test_speed = 55.0
            client.set_current_values({
                'Vehicle.Speed': Datapoint(test_speed)
            })
            print(f"📡 Set Vehicle.Speed to {test_speed} km/h")

            # Test reading speed value
            current_speed = client.get_current_values(['Vehicle.Speed'])
            print(f"📊 Read Vehicle.Speed: {current_speed}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()`)}
              title="Insert KUKSA test code template"
            >
              <TbDownload className="w-4 h-4 mr-1" />
              Insert KUKSA Test Code
            </Button>
          </div>
          <Textarea
            placeholder="Enter your Python application code here... (e.g., KUKSA client, vehicle data provider)"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            className="min-h-[200px] font-mono"
            required
          />
          {detectedDependencies.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-green-600 mb-2">Auto-detected dependencies:</p>
              <div className="flex flex-wrap gap-1">
                {detectedDependencies.map(dep => (
                  <Badge key={dep} variant="secondary" className="text-xs">
                    {dep}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EnhancedDependencyManager
        detectedDependencies={detectedDependencies}
        onDependenciesChange={handleDependenciesChange}
        disabled={isDeploying}
      />

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Signals</CardTitle>
          <CardDescription>
            Specify the vehicle signals your application needs to access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-3">
            <Input
              placeholder="Enter signal path (e.g., Vehicle.Speed)"
              value={newSignal}
              onChange={(e) => setNewSignal(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSignal())}
            />
            <Button type="button" onClick={addSignal} disabled={!newSignal.trim()}>
              <TbPlus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.signals.map(signal => (
              <Badge 
                key={signal} 
                variant={signalValidation?.valid.some(s => s.path === signal) ? "default" : "destructive"}
                className="flex items-center space-x-1"
              >
                <span>{signal}</span>
                <button
                  type="button"
                  onClick={() => removeSignal(signal)}
                  className="ml-1 text-current opacity-70 hover:opacity-100"
                >
                  <TbX className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {signalValidation && (
            <div className="space-y-2">
              {signalValidation.invalid.length > 0 && (
                <div className="text-sm text-red-600">
                  <p>Invalid signals:</p>
                  <ul className="list-disc list-inside">
                    {signalValidation.invalid.map(sig => (
                      <li key={sig.path}>{sig.path}</li>
                    ))}
                  </ul>
                </div>
              )}
              {signalValidation.warnings.length > 0 && (
                <div className="text-sm text-yellow-600">
                  <p>Warnings:</p>
                  <ul className="list-disc list-inside">
                    {signalValidation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="flex flex-col items-end space-y-2">
          {signalValidation && signalValidation.invalid.length > 0 && (
            <div className="text-sm text-yellow-600 text-right">
              ⚠️ {signalValidation.invalid.length} signal{signalValidation.invalid.length !== 1 ? 's' : ''} unavailable. Deployment may have limited functionality.
            </div>
          )}
          <Button 
            type="submit" 
            disabled={!isFormValid || isDeploying}
            className="min-w-[120px]"
            title={
              !isFormValid
                ? 'Please fill in required fields (Application ID and Code)'
                : isDeploying
                ? 'Deployment in progress...'
                : 'Deploy application to Vehicle Edge Runtime'
            }
          >
            {isDeploying ? (
              <>
                <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <TbRocket className="w-4 h-4 mr-2" />
                Deploy Application
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default SmartDeployForm