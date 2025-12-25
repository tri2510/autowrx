// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import {
  TbCode,
  TbBinary,
  TbPackage,
  TbInfoCircle
} from 'react-icons/tb'

export type DeploymentType = 'python' | 'binary' | 'docker'

interface DeploymentTypeConfig {
  id: DeploymentType
  name: string
  description: string
  icon: React.ReactNode
  badge: string
  badgeColor: string
  features: string[]
  status: 'available' | 'coming-soon'
}

interface DeploymentTypeSelectorProps {
  selectedType: DeploymentType
  onTypeChange: (type: DeploymentType) => void
  disabled?: boolean
}

const deploymentTypes: DeploymentTypeConfig[] = [
  {
    id: 'python',
    name: 'Python Application',
    description: 'Deploy Python-based vehicle applications with real-time monitoring and signal management.',
    icon: <TbCode className="w-6 h-6" />,
    badge: 'Available',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    features: [
      'Code editor with syntax highlighting',
      'Auto dependency detection',
      'Vehicle signal integration',
      'Real-time debugging',
      'Environment variable management'
    ],
    status: 'available'
  },
  {
    id: 'binary',
    name: 'Binary Application',
    description: 'Deploy pre-compiled binary applications with automatic containerization.',
    icon: <TbBinary className="w-6 h-6" />,
    badge: 'Other Use Cases',
    badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    features: [
      'Binary file upload with base64 encoding',
      'URL download support for binaries',
      'Automatic Docker containerization',
      'Custom run commands and base images',
      'Resource limits and environment variables'
    ],
    status: 'coming-soon'
  },
  {
    id: 'docker',
    name: 'Docker Container',
    description: 'Deploy existing Docker images or custom container configurations.',
    icon: <TbPackage className="w-6 h-6" />,
    badge: 'Other Use Cases',
    badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    features: [
      'Deploy existing Docker images',
      'Custom Docker command execution',
      'Docker Compose support',
      'Port and volume mapping',
      'Network and runtime configuration'
    ],
    status: 'coming-soon'
  }
]

const DeploymentTypeSelector: FC<DeploymentTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Deployment Type</h3>
        <p className="text-sm text-muted-foreground">
          Select how you want to deploy your application
        </p>
      </div>

      {/* Deployment Type Options - Vertical List */}
      <div className="space-y-3">
        {deploymentTypes.map((type) => {
          const isAvailable = type.status === 'available'
          const isSelected = selectedType === type.id

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : isAvailable
                    ? 'hover:shadow-md hover:border-primary/50'
                    : 'cursor-not-allowed opacity-60'
              } ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border'
              }`}
              onClick={() => {
                if (!disabled && isAvailable) {
                  onTypeChange(type.id)
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {type.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{type.name}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${type.badgeColor}`}
                      >
                        {type.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {type.description}
                    </p>

                    {/* Features - Compact */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {type.features.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="flex items-center">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground mr-1.5"></span>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Indicator */}
                  <div className="flex-shrink-0">
                    {isAvailable ? (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <TbInfoCircle className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Message */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">
          <TbInfoCircle className="inline-block w-3 h-3 mr-1" />
          Python code deployment is available. Binary and Docker are for different application types.
        </p>
      </div>
    </div>
  )
}

export default DeploymentTypeSelector