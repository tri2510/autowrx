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
  TbPackage,
  TbCloud,
  TbSettings,
  TbCloudDownload,
  TbTerminal,
  TbAlertCircle,
  TbShield,
  TbRocket,
  TbLoader,
  TbCheck,
  TbX,
  TbPlug,
  TbDatabase
} from 'react-icons/tb'

interface DockerDeploymentComponentProps {
  selectedKit: any
  isRuntimeConnected: boolean
  onDeploy: (deployment: any) => Promise<any>
  isDeploying?: boolean
  deployedApps?: any[]
  onBack?: () => void
}

interface DockerDeploymentConfig {
  name: string
  deploymentMode: 'image' | 'compose' | 'command'
  imageName?: string
  imageTag?: string
  dockerCompose?: string
  dockerCommand?: string[]
  ports: Array<{
    container: number
    host: number
    protocol: 'tcp' | 'udp'
  }>
  environment: Record<string, string>
  volumes: Array<{
    hostPath: string
    containerPath: string
    readOnly?: boolean
  }>
  networkMode: 'bridge' | 'host' | 'none'
  restartPolicy: 'no' | 'always' | 'unless-stopped' | 'on-failure'
  resources: {
    memory?: number
    cpu?: number
  }
  privileged: boolean
  detach: boolean
}

