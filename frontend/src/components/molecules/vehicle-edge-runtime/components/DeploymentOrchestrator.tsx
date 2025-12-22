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
import BinaryDeploymentComponent from './BinaryDeploymentComponent'
import DockerDeploymentComponent from './DockerDeploymentComponent'

interface DeploymentOrchestratorProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: any) => Promise<any>
  isDeploying?: boolean
  deployedApps?: any[]
  selectedDeploymentType?: 'python' | 'binary' | 'docker'
  onDeploymentTypeChange?: (type: 'python' | 'binary' | 'docker') => void
  showTypeSelector?: boolean
  onShowTypeSelectorChange?: (show: boolean) => void
}

const DeploymentOrchestrator: FC<DeploymentOrchestratorProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = [],
  selectedDeploymentType = 'python',
  onDeploymentTypeChange,
  showTypeSelector = true,
  onShowTypeSelectorChange
}) => {
  const handleTypeSelect = (type: DeploymentType) => {
    if (onDeploymentTypeChange) {
      onDeploymentTypeChange(type)
    }
    if (onShowTypeSelectorChange) {
      onShowTypeSelectorChange(false)
    }
  }

  const handleBackToTypeSelector = () => {
    if (onShowTypeSelectorChange) {
      onShowTypeSelectorChange(true)
    }
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
        deploymentType: selectedDeploymentType,
        timestamp: new Date().toISOString()
      }

      await onDeploy(enhancedDeployment)
    } catch (error) {
      console.error('Deployment failed:', error)
      throw error
    }
  }

  const renderDeploymentComponent = () => {
    switch (selectedDeploymentType) {
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
          <BinaryDeploymentComponent
            selectedKit={selectedKit}
            isRuntimeConnected={isRuntimeConnected}
            onDeploy={handleDeploy}
            isDeploying={isDeploying}
            deployedApps={deployedApps}
            onBack={handleBackToTypeSelector}
          />
        )

      case 'docker':
        return (
          <DockerDeploymentComponent
            selectedKit={selectedKit}
            isRuntimeConnected={isRuntimeConnected}
            onDeploy={handleDeploy}
            isDeploying={isDeploying}
            deployedApps={deployedApps}
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
            {selectedDeploymentType === 'python' && <TbCode className="w-4 h-4" />}
            {selectedDeploymentType === 'binary' && <TbBinary className="w-4 h-4" />}
            {selectedDeploymentType === 'docker' && <TbPackage className="w-4 h-4" />}
            <span className="text-sm font-medium capitalize">
              {selectedDeploymentType === 'python' ? 'Python Application' :
               selectedDeploymentType === 'binary' ? 'Binary Application' : 'Docker Container'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {showTypeSelector ? (
        <DeploymentTypeSelector
          selectedType={selectedDeploymentType}
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
                <p className="font-medium">Deploying {selectedDeploymentType} Application</p>
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