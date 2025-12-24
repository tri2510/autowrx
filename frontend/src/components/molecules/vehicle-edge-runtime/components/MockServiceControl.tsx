// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import {
  TbBrain,
  TbLoader,
  TbPlay,
  TbStop,
  TbSettings,
  TbRefresh,
  TbCheck,
  TbX,
  TbToggleLeft,
  TbToggleRight
} from 'react-icons/tb'
import { useMockService, MOCK_MODE_DESCRIPTIONS, MockMode } from '../hooks/useMockService'

interface MockServiceControlProps {
  className?: string
}

const MockServiceControl: FC<MockServiceControlProps> = ({ className = '' }) => {
  const {
    status,
    isConnected,
    isLoading,
    error,

    getStatus,
    startService,
    stopService,
    configureService
  } = useMockService()

  const [selectedMode, setSelectedMode] = useState<MockMode>('echo-all')
  const [customSignals, setCustomSignals] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const isRunning = status?.running || false
  const currentMode = status?.mode || 'off'

  // Handle mode selection
  const handleModeChange = (mode: MockMode) => {
    setSelectedMode(mode)

    // If service is running, reconfigure it with new mode
    if (isRunning) {
      handleConfigure(mode)
    }
  }

  // Handle start service
  const handleStart = async () => {
    setLastAction(null)

    try {
      const signals = selectedMode === 'echo-specific' && customSignals
        ? customSignals.split(',').map(s => s.trim()).filter(Boolean)
        : undefined

      const response = await startService(selectedMode, signals)

      if (response.success || response.status?.running) {
        setLastAction({
          type: 'success',
          message: response.message || 'Mock service started successfully'
        })
      } else {
        setLastAction({
          type: 'error',
          message: response.message || 'Failed to start mock service'
        })
      }
    } catch (err) {
      setLastAction({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to start mock service'
      })
    }
  }

  // Handle stop service
  const handleStop = async () => {
    setLastAction(null)

    try {
      const response = await stopService()

      if (response.success) {
        setLastAction({
          type: 'success',
          message: response.message || 'Mock service stopped successfully'
        })
      } else {
        setLastAction({
          type: 'error',
          message: response.message || 'Failed to stop mock service'
        })
      }
    } catch (err) {
      setLastAction({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to stop mock service'
      })
    }
  }

  // Handle configure service
  const handleConfigure = async (mode?: MockMode) => {
    const targetMode = mode || selectedMode
    setLastAction(null)

    try {
      const signals = targetMode === 'echo-specific' && customSignals
        ? customSignals.split(',').map(s => s.trim()).filter(Boolean)
        : undefined

      const response = await configureService(targetMode, signals)

      if (response.success || response.configured) {
        setLastAction({
          type: 'success',
          message: response.message || 'Mock service configured successfully'
        })
      } else {
        setLastAction({
          type: 'error',
          message: response.message || 'Failed to configure mock service'
        })
      }
    } catch (err) {
      setLastAction({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to configure mock service'
      })
    }
  }

  // Handle refresh status
  const handleRefresh = async () => {
    setLastAction(null)
    try {
      await getStatus()
    } catch (err) {
      setLastAction({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to get mock service status'
      })
    }
  }

  // Clear action message after 5 seconds
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [lastAction])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TbBrain className="w-5 h-5" />
            <CardTitle>Mock Service</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{isRunning ? 'Running' : 'Stopped'}</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh status"
            >
              <TbRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          {isRunning
            ? `Mock service is running in ${MOCK_MODE_DESCRIPTIONS[currentMode]?.title || currentMode} mode`
            : 'Start mock service to simulate vehicle signals for testing'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Messages */}
        {lastAction && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            lastAction.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {lastAction.type === 'success' ? (
              <TbCheck className="w-5 h-5 flex-shrink-0" />
            ) : (
              <TbX className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{lastAction.message}</span>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && !error && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg">
            <TbLoader className="w-5 h-5 animate-spin" />
            <span className="text-sm">Connecting to mock service...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            <TbX className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Mode Selection Grid */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Mock Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(Object.keys(MOCK_MODE_DESCRIPTIONS) as MockMode[]).map((mode) => {
              const info = MOCK_MODE_DESCRIPTIONS[mode]
              const isSelected = selectedMode === mode
              const isCurrent = currentMode === mode

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${isCurrent && isRunning ? 'ring-2 ring-green-500/30' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-medium">{info.title}</span>
                    </div>
                    {isCurrent && isRunning && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Advanced Settings */}
        {selectedMode === 'echo-specific' && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <label className="text-sm font-medium">Specific Signals (comma-separated)</label>
            <Input
              placeholder="Vehicle.Body.Lights.Beam.Low.IsOn, Vehicle.ADAS.CruiseControl.SpeedSet"
              value={customSignals}
              onChange={(e) => setCustomSignals(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Only these signals will be echoed. Leave empty to use default signals.
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={isLoading || !isConnected}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <TbPlay className="w-4 h-4 mr-2" />
                  Start Mock Service
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => handleConfigure()}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  <>
                    <TbSettings className="w-4 h-4 mr-2" />
                    Apply Configuration
                  </>
                )}
              </Button>
              <Button
                onClick={handleStop}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? (
                  <>
                    <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <TbStop className="w-4 h-4 mr-2" />
                    Stop
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Service Info */}
        {status && (
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-between">
              <span>Container:</span>
              <span className="font-mono">{status.image || 'vehicle-simple-mock-service:latest'}</span>
            </div>
            {status.containerId && (
              <div className="flex justify-between">
                <span>Container ID:</span>
                <span className="font-mono truncate ml-2">{status.containerId}</span>
              </div>
            )}
          </div>
        )}

        {/* Info Banner */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="font-medium mb-1">About Mock Service:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Runs as a separate Docker container</li>
            <li>Connects to KUKSA Databroker to simulate vehicle signals</li>
            <li>Perfect for testing without real vehicle hardware</li>
            <li>Signals are echoed from actuators back to sensors</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default MockServiceControl
