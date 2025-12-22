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
}

const SmartDeploymentWorkflow: FC<SmartDeploymentWorkflowProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = []
}) => {
  return (
    <DeploymentOrchestrator
      selectedKit={selectedKit}
      isRuntimeConnected={isRuntimeConnected}
      onDeploy={onDeploy}
      isDeploying={isDeploying}
      deployedApps={deployedApps}
    />
  )
}

export default SmartDeploymentWorkflow