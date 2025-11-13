// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect, useCallback } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect } from '@/components/atoms/DaSelect'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { DaText } from '@/components/atoms/DaText'
import { TbServer, TbSearch, TbCheck, TbAlertTriangle, TbSettings } from 'react-icons/tb'
import { toast } from 'react-toastify'

interface KuksaBrokerInfo {
  host: string
  port: number
  version: string
  status: 'online' | 'offline' | 'unknown'
  responseTime?: number
  vssVersion?: string
}

interface DaKuksaConfigProps {
  config: {
    brokerAutoDetect: boolean
    fallbackBroker: boolean
    vssVersion: string
    customBrokerUrl?: string
  }
  onConfigChange?: (config: any) => void
  onBrokerDetected?: (brokerInfo: KuksaBrokerInfo) => void
  showAdvanced?: boolean
}

const DEFAULT_BROKER_PORTS = [1883, 8883, 8090, 8091, 9001]
const DEFAULT_BROKER_HOSTS = ['localhost', '127.0.0.1', '192.168.1.100', '192.168.1.101']

const DaKuksaConfig: FC<DaKuksaConfigProps> = ({
  config,
  onConfigChange,
  onBrokerDetected,
  showAdvanced = false
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedBrokers, setDetectedBrokers] = useState<KuksaBrokerInfo[]>([])
  const [selectedBroker, setSelectedBroker] = useState<KuksaBrokerInfo | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({})

  // Simulate broker detection
  const scanForBrokers = useCallback(async () => {
    setIsScanning(true)
    setScanProgress(0)
    setDetectedBrokers([])
    setSelectedBroker(null)

    const mockBrokers: KuksaBrokerInfo[] = []

    // Simulate scanning different hosts and ports
    for (let i = 0; i < DEFAULT_BROKER_HOSTS.length; i++) {
      const host = DEFAULT_BROKER_HOSTS[i]

      for (let j = 0; j < DEFAULT_BROKER_PORTS.length; j++) {
        const port = DEFAULT_BROKER_PORTS[j]
        setScanProgress(Math.round((i * DEFAULT_BROKER_PORTS.length + j) / (DEFAULT_BROKER_HOSTS.length * DEFAULT_BROKER_PORTS.length) * 100))

        // Simulate network test with random success
        await new Promise(resolve => setTimeout(resolve, 100))

        const isOnline = Math.random() > 0.7 // 30% chance of finding a broker

        if (isOnline) {
          const brokerInfo: KuksaBrokerInfo = {
            host,
            port,
            version: '0.4.0',
            status: 'online',
            responseTime: Math.floor(Math.random() * 50) + 10,
            vssVersion: config.vssVersion
          }
          mockBrokers.push(brokerInfo)
          break // Found broker on this host, move to next
        }
      }
    }

    setDetectedBrokers(mockBrokers)

    // Auto-select first online broker
    const onlineBroker = mockBrokers.find(b => b.status === 'online')
    if (onlineBroker) {
      setSelectedBroker(onlineBroker)
      onBrokerDetected?.(onlineBroker)
      toast.success(`Found Kuksa Databroker at ${onlineBroker.host}:${onlineBroker.port}`)
    } else {
      toast.warning('No Kuksa Databroker found on network')
    }

    setIsScanning(false)
    setScanProgress(0)
  }, [config.vssVersion, onBrokerDetected])

  // Test connection to a specific broker
  const testBrokerConnection = useCallback(async (broker: KuksaBrokerInfo) => {
    setTestResults(prev => ({ ...prev, [`${broker.host}:${broker.port}`]: false }))

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000))

    const isSuccess = broker.status === 'online'
    setTestResults(prev => ({ ...prev, [`${broker.host}:${broker.port}`]: isSuccess }))

    if (isSuccess) {
      toast.success(`Connected to Kuksa Databroker at ${broker.host}:${broker.port}`)
      setSelectedBroker(broker)
      onBrokerDetected?.(broker)
    } else {
      toast.error(`Failed to connect to Kuksa Databroker at ${broker.host}:${broker.port}`)
    }
  }, [onBrokerDetected])

  const updateConfig = useCallback((field: string, value: any) => {
    onConfigChange?.(prev => ({
      ...prev,
      [field]: value
    }))
  }, [onConfigChange])

  const addCustomBroker = useCallback(() => {
    const customBroker: KuksaBrokerInfo = {
      host: 'custom-host',
      port: 1883,
      version: '0.4.0',
      status: 'unknown'
    }
    setDetectedBrokers(prev => [...prev, customBroker])
  }, [])

  const removeCustomBroker = useCallback((index: number) => {
    setDetectedBrokers(prev => prev.filter((_, i) => i !== index))
    if (selectedBroker === detectedBrokers[index]) {
      setSelectedBroker(null)
    }
  }, [detectedBrokers, selectedBroker])

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TbServer className="text-2xl text-da-primary-500" />
          <h2 className="text-xl font-bold text-gray-900">Kuksa Configuration</h2>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Configuration */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TbSettings className="text-da-primary-500" />
            Basic Configuration
          </h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.brokerAutoDetect}
                onChange={(e) => updateConfig('brokerAutoDetect', e.target.checked)}
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Auto-detect Kuksa Databroker</span>
                <p className="text-sm text-gray-600">Automatically discover Kuksa brokers on the network</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.fallbackBroker}
                onChange={(e) => updateConfig('fallbackBroker', e.target.checked)}
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Start fallback Databroker</span>
                <p className="text-sm text-gray-600">Start a local Kuksa broker if none are found</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VSS Version
              </label>
              <DaSelect
                value={config.vssVersion}
                onChange={(e) => updateConfig('vssVersion', e.target.value)}
                className="w-full"
              >
                <option value="latest">Latest (Recommended)</option>
                <option value="5.0">VSS 5.0</option>
                <option value="4.2">VSS 4.2</option>
                <option value="4.1">VSS 4.1</option>
                <option value="4.0">VSS 4.0</option>
                <option value="3.1">VSS 3.1</option>
              </DaSelect>
            </div>
          </div>
        </div>

        {/* Broker Discovery */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TbSearch className="text-da-primary-500" />
              Broker Discovery
            </h3>

            <DaButton
              variant="outline"
              onClick={scanForBrokers}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              <TbSearch className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Scanning...' : 'Scan Network'}
            </DaButton>
          </div>

          {/* Scan Progress */}
          {isScanning && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Scanning for Kuksa Databrokers...</span>
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

          {/* Detected Brokers */}
          {detectedBrokers.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">
                Found {detectedBrokers.length} broker(s):
              </div>

              {detectedBrokers.map((broker, index) => {
                const brokerKey = `${broker.host}:${broker.port}`
                const isTested = testResults[brokerKey] !== undefined
                const testSuccess = testResults[brokerKey]

                return (
                  <div
                    key={brokerKey}
                    className={`border rounded-lg p-4 ${
                      selectedBroker?.host === broker.host && selectedBroker?.port === broker.port
                        ? 'border-da-primary-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {broker.status === 'online' ? (
                          <TbCheck className="text-green-500" />
                        ) : broker.status === 'offline' ? (
                          <TbAlertTriangle className="text-red-500" />
                        ) : (
                          <TbAlertTriangle className="text-yellow-500" />
                        )}

                        <div>
                          <div className="font-semibold text-gray-900">
                            {broker.host}:{broker.port}
                          </div>
                          <div className="text-sm text-gray-600">
                            Version {broker.version}
                            {broker.responseTime && ` • ${broker.responseTime}ms response time`}
                            {broker.vssVersion && ` • VSS ${broker.vssVersion}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTested && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            testSuccess
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {testSuccess ? 'Connected' : 'Failed'}
                          </span>
                        )}

                        <DaButton
                          variant="outline"
                          size="sm"
                          onClick={() => testBrokerConnection(broker)}
                          disabled={isScanning}
                        >
                          Test
                        </DaButton>

                        {broker.host === 'custom-host' && (
                          <DaButton
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomBroker(index)}
                          >
                            Remove
                          </DaButton>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !isScanning && (
            <div className="text-center py-8">
              <TbSearch className="text-4xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No Kuksa Databrokers found</p>
              <p className="text-sm text-gray-500">Start a scan to discover brokers on your network</p>
            </div>
          )}
        </div>

        {/* Custom Broker Configuration */}
        {showAdvanced && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Advanced Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Broker URL
                </label>
                <div className="flex gap-2">
                  <DaInput
                    value={config.customBrokerUrl || ''}
                    onChange={(e) => updateConfig('customBrokerUrl', e.target.value)}
                    placeholder="mqtt://localhost:1883"
                    className="flex-1"
                  />
                  <DaButton onClick={addCustomBroker}>
                    Add
                  </DaButton>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Timeout (seconds)
                </label>
                <DaInput
                  type="number"
                  defaultValue="30"
                  placeholder="30"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Configuration
                </label>
                <DaTextarea
                  placeholder='# Additional Kuksa configuration
# See Kuksa documentation for options'
                  className="w-full h-24 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Broker Summary */}
        {selectedBroker && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <TbCheck className="text-green-600" />
              <span className="font-semibold text-green-900">
                Using Kuksa Databroker at {selectedBroker.host}:{selectedBroker.port}
              </span>
            </div>
            <div className="text-sm text-green-700 mt-1">
              VSS Version: {selectedBroker.vssVersion} • Response time: {selectedBroker.responseTime}ms
            </div>
          </div>
        )}

        {/* Fallback Broker Notice */}
        {config.fallbackBroker && !selectedBroker && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <TbAlertTriangle className="text-yellow-600" />
              <span className="font-semibold text-yellow-900">
                Fallback Databroker will be started
              </span>
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              No external Kuksa Databroker found - a local broker will be started for development
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DaKuksaConfig