// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import { TbBinary } from 'react-icons/tb'

interface BinaryDeploymentComponentProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: any) => Promise<any>
  isDeploying?: boolean
  deployedApps?: any[]
  onBack?: () => void
}

const BinaryDeploymentComponent: FC<BinaryDeploymentComponentProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = [],
  onBack
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center">
            <TbBinary className="w-6 h-6 mr-2" />
            Binary Application Deployment
          </h3>
          <p className="text-muted-foreground text-sm">
            Deploy compiled binary applications to the Vehicle Edge Runtime
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Types
          </Button>
        )}
      </div>

      {/* Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Binary Deployment Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Binary application deployment functionality is under development.
            This feature will allow you to deploy compiled binary applications
            to the Vehicle Edge Runtime with containerization support.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please provide implementation details to complete this feature.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default BinaryDeploymentComponent