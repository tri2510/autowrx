// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { DaSelect } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { DaPopup } from '@/components/atoms/DaPopup'
import { TbPackage, TbSettings, TbDeviceFloppy, TbCloudUpload } from 'react-icons/tb'
import { toast } from 'react-toastify'

interface SDVAppPackage {
  name: string
  version: string
  description: string
  pythonVersion: string
  entryPoint: string
  runtimeMode: 'docker' | 'native'
  kuksaConfig: {
    brokerAutoDetect: boolean
    fallbackBroker: boolean
    vssVersion: string
  }
  deployment: {
    targetDevices: string[]
    hotSwap: boolean
    otaEnabled: boolean
    resourceLimits: {
      memory: string
      cpu: string
    }
  }
  security: {
    sandboxLevel: 'basic' | 'advanced' | 'military'
    dataAccess: 'open' | 'restricted' | 'encrypted'
    interAppCommunication: boolean
  }
}

interface DaAppPackagerProps {
  pythonCode: string
  prototypeName?: string
  onPackageCreated?: (pkg: SDVAppPackage) => void
  onClose?: () => void
}

const DEFAULT_PACKAGE: SDVAppPackage = {
  name: '',
  version: '1.0.0',
  description: '',
  pythonVersion: '3.9+',
  entryPoint: 'app.py',
  runtimeMode: 'docker',
  kuksaConfig: {
    brokerAutoDetect: true,
    fallbackBroker: true,
    vssVersion: 'latest'
  },
  deployment: {
    targetDevices: ['jetson-orin', 'linux-generic'],
    hotSwap: true,
    otaEnabled: true,
    resourceLimits: {
      memory: '512MB',
      cpu: '0.5'
    }
  },
  security: {
    sandboxLevel: 'basic',
    dataAccess: 'open',
    interAppCommunication: true
  }
}

