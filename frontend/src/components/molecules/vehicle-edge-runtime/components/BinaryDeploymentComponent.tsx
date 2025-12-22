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
import { Label } from '@/components/atoms/label'
import { Textarea } from '@/components/atoms/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select'
import {
  TbBinary,
  TbUpload,
  TbDownload,
  TbSettings,
  TbCpu,
  TbChartBar,
  TbAlertCircle,
  TbShield,
  TbRocket,
  TbLoader,
  TbCheck,
  TbX,
  TbCloudDownload,
  TbTerminal,
  TbCloud
} from 'react-icons/tb'

interface BinaryDeploymentComponentProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: any) => Promise<any>
  isDeploying?: boolean
  deployedApps?: any[]
  onBack?: () => void
}

interface BinaryDeploymentConfig {
  name: string
  sourceType: 'upload' | 'url'
  binaryUrl?: string
  binaryFile?: File | null
  architecture: 'amd64' | 'arm64' | 'auto'
  baseImage: string
  command: string
  args: string[]
  environment: Record<string, string>
  workingDirectory: string
  memoryLimit: number
  cpuLimit: number
  ports: Array<{
    container: number
    host: number
    protocol: 'tcp' | 'udp'
  }>
  volumes: Array<{
    hostPath: string
    containerPath: string
    readOnly?: boolean
  }>
}