const DockerDeploymentComponent: FC<DockerDeploymentComponentProps> = ({
  selectedKit,
  isRuntimeConnected,
  onDeploy,
  isDeploying = false,
  deployedApps = [],
  onBack
}) => {
  const [deploymentConfig, setDeploymentConfig] = useState<DockerDeploymentConfig>({
    name: 'Docker Container App',
    deploymentMode: 'image',
    imageName: '',
    imageTag: 'latest',
    dockerCommand: [],
    ports: [],
    environment: {},
    volumes: [],
    networkMode: 'bridge',
    restartPolicy: 'unless-stopped',
    resources: {},
    privileged: false,
    detach: true
  })

  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'idle' | 'deploying' | 'success' | 'error'
    message: string
    progress?: number
  }>({ status: 'idle', message: '' })

  const [activeTab, setActiveTab] = useState<'image' | 'compose' | 'command'>('image')

  const handleInputChange = useCallback((field: keyof DockerDeploymentConfig, value: any) => {
    setDeploymentConfig(prev => ({ ...prev, [field]: value }))
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
        message: 'Container name is required'
      })
      return
    }

    if (deploymentConfig.deploymentMode === 'image' && !deploymentConfig.imageName) {
      setDeploymentStatus({
        status: 'error',
        message: 'Docker image name is required'
      })
      return
    }

    if (deploymentConfig.deploymentMode === 'compose' && !deploymentConfig.dockerCompose) {
      setDeploymentStatus({
        status: 'error',
        message: 'Docker Compose content is required'
      })
      return
    }

    if (deploymentConfig.deploymentMode === 'command' && deploymentConfig.dockerCommand?.length === 0) {
      setDeploymentStatus({
        status: 'error',
        message: 'Docker command is required'
      })
      return
    }

    setDeploymentStatus({ status: 'deploying', message: 'Preparing Docker deployment...' })

    try {
      // Create Docker deployment request using unified API
      const deploymentRequest = {
        type: 'smart_deploy',
        deploymentType: 'docker',
        app_name: deploymentConfig.name,
        docker_config: {
          deployment_mode: deploymentConfig.deploymentMode,
          image_name: deploymentConfig.imageName,
          image_tag: deploymentConfig.imageTag,
          docker_compose: deploymentConfig.dockerCompose,
          docker_command: deploymentConfig.dockerCommand,
          ports: deploymentConfig.ports,
          environment: deploymentConfig.environment,
          volumes: deploymentConfig.volumes,
          network_mode: deploymentConfig.networkMode,
          restart_policy: deploymentConfig.restartPolicy,
          resources: deploymentConfig.resources,
          privileged: deploymentConfig.privileged,
          detach: deploymentConfig.detach
        },
        vehicle_id: selectedKit.id || 'default-vehicle'
      }

      console.log('🐳 Docker deployment request:', deploymentRequest)

      setDeploymentStatus({ status: 'deploying', message: 'Pulling Docker image...', progress: 25 })

      // Send deployment request
      const response = await onDeploy(deploymentRequest)

      setDeploymentStatus({ status: 'deploying', message: 'Starting Docker container...', progress: 50 })

      if (response && typeof response === 'object' && response.status === 'started') {
        setDeploymentStatus({
          status: 'success',
          message: `Docker container "${deploymentConfig.name}" deployed successfully!`,
          progress: 100
        })
      } else {
        throw new Error(`Docker deployment failed: ${(response as any)?.result || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Docker deployment failed:', error)
      setDeploymentStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Docker deployment failed'
      })
    }
  }, [deploymentConfig, selectedKit, isRuntimeConnected, onDeploy])

  const popularImages = [
    'nginx:alpine',
    'redis:alpine',
    'postgres:15-alpine',
    'mysql:8',
    'node:18-alpine',
    'python:3.11-alpine',
    'alpine:latest',
    'ubuntu:22.04'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center">
            <TbPackage className="w-6 h-6 mr-2" />
            Docker Container Deployment
          </h3>
          <p className="text-muted-foreground text-sm">
            Deploy existing Docker images or custom containers
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

      {/* Deployment Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbPackage className="w-5 h-5 mr-2" />
            Deployment Mode
          </CardTitle>
          <CardDescription>
            Choose how you want to deploy the Docker container
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={activeTab === 'image' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('image')
                handleInputChange('deploymentMode', 'image')
              }}
              className="flex items-center justify-center h-20 flex-col space-y-2"
            >
              <TbCloudDownload className="w-8 h-8" />
              <span>Docker Image</span>
            </Button>
            <Button
              variant={activeTab === 'compose' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('compose')
                handleInputChange('deploymentMode', 'compose')
              }}
              className="flex items-center justify-center h-20 flex-col space-y-2"
            >
              <TbCloudDownload className="w-8 h-8" />
              <span>Docker Compose</span>
            </Button>
            <Button
              variant={activeTab === 'command' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('command')
                handleInputChange('deploymentMode', 'command')
              }}
              className="flex items-center justify-center h-20 flex-col space-y-2"
            >
              <TbTerminal className="w-8 h-8" />
              <span>Custom Command</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Container Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbSettings className="w-5 h-5 mr-2" />
            Container Configuration
          </CardTitle>
          <CardDescription>
            Configure the Docker container settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="container-name">Container Name</Label>
            <Input
              id="container-name"
              value={deploymentConfig.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="my-docker-app"
            />
          </div>

          {activeTab === 'image' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image-name">Docker Image</Label>
                  <Select value={deploymentConfig.imageName} onValueChange={(value) => handleInputChange('imageName', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or enter image name" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularImages.map(image => (
                        <SelectItem key={image} value={image.split(':')[0]}>
                          {image}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    placeholder="e.g., nginx"
                    value={deploymentConfig.imageName}
                    onChange={(e) => handleInputChange('imageName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="image-tag">Image Tag</Label>
                  <Input
                    id="image-tag"
                    value={deploymentConfig.imageTag}
                    onChange={(e) => handleInputChange('imageTag', e.target.value)}
                    placeholder="latest"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'compose' && (
            <div>
              <Label htmlFor="docker-compose">Docker Compose Content</Label>
              <Textarea
                id="docker-compose"
                value={deploymentConfig.dockerCompose || ''}
                onChange={(e) => handleInputChange('dockerCompose', e.target.value)}
                placeholder={`version: '3.8'
services:
  app:
    image: nginx:alpine
    ports:
      - "80:80"`}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          )}

          {activeTab === 'command' && (
            <div>
              <Label htmlFor="docker-command">Docker Command</Label>
              <Textarea
                id="docker-command"
                value={deploymentConfig.dockerCommand?.join('\n') || ''}
                onChange={(e) => handleInputChange('dockerCommand', e.target.value.split('\n').filter(cmd => cmd.trim()))}
                placeholder={`run -d --name my-app -p 8080:80 nginx:alpine`}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network and Runtime Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbPlug className="w-5 h-5 mr-2" />
            Network & Runtime
          </CardTitle>
          <CardDescription>
            Configure networking and runtime options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="network-mode">Network Mode</Label>
              <Select value={deploymentConfig.networkMode} onValueChange={(value: 'bridge' | 'host' | 'none') => handleInputChange('networkMode', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="restart-policy">Restart Policy</Label>
              <Select value={deploymentConfig.restartPolicy} onValueChange={(value: 'no' | 'always' | 'unless-stopped' | 'on-failure') => handleInputChange('restartPolicy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="always">Always</SelectItem>
                  <SelectItem value="unless-stopped">Unless Stopped</SelectItem>
                  <SelectItem value="on-failure">On Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={deploymentConfig.privileged}
                onChange={(e) => handleInputChange('privileged', e.target.checked)}
                className="rounded"
              />
              <span>Privileged Mode</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={deploymentConfig.detach}
                onChange={(e) => handleInputChange('detach', e.target.checked)}
                className="rounded"
              />
              <span>Run in Detached Mode</span>
            </label>
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

      {/* Volume Mounting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TbDatabase className="w-5 h-5 mr-2" />
              Volume Mounting
            </div>
            <Button variant="outline" size="sm" onClick={addVolume}>
              <TbCloud className="w-4 h-4 mr-1" />
              Add Volume
            </Button>
          </CardTitle>
          <CardDescription>
            Mount host directories into the container
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deploymentConfig.volumes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No volumes mounted</p>
          ) : (
            <div className="space-y-2">
              {deploymentConfig.volumes.map((volume, index) => (
                <div key={index} className="flex items-center space-x-2 grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Host path"
                    value={volume.hostPath}
                    onChange={(e) => handleVolumeChange(index, 'hostPath', e.target.value)}
                  />
                  <Input
                    placeholder="Container path"
                    value={volume.containerPath}
                    onChange={(e) => handleVolumeChange(index, 'containerPath', e.target.value)}
                  />
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={volume.readOnly}
                        onChange={(e) => handleVolumeChange(index, 'readOnly', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Read-only</span>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVolume(index)}
                    >
                      <TbX className="w-4 h-4" />
                    </Button>
                  </div>
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
              Deploy Docker Container
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

export default DockerDeploymentComponent