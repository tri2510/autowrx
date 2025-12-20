// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import { 
  TbAlertTriangle, 
  TbRefresh, 
  TbSquareRotated, 
  TbArrowRight,
  TbCode,
  TbCube,
  TbActivity,
  TbWifi,
  TbServer,
  TbCheck,
  TbCopy,
  TbExternalLink
} from 'react-icons/tb'

interface ErrorSuggestionsProps {
  error: string
  suggestions: string[]
  onRetry?: () => void
  errorCode?: string
  context?: {
    appId?: string
    signal?: string
    dependency?: string
    runtime?: string
  }
}

const ErrorSuggestions: FC<ErrorSuggestionsProps> = ({
  error,
  suggestions,
  onRetry,
  errorCode,
  context
}) => {
  const [copiedSuggestion, setCopiedSuggestion] = useState<string | null>(null)

  // Generate contextual suggestions based on error type
  const generateSmartSuggestions = (errorMessage: string, ctx?: any): string[] => {
    const smartSuggestions: string[] = []
    
    // Connection errors
    if (errorMessage.toLowerCase().includes('connection') || 
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('network')) {
      smartSuggestions.push('Check your network connection')
      smartSuggestions.push('Verify the Vehicle Edge Runtime is running')
      smartSuggestions.push('Try reconnecting from the overview tab')
      
      if (ctx?.runtime) {
        smartSuggestions.push(`Ensure ${ctx.runtime} is online and accessible`)
      }
    }

    // Code errors
    if (errorMessage.toLowerCase().includes('syntax') ||
        errorMessage.toLowerCase().includes('import') ||
        errorMessage.toLowerCase().includes('module')) {
      smartSuggestions.push('Check for syntax errors in your Python code')
      smartSuggestions.push('Verify all required packages are listed in dependencies')
      
      if (ctx?.dependency) {
        smartSuggestions.push(`Check if "${ctx.dependency}" is a valid Python package`)
      }
      
      smartSuggestions.push('Try testing your code locally first')
    }

    // Resource errors
    if (errorMessage.toLowerCase().includes('memory') ||
        errorMessage.toLowerCase().includes('cpu') ||
        errorMessage.toLowerCase().includes('resource')) {
      smartSuggestions.push('Increase memory or CPU limits in deployment settings')
      smartSuggestions.push('Optimize your application to use fewer resources')
      smartSuggestions.push('Check for memory leaks or infinite loops')
    }

    // Permission errors
    if (errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('access') ||
        errorMessage.toLowerCase().includes('unauthorized')) {
      smartSuggestions.push('Check file permissions in your application')
      smartSuggestions.push('Verify the runtime has proper system permissions')
      smartSuggestions.push('Check if your app requires special vehicle data access')
    }

    // Signal errors
    if (errorMessage.toLowerCase().includes('signal') ||
        errorMessage.toLowerCase().includes('vss') ||
        ctx?.signal) {
      smartSuggestions.push('Validate signal paths against VSS specification')
      
      if (ctx?.signal) {
        smartSuggestions.push(`Check if "${ctx.signal}" is available in your vehicle`)
      }
      
      smartSuggestions.push('Ensure your vehicle supports the requested signals')
      smartSuggestions.push('Try with a different set of vehicle signals')
    }

    // Container/Docker errors
    if (errorMessage.toLowerCase().includes('container') ||
        errorMessage.toLowerCase().includes('docker')) {
      smartSuggestions.push('Check Docker installation and permissions')
      smartSuggestions.push('Ensure sufficient disk space for containers')
      smartSuggestions.push('Try clearing unused Docker containers')
    }

    // General deployment errors
    if (errorMessage.toLowerCase().includes('deployment') ||
        errorMessage.toLowerCase().includes('deploy')) {
      smartSuggestions.push('Verify all required fields are filled in deployment form')
      smartSuggestions.push('Check if the selected runtime is online')
      
      if (ctx?.appId) {
        smartSuggestions.push(`Try uninstalling app "${ctx.appId}" and deploying again`)
      }
    }

    return smartSuggestions
  }

  const allSuggestions = [...suggestions, ...generateSmartSuggestions(error, context)]
  const uniqueSuggestions = [...new Set(allSuggestions)]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuggestion(text)
      setTimeout(() => setCopiedSuggestion(null), 2000)
    })
  }

  const getErrorSeverity = (errorMessage: string): 'high' | 'medium' | 'low' => {
    const highSeverityPatterns = [
      'critical', 'fatal', 'crash', 'panic', 'segfault',
      'permission denied', 'access denied', 'unauthorized'
    ]
    
    const mediumSeverityPatterns = [
      'timeout', 'connection', 'network', 'failed', 'error',
      'invalid', 'not found', 'missing'
    ]

    const lowerMessage = errorMessage.toLowerCase()
    
    if (highSeverityPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'high'
    }
    
    if (mediumSeverityPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'medium'
    }
    
    return 'low'
  }

  const severity = getErrorSeverity(error)

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-400'
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400'
      default: return 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400'
    }
  }

  const getErrorIcon = (sev: string) => {
    switch (sev) {
      case 'high': return <TbAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'medium': return <TbAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      case 'low': return <TbAlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      default: return <TbAlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  return (
    <Card className={`${getSeverityColor(severity)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${getSeverityColor(severity)}`}>
              {getErrorIcon(severity)}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>Deployment Error</span>
                {errorCode && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {errorCode}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Something went wrong during deployment. Here are some suggestions to fix it.
              </CardDescription>
            </div>
          </div>
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <TbRefresh className="w-4 h-4 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Error Message */}
          <div>
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <TbAlertTriangle className="w-4 h-4" />
              <span>Error Message</span>
            </h4>
            <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg font-mono text-sm">
              {error}
            </div>
          </div>

          {/* Context Information */}
          {context && Object.keys(context).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Context</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {context.appId && (
                  <div>
                    <span className="font-medium">App ID:</span>
                    <p className="font-mono text-muted-foreground">{context.appId}</p>
                  </div>
                )}
                {context.signal && (
                  <div>
                    <span className="font-medium">Signal:</span>
                    <p className="font-mono text-muted-foreground">{context.signal}</p>
                  </div>
                )}
                {context.dependency && (
                  <div>
                    <span className="font-medium">Package:</span>
                    <p className="font-mono text-muted-foreground">{context.dependency}</p>
                  </div>
                )}
                {context.runtime && (
                  <div>
                    <span className="font-medium">Runtime:</span>
                    <p className="font-mono text-muted-foreground">{context.runtime}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          <div>
            <h4 className="font-medium mb-3">Suggested Solutions</h4>
            <div className="space-y-3">
              {uniqueSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm">{suggestion}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(suggestion)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    title="Copy suggestion"
                  >
                    {copiedSuggestion === suggestion ? (
                      <TbCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <TbCopy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(error)}
                className="flex items-center space-x-1"
              >
                <TbCopy className="w-4 h-4" />
                <span>Copy Error</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/eclipse-velocita/vehicle-edge-runtime/issues', '_blank')}
                className="flex items-center space-x-1"
              >
                <TbExternalLink className="w-4 h-4" />
                <span>Report Issue</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://eclipse-velocita.github.io/vehicle-edge-runtime/docs/', '_blank')}
                className="flex items-center space-x-1"
              >
                <TbExternalLink className="w-4 h-4" />
                <span>Documentation</span>
              </Button>
            </div>
          </div>

          {/* Help Section */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <TbAlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Need More Help?
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  If these suggestions don't resolve your issue, you can:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Check the <strong>Console tab</strong> for detailed error logs</li>
                  <li>Verify your <strong>runtime connection</strong> in the Overview tab</li>
                  <li>Test your <strong>application locally</strong> before deployment</li>
                  <li>Review the <strong>signal requirements</strong> in your application code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ErrorSuggestions