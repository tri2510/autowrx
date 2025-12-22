// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Input } from '@/components/atoms/input'
import { 
  TbLoader, 
  TbCheck, 
  TbAlertCircle, 
  TbActivity, 
  TbRefresh,
  TbPlus,
  TbX
} from 'react-icons/tb'

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

interface SignalValidatorProps {
  signals: string[]
  onValidationComplete: (validation: SignalValidation) => void
  availableSignals?: string[]
  loading?: boolean
  validation?: SignalValidation
}

const SignalValidator: FC<SignalValidatorProps> = ({
  signals,
  onValidationComplete,
  availableSignals = [],
  loading: externalLoading = false,
  validation: externalValidation
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const [validation, setValidation] = useState<SignalValidation | null>(externalValidation || null)
  const [newSignal, setNewSignal] = useState('')
  const [signalList, setSignalList] = useState<string[]>(signals)
  const [error, setError] = useState<string | null>(null)

  const isLoading = externalLoading || internalLoading

  // Default available VSS signals
  const defaultVSSSignals = [
    'Vehicle.Speed',
    'Vehicle.Acceleration.Longitudinal',
    'Vehicle.Acceleration.Lateral',
    'Vehicle.Acceleration.Vertical',
    'Vehicle.Location.Latitude',
    'Vehicle.Location.Longitude',
    'Vehicle.Location.Altitude',
    'Vehicle.FuelLevel',
    'Vehicle.EngineTemperature',
    'Vehicle.Odometer',
    'Vehicle.Powertrain.Transmission.Gear',
    'Vehicle.Powertrain.FuelSystem.FuelType',
    'Vehicle.Body.Cabin.Door.IsOpen',
    'Vehicle.Body.Cabin.Light.IsOn',
    'Vehicle.Chassis.Brake.Pedal.Position',
    'Vehicle.Chassis.SteeringWheel.Angle',
    'Vehicle.ADAS.ABS.IsActive',
    'Vehicle.ADAS.ESC.IsActive',
    'Vehicle.Cabin.Infotainment.Display.Brightness'
  ]

  const allAvailableSignals = [...new Set([...defaultVSSSignals, ...availableSignals])]

  const validateSignals = useCallback(async (signalsToValidate: string[]) => {
    if (!signalsToValidate || signalsToValidate.length === 0) {
      setValidation(null)
      onValidationComplete({
        valid: [],
        invalid: [],
        warnings: [],
        total: 0
      })
      return
    }

    setInternalLoading(true)
    setError(null)

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      const valid: Signal[] = []
      const invalid: Signal[] = []
      const warnings: string[] = []

      signalsToValidate.forEach(signal => {
        if (allAvailableSignals.includes(signal)) {
          valid.push({
            path: signal,
            access: 'subscribe'
          })
        } else {
          invalid.push({
            path: signal,
            access: 'subscribe'
          })
        }
      })

      // Add warnings for potentially problematic signals
      if (valid.some(s => s.path.includes('Location'))) {
        warnings.push('Location signals may require GPS connectivity')
      }
      if (valid.some(s => s.path.includes('ADAS'))) {
        warnings.push('ADAS signals require compatible vehicle hardware')
      }

      const validationResult: SignalValidation = {
        valid,
        invalid,
        warnings,
        total: signalsToValidate?.length || 0
      }

      setValidation(validationResult)
      onValidationComplete(validationResult)

    } catch (err) {
      console.error('Signal validation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate signals')
      
      // Fallback validation
      const valid: Signal[] = []
      const invalid: Signal[] = []

      signalsToValidate.forEach(signal => {
        if (allAvailableSignals.includes(signal)) {
          valid.push({
            path: signal,
            access: 'subscribe'
          })
        } else {
          invalid.push({
            path: signal,
            access: 'subscribe'
          })
        }
      })

      const fallbackValidation: SignalValidation = {
        valid,
        invalid,
        warnings: ['Validation service unavailable - using fallback validation'],
        total: signalsToValidate?.length || 0
      }

      setValidation(fallbackValidation)
      onValidationComplete(fallbackValidation)
    } finally {
      setInternalLoading(false)
    }
  }, [allAvailableSignals, onValidationComplete])

  // Add new signal
  const addSignal = useCallback(() => {
    if (newSignal.trim() && !signalList.includes(newSignal.trim())) {
      const updatedSignals = [...signalList, newSignal.trim()]
      setSignalList(updatedSignals)
      setNewSignal('')
      validateSignals(updatedSignals)
    }
  }, [newSignal, signalList, validateSignals])

  // Remove signal
  const removeSignal = useCallback((signalToRemove: string) => {
    const updatedSignals = signalList.filter(s => s !== signalToRemove)
    setSignalList(updatedSignals)
    validateSignals(updatedSignals)
  }, [signalList, validateSignals])

  // Validate signals when they change externally
  useEffect(() => {
    if (JSON.stringify(signals) !== JSON.stringify(signalList)) {
      setSignalList(signals)
      validateSignals(signals)
    }
  }, [signals, signalList, validateSignals])

  // Validate signals when available signals change
  useEffect(() => {
    if (signalList && signalList.length > 0) {
      validateSignals(signalList)
    }
  }, [signalList, allAvailableSignals, validateSignals])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbLoader className="w-4 h-4 animate-spin" />
            <span>Validating Signals</span>
          </CardTitle>
          <CardDescription>
            Checking vehicle signal availability...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TbLoader className="w-4 h-4 animate-spin" />
            <span>Validating {signalList?.length || 0} signal{(signalList?.length || 0) !== 1 ? 's' : ''}...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TbActivity className="w-4 h-4" />
          <span>Vehicle Signal Validator</span>
        </CardTitle>
        <CardDescription>
          Validate vehicle signals against the VSS (Vehicle Signal Specification)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <TbAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Validation Warning
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add new signal */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter signal path (e.g., Vehicle.Speed)"
              value={newSignal}
              onChange={(e) => setNewSignal(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSignal()}
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={addSignal}
              disabled={!newSignal.trim() || signalList.includes(newSignal.trim())}
              size="sm"
            >
              <TbPlus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Available signals suggestions */}
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Available signals:</p>
            <div className="flex flex-wrap gap-1">
              {allAvailableSignals.slice(0, 8).map(signal => (
                <button
                  key={signal}
                  onClick={() => {
                    if (!signalList.includes(signal)) {
                      const updatedSignals = [...signalList, signal]
                      setSignalList(updatedSignals)
                      validateSignals(updatedSignals)
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    signalList.includes(signal)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                  disabled={signalList.includes(signal)}
                >
                  {signal.split('.').pop()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Signal list and validation results */}
        {signalList && signalList.length > 0 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Selected Signals ({signalList.length}):</h4>
              <div className="space-y-2">
                {(signalList || []).map(signal => {
                  const isValid = validation?.valid?.some(s => s.path === signal) || false
                  const isInvalid = validation?.invalid?.some(s => s.path === signal) || false
                  
                  return (
                    <div
                      key={signal}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        isValid
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                          : isInvalid
                          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{signal}</span>
                        {isValid && (
                          <Badge variant="default" className="text-xs">
                            <TbCheck className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        )}
                        {isInvalid && (
                          <Badge variant="destructive" className="text-xs">
                            <TbAlertCircle className="w-3 h-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => removeSignal(signal)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <TbX className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Validation summary */}
            {validation && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Validation Summary:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <TbCheck className="w-4 h-4 text-green-600" />
                    <span>{validation?.valid?.length || 0} Valid signals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TbAlertCircle className="w-4 h-4 text-red-600" />
                    <span>{validation?.invalid?.length || 0} Invalid signals</span>
                  </div>
                </div>
                
                {validation?.warnings && validation.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-yellow-600 mb-1">Warnings:</p>
                    <ul className="text-sm text-yellow-600 list-disc list-inside">
                      {(validation?.warnings || []).map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!signalList || signalList.length === 0 && (
          <div className="text-center py-8">
            <TbActivity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No signals selected. Add vehicle signals to validate them against the VSS specification.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SignalValidator