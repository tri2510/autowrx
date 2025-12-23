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
import { TbCode, TbRocket, TbLoader, TbPlus, TbX, TbDownload } from 'react-icons/tb'
import EnhancedDependencyManager from './EnhancedDependencyManager'

export interface SmartDeployment {
  id: string
  name: string
  type: 'python'
  code: string
  dependencies: string[]
  signals: string[]
  environment?: string
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
  selectedKit?: any
  isRuntimeConnected?: boolean
  autoDetectEnabled?: boolean
  onToggleAutoDetect?: () => void
}

const SmartDeployForm: FC<SmartDeployFormProps> = ({
  onSubmit,
  isDeploying,
  detectedDependencies = [],
  signalValidation,
  onDetectDependencies,
  onValidateSignals,
  selectedKit,
  isRuntimeConnected = false,
  autoDetectEnabled = false,
  onToggleAutoDetect
}) => {
  const [formData, setFormData] = useState<SmartDeployment>({
    id: 'your-vehicle-app',
    name: 'Your Vehicle Application',
    type: 'python',
    code: '',
    dependencies: [],
    signals: []
  })

  const [newSignal, setNewSignal] = useState('')
  // Default dependencies for vehicle applications
  const DEFAULT_DEPENDENCIES = ['kuksa_client==0.4.3', 'velocitas-sdk==0.14.1']
  const [allDependencies, setAllDependencies] = useState<string[]>(DEFAULT_DEPENDENCIES)

  // Sync allDependencies with detectedDependencies when they change (if auto-detect is enabled)
  useEffect(() => {
    if (detectedDependencies.length > 0) {
      setAllDependencies(prev => {
        const manualDeps = prev.filter(dep => !DEFAULT_DEPENDENCIES.includes(dep) && !detectedDependencies.includes(dep))
        return [...DEFAULT_DEPENDENCIES, ...detectedDependencies, ...manualDeps]
      })
    }
  }, [detectedDependencies, DEFAULT_DEPENDENCIES])

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
    // Always ensure DEFAULT_DEPENDENCIES are included first
    const depsWithDefaults = DEFAULT_DEPENDENCIES.every(dep => dependencies.includes(dep))
      ? dependencies
      : [...DEFAULT_DEPENDENCIES, ...dependencies]

    setAllDependencies(depsWithDefaults)
    // Store manual dependencies separately for form submission
    const manualDeps = depsWithDefaults.filter(dep => !DEFAULT_DEPENDENCIES.includes(dep) && !detectedDependencies.includes(dep))
    handleInputChange('dependencies', manualDeps)
  }, [detectedDependencies, handleInputChange, DEFAULT_DEPENDENCIES])

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
    <>
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
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleInputChange('code', `# kuksa_set_value.py
from kuksa_client.grpc import VSSClient
from kuksa_client.grpc import Datapoint
import time
import random

# --- Configuration ---
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 55555
VSS_PATH_SPEED = 'Vehicle.Speed'
LOOP_INTERVAL = 1.0  # seconds

def main():
    """
    Connects to KUKSA and continuously sets random speed values in a loop.
    Runs forever with 1-second intervals.
    """
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print(f"Connected to KUKSA at {SERVER_HOST}:{SERVER_PORT}")
            print(f"Starting to set {VSS_PATH_SPEED} every {LOOP_INTERVAL} seconds...")
            print("Press Ctrl+C to stop")

            speed = 0.0
            increasing = True
            loop_count = 0

            # Infinite loop with 1-second interval
            while True:
                try:
                    # Generate a smooth sine wave speed pattern
                    speed = 50 + 45 * math.sin(math.radians(loop_count * 6))
                    speed = round(speed, 1)  # Round to 1 decimal place

                    client.set_current_values({
                        VSS_PATH_SPEED: Datapoint(speed)
                    })

                    timestamp = time.strftime('%H:%M:%S')
                    print(f"[{timestamp}] Set {VSS_PATH_SPEED}: {speed} km/h")

                    loop_count += 1
                    time.sleep(LOOP_INTERVAL)

                except Exception as loop_error:
                    print(f"Error in loop iteration {loop_count}: {loop_error}")
                    time.sleep(LOOP_INTERVAL)  # Continue with next iteration

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    import math
    main()`)}
                title="Insert example set value application code"
              >
                <TbDownload className="w-4 h-4 mr-1" />
                Example set value app
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleInputChange('code', `# poll_speed.py

from kuksa_client.grpc import VSSClient
import sys
import time

# --- Configuration ---
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 55555
VSS_PATH_SPEED = 'Vehicle.Speed'
# Time to wait between each poll (in seconds)
POLL_INTERVAL = 1.0

def main():
    """
    Connects to KUKSA and polls for speed values in an infinite loop.
    Runs forever with 1-second intervals.
    """
    try:
        # The 'with' statement handles connection and disconnection automatically
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print(f"Connecting to KUKSA at {SERVER_HOST}:{SERVER_PORT}...")
            print(f"Polling {VSS_PATH_SPEED} every {POLL_INTERVAL} seconds. Press Ctrl+C to stop.")
            print("-" * 60)

            # Infinite loop for continuous polling
            while True:
                # Use get_current_values() to retrieve the data
                values = client.get_current_values([VSS_PATH_SPEED])

                # Extract the datapoint from the dictionary
                speed_datapoint = values.get(VSS_PATH_SPEED)

                # Get the current timestamp for a more informative output
                timestamp = time.strftime('%H:%M:%S')

                if speed_datapoint and speed_datapoint.value is not None:
                    # Format speed to 1 decimal place like the set value app
                    speed_formatted = round(float(speed_datapoint.value), 1)
                    print(f"[{timestamp}] Current {VSS_PATH_SPEED}: {speed_formatted} km/h")
                else:
                    print(f"[{timestamp}] Could not retrieve {VSS_PATH_SPEED}. Value may not be set.")

                # Wait for the next interval
                time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        print("\\nPolling stopped by user.")
    except ConnectionRefusedError:
        print(f"Connection failed. Is the KUKSA Databroker running on the host at {SERVER_HOST}:{SERVER_PORT}?")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()`)}
                title="Insert example speed polling application code"
              >
                <TbDownload className="w-4 h-4 mr-1" />
                Example poll speed app
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleInputChange('code', `import asyncio
from sdv import VehicleApp
from vehicle import vehicle


class TestApp(VehicleApp):
    def __init__(self, vehicle_client):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        print("App started!")
        while True:
            await asyncio.sleep(2)
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(True)
            await asyncio.sleep(1)
            value = await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()
            print("Light value ", value.value)

            await asyncio.sleep(2)
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(False)
            await asyncio.sleep(1)
            value = await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()
            print("Light value ", value.value)


# Correct way to run the app
async def main():
    app = TestApp(vehicle)
    await app.run()


if __name__ == "__main__":
    asyncio.run(main())`)}
                title="Insert Velocitas app example"
              >
                <TbDownload className="w-4 h-4 mr-1" />
                Velocitas app
              </Button>
            </div>
          </div>
          <Textarea
            placeholder="Enter your Python application code here..."
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            className="min-h-[200px] font-mono"
            required
          />
          {detectedDependencies && detectedDependencies.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-green-600 mb-2">Auto-detected dependencies:</p>
              <div className="flex flex-wrap gap-1">
                {(detectedDependencies || []).map(dep => (
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
        detectedDependencies={detectedDependencies || []}
        onDependenciesChange={handleDependenciesChange}
        disabled={isDeploying}
        fixedDependencies={DEFAULT_DEPENDENCIES}
        autoDetectEnabled={autoDetectEnabled}
        onToggleAutoDetect={onToggleAutoDetect}
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
                variant={signalValidation?.valid && signalValidation.valid.some(s => s.path === signal) ? "default" : "destructive"}
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
              {signalValidation.invalid && signalValidation.invalid.length > 0 && (
                <div className="text-sm text-red-600">
                  <p>Invalid signals:</p>
                  <ul className="list-disc list-inside">
                    {signalValidation.invalid.map(sig => (
                      <li key={sig.path}>{sig.path}</li>
                    ))}
                  </ul>
                </div>
              )}
              {signalValidation.warnings && signalValidation.warnings.length > 0 && (
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
        {signalValidation && signalValidation.invalid && signalValidation.invalid.length > 0 && (
          <div className="text-sm text-yellow-600 mb-2">
            ⚠️ {signalValidation.invalid.length} signal{signalValidation.invalid.length !== 1 ? 's' : ''} unavailable. Deployment may have limited functionality.
          </div>
        )}
        <Button
          type="submit"
          disabled={!isFormValid || isDeploying}
          className="min-w-[140px]"
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
      </form>
    </>
  )
}

export default SmartDeployForm