// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { TbServer, TbPlug, TbRocket, TbLoader, TbCheck } from 'react-icons/tb'

interface KuksaServerSectionProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeployKuksaServer: () => void
  isDeployingKuksa: boolean
}

const KuksaServerSection: FC<KuksaServerSectionProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeployKuksaServer,
  isDeployingKuksa
}) => {
  const [deploymentMode, setDeploymentMode] = useState<'runtime' | 'external'>('runtime')
  const [externalServerUrl, setExternalServerUrl] = useState('ws://127.0.0.1:8090')
  const [isConnected, setIsConnected] = useState(false)

  const handleConnectToExternal = async () => {
    try {
      // Test connection to external KUKSA server
      const ws = new WebSocket(externalServerUrl)

      ws.onopen = () => {
        setIsConnected(true)
        ws.close()
      }

      ws.onerror = () => {
        setIsConnected(false)
      }

      ws.onclose = () => {
        // Connection closed
      }

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          setIsConnected(false)
        }
      }, 5000)
    } catch (error) {
      setIsConnected(false)
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TbServer className="w-5 h-5 text-blue-600" />
          <span>KUKSA Databroker Server</span>
        </CardTitle>
        <CardDescription>
          Deploy a KUKSA server inside the runtime or connect to an external server
          for vehicle signal management and data exchange.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deployment Mode Selection */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Choose Deployment Method:</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Runtime Deployment Option */}
            <div
              className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                deploymentMode === 'runtime'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setDeploymentMode('runtime')}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  deploymentMode === 'runtime'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {deploymentMode === 'runtime' && (
                    <div className="w-full h-full rounded-full bg-white" style={{ margin: '2px' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium flex items-center space-x-2">
                    <TbRocket className="w-4 h-4 text-blue-600" />
                    <span>Deploy in Runtime</span>
                  </h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start a new KUKSA server instance inside the selected Vehicle Edge Runtime.
                    Recommended for development and testing.
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedKit ? selectedKit.name : 'No runtime selected'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* External Connection Option */}
            <div
              className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                deploymentMode === 'external'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setDeploymentMode('external')}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  deploymentMode === 'external'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}>
                  {deploymentMode === 'external' && (
                    <div className="w-full h-full rounded-full bg-white" style={{ margin: '2px' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium flex items-center space-x-2">
                    <TbPlug className="w-4 h-4 text-green-600" />
                    <span>Connect to External</span>
                  </h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect to an existing KUKSA server running outside the runtime.
                    Use this for production or shared environments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Based on Mode */}
        {deploymentMode === 'runtime' ? (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900">Runtime Deployment Configuration</h5>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Server Details:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>WebSocket endpoint: <code className="bg-blue-100 px-1 rounded">ws://localhost:8090</code></li>
                <li>VSS database: <code className="bg-blue-100 px-1 rounded">vss_release_3.0.json</code></li>
                <li>Host binding: <code className="bg-blue-100 px-1 rounded">0.0.0.0:8090</code></li>
                <li>Auto-installs <code className="bg-blue-100 px-1 rounded">kuksa-val</code> dependency</li>
              </ul>
              {isRuntimeConnected ? (
                <div className="flex items-center space-x-1 text-green-700">
                  <TbCheck className="w-4 h-4" />
                  <span>Runtime is connected and ready</span>
                </div>
              ) : (
                <div className="text-yellow-700">
                  ⚠️ Please select and connect to a Vehicle Edge Runtime first
                </div>
              )}
            </div>

            <Button
              onClick={onDeployKuksaServer}
              disabled={!isRuntimeConnected || isDeployingKuksa}
              className="w-full"
            >
              {isDeployingKuksa ? (
                <>
                  <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                  Deploying KUKSA Server...
                </>
              ) : (
                <>
                  <TbRocket className="w-4 h-4 mr-2" />
                  Deploy KUKSA Server in Runtime
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-900">External Server Connection</h5>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-green-800">KUKSA Server URL:</label>
                <Input
                  value={externalServerUrl}
                  onChange={(e) => setExternalServerUrl(e.target.value)}
                  placeholder="ws://127.0.0.1:8090"
                  className="mt-1"
                />
              </div>

              <div className="text-sm text-green-800 space-y-2">
                <p><strong>Connection Requirements:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>KUKSA Databroker server must be running</li>
                  <li>WebSocket endpoint must be accessible</li>
                  <li>Compatible VSS database version</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleConnectToExternal}
                  variant="outline"
                  className="flex-1"
                >
                  {isConnected ? (
                    <>
                      <TbCheck className="w-4 h-4 mr-2 text-green-600" />
                      Connected
                    </>
                  ) : (
                    <>
                      <TbPlug className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    // Store external server configuration
                    if (isConnected) {
                      // TODO: Implement external server connection logic
                      console.log('Connecting to external KUKSA server:', externalServerUrl)
                    }
                  }}
                  disabled={!isConnected}
                  className="flex-1"
                >
                  Use External Server
                </Button>
              </div>

              {externalServerUrl && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> When using an external server, make sure your vehicle applications
                    are configured to connect to <code className="bg-yellow-100 px-1 rounded">{externalServerUrl}</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p><strong>What is KUKSA Databroker?</strong></p>
          <p>KUKSA (Kubernetes-based Unified Automotive Data Architecture) is an open-source platform
          for vehicle data management. The databroker provides standardized access to vehicle signals
          through WebSocket APIs using the VSS (Vehicle Signal Specification) standard.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default KuksaServerSection