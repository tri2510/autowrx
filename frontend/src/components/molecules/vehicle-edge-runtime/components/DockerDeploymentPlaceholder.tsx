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
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import {
  TbPackage,
  TbWorld,
  TbSettings,
  TbCloud,
  TbServer,
  TbDatabase,
  TbClock,
  TbPlug,
  TbShield,
  TbNetwork,
  TbCpu,
  TbAlertCircle
} from 'react-icons/tb'

interface DockerDeploymentPlaceholderProps {
  onBack?: () => void
}

const DockerDeploymentPlaceholder: FC<DockerDeploymentPlaceholderProps> = ({
  onBack
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <TbPackage className="w-8 h-8 text-primary" />
          <h3 className="text-2xl font-bold text-foreground">Docker Container Deployment</h3>
        </div>
        <p className="text-muted-foreground">
          Deploy containerized applications using Docker for isolated and scalable deployments
        </p>
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Coming Soon
        </Badge>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TbWorld className="w-5 h-5 mr-2" />
              Container Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pull and deploy from Docker Hub, private registries, or local images
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TbNetwork className="w-5 h-5 mr-2" />
              Networking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure port mappings, networks, and service discovery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TbDatabase className="w-5 h-5 mr-2" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage volumes, bind mounts, and persistent storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Docker Configuration Form */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <TbPackage className="w-5 h-5 mr-2" />
              Docker Configuration
            </span>
            <Badge variant="secondary">Preview</Badge>
          </CardTitle>
          <CardDescription>
            This is a preview of the Docker deployment interface with JSON-based configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Container Configuration */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Container Image
            </label>
            <Input placeholder="nginx:latest" disabled />
            <p className="text-xs text-muted-foreground mt-1">
              Docker image from registry or local repository
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Container Name
              </label>
              <Input placeholder="my-vehicle-container" disabled />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Restart Policy
              </label>
              <Input placeholder="unless-stopped" disabled />
            </div>
          </div>

          {/* JSON Configuration Preview */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Docker Configuration (JSON)
            </label>
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-sm font-mono text-muted-foreground">
{`{
  "image": "nginx:latest",
  "name": "my-vehicle-container",
  "ports": [
    {"host": "8080", "container": "80"}
  ],
  "volumes": [
    {"host": "/data", "container": "/usr/share/nginx/html"}
  ],
  "environment": {
    "ENV": "production"
  },
  "restartPolicy": "unless-stopped",
  "network": "host",
  "detach": true
}`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              JSON configuration will be validated and converted to Docker commands
            </p>
          </div>

          {/* Configuration Tabs */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Configuration Options</h4>

            {/* Ports */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <TbPlug className="w-4 h-4 mr-1" />
                  Port Mappings
                </span>
                <Button variant="outline" size="sm" disabled>
                  Add Port
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Input placeholder="8080" className="w-20" disabled />
                  <span>:</span>
                  <Input placeholder="80" className="w-20" disabled />
                  <Button variant="ghost" size="sm" disabled>
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            {/* Volumes */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <TbDatabase className="w-4 h-4 mr-1" />
                  Volume Mappings
                </span>
                <Button variant="outline" size="sm" disabled>
                  Add Volume
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Input placeholder="/host/path" className="w-32" disabled />
                  <span>:</span>
                  <Input placeholder="/container/path" className="w-32" disabled />
                  <Button variant="ghost" size="sm" disabled>
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            {/* Environment */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <TbSettings className="w-4 h-4 mr-1" />
                  Environment Variables
                </span>
                <Button variant="outline" size="sm" disabled>
                  Add Variable
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Input placeholder="KEY" className="w-24" disabled />
                  <Input placeholder="value" className="flex-1" disabled />
                  <Button variant="ghost" size="sm" disabled>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <div className="pt-4 border-t">
            <Button disabled className="w-full">
              <TbAlertCircle className="w-4 h-4 mr-2" />
              Docker Deployment Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Docker Features</CardTitle>
          <CardDescription>
            Future capabilities for container orchestration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Orchestration</h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <TbServer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Docker Compose support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TbCloud className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Kubernetes integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TbNetwork className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Service mesh</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Monitoring & Security</h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <TbCpu className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Resource monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TbShield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Container security scanning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TbAlertCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Health checks</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Development Timeline</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <TbClock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Q1 2024 - Basic Docker</p>
              <p className="text-xs text-muted-foreground">Simple container deployment with JSON configuration</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TbClock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Q2 2024 - Orchestration</p>
              <p className="text-xs text-muted-foreground">Docker Compose and multi-container deployments</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TbClock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Q3 2024 - Advanced Features</p>
              <p className="text-xs text-muted-foreground">Kubernetes integration and service mesh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      {onBack && (
        <div className="text-center">
          <Button variant="outline" onClick={onBack}>
            Back to Deployment Type Selection
          </Button>
        </div>
      )}
    </div>
  )
}

export default DockerDeploymentPlaceholder