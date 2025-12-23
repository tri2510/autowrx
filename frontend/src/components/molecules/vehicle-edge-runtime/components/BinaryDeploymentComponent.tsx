// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Textarea } from '@/components/atoms/textarea'
import { Badge } from '@/components/atoms/badge'
import {
  TbBinary,
  TbUpload,
  TbAlertCircle,
  TbRocket,
  TbLoader,
  TbCheck,
  TbX,
  TbPlus,
  TbTrash
} from 'react-icons/tb'

interface BinaryDeploymentComponentProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: any) => Promise<any>
  isDeploying?: boolean
  deployedApps?: any[]
  onBack?: () => void
}

interface BinaryConfig {
  args: string[]
  env: Record<string, string>
}

const BinaryDeploymentComponent: FC<BinaryDeploymentComponentProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = [],
  onBack
}) => {
  const [appName, setAppName] = useState('')
  const [appDescription, setAppDescription] = useState('')
  const [binaryFile, setBinaryFile] = useState<File | null>(null)
  const [binaryBase64, setBinaryBase64] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<{
    status: 'success' | 'error'
    message: string
    appId?: string
    containerId?: string
    suggestions?: string[]
  } | null>(null)

  const [args, setArgs] = useState<string[]>([])
  const [newArg, setNewArg] = useState('')
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')

  // Convert file to base64
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Extract base64 data (remove data URL prefix)
        const base64Data = result.split(',')[1] || result
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      setDeploymentResult({
        status: 'error',
        message: 'File too large',
        suggestions: ['Maximum file size is 50MB', 'Please select a smaller binary file']
      })
      return
    }

    // Validate it's a binary file (executable or no extension)
    const validExtensions = ['', '.bin', '.exe', '.out', '.elf', '.app', '.run']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    // Also check mime type for binary files
    const isBinaryFile = file.type === 'application/octet-stream' ||
                        file.type === 'application/x-executable' ||
                        file.type === 'application/x-elf' ||
                        validExtensions.includes(fileExtension)

    if (!isBinaryFile && !file.name.match(/^[a-zA-Z0-9_-]+$/)) {
      setDeploymentResult({
        status: 'error',
        message: 'Invalid file type',
        suggestions: ['Please select a valid binary file (.bin, .exe, .out, .elf, etc.)', 'Or an executable without extension']
      })
      return
    }

    try {
      setBinaryFile(file)
      const base64 = await convertFileToBase64(file)
      setBinaryBase64(base64)
      setDeploymentResult(null)
    } catch (error) {
      console.error('Error converting file to base64:', error)
      setDeploymentResult({
        status: 'error',
        message: 'Failed to process file',
        suggestions: ['Please try selecting the file again', 'Ensure the file is not corrupted']
      })
    }
  }, [convertFileToBase64])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Handle input file change
  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Add argument
  const handleAddArg = useCallback(() => {
    if (newArg.trim()) {
      setArgs([...args, newArg.trim()])
      setNewArg('')
    }
  }, [args, newArg])

  // Remove argument
  const handleRemoveArg = useCallback((index: number) => {
    setArgs(args.filter((_, i) => i !== index))
  }, [args])

  // Add environment variable
  const handleAddEnv = useCallback(() => {
    if (newEnvKey.trim()) {
      setEnvVars({
        ...envVars,
        [newEnvKey.trim()]: newEnvValue.trim()
      })
      setNewEnvKey('')
      setNewEnvValue('')
    }
  }, [envVars, newEnvKey, newEnvValue])

  // Remove environment variable
  const handleRemoveEnv = useCallback((key: string) => {
    const newEnvVars = { ...envVars }
    delete newEnvVars[key]
    setEnvVars(newEnvVars)
  }, [envVars])

  // Deploy binary application
  const handleDeploy = useCallback(async () => {
    // Validation
    if (!appName.trim()) {
      setDeploymentResult({
        status: 'error',
        message: 'App name is required',
        suggestions: ['Please enter a name for your application']
      })
      return
    }

    if (!binaryFile || !binaryBase64) {
      setDeploymentResult({
        status: 'error',
        message: 'Binary file is required',
        suggestions: ['Please select a binary file to deploy', 'You can drag and drop or click to browse']
      })
      return
    }

    if (!selectedKit) {
      setDeploymentResult({
        status: 'error',
        message: 'No runtime selected',
        suggestions: ['Please select a Vehicle Edge Runtime from the header']
      })
      return
    }

    setDeploymentResult(null)

    try {
      // Create deployment request matching API specification
      const deploymentRequest = {
        type: 'deploy_request',
        id: `deploy-binary-${Date.now()}`,
        prototype: {
          id: appName.toLowerCase().replace(/\s+/g, '-'),
          name: appName,
          type: 'binary',
          description: appDescription || `${appName} binary application`,
          config: {
            args: args,
            env: envVars
          }
        },
        binary: binaryBase64,
        vehicleId: selectedKit.id || 'default-vehicle'
      }

      console.log('📦 Binary deployment request:', deploymentRequest)

      // Send deployment request
      const response = await onDeploy(deploymentRequest)

      // Check response
      if (response && response.status === 'started') {
        setDeploymentResult({
          status: 'success',
          message: `Binary application deployed successfully (ID: ${response.appId})`,
          appId: response.appId,
          containerId: response.containerId,
          suggestions: [
            `Application ID: ${response.appId}`,
            `Container ID: ${response.containerId || 'pending'}`,
            'Use the Applications tab to monitor and manage the deployment'
          ]
        })
      } else {
        throw new Error(`Deployment failed: ${response?.result || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Binary deployment failed:', error)
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Binary deployment failed',
        suggestions: [
          'Check if the runtime is connected',
          'Verify the binary file format is correct',
          'Check runtime logs for detailed error information'
        ]
      })
    }
  }, [appName, appDescription, binaryFile, binaryBase64, args, envVars, selectedKit, onDeploy])

  // Clear form
  const handleClear = useCallback(() => {
    setAppName('')
    setAppDescription('')
    setBinaryFile(null)
    setBinaryBase64('')
    setArgs([])
    setEnvVars({})
    setDeploymentResult(null)
  }, [])

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

      {/* Main Deployment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Application Configuration</CardTitle>
          <CardDescription>
            Configure and deploy your binary application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="app-name">Application Name *</Label>
            <Input
              id="app-name"
              placeholder="my-vehicle-app"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              disabled={isDeploying}
            />
          </div>

          {/* App Description */}
          <div className="space-y-2">
            <Label htmlFor="app-description">Description</Label>
            <Textarea
              id="app-description"
              placeholder="Brief description of your application..."
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              disabled={isDeploying}
              rows={2}
            />
          </div>

          {/* Binary File Upload */}
          <div className="space-y-2">
            <Label>Binary File *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="binary-file"
                className="hidden"
                accept=".bin,.exe,.out,.elf,.app,.run,application/octet-stream,application/x-executable,application/x-elf"
                onChange={handleInputChange}
                disabled={isDeploying}
              />
              <label htmlFor="binary-file" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-3">
                  {binaryFile ? (
                    <>
                      <TbCheck className="w-12 h-12 text-green-600 dark:text-green-400" />
                      <div className="text-center">
                        <p className="font-medium text-foreground">{binaryFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(binaryFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          setBinaryFile(null)
                          setBinaryBase64('')
                        }}
                        disabled={isDeploying}
                      >
                        <TbX className="w-4 h-4 mr-1" />
                        Clear File
                      </Button>
                    </>
                  ) : (
                    <>
                      <TbUpload className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">
                          Drag and drop binary file here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse (.bin, .exe, .out, .elf, etc.)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 50MB • Supported formats: Binary executables (.bin, .exe, .out, .elf, etc.)
            </p>
          </div>

          {/* Command Arguments */}
          <div className="space-y-2">
            <Label>Command Arguments</Label>
            <div className="flex gap-2">
              <Input
                placeholder="--port 8080"
                value={newArg}
                onChange={(e) => setNewArg(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddArg()}
                disabled={isDeploying}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddArg}
                disabled={isDeploying || !newArg.trim()}
              >
                <TbPlus className="w-4 h-4" />
              </Button>
            </div>
            {args.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {args.map((arg, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {arg}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleRemoveArg(index)}
                      disabled={isDeploying}
                    >
                      <TbX className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Environment Variables */}
          <div className="space-y-2">
            <Label>Environment Variables</Label>
            <div className="flex gap-2">
              <Input
                placeholder="KEY"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                disabled={isDeploying}
                className="flex-1"
              />
              <Input
                placeholder="value"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEnv()}
                disabled={isDeploying}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddEnv}
                disabled={isDeploying || !newEnvKey.trim()}
              >
                <TbPlus className="w-4 h-4" />
              </Button>
            </div>
            {Object.keys(envVars).length > 0 && (
              <div className="space-y-2 mt-2">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <span className="font-mono text-sm font-medium">{key}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="font-mono text-sm">{value}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleRemoveEnv(key)}
                      disabled={isDeploying}
                    >
                      <TbTrash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deployment Result */}
          {deploymentResult && (
            <div className={`p-4 rounded-lg ${
              deploymentResult.status === 'success'
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-3">
                {deploymentResult.status === 'success' ? (
                  <TbCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <TbAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDeploy}
              disabled={!selectedKit || !binaryFile || !appName.trim() || isDeploying}
              className="flex-1"
            >
              {isDeploying ? (
                <>
                  <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <TbRocket className="w-4 h-4 mr-2" />
                  Deploy Binary Application
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isDeploying}
            >
              Clear Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BinaryDeploymentComponent