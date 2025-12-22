// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { TbArrowLeft, TbPackage, TbBinary, TbCode } from 'react-icons/tb'
import { DeploymentType } from './DeploymentTypeSelector'
import DeploymentTypeSelector from './DeploymentTypeSelector'
import PythonDeploymentComponent from './PythonDeploymentComponent'
import BinaryDeploymentPlaceholder from './BinaryDeploymentPlaceholder'
import DockerDeploymentPlaceholder from './DockerDeploymentPlaceholder'

interface DeploymentOrchestratorProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: any) => Promise<void>
  isDeploying?: boolean
  deployedApps?: any[]
}

const DeploymentOrchestrator: FC<DeploymentOrchestratorProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = []
}) => {
  const [selectedType, setSelectedType] = useState<DeploymentType>('python' as DeploymentType)
  const [showTypeSelector, setShowTypeSelector] = useState(true)

  const handleTypeSelect = (type: DeploymentType) => {
    setSelectedType(type)
    setShowTypeSelector(false)
  }

  const handleBackToTypeSelector = () => {
    setShowTypeSelector(true)
  }

  const handleDeploy = async (deployment: any) => {
    try {
      // For Docker deployments, pass through without modification
      if (deployment.type === 'deploy_request' && deployment.prototype?.type === 'docker') {
        await onDeploy(deployment)
        return
      }

      // Add deployment type information for other deployments
      const enhancedDeployment = {
        ...deployment,
        deploymentType: selectedType,
        timestamp: new Date().toISOString()
      }

      await onDeploy(enhancedDeployment)
    } catch (error) {
      console.error('Deployment failed:', error)
      throw error
    }
  }

  const renderDeploymentComponent = () => {
    switch (selectedType) {
      case 'python':
        return (
          <PythonDeploymentComponent
            selectedKit={selectedKit}
            isRuntimeConnected={isRuntimeConnected}
            onDeploy={handleDeploy}
            isDeploying={isDeploying}
            deployedApps={deployedApps}
            onBack={handleBackToTypeSelector}
          />
        )

      case 'binary':
        return (
          <BinaryDeploymentPlaceholder
            onBack={handleBackToTypeSelector}
          />
        )

      case 'docker':
        return (
          <DockerDeploymentPlaceholder
            onBack={handleBackToTypeSelector}
          />
        )

      default:
        return (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Invalid deployment type selected</p>
            <Button variant="outline" onClick={handleBackToTypeSelector}>
              Back to Type Selection
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      {!showTypeSelector && (
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBackToTypeSelector}
            className="flex items-center"
          >
            <TbArrowLeft className="w-4 h-4 mr-2" />
            Change Deployment Type
          </Button>

          <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-lg">
            {selectedType === 'python' && <TbCode className="w-4 h-4" />}
            {selectedType === 'binary' && <TbBinary className="w-4 h-4" />}
            {selectedType === 'docker' && <TbPackage className="w-4 h-4" />}
            <span className="text-sm font-medium capitalize">
              {selectedType === 'python' ? 'Python Application' :
               selectedType === 'binary' ? 'Binary Application' : 'Docker Container'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {showTypeSelector ? (
        <DeploymentTypeSelector
          selectedType={selectedType}
          onTypeChange={handleTypeSelect}
          disabled={isDeploying}
        />
      ) : (
        renderDeploymentComponent()
      )}

      {/* Deployment Status Overlay */}
      {isDeploying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <div>
                <p className="font-medium">Deploying {selectedType} Application</p>
                <p className="text-sm text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeploymentOrchestrator