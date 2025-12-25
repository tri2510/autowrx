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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Choose Deployment Type</h3>
        <p className="text-muted-foreground">
          Select the type of application you want to deploy to your Vehicle Edge Runtime.
        </p>
      </div>

      {/* Deployment Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border'
              }`}
              onClick={() => {
                if (!disabled && isAvailable) {
                  onTypeChange(type.id)
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {type.icon}
                  </div>
                  <Badge
                    variant="secondary"
                    className={type.badgeColor}
                  >
                    {type.badge}
                  </Badge>
                </div>

                <CardTitle className="text-lg">{type.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {type.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center">
                    <TbInfoCircle className="w-4 h-4 mr-1" />
                    Features
                  </h4>
                  <ul className="space-y-1">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 mr-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {isAvailable ? (
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      disabled={disabled}
                    >
                      {isSelected ? 'Selected' : 'Choose This Type'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled
                      className="w-full"
                    >
                      For Other Scenarios
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Message */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          <TbInfoCircle className="inline-block w-4 h-4 mr-1" />
          Python code deployment is available here. Binary and Docker options are for different application types.
        </p>
      </div>
    </div>
  )
}

export default DeploymentTypeSelector