const BinaryDeploymentComponent: FC<BinaryDeploymentComponentProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = [],
  onBack
}) => {
  const [deploymentConfig, setDeploymentConfig] = useState<BinaryDeploymentConfig>({
    name: 'Vehicle Binary App',
    sourceType: 'upload',
    architecture: 'auto',
    baseImage: 'alpine:latest',
    command: './app',
    args: [],
    environment: {},
    workingDirectory: '/app',
    memoryLimit: 512,
    cpuLimit: 1,
    ports: [],
    volumes: []
  })

  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'idle' | 'deploying' | 'success' | 'error'
    message: string
    progress?: number
  }>({ status: 'idle', message: '' })

  const [fileUploadProgress, setFileUploadProgress] = useState(0)
  const [activeSection, setActiveSection] = useState<'basic' | 'advanced'>('basic')

  const handleInputChange = useCallback((field: keyof BinaryDeploymentConfig, value: any) => {
    setDeploymentConfig(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setDeploymentConfig(prev => ({ ...prev, binaryFile: file, name: file.name.replace(/\.[^/.]+$/, '') }))
    }
  }, [])

  const handleEnvironmentChange = useCallback((key: string, value: string) => {
    setDeploymentConfig(prev => ({
      ...prev,
      environment: { ...prev.environment, [key]: value }
    }))
  }, [])

  const handlePortChange = useCallback((index: number, field: string, value: string | number) => {
    setDeploymentConfig(prev => ({
      ...prev,
      ports: prev.ports.map((port, i) =>
        i === index ? { ...port, [field]: value } : port
      )
    }))
  }, [])

  const handleVolumeChange = useCallback((index: number, field: string, value: string | boolean) => {
    setDeploymentConfig(prev => ({
      ...prev,
      volumes: prev.volumes.map((volume, i) =>
        i === index ? { ...volume, [field]: value } : volume
      )
    }))
  }, [])

  const addPort = useCallback(() => {
    setDeploymentConfig(prev => ({
      ...prev,
      ports: [...prev.ports, { container: 8080, host: 8080, protocol: 'tcp' }]
    }))
  }, [])

  const removePort = useCallback((index: number) => {
    setDeploymentConfig(prev => ({
      ...prev,
      ports: prev.ports.filter((_, i) => i !== index)
    }))
  }, [])

  const addVolume = useCallback(() => {
    setDeploymentConfig(prev => ({
      ...prev,
      volumes: [...prev.volumes, { hostPath: '/data', containerPath: '/data', readOnly: false }]
    }))
  }, [])

  const removeVolume = useCallback((index: number) => {
    setDeploymentConfig(prev => ({
      ...prev,
      volumes: prev.volumes.filter((_, i) => i !== index)
    }))
  }, [])

  const handleDeploy = useCallback(async () => {
    if (!selectedKit || !isRuntimeConnected) {
      setDeploymentStatus({
        status: 'error',
        message: 'No runtime selected or not connected'
      })
      return
    }

    // Validate configuration
    if (!deploymentConfig.name) {
      setDeploymentStatus({
        status: 'error',
        message: 'Application name is required'
      })
      return
    }

    if (deploymentConfig.sourceType === 'upload' && !deploymentConfig.binaryFile) {
      setDeploymentStatus({
        status: 'error',
        message: 'Please select a binary file to upload'
      })
      return
    }

    if (deploymentConfig.sourceType === 'url' && !deploymentConfig.binaryUrl) {
      setDeploymentStatus({
        status: 'error',
        message: 'Please provide a binary URL'
      })
      return
    }

    setDeploymentStatus({ status: 'deploying', message: 'Preparing binary deployment...' })

    try {
      let binaryData = null

      // Handle file upload
      if (deploymentConfig.sourceType === 'upload' && deploymentConfig.binaryFile) {
        const reader = new FileReader()
        binaryData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            if (reader.result) {
              const base64 = (reader.result as string).split(',')[1]
              resolve(base64)
            } else {
              reject(new Error('Failed to read file'))
            }
          }
          reader.onerror = () => reject(new Error('File reading error'))
          reader.readAsDataURL(deploymentConfig.binaryFile!)
        })
      }

      // Create binary deployment request using unified API
      const deploymentRequest = {
        type: 'smart_deploy',
        deploymentType: 'binary',
        app_name: deploymentConfig.name,
        binary_config: {
          source_type: deploymentConfig.sourceType,
          binary_url: deploymentConfig.binaryUrl,
          binary_data: binaryData,
          architecture: deploymentConfig.architecture,
          base_image: deploymentConfig.baseImage,
          command: deploymentConfig.command,
          args: deploymentConfig.args,
          environment: deploymentConfig.environment,
          working_directory: deploymentConfig.workingDirectory,
          memory_limit: deploymentConfig.memoryLimit,
          cpu_limit: deploymentConfig.cpuLimit,
          ports: deploymentConfig.ports,
          volumes: deploymentConfig.volumes
        },
        vehicle_id: selectedKit.id || 'default-vehicle'
      }

      console.log('📦 Binary deployment request:', deploymentRequest)

      setDeploymentStatus({ status: 'deploying', message: 'Deploying binary application...', progress: 25 })

      // Send deployment request
      const response = await onDeploy(deploymentRequest)

      setDeploymentStatus({ status: 'deploying', message: 'Containerizing binary...', progress: 50 })

      if (response && typeof response === 'object' && response.status === 'started') {
        setDeploymentStatus({
          status: 'success',
          message: `Binary app "${deploymentConfig.name}" deployed successfully!`,
          progress: 100
        })
      } else {
        throw new Error(`Binary deployment failed: ${(response as any)?.result || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Binary deployment failed:', error)
      setDeploymentStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Binary deployment failed'
      })
    }
  }, [deploymentConfig, selectedKit, isRuntimeConnected, onDeploy])

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
            Deploy pre-compiled binaries with automatic containerization
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Types
          </Button>
        )}
      </div>

      {/* Deployment Status */}
      {deploymentStatus.status !== 'idle' && (
        <Card className={deploymentStatus.status === 'success' ? 'border-green-200' : deploymentStatus.status === 'error' ? 'border-red-200' : 'border-blue-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              {deploymentStatus.status === 'deploying' && (
                <TbLoader className="w-5 h-5 animate-spin text-blue-600" />
              )}
              {deploymentStatus.status === 'success' && (
                <TbCheck className="w-5 h-5 text-green-600" />
              )}
              {deploymentStatus.status === 'error' && (
                <TbAlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${deploymentStatus.status === 'success' ? 'text-green-800' : deploymentStatus.status === 'error' ? 'text-red-800' : 'text-blue-800'}`}>
                  {deploymentStatus.message}
                </p>
                {deploymentStatus.progress && (
                  <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${deploymentStatus.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Binary Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbDownload className="w-5 h-5 mr-2" />
            Binary Source
          </CardTitle>
          <CardDescription>
            Select how you want to provide the binary file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source-type">Source Type</Label>
              <Select value={deploymentConfig.sourceType} onValueChange={(value: 'upload' | 'url') => handleInputChange('sourceType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">
                    <div className="flex items-center space-x-2">
                      <TbUpload className="w-4 h-4" />
                      <span>Upload File</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="url">
                    <div className="flex items-center space-x-2">
                      <TbCloudDownload className="w-4 h-4" />
                      <span>Download from URL</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                value={deploymentConfig.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="my-binary-app"
              />
            </div>
          </div>

          {deploymentConfig.sourceType === 'upload' ? (
            <div className="space-y-2">
              <Label htmlFor="binary-upload">Select Binary File</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <TbUpload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Input
                  id="binary-upload"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".bin,.elf,.exe,.run"
                  className="hidden"
                />
                <label htmlFor="binary-upload" className="cursor-pointer">
                  <Button variant="outline" className="mb-2">
                    Choose Binary File
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">
                  Supported formats: .bin, .elf, .exe, .run (max 50MB)
                </p>
                {deploymentConfig.binaryFile && (
                  <p className="text-sm text-green-600 mt-2">
                    <TbCheck className="inline-block w-4 h-4 mr-1" />
                    Selected: {deploymentConfig.binaryFile.name}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="binary-url">Binary URL</Label>
              <Input
                id="binary-url"
                value={deploymentConfig.binaryUrl || ''}
                onChange={(e) => handleInputChange('binaryUrl', e.target.value)}
                placeholder="https://example.com/my-binary.bin"
              />
              <p className="text-xs text-muted-foreground">
                URL to download the binary file (must be accessible from the runtime)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Container Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbShield className="w-5 h-5 mr-2" />
            Container Configuration
          </CardTitle>
          <CardDescription>
            Configure the Docker container settings for your binary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="architecture">Architecture</Label>
              <Select value={deploymentConfig.architecture} onValueChange={(value: 'amd64' | 'arm64' | 'auto') => handleInputChange('architecture', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="amd64">AMD64</SelectItem>
                  <SelectItem value="arm64">ARM64</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="base-image">Base Image</Label>
              <Input
                id="base-image"
                value={deploymentConfig.baseImage}
                onChange={(e) => handleInputChange('baseImage', e.target.value)}
                placeholder="alpine:latest"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="command">Command</Label>
              <Input
                id="command"
                value={deploymentConfig.command}
                onChange={(e) => handleInputChange('command', e.target.value)}
                placeholder="./app"
              />
            </div>
            <div>
              <Label htmlFor="working-dir">Working Directory</Label>
              <Input
                id="working-dir"
                value={deploymentConfig.workingDirectory}
                onChange={(e) => handleInputChange('workingDirectory', e.target.value)}
                placeholder="/app"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="args">Command Arguments</Label>
            <Input
              id="args"
              value={deploymentConfig.args.join(' ')}
              onChange={(e) => handleInputChange('args', e.target.value.split(' ').filter(arg => arg))}
              placeholder="--port 8080 --verbose"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resource Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbCpu className="w-5 h-5 mr-2" />
            Resource Limits
          </CardTitle>
          <CardDescription>
            Set memory and CPU limits for the container
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="memory-limit">Memory Limit (MB)</Label>
              <Input
                id="memory-limit"
                type="number"
                value={deploymentConfig.memoryLimit}
                onChange={(e) => handleInputChange('memoryLimit', parseInt(e.target.value))}
                min="64"
                max="4096"
              />
            </div>
            <div>
              <Label htmlFor="cpu-limit">CPU Limit</Label>
              <Input
                id="cpu-limit"
                type="number"
                value={deploymentConfig.cpuLimit}
                onChange={(e) => handleInputChange('cpuLimit', parseInt(e.target.value))}
                min="0.1"
                max="4"
                step="0.1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Port Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TbTerminal className="w-5 h-5 mr-2" />
              Port Mapping
            </div>
            <Button variant="outline" size="sm" onClick={addPort}>
              <TbCloud className="w-4 h-4 mr-1" />
              Add Port
            </Button>
          </CardTitle>
          <CardDescription>
            Map container ports to host ports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deploymentConfig.ports.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No ports mapped</p>
          ) : (
            <div className="space-y-2">
              {deploymentConfig.ports.map((port, index) => (
                <div key={index} className="flex items-center space-x-2 grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Container"
                    type="number"
                    value={port.container}
                    onChange={(e) => handlePortChange(index, 'container', parseInt(e.target.value))}
                  />
                  <Input
                    placeholder="Host"
                    type="number"
                    value={port.host}
                    onChange={(e) => handlePortChange(index, 'host', parseInt(e.target.value))}
                  />
                  <Select value={port.protocol} onValueChange={(value: 'tcp' | 'udp') => handlePortChange(index, 'protocol', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePort(index)}
                  >
                    <TbX className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            Set environment variables for the container
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Variable name (e.g., PORT)"
              onChange={(e) => {
                const key = e.target.value
                if (key && !deploymentConfig.environment[key]) {
                  handleEnvironmentChange(key, '')
                }
              }}
            />
            <Input
              placeholder="Value"
              onChange={(e) => {
                const entries = Object.entries(deploymentConfig.environment)
                if (entries.length > 0) {
                  handleEnvironmentChange(entries[entries.length - 1][0], e.target.value)
                }
              }}
            />
          </div>
          {Object.entries(deploymentConfig.environment).length > 0 && (
            <div className="space-y-2">
              {Object.entries(deploymentConfig.environment).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Badge variant="secondary" className="flex-1 justify-between">
                    <span>{key}</span>
                    <span>=</span>
                    <span>{value}</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newEnv = { ...deploymentConfig.environment }
                      delete newEnv[key]
                      setDeploymentConfig(prev => ({ ...prev, environment: newEnv }))
                    }}
                  >
                    <TbX className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deploy Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDeploy}
          disabled={!selectedKit || !isRuntimeConnected || isDeploying || deploymentStatus.status === 'deploying'}
          className="min-w-[200px]"
        >
          {deploymentStatus.status === 'deploying' ? (
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
                  Please select a Vehicle Edge Runtime to deploy applications.
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

export default BinaryDeploymentComponent