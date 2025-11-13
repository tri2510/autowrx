// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect, useCallback } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { TbDevice, TbSearch, TbRefresh, TbCheck, TbAlertTriangle, TbWifi, TbServer } from 'react-icons/tb'
import { toast } from 'react-toastify'

interface DeviceInfo {
  id: string
  name: string
  type: 'jetson-orin' | 'linux-generic' | 'automotive-prototype' | 'unknown'
  ip: string
  status: 'online' | 'offline' | 'error'
  runtime: 'docker' | 'native' | 'both'
  architecture: 'arm64' | 'x86_64' | 'unknown'
  capabilities: {
    gpu: boolean
    kuksa: boolean
    memory: string
    storage: string
  }
  lastSeen: string
}

interface DaDeviceScannerProps {
  onDevicesFound?: (devices: DeviceInfo[]) => void
  selectedDevices?: string[]
  onDeviceSelect?: (deviceId: string, selected: boolean) => void
  autoScan?: boolean
}

const DaDeviceScanner: FC<DaDeviceScannerProps> = ({
  onDevicesFound,
  selectedDevices = [],
  onDeviceSelect,
  autoScan = false
}) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  // Mock device scanning function
  const scanNetwork = useCallback(async (): Promise<DeviceInfo[]> => {
    const mockDevices: DeviceInfo[] = [
      {
        id: 'jetson-01',
        name: 'NVIDIA Jetson Orin DevKit',
        type: 'jetson-orin',
        ip: '192.168.1.100',
        status: 'online',
        runtime: 'both',
        architecture: 'arm64',
        capabilities: {
          gpu: true,
          kuksa: true,
          memory: '32GB',
          storage: '64GB'
        },
        lastSeen: new Date().toISOString()
      },
      {
        id: 'linux-01',
        name: 'Development Linux Box',
        type: 'linux-generic',
        ip: '192.168.1.101',
        status: 'online',
        runtime: 'both',
        architecture: 'x86_64',
        capabilities: {
          gpu: false,
          kuksa: true,
          memory: '16GB',
          storage: '500GB'
        },
        lastSeen: new Date().toISOString()
      },
      {
        id: 'auto-prototype-01',
        name: 'Automotive Prototype ECU',
        type: 'automotive-prototype',
        ip: '192.168.1.102',
        status: 'online',
        runtime: 'docker',
        architecture: 'arm64',
        capabilities: {
          gpu: false,
          kuksa: true,
          memory: '8GB',
          storage: '32GB'
        },
        lastSeen: new Date().toISOString()
      },
      {
        id: 'offline-device',
        name: 'Offline Raspberry Pi',
        type: 'linux-generic',
        ip: '192.168.1.103',
        status: 'offline',
        runtime: 'native',
        architecture: 'arm64',
        capabilities: {
          gpu: false,
          kuksa: false,
          memory: '4GB',
          storage: '32GB'
        },
        lastSeen: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ]

    // Simulate network scanning with progress
    for (let i = 0; i <= 100; i += 20) {
      setScanProgress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return mockDevices
  }, [])

  const startScan = useCallback(async () => {
    setIsScanning(true)
    setScanProgress(0)
    setDevices([])

    try {
      const foundDevices = await scanNetwork()
      setDevices(foundDevices)
      onDevicesFound?.(foundDevices)
      toast.success(`Found ${foundDevices.length} compatible devices`)
    } catch (error) {
      console.error('Error scanning devices:', error)
      toast.error('Failed to scan network for devices')
    } finally {
      setIsScanning(false)
      setScanProgress(0)
    }
  }, [scanNetwork, onDevicesFound])

  // Auto-scan on mount if enabled
  useEffect(() => {
    if (autoScan) {
      startScan()
    }
  }, [autoScan, startScan])

  const handleDeviceSelect = useCallback((deviceId: string, selected: boolean) => {
    onDeviceSelect?.(deviceId, selected)
  }, [onDeviceSelect])

  const getDeviceIcon = (device: DeviceInfo) => {
    if (device.status === 'offline') return <TbAlertTriangle className="text-gray-400" />
    if (device.status === 'error') return <TbAlertTriangle className="text-red-500" />
    return <TbCheck className="text-green-500" />
  }

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'jetson-orin': return <TbServer className="text-blue-500" />
      case 'linux-generic': return <TbDevice className="text-green-500" />
      case 'automotive-prototype': return <TbDevice className="text-purple-500" />
      default: return <TbDevice className="text-gray-500" />
    }
  }

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TbDevice className="text-2xl text-da-primary-500" />
          <h2 className="text-xl font-bold text-gray-900">Device Scanner</h2>
        </div>

        <DaButton
          variant="outline"
          onClick={startScan}
          disabled={isScanning}
          className="flex items-center gap-2"
        >
          <TbRefresh className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning...' : 'Rescan'}
        </DaButton>
      </div>

      {/* Scan Progress */}
      {isScanning && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Scanning network...</span>
            <span className="text-sm text-gray-500">{scanProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-da-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Device List */}
      {devices.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Found Devices ({devices.length})
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TbWifi />
              Network: 192.168.1.0/24
            </div>
          </div>

          {devices.map((device) => (
            <div
              key={device.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                selectedDevices.includes(device.id)
                  ? 'border-da-primary-500 bg-blue-50'
                  : device.status === 'online'
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Device Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={(e) => handleDeviceSelect(device.id, e.target.checked)}
                    disabled={device.status !== 'online'}
                    className="mt-1 rounded"
                  />

                  {/* Device Icons */}
                  <div className="flex flex-col gap-1">
                    {getDeviceIcon(device)}
                    {getDeviceTypeIcon(device.type)}
                  </div>

                  {/* Device Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{device.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        device.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {device.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">IP:</span> {device.ip}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {device.type.replace('-', ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Runtime:</span> {device.runtime}
                      </div>
                      <div>
                        <span className="font-medium">Arch:</span> {device.architecture}
                      </div>
                      <div>
                        <span className="font-medium">Memory:</span> {device.capabilities.memory}
                      </div>
                      <div>
                        <span className="font-medium">Storage:</span> {device.capabilities.storage}
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        device.capabilities.gpu
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        GPU: {device.capabilities.gpu ? 'Yes' : 'No'}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        device.capabilities.kuksa
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        Kuksa: {device.capabilities.kuksa ? 'Ready' : 'Not Available'}
                      </span>
                      <span className="text-gray-500">
                        Last seen: {formatLastSeen(device.lastSeen)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isScanning && (
        <div className="text-center py-12">
          <TbSearch className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Found</h3>
          <p className="text-gray-600 mb-4">
            Start a scan to discover compatible SDV devices on your network
          </p>
          <DaButton onClick={startScan} className="flex items-center gap-2 mx-auto">
            <TbSearch />
            Start Scan
          </DaButton>
        </div>
      )}

      {/* Selected Devices Summary */}
      {selectedDevices.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TbCheck className="text-blue-600" />
              <span className="font-semibold text-blue-900">
                {selectedDevices.length} device(s) selected for deployment
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Ready to deploy SDV apps
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DaDeviceScanner