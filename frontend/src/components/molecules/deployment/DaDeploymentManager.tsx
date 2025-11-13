// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { TbRocket, TbLoader, TbCheck, TbAlertTriangle, TbX, TbRefresh } from 'react-icons/tb'
import { toast } from 'react-toastify'
import { DeviceInfo } from './DaDeviceScanner'

interface SDVAppPackage {
  name: string
  version: string
  code?: string
  runtimeMode: 'docker' | 'native'
  deployment: {
    targetDevices: string[]
    hotSwap: boolean
    otaEnabled: boolean
  }
  kuksaConfig: {
    brokerAutoDetect: boolean
    fallbackBroker: boolean
    vssVersion: string
  }
}

interface DeploymentStatus {
  deviceId: string
  status: 'pending' | 'deploying' | 'success' | 'error'
  progress: number
  message: string
  startTime?: string
  endTime?: string
  error?: string
}

interface DaDeploymentManagerProps {
  appPackage: SDVAppPackage
  selectedDevices: DeviceInfo[]
  onDeploymentComplete?: (results: DeploymentStatus[]) => void
  onClose?: () => void
}

const DaDeploymentManager: FC<DaDeploymentManagerProps> = ({
  appPackage,
  selectedDevices,
  onDeploymentComplete,
  onClose
}) => {
  const [deploymentStatuses, setDeploymentStatuses] = useState<DeploymentStatus[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Initialize deployment statuses
  useState(() => {
    const initialStatuses = selectedDevices.map(device => ({
      deviceId: device.id,
      status: 'pending' as const,
      progress: 0,
      message: `Ready to deploy to ${device.name}`
    }))
    setDeploymentStatuses(initialStatuses)
  })

  const updateDeploymentStatus = useCallback((deviceId: string, updates: Partial<DeploymentStatus>) => {
    setDeploymentStatuses(prev =>
      prev.map(status =>
        status.deviceId === deviceId
          ? { ...status, ...updates }
          : status
      )
    )
  }, [])

  const simulateDeployment = useCallback(async (device: DeviceInfo): Promise<DeploymentStatus> => {
    const deviceId = device.id
    const deviceName = device.name

    try {
      // Stage 1: Connection
      updateDeploymentStatus(deviceId, {
        status: 'deploying',
        progress: 10,
        message: `Connecting to ${deviceName}...`,
        startTime: new Date().toISOString()
      })
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Stage 2: Platform Compatibility Check
      updateDeploymentStatus(deviceId, {
        progress: 25,
        message: 'Checking platform compatibility...'
      })
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check runtime compatibility
      if (appPackage.runtimeMode === 'native' && device.runtime === 'docker') {
        throw new Error('Native deployment not supported on this device')
      }

      // Stage 3: Kuksa Integration
      updateDeploymentStatus(deviceId, {
        progress: 40,
        message: 'Configuring Kuksa integration...'
      })
      await new Promise(resolve => setTimeout(resolve, 800))

      // Simulate Kuksa setup
      if (!device.capabilities.kuksa && !appPackage.kuksaConfig.fallbackBroker) {
        throw new Error('Kuksa Databroker not available and fallback disabled')
      }

      // Stage 4: Package Transfer
      updateDeploymentStatus(deviceId, {
        progress: 60,
        message: 'Transferring app package...'
      })
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Stage 5: Installation
      updateDeploymentStatus(deviceId, {
        progress: 80,
        message: `Installing ${appPackage.name} v${appPackage.version}...`
      })
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Stage 6: Starting Application
      updateDeploymentStatus(deviceId, {
        progress: 90,
        message: 'Starting SDV application...'
      })
      await new Promise(resolve => setTimeout(resolve, 500))

      // Stage 7: Health Check
      updateDeploymentStatus(deviceId, {
        progress: 95,
        message: 'Performing health check...'
      })
      await new Promise(resolve => setTimeout(resolve, 300))

      // Success
      const successStatus: DeploymentStatus = {
        deviceId,
        status: 'success',
        progress: 100,
        message: `Successfully deployed to ${deviceName}`,
        endTime: new Date().toISOString()
      }

      updateDeploymentStatus(deviceId, successStatus)
      return successStatus

    } catch (error) {
      const errorStatus: DeploymentStatus = {
        deviceId,
        status: 'error',
        progress: 0,
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: new Date().toISOString()
      }

      updateDeploymentStatus(deviceId, errorStatus)
      return errorStatus
    }
  }, [appPackage, updateDeploymentStatus])

  const deployToDevices = useCallback(async () => {
    if (selectedDevices.length === 0) {
      toast.error('No devices selected for deployment')
      return
    }

    setIsDeploying(true)

    try {
      // Reset statuses
      setDeploymentStatuses(prev =>
        prev.map(status => ({
          ...status,
          status: 'pending' as const,
          progress: 0,
          message: `Ready to deploy`,
          error: undefined
        }))
      )

      // Deploy to all devices in parallel
      const deploymentPromises = selectedDevices.map(device =>
        simulateDeployment(device)
      )

      const results = await Promise.all(deploymentPromises)

      // Count successes and failures
      const successes = results.filter(r => r.status === 'success').length
      const failures = results.filter(r => r.status === 'error').length

      if (successes > 0) {
        toast.success(`Successfully deployed to ${successes} device(s)`)
      }
      if (failures > 0) {
        toast.error(`Failed to deploy to ${failures} device(s)`)
      }

      onDeploymentComplete?.(results)

    } catch (error) {
      console.error('Deployment error:', error)
      toast.error('Deployment process failed')
    } finally {
      setIsDeploying(false)
    }
  }, [selectedDevices, simulateDeployment, onDeploymentComplete])

  const retryFailedDeployments = useCallback(async () => {
    const failedStatuses = deploymentStatuses.filter(s => s.status === 'error')
    const failedDevices = selectedDevices.filter(device =>
      failedStatuses.some(status => status.deviceId === device.id)
    )

    if (failedDevices.length === 0) return

    setIsDeploying(true)

    try {
      const retryPromises = failedDevices.map(device => simulateDeployment(device))
      await Promise.all(retryPromises)
      toast.success('Retry completed')
    } catch (error) {
      toast.error('Retry failed')
    } finally {
      setIsDeploying(false)
    }
  }, [deploymentStatuses, selectedDevices, simulateDeployment])

  const getDeploymentSummary = useCallback(() => {
    const total = deploymentStatuses.length
    const pending = deploymentStatuses.filter(s => s.status === 'pending').length
    const deploying = deploymentStatuses.filter(s => s.status === 'deploying').length
    const success = deploymentStatuses.filter(s => s.status === 'success').length
    const error = deploymentStatuses.filter(s => s.status === 'error').length

    return { total, pending, deploying, success, error }
  }, [deploymentStatuses])

  const summary = getDeploymentSummary()

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TbRocket className="text-2xl text-da-primary-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deployment Manager</h2>
            <p className="text-sm text-gray-600">
              Deploying {appPackage.name} v{appPackage.version}
            </p>
          </div>
        </div>

        {onClose && (
          <DaButton variant="outline" onClick={onClose} disabled={isDeploying}>
            <TbX />
          </DaButton>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summary.deploying}</div>
          <div className="text-sm text-gray-600">Deploying</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.success}</div>
          <div className="text-sm text-gray-600">Success</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{summary.error}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
      </div>

      {/* Deployment List */}
      <div className="space-y-3 mb-6">
        {deploymentStatuses.map((status) => {
          const device = selectedDevices.find(d => d.id === status.deviceId)
          const deviceName = device?.name || status.deviceId

          return (
            <div
              key={status.deviceId}
              className={`border rounded-lg p-4 ${
                status.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : status.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : status.status === 'deploying'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {status.status === 'success' && <TbCheck className="text-green-600" />}
                  {status.status === 'error' && <TbAlertTriangle className="text-red-600" />}
                  {status.status === 'deploying' && <TbLoader className="text-blue-600 animate-spin" />}
                  {status.status === 'pending' && <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}

                  <span className="font-semibold text-gray-900">{deviceName}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    status.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : status.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : status.status === 'deploying'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {status.status}
                  </span>
                </div>

                <span className="text-sm text-gray-600">
                  {status.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              {status.status === 'deploying' && (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Message */}
              <div className="text-sm text-gray-700">{status.message}</div>

              {/* Error Details */}
              {status.error && showDetails && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                  Error: {status.error}
                </div>
              )}

              {/* Timing Info */}
              {status.startTime && (
                <div className="mt-2 text-xs text-gray-500">
                  Started: {new Date(status.startTime).toLocaleTimeString()}
                  {status.endTime && (
                    <> • Completed: {new Date(status.endTime).toLocaleTimeString()}</>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DaButton
            variant="solid"
            onClick={deployToDevices}
            disabled={isDeploying || selectedDevices.length === 0}
            className="flex items-center gap-2"
          >
            <TbRocket />
            {isDeploying ? 'Deploying...' : 'Deploy to Devices'}
          </DaButton>

          {summary.error > 0 && !isDeploying && (
            <DaButton
              variant="outline"
              onClick={retryFailedDeployments}
              className="flex items-center gap-2"
            >
              <TbRefresh />
              Retry Failed ({summary.error})
            </DaButton>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
              className="rounded"
            />
            Show error details
          </label>
        </div>
      </div>

      {/* Deployment Complete Message */}
      {summary.success > 0 && summary.error === 0 && !isDeploying && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <TbCheck className="text-xl" />
            <span className="font-semibold">
              Deployment completed successfully! {summary.success} device(s) are now running {appPackage.name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DaDeploymentManager