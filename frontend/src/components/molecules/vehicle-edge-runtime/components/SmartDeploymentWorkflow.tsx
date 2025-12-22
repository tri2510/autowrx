// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Textarea } from '@/components/atoms/textarea'
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
import AutoDependencyDetector from './AutoDependencyDetector'
import SmartDeployForm, { SmartDeployment, SignalValidation } from './SmartDeployForm'

interface SmartDeploymentWorkflowProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: SmartDeployment) => Promise<void>
  isDeploying?: boolean
}

const SmartDeploymentWorkflow: FC<SmartDeploymentWorkflowProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false
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
  const [signalValidation, setSignalValidation] = useState<SignalValidation | null>(null)
  const [isValidatingSignals, setIsValidatingSignals] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<{
    status: 'success' | 'error'
    message: string
    suggestions?: string[]
  } | null>(null)
  const [isDeployingKuksa, setIsDeployingKuksa] = useState(false)

  // Handle code change with dependency detection
  const handleCodeChange = useCallback(async (newCode: string) => {
    setDeployment(prev => ({ ...prev, code: newCode }))

    if (newCode.trim()) {
      try {
        // Simulate dependency detection
        const deps = extractPythonDependencies(newCode)
        setDetectedDependencies(deps)
      } catch (error) {
        console.error('Dependency detection failed:', error)
      }
    } else {
      setDetectedDependencies([])
    }
  }, [])

  // Handle KUKSA server deployment
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
      console.log('🚀 Starting KUKSA Server deployment...')

      // Create KUKSA server deployment data using the same mechanism as app deployment
      const kuksaServerDeployment: SmartDeployment = {
        id: 'kuksa-server-docker',
        name: 'KUKSA Databroker Server',
        type: 'python',
        code: `import os
import subprocess
import time
import signal
import sys
from pathlib import Path

# Install kuksa-val in container if not already installed
try:
    import kuksa.val.server
except ImportError:
    print('Installing kuksa-val...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'kuksa-val'])
    import kuksa.val.server

# Start Kuksa server using Python module
print('Starting Kuksa server...')
try:
    cmd = [
        sys.executable, '-m', 'kuksa.val.server',
        '--vss', '/vss-core/vss_release_3.0.json',
        '--port', '8090',
        '--host', '0.0.0.0',
        '--log-level', 'info'
    ]

    print(f'Command: {" ".join(cmd)}')

    # Start server process
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )

    print('Kuksa server starting...')
    print('Server will be available at: ws://localhost:8090')

    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print('\\\\nShutting down Kuksa server...')
        process.terminate()
        process.wait()
        print('Kuksa server stopped')
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Stream server output
    for line in iter(process.stdout.readline, ''):
        if line:
            print(line.rstrip())

except Exception as e:
    print(f'Error starting Kuksa server: {e}')
    sys.exit(1)
except KeyboardInterrupt:
    print('\\\\nShutting down...')`,
        dependencies: ['kuksa-val'],
        signals: [],
        environment: 'development'
      }

      await onDeploy(kuksaServerDeployment)

      setDeploymentResult({
        status: 'success',
        message: `KUKSA Databroker Server deployed successfully to ${selectedKit.name}!`,
        suggestions: [
          'Server will be available at: ws://localhost:8090',
          'Check the Applications tab to manage the KUKSA server',
          'Use the set value app to test connectivity to the server'
        ]
      })

      // Switch to apps tab to show the deployed KUKSA server
      setTimeout(() => {
        // This will be handled by the parent component
      }, 1000)

    } catch (error) {
      console.error('KUKSA server deployment failed:', error)
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'KUKSA server deployment failed',
        suggestions: [
          'Check if the runtime has sufficient resources',
          'Verify the runtime connection is stable',
          'Try redeploying the KUKSA server'
        ]
      })
    } finally {
      setIsDeployingKuksa(false)
    }
  }, [selectedKit, isRuntimeConnected, onDeploy])

  // Handle signal validation
  const handleSignalsChange = useCallback(async (signals: string[]) => {
    setDeployment(prev => ({ ...prev, signals }))

    if (signals.length > 0) {
      setIsValidatingSignals(true)
      try {
        // Simulate signal validation
        const validation = await validateVehicleSignals(signals)
        setSignalValidation(validation)
      } catch (error) {
        console.error('Signal validation failed:', error)
        setSignalValidation({
          valid: [],
          invalid: signals.map(signal => ({
            path: signal,
            access: 'subscribe' as const
          })),
          warnings: ['Signal validation failed'],
          total: signals.length
        })
      } finally {
        setIsValidatingSignals(false)
      }
    } else {
      setSignalValidation(null)
    }
  }, [])

  // Handle smart deployment
  const handleSmartDeploy = useCallback(async (deploymentData: SmartDeployment) => {
    if (!selectedKit || !isRuntimeConnected) {
      setDeploymentResult({
        status: 'error',
        message: 'No runtime selected or not connected',
        suggestions: ['Please select a connected Vehicle Edge Runtime from the header']
      })
      return
    }

    try {
      setDeploymentResult(null)

      // Merge detected dependencies with manual ones
      const allDependencies = [...new Set([...detectedDependencies, ...deploymentData.dependencies])]
      const enhancedDeployment = {
        ...deploymentData,
        dependencies: allDependencies
      }

      await onDeploy(enhancedDeployment)

      setDeploymentResult({
        status: 'success',
        message: `Application "${enhancedDeployment.name}" deployed successfully to ${selectedKit.name}!`,
        suggestions: [
          'Switch to the Console tab to monitor your application',
          'Check the Applications tab to manage your deployed apps'
        ]
      })

      // Reset form on success
      setDeployment({
        id: '',
        name: '',
        type: 'python',
        code: '',
        dependencies: [],
        signals: [],
        environment: 'development'
      })
      setDetectedDependencies([])
      setSignalValidation(null)

    } catch (error) {
      console.error('Smart deployment failed:', error)
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Deployment failed',
        suggestions: [
          'Check your application code for syntax errors',
          'Verify all required dependencies are specified',
          'Ensure your selected runtime is online and accessible',
          'Try refreshing the connection and deploying again'
        ]
      })
    }
  }, [selectedKit, isRuntimeConnected, detectedDependencies, onDeploy])

  // Extract Python dependencies using regex
  const extractPythonDependencies = (code: string): string[] => {
    const imports = new Set<string>()
    const patterns = [
      /import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g,
      /from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import/g
    ]

    patterns.forEach(pattern => {
      const matches = code.matchAll(pattern)
      for (const match of matches) {
        const packageName = match[1].split('.')[0]
        // Filter out standard library modules
        if (!isStandardLibraryModule(packageName) && !isLocalModule(packageName, code)) {
          imports.add(packageName)
        }
      }
    })

    return Array.from(imports).sort()
  }

  const isStandardLibraryModule = (moduleName: string): boolean => {
    const standardLibModules = [
      'os', 'sys', 'time', 'datetime', 'json', 'csv', 're', 'math', 'random',
      'collections', 'itertools', 'functools', 'operator', 'pathlib', 'urllib',
      'http', 'socket', 'threading', 'multiprocessing', 'asyncio', 'logging',
      'unittest', 'argparse', 'configparser', 'sqlite3', 'pickle', 'base64',
      'hashlib', 'hmac', 'uuid', 'decimal', 'fractions', 'statistics', 'typing'
    ]
    return standardLibModules.includes(moduleName)
  }

  const isLocalModule = (moduleName: string, code: string): boolean => {
    const localImportPattern = new RegExp(`from\\s+\\.\\s*${moduleName}\\s+import`)
    return localImportPattern.test(code)
  }

  // Simulate signal validation
  const validateVehicleSignals = async (signals: string[]): Promise<SignalValidation> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const validSignals = ['Vehicle.Speed', 'Vehicle.Acceleration', 'Vehicle.Location', 'Vehicle.FuelLevel', 'Vehicle.EngineTemperature']
    
    const valid = signals
      .filter(signal => validSignals.includes(signal))
      .map(signal => ({
        path: signal,
        access: 'subscribe' as const
      }))

    const invalid = signals
      .filter(signal => !validSignals.includes(signal))
      .map(signal => ({
        path: signal,
        access: 'subscribe' as const
      }))

    return {
      valid,
      invalid,
      warnings: invalid.length > 0 ? ['Some signals are not available in the current VSS tree'] : [],
      total: signals.length
    }
  }

  if (!selectedKit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbRocket className="w-5 h-5" />
            <span>Smart Deployment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TbCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Runtime Selected</h3>
            <p className="text-muted-foreground mb-6">
              Please select a Vehicle Edge Runtime from the header to deploy applications.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isRuntimeConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbRocket className="w-5 h-5" />
            <span>Smart Deployment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TbAlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Runtime Not Connected</h3>
            <p className="text-muted-foreground mb-6">
              The selected Vehicle Edge Runtime is not connected. Please check the connection and try again.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbRocket className="w-5 h-5" />
            <span>Smart Deployment</span>
          </CardTitle>
          <CardDescription>
            Intelligent deployment with auto-dependency detection and signal validation for {selectedKit.name}
          </CardDescription>
        </CardHeader>
      </Card>

      <SmartDeployForm
        onSubmit={handleSmartDeploy}
        isDeploying={isDeploying}
        isDeployingKuksa={isDeployingKuksa}
        onDeployKuksaServer={handleDeployKuksaServer}
        selectedKit={selectedKit}
        isRuntimeConnected={isRuntimeConnected}
        detectedDependencies={detectedDependencies}
        signalValidation={signalValidation}
        onDetectDependencies={handleCodeChange}
        onValidateSignals={handleSignalsChange}
      />

      {/* Dependency Detection Status */}
      {detectedDependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <TbCube className="w-4 h-4" />
              <span>Auto-Detected Dependencies ({detectedDependencies.length})</span>
            </CardTitle>
            <CardDescription>
              These packages will be automatically installed during deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {detectedDependencies.map(dep => (
                <Badge key={dep} variant="secondary" className="flex items-center space-x-1">
                  <TbCube className="w-3 h-3" />
                  <span>{dep}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signal Validation Status */}
      {signalValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TbActivity className="w-4 h-4" />
              <span>Signal Validation Results</span>
            </CardTitle>
            <CardDescription>
              {signalValidation.invalid.length === 0 
                ? 'All signals are available and validated' 
                : `${signalValidation.invalid.length} of ${signalValidation.total} signals are invalid`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signalValidation.valid.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-600 mb-2">Valid Signals ({signalValidation.valid.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {signalValidation.valid.map(signal => (
                      <Badge key={signal.path} variant="default" className="text-xs">
                        <TbCheck className="w-3 h-3 mr-1" />
                        {signal.path}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {signalValidation.invalid.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Invalid Signals ({signalValidation.invalid.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {signalValidation.invalid.map(signal => (
                      <Badge key={signal.path} variant="destructive" className="text-xs">
                        <TbAlertCircle className="w-3 h-3 mr-1" />
                        {signal.path}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {signalValidation.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-600 mb-2">Warnings:</p>
                  <ul className="text-sm text-yellow-600 list-disc list-inside">
                    {signalValidation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Result */}
      {deploymentResult && (
        <Card className={deploymentResult.status === 'success' 
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        }>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${
              deploymentResult.status === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {deploymentResult.status === 'success' ? (
                <TbCheck className="w-5 h-5" />
              ) : (
                <TbAlertCircle className="w-5 h-5" />
              )}
              <span>
                {deploymentResult.status === 'success' ? 'Deployment Successful' : 'Deployment Failed'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className={`${
                deploymentResult.status === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {deploymentResult.message}
              </p>
              
              {deploymentResult.suggestions && deploymentResult.suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Suggestions:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {deploymentResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className={
                        deploymentResult.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SmartDeploymentWorkflow