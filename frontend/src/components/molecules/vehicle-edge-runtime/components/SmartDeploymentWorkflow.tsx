// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DeploymentOrchestrator from './DeploymentOrchestrator'

interface SmartDeploymentWorkflowProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: any) => Promise<void>
  isDeploying?: boolean
  deployedApps?: any[]
  selectedDeploymentType?: 'python' | 'binary' | 'docker'
  onDeploymentTypeChange?: (type: 'python' | 'binary' | 'docker') => void
  showTypeSelector?: boolean
  onShowTypeSelectorChange?: (show: boolean) => void
}

const SmartDeploymentWorkflow: FC<SmartDeploymentWorkflowProps> = ({
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
  return (
    <DeploymentOrchestrator
      selectedKit={selectedKit}
      isRuntimeConnected={isRuntimeConnected}
      onDeploy={onDeploy}
      isDeploying={isDeploying}
      deployedApps={deployedApps}
      selectedDeploymentType={selectedDeploymentType}
      onDeploymentTypeChange={onDeploymentTypeChange}
      showTypeSelector={showTypeSelector}
      onShowTypeSelectorChange={onShowTypeSelectorChange}
    />
  )
}

export default SmartDeploymentWorkflow