const DaAppPackager: FC<DaAppPackagerProps> = ({
  pythonCode,
  prototypeName,
  onPackageCreated,
  onClose
}) => {
  const [packageConfig, setPackageConfig] = useState<SDVAppPackage>(DEFAULT_PACKAGE)
  const [isPackaging, setIsPackaging] = useState(false)

  // Auto-fill name from prototype name
  useState(() => {
    if (prototypeName && !packageConfig.name) {
      setPackageConfig(prev => ({
        ...prev,
        name: prototypeName.toLowerCase().replace(/\s+/g, '-'),
        description: `SDV app: ${prototypeName}`
      }))
    }
  })

  const updatePackageConfig = useCallback((field: string, value: any) => {
    setPackageConfig(prev => {
      const keys = field.split('.')
      const updated = { ...prev }
      let current = updated

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return updated
    })
  }, [])

  const validatePackage = useCallback((): string[] => {
    const errors: string[] = []

    if (!packageConfig.name.trim()) errors.push('App name is required')
    if (!packageConfig.version.trim()) errors.push('Version is required')
    if (!pythonCode.trim()) errors.push('Python code is required')
    if (!packageConfig.name.match(/^[a-z0-9-]+$/)) {
      errors.push('App name must contain only lowercase letters, numbers, and hyphens')
    }

    return errors
  }, [packageConfig, pythonCode])

  const createPackage = useCallback(async () => {
    const errors = validatePackage()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    setIsPackaging(true)

    try {
      // Create the complete package
      const completePackage: SDVAppPackage = {
        ...packageConfig,
        // Include the actual Python code
        code: pythonCode,

        // Generate package metadata
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: 'AutoWRX',
          platform: 'SDV',
          architecture: 'universal'
        }
      }

      // Simulate packaging process
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success('App package created successfully!')
      onPackageCreated?.(completePackage)
      onClose?.()

    } catch (error) {
      console.error('Error creating package:', error)
      toast.error('Failed to create app package')
    } finally {
      setIsPackaging(false)
    }
  }, [packageConfig, pythonCode, validatePackage, onPackageCreated, onClose])

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TbPackage className="text-2xl text-da-primary-500" />
          <h2 className="text-xl font-bold text-gray-900">Package SDV App</h2>
        </div>
        {onClose && (
          <DaButton variant="outline" onClick={onClose}>
            Cancel
          </DaButton>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TbSettings className="text-da-primary-500" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Name *
              </label>
              <DaInput
                value={packageConfig.name}
                onChange={(e) => updatePackageConfig('name', e.target.value)}
                placeholder="my-sdv-app"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version *
              </label>
              <DaInput
                value={packageConfig.version}
                onChange={(e) => updatePackageConfig('version', e.target.value)}
                placeholder="1.0.0"
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <DaTextarea
              value={packageConfig.description}
              onChange={(e) => updatePackageConfig('description', e.target.value)}
              placeholder="Describe your SDV app functionality..."
              className="w-full h-20"
            />
          </div>
        </div>

        {/* Runtime Configuration */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TbDeviceFloppy className="text-da-primary-500" />
            Runtime Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Runtime Mode
              </label>
              <DaSelect
                value={packageConfig.runtimeMode}
                onChange={(e) => updatePackageConfig('runtimeMode', e.target.value)}
                className="w-full"
              >
                <option value="docker">Docker (Recommended)</option>
                <option value="native">Native Python</option>
              </DaSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Python Version
              </label>
              <DaInput
                value={packageConfig.pythonVersion}
                onChange={(e) => updatePackageConfig('pythonVersion', e.target.value)}
                placeholder="3.9+"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Point
              </label>
              <DaInput
                value={packageConfig.entryPoint}
                onChange={(e) => updatePackageConfig('entryPoint', e.target.value)}
                placeholder="app.py"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Memory Limit
              </label>
              <DaInput
                value={packageConfig.deployment.resourceLimits.memory}
                onChange={(e) => updatePackageConfig('deployment.resourceLimits.memory', e.target.value)}
                placeholder="512MB"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPU Limit
              </label>
              <DaInput
                value={packageConfig.deployment.resourceLimits.cpu}
                onChange={(e) => updatePackageConfig('deployment.resourceLimits.cpu', e.target.value)}
                placeholder="0.5"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Kuksa Configuration */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Kuksa Integration</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={packageConfig.kuksaConfig.brokerAutoDetect}
                onChange={(e) => updatePackageConfig('kuksaConfig.brokerAutoDetect', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Auto-discover Kuksa Databroker on network
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={packageConfig.kuksaConfig.fallbackBroker}
                onChange={(e) => updatePackageConfig('kuksaConfig.fallbackBroker', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Start fallback Kuksa Databroker if none found
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VSS Version
              </label>
              <DaSelect
                value={packageConfig.kuksaConfig.vssVersion}
                onChange={(e) => updatePackageConfig('kuksaConfig.vssVersion', e.target.value)}
                className="w-full"
              >
                <option value="latest">Latest</option>
                <option value="5.0">VSS 5.0</option>
                <option value="4.2">VSS 4.2</option>
                <option value="4.1">VSS 4.1</option>
                <option value="4.0">VSS 4.0</option>
              </DaSelect>
            </div>
          </div>
        </div>

        {/* Deployment Options */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TbCloudUpload className="text-da-primary-500" />
            Deployment Options
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={packageConfig.deployment.hotSwap}
                onChange={(e) => updatePackageConfig('deployment.hotSwap', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable hot-swapping (update without downtime)
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={packageConfig.deployment.otaEnabled}
                onChange={(e) => updatePackageConfig('deployment.otaEnabled', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable OTA (Over-The-Air) updates
              </span>
            </label>
          </div>
        </div>

        {/* Package Button */}
        <div className="flex justify-end">
          <DaButton
            variant="solid"
            onClick={createPackage}
            disabled={isPackaging || !pythonCode.trim()}
            className="min-w-32"
          >
            <TbPackage className="mr-2" />
            {isPackaging ? 'Packaging...' : 'Create Package'}
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default DaAppPackager