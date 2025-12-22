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
import { TbServer, TbPlug, TbRocket, TbLoader, TbCheck, TbChevronDown, TbChevronUp, TbCopy } from 'react-icons/tb'

interface CollapsibleKuksaSectionProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeployKuksaServer: () => void
  isDeployingKuksa: boolean
}

const CollapsibleKuksaSection: FC<CollapsibleKuksaSectionProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeployKuksaServer,
  isDeployingKuksa
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [deploymentMode, setDeploymentMode] = useState<'runtime' | 'external'>('runtime')
  const [externalServerUrl, setExternalServerUrl] = useState('ws://127.0.0.1:8090')
  const [isConnected, setIsConnected] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const handleConnectToExternal = async () => {
    try {
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getPythonConnectionCode = () => {
    const host = externalServerUrl.replace('ws://', '').replace('wss://', '')
    const [hostname, port] = host.split(':')

    return `# KUKSA Client Configuration for External Server
from kuksa_client.grpc import VSSClient
from kuksa_client.grpc import Datapoint

# Replace with your external server details
SERVER_HOST = "${hostname}"
SERVER_PORT = ${port}

def main():
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print("Connected to external KUKSA server!")

            # Example: Set vehicle speed
            client.set_current_values({
                'Vehicle.Speed': Datapoint(55.0)
            })

            # Example: Read vehicle speed
            current_speed = client.get_current_values(['Vehicle.Speed'])
            print(f"Current speed: {current_speed}")

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()`
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TbServer className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">KUKSA Databroker Server</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1"
          >
            <span className="text-sm">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
            {isExpanded ? (
              <TbChevronUp className="w-4 h-4" />
            ) : (
              <TbChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Configure KUKSA server for vehicle signal management
          {deploymentMode === 'runtime' ? ' inside the runtime' : ' with external connection'}
        </CardDescription>
      </CardHeader>

      {isExpanded && (
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
              <h5 className="font-medium text-green-900">External Server Connection Setup</h5>

              {/* Step 1: Configure Connection */}
              <div className="space-y-3">
                <h6 className="text-sm font-medium text-green-800">Step 1: Configure External Server URL</h6>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-800">KUKSA Server URL:</label>
                  <div className="flex space-x-2">
                    <Input
                      value={externalServerUrl}
                      onChange={(e) => setExternalServerUrl(e.target.value)}
                      placeholder="ws://127.0.0.1:8090"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleConnectToExternal}
                      variant="outline"
                      disabled={!externalServerUrl.trim()}
                    >
                      {isConnected ? (
                        <>
                          <TbCheck className="w-4 h-4 mr-1 text-green-600" />
                          Connected
                        </>
                      ) : (
                        <>
                          <TbPlug className="w-4 h-4 mr-1" />
                          Test
                        </>
                      )}
                    </Button>
                  </div>
                  {externalServerUrl && (
                    <p className="text-xs text-green-700">
                      Testing connection to: <code className="bg-green-100 px-1 rounded">{externalServerUrl}</code>
                    </p>
                  )}
                </div>
              </div>

              {/* Step 2: Get Python Configuration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h6 className="text-sm font-medium text-green-800">Step 2: Copy Python Configuration</h6>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getPythonConnectionCode())}
                    className="flex items-center space-x-1 text-green-700"
                  >
                    {copiedToClipboard ? (
                      <>
                        <TbCheck className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <TbCopy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-white border border-green-200 rounded-md p-3">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
{getPythonConnectionCode()}
                  </pre>
                </div>

                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>How to use this code:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Copy the code above into your Python application</li>
                    <li>Import the required <code className="bg-green-100 px-1 rounded">kuksa_client</code> library</li>
                    <li>Your app will automatically connect to the external KUKSA server</li>
                    <li>Use <code className="bg-green-100 px-1 rounded">pip install kuksa-client</code> if needed</li>
                  </ol>
                </div>
              </div>

              {/* Step 3: Deploy Application */}
              <div className="space-y-3">
                <h6 className="text-sm font-medium text-green-800">Step 3: Deploy Your Application</h6>
                <div className="text-xs text-green-700 space-y-1">
                  <p>Now you can deploy your Python application using the regular "Deploy Application" button above.</p>
                  <p>Your app will automatically connect to the external KUKSA server at <code className="bg-green-100 px-1 rounded">{externalServerUrl}</code></p>
                </div>
              </div>

              {/* Usage Note */}
              {externalServerUrl && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> When using external KUKSA server, make sure:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-1 ml-2 space-y-1">
                    <li>The external server is running and accessible</li>
                    <li>Your vehicle applications use the exact server URL: <code className="bg-yellow-100 px-1 rounded">{externalServerUrl}</code></li>
                    <li>The VSS database version is compatible with your applications</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Status Information */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p><strong>About KUKSA Databroker:</strong></p>
            <p>KUKSA (Kubernetes-based Unified Automotive Data Architecture) is an open-source platform
            for vehicle data management. The databroker provides standardized access to vehicle signals
            through WebSocket APIs using the VSS (Vehicle Signal Specification) standard.</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default CollapsibleKuksaSection