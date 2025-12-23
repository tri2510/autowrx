// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select'
import {
  TbLoader,
  TbCube,
  TbAlertCircle,
  TbCheck,
  TbRocket,
  TbRefresh,
  TbActivity,
  TbPlus,
  TbX,
  TbCode,
  TbBinary
} from 'react-icons/tb'
import SmartDeployForm, { SmartDeployment, SignalValidation } from './SmartDeployForm'

interface PythonDeploymentComponentProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: SmartDeployment | any) => Promise<any>
  isDeploying?: boolean
  deployedApps?: any[]
  onBack?: () => void
}

const PythonDeploymentComponent: FC<PythonDeploymentComponentProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = [],
  onBack
}) => {
  const [deployment, setDeployment] = useState<SmartDeployment>({
    id: '',
    name: '',
    type: 'python',
    code: '',
    dependencies: [],
    signals: [],
    environment: 'development'
  })

  const [detectedDependencies, setDetectedDependencies] = useState<string[]>([])
  const [signalValidation, setSignalValidation] = useState<SignalValidation>({
    valid: [],
    invalid: [],
    warnings: [],
    total: 0
  })
  const [isValidatingSignals, setIsValidatingSignals] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<{
    status: 'success' | 'error'
    message: string
    suggestions?: string[]
  } | null>(null)
  const [isDeployingKuksa, setIsDeployingKuksa] = useState(false)
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false) // Auto-detect off by default

  // Fixed dependencies that should not be auto-detected
  const FIXED_DEPS_BASE = ['kuksa_client', 'velocitas-sdk']

  // Trigger dependency detection
  const triggerDependencyDetection = useCallback(async () => {
    const code = deployment.code || ''
    if (code.trim()) {
      try {
        const allDeps = extractPythonDependencies(code)
        // Filter out fixed dependencies to avoid duplicates
        const filteredDeps = allDeps.filter(dep =>
          !FIXED_DEPS_BASE.some(fixed => dep.toLowerCase().startsWith(fixed.toLowerCase()))
        )
        setDetectedDependencies(filteredDeps)
      } catch (error) {
        console.error('Dependency detection failed:', error)
      }
    }
  }, [deployment.code])

  // Handle code change with optional dependency detection
  const handleCodeChange = useCallback(async (newCode: string) => {
    setDeployment(prev => ({ ...prev, code: newCode }))

    // Only auto-detect if enabled
    if (autoDetectEnabled && newCode.trim()) {
      try {
        const allDeps = extractPythonDependencies(newCode)
        // Filter out fixed dependencies to avoid duplicates
        const filteredDeps = allDeps.filter(dep =>
          !FIXED_DEPS_BASE.some(fixed => dep.toLowerCase().startsWith(fixed.toLowerCase()))
        )
        setDetectedDependencies(filteredDeps)
      } catch (error) {
        console.error('Dependency detection failed:', error)
      }
    } else if (!autoDetectEnabled) {
      setDetectedDependencies([])
    }
  }, [autoDetectEnabled])

  // Handle Python app deployment
  const handleDeploy = useCallback(async (deploymentToDeploy: SmartDeployment) => {
    try {
      console.log('🚀 Deploying Python application:', deploymentToDeploy.name)

      // Create enhanced deployment object for parent
      const enhancedDeployment = {
        ...deploymentToDeploy,
        deploymentType: 'python' as const,
        timestamp: new Date().toISOString(),
        vehicleId: selectedKit.id || 'default-vehicle'
      }

      console.log('🐍 Python deployment request:', enhancedDeployment)

      // Send deployment request to parent component
      await onDeploy(enhancedDeployment)

      console.log('✅ Python deployment successful:', deploymentToDeploy.name)
    } catch (error) {
      console.error('Python deployment failed:', error)
      throw error
    }
  }, [selectedKit, isRuntimeConnected, onDeploy])

  // Handle KUKSA server deployment using Docker API
  const handleDeployKuksaServer = useCallback(async () => {
    if (!selectedKit || !isRuntimeConnected) {
      setDeploymentResult({
        status: 'error',
        message: 'No runtime selected or not connected',
        suggestions: ['Please select a connected Vehicle Edge Runtime from the header']
      })
      return
    }

    setIsDeployingKuksa(true)
    setDeploymentResult(null)

    try {
      const timestamp = new Date().toLocaleTimeString()
      console.log('🚀 Starting KUKSA Server deployment using Docker API...')

      // Check if KUKSA server is already deployed
      const kuksaAlreadyDeployed = (deployedApps || []).some(app =>
        app.app_id && app.app_id.toLowerCase().includes('kuksa')
      )

      if (kuksaAlreadyDeployed) {
        setDeploymentResult({
          status: 'error',
          message: 'KUKSA Server is already deployed',
          suggestions: [
            'Check the Applications tab to manage existing KUKSA deployment',
            'Stop the existing KUKSA server before redeploying'
          ]
        })
        return
      }

      // Create Docker deployment request
      const dockerDeploymentRequest = {
        type: 'deploy_request',
        id: `deploy-kuksa-${Date.now()}`,
        prototype: {
          id: 'VEA-kuksa-databroker',
          name: 'KUKSA Databroker',
          type: 'docker',
          description: 'Eclipse KUKSA Vehicle Signal Databroker',
          config: {
            dockerCommand: [
              'run', '-d',
              '--name', 'VEA-kuksa-databroker',
              '--network', 'host',
              '-p', '55555:55555',
              '-p', '8090:8090',
              'ghcr.io/eclipse-kuksa/kuksa-databroker:0.4.4',
              '--insecure'
            ]
          }
        },
        vehicle_id: selectedKit.id || 'default-vehicle'
      }

      console.log('🐳 KUKSA Docker deployment request:', dockerDeploymentRequest)

      // Send deployment request
      const response = await onDeploy(dockerDeploymentRequest as any)

      console.log('📥 KUKSA deployment response:', response)
      console.log('📥 Response type:', typeof response)
      console.log('📥 Response is null/undefined:', response == null)
      if (response) {
        console.log('📥 Response keys:', Object.keys(response))
        console.log('📥 Response JSON:', JSON.stringify(response, null, 2))
      }

      // Check if deployment actually started (for Docker deployments)
      // Backend returns success if:
      // 1. Response exists and is an object
      // 2. No error field is present
      // 3. Type is not 'error'
      // 4. OR response is null/undefined (deployment initiated, no response yet)
      const isSuccess = !response ||
        (typeof response === 'object' && !response.error && response.type !== 'error')

      console.log('✅ Deployment success check:', isSuccess)

      if (isSuccess) {
        setDeploymentResult({
          status: 'success',
          message: `KUKSA Server deployed successfully${response?.executionId || response?.id ? ` (ID: ${response.executionId || response.id})` : ''}`,
          suggestions: [
            'KUKSA Databroker is now available at localhost:8090',
            'Use the Applications tab to monitor the deployment',
            'You can now connect Python apps to KUKSA signals',
            response?.containerId ? `Container ID: ${response.containerId}` : undefined
          ].filter(Boolean) as string[]
        })
      } else {
        const errorMsg = response?.error || response?.result || response?.message || JSON.stringify(response)
        console.error('❌ KUKSA deployment response indicates error:', errorMsg)
        throw new Error(`KUKSA deployment failed to start: ${errorMsg}`)
      }

    } catch (error) {
      console.error('KUKSA deployment failed:', error)
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'KUKSA deployment failed',
        suggestions: [
          'Check if Docker is running on the target runtime',
          'Verify network connectivity to the registry',
          'Check runtime logs for detailed error information'
        ]
      })
    } finally {
      setIsDeployingKuksa(false)
    }
  }, [selectedKit, isRuntimeConnected, deployedApps, onDeploy])

  // Helper function to extract Python dependencies (simplified)
  const extractPythonDependencies = (code: string): string[] => {
    const imports = code.match(/(?:from|import)\s+([^\s\n]+)/g)
    if (!imports) return []

    const deps = imports.map(imp => {
      if (imp.startsWith('from ')) {
        return imp.replace('from ', '').split(' ')[0]
      } else {
        return imp.replace('import ', '').split(' as ')[0]
      }
    })

    // Filter out standard library modules
    return deps.filter(dep =>
      !['os', 'sys', 'time', 'json', 'math', 'datetime', 'random', 'uuid'].includes(dep)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center">
            <TbCode className="w-6 h-6 mr-2" />
            Python Application Deployment
          </h3>
          <p className="text-muted-foreground text-sm">
            Deploy Python-based vehicle applications with real-time monitoring and signal management
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Types
          </Button>
        )}
      </div>

      {/* KUKSA Server Quick Deploy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbCube className="w-5 h-5 mr-2" />
            Quick Deploy: KUKSA Data Broker
          </CardTitle>
          <CardDescription>
            Deploy the Eclipse KUKSA Vehicle Signal Databroker for real-time data access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Recommended
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Provides vehicle signal API for Python apps
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>🌐 HTTP API: localhost:8090</span>
                <span>📡 gRPC: localhost:55555</span>
                <span>📊 Web UI Available</span>
              </div>
            </div>
            <Button
              onClick={handleDeployKuksaServer}
              disabled={!selectedKit || !isRuntimeConnected || isDeployingKuksa || isDeploying}
              className="whitespace-nowrap"
            >
              {isDeployingKuksa ? (
                <>
                  <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <TbRocket className="w-4 h-4 mr-2" />
                  Deploy KUKSA
                </>
              )}
            </Button>
          </div>

          {/* KUKSA Deployment Result */}
          {deploymentResult && (
            <div className={`mt-4 p-3 rounded-lg ${
              deploymentResult.status === 'success'
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-2">
                {deploymentResult.status === 'success' ? (
                  <TbCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <TbAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium text-sm ${
                    deploymentResult.status === 'success'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {deploymentResult.message}
                  </p>
                  {deploymentResult.suggestions && deploymentResult.suggestions.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {deploymentResult.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start">
                          <span className="w-1 h-1 rounded-full bg-current mt-1.5 mr-2 flex-shrink-0"></span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Python App Deployment */}
      <SmartDeployForm
        onSubmit={handleDeploy}
        isDeploying={isDeploying}
        detectedDependencies={detectedDependencies}
        signalValidation={signalValidation}
        onDetectDependencies={handleCodeChange}
        onValidateSignals={(signals) => {
          // Here you would implement signal validation logic
          // For now, just create a basic validation object
          const validation: SignalValidation = {
            valid: (signals || []).map(path => ({ path, access: 'subscribe' as const })),
            invalid: [],
            warnings: [],
            total: (signals || []).length
          }
          setSignalValidation(validation)
        }}
        selectedKit={selectedKit}
        isRuntimeConnected={isRuntimeConnected}
        autoDetectEnabled={autoDetectEnabled}
        onToggleAutoDetect={async () => {
          const newState = !autoDetectEnabled
          setAutoDetectEnabled(newState)
          // If enabling, trigger detection immediately
          if (newState) {
            await triggerDependencyDetection()
          } else {
            // If disabling, clear detected dependencies
            setDetectedDependencies([])
          }
        }}
      />

      {/* Connection Status */}
      {!selectedKit && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 text-yellow-600 dark:text-yellow-400">
              <TbAlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">No Runtime Selected</p>
                <p className="text-sm opacity-90">
                  Please select a Vehicle Edge Runtime from the dropdown above to deploy applications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedKit && !isRuntimeConnected && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 text-orange-600 dark:text-orange-400">
              <TbAlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Runtime Offline</p>
                <p className="text-sm opacity-90">
                  The selected runtime ({selectedKit.name}) is offline. Deployment may fail.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PythonDeploymentComponent