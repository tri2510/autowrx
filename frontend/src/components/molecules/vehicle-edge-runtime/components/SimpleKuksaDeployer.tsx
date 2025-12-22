// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { TbServer, TbRocket, TbLoader, TbCheck, TbInfoCircle, TbPlug } from 'react-icons/tb'

interface SimpleKuksaDeployerProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeployKuksaServer: () => void
  isDeployingKuksa: boolean
}

const SimpleKuksaDeployer: FC<SimpleKuksaDeployerProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeployKuksaServer,
  isDeployingKuksa
}) => {
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleDeploy = async () => {
    if (!selectedKit || !isRuntimeConnected) {
      setDeploymentStatus('error')
      return
    }

    setDeploymentStatus('idle')
    await onDeployKuksaServer()

    // Success will be handled by the parent component
    // We can add basic status handling here if needed
  }

  const isDisabled = !selectedKit || !isRuntimeConnected || isDeployingKuksa

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TbServer className="w-5 h-5 text-green-600" />
          <CardTitle className="text-lg">KUKSA Databroker Server</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Docker Container
          </Badge>
        </div>
        <CardDescription>
          Deploy the Eclipse Kuksa vehicle signal databroker as a Docker container
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Overview */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {isRuntimeConnected ? (
                <TbCheck className="w-4 h-4 text-green-600" />
              ) : (
                <TbInfoCircle className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-sm font-medium">
                Runtime Status: {isRuntimeConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Target: {selectedKit?.name || 'No runtime selected'}
              </span>
            </div>
          </div>

          {/* Deployment Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <TbRocket className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-medium">Quick Deployment</h4>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                One-click deployment of KUKSA Databroker server using Docker:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 ml-2">
                <li>Container: <code className="bg-gray-100 px-1 rounded">ghcr.io/eclipse-kuksa/kuksa-databroker:main</code></li>
                <li>Network: Host networking (localhost access)</li>
                <li>Ports: gRPC:55555, HTTP/VSS:8090</li>
                <li>Auto-managed lifecycle (start/stop/restart)</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <TbPlug className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">After deployment, the server will:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs mt-1 text-blue-700">
                    <li>Appear as <code className="bg-blue-100 px-1 rounded">kuksa-databroker</code> in Applications tab</li>
                    <li>Be accessible at localhost:55555 (gRPC) and localhost:8090 (HTTP)</li>
                    <li>Support full lifecycle management (start/stop/restart)</li>
                    <li>Allow Python apps to connect via localhost</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              {isDisabled && (
                <span>
                  {!selectedKit
                    ? 'Please select a Vehicle Edge Runtime'
                    : !isRuntimeConnected
                    ? 'Runtime connection required'
                    : 'Deployment in progress...'}
                </span>
              )}
            </div>

            <Button
              onClick={handleDeploy}
              disabled={isDisabled}
              className="min-w-[160px]"
              variant={isDisabled ? "secondary" : "default"}
            >
              {isDeployingKuksa ? (
                <>
                  <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <TbRocket className="w-4 h-4 mr-2" />
                  Deploy KUKSA Server
                </>
              )}
            </Button>
          </div>

          {/* Simple Status Messages */}
          {deploymentStatus === 'error' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Deployment failed. Please check your runtime connection and try again.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SimpleKuksaDeployer