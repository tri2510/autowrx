// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { 
  TbLoader, 
  TbCube, 
  TbRocket, 
  TbProgress,
  TbCheck,
  TbAlertCircle,
  TbX,
  TbSquare
} from 'react-icons/tb'

export type DeploymentStage =
  | 'installing_dependencies'
  | 'installing_dependency'
  | 'starting_application'
  | 'validating_signals'
  | 'code_conversion'
  | 'container_creation'
  | 'deployment_complete'
  | 'deployment_failed'

export interface ProgressDetails {
  dependency?: string
  current?: number
  total?: number
  progress?: number
  error?: string
  stage_message?: string
}

interface DeploymentProgressProps {
  appId: string
  stage: DeploymentStage
  details: ProgressDetails
  onStop?: () => void
  onComplete?: () => void
  isExpanded?: boolean
}

const DeploymentProgress: FC<DeploymentProgressProps> = ({
  appId,
  stage,
  details,
  onStop,
  onComplete,
  isExpanded = true
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [currentProgress, setCurrentProgress] = useState(0)

  // Calculate progress percentage
  const calculateProgress = (stage: DeploymentStage, details: ProgressDetails): number => {
    if (details.progress !== undefined) {
      return Math.max(0, Math.min(100, details.progress))
    }

    switch (stage) {
      case 'validating_signals':
        return 10
      case 'code_conversion':
        return 20
      case 'installing_dependencies':
        if (details.current !== undefined && details.total !== undefined) {
          return 20 + (details.current / details.total) * 40
        }
        return 30
      case 'installing_dependency':
        return 40
      case 'container_creation':
        return 70
      case 'starting_application':
        return 85
      case 'deployment_complete':
        return 100
      case 'deployment_failed':
        return currentProgress // Keep current progress on failure
      default:
        return 0
    }
  }

  // Update progress when stage changes
  useEffect(() => {
    const newProgress = calculateProgress(stage, details)
    setCurrentProgress(newProgress)

    // Auto-hide on completion
    if (stage === 'deployment_complete' && onComplete) {
      const timer = setTimeout(() => {
        onComplete()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [stage, details, onComplete])

  // Get stage-specific icon and message
  const getStageInfo = (stage: DeploymentStage, details: ProgressDetails) => {
    switch (stage) {
      case 'validating_signals':
        return {
          icon: <TbProgress className="w-4 h-4 text-blue-500" />,
          title: 'Validating Vehicle Signals',
          message: 'Checking signal availability against VSS specification...',
          color: 'blue'
        }
      case 'code_conversion':
        return {
          icon: <TbProgress className="w-4 h-4 text-purple-500" />,
          title: 'Converting Code',
          message: 'Transforming code to Vehicle App format...',
          color: 'purple'
        }
      case 'installing_dependencies':
        return {
          icon: <TbCube className="w-4 h-4 text-cyan-500" />,
          title: 'Installing Dependencies',
          message: details.current && details.total 
            ? `Installing packages (${details.current}/${details.total})...`
            : 'Installing required packages...',
          color: 'cyan'
        }
      case 'installing_dependency':
        return {
          icon: <TbCube className="w-4 h-4 text-cyan-500 animate-pulse" />,
          title: 'Installing Package',
          message: details.dependency 
            ? `Installing ${details.dependency}...`
            : 'Installing package...',
          color: 'cyan'
        }
      case 'container_creation':
        return {
          icon: <TbProgress className="w-4 h-4 text-indigo-500" />,
          title: 'Creating Container',
          message: 'Setting up isolated environment...',
          color: 'indigo'
        }
      case 'starting_application':
        return {
          icon: <TbRocket className="w-4 h-4 text-orange-500 animate-pulse" />,
          title: 'Starting Application',
          message: 'Launching vehicle application...',
          color: 'orange'
        }
      case 'deployment_complete':
        return {
          icon: <TbCheck className="w-4 h-4 text-green-500" />,
          title: 'Deployment Complete',
          message: `Application "${appId}" deployed successfully!`,
          color: 'green'
        }
      case 'deployment_failed':
        return {
          icon: <TbAlertCircle className="w-4 h-4 text-red-500" />,
          title: 'Deployment Failed',
          message: details.error || 'Deployment encountered an error',
          color: 'red'
        }
      default:
        return {
          icon: <TbProgress className="w-4 h-4 text-gray-500" />,
          title: 'Processing',
          message: 'Processing deployment...',
          color: 'gray'
        }
    }
  }

  const stageInfo = getStageInfo(stage, details)
  const progress = calculateProgress(stage, details)
  const isActive = stage !== 'deployment_complete' && stage !== 'deployment_failed'

  if (!isVisible) return null

  return (
    <Card className={`${stage === 'deployment_failed' ? 'border-red-200 dark:border-red-800' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${stageInfo.color}-100 dark:bg-${stageInfo.color}-900`}>
              {stageInfo.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{stageInfo.title}</span>
                {isActive && (
                  <Badge variant="secondary" className="animate-pulse">
                    Active
                  </Badge>
                )}
                {stage === 'deployment_complete' && (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Complete
                  </Badge>
                )}
                {stage === 'deployment_failed' && (
                  <Badge variant="destructive">
                    Failed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{stageInfo.message}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Stop button for active deployments */}
            {isActive && onStop && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TbSquare className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <TbX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${
                    stage === 'deployment_complete'
                      ? 'bg-green-500'
                      : stage === 'deployment_failed'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Application ID:</span>
                <p className="text-muted-foreground font-mono text-xs">{appId}</p>
              </div>
              <div>
                <span className="font-medium">Current Stage:</span>
                <p className="text-muted-foreground">{stage.replace(/_/g, ' ')}</p>
              </div>
              
              {details.dependency && (
                <div className="col-span-2">
                  <span className="font-medium">Current Package:</span>
                  <p className="text-muted-foreground font-mono text-sm">{details.dependency}</p>
                </div>
              )}
              
              {details.current !== undefined && details.total !== undefined && (
                <div className="col-span-2">
                  <span className="font-medium">Items Processed:</span>
                  <p className="text-muted-foreground">
                    {details.current} of {details.total} packages
                  </p>
                </div>
              )}
            </div>

            {/* Stage-specific additional information */}
            {details.stage_message && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{details.stage_message}</p>
              </div>
            )}

            {/* Error information */}
            {stage === 'deployment_failed' && details.error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <TbAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error Details
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {details.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success actions */}
            {stage === 'deployment_complete' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TbCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Ready to Monitor
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Switch to the Console tab to monitor your application or view it in the Applications tab.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default DeploymentProgress