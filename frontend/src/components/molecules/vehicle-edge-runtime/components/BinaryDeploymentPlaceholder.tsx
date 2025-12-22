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
import {
  TbBinary,
  TbUpload,
  TbSettings,
  TbCpu,
  TbChartBar,
  TbAlertCircle,
  TbClock,
  TbCode,
  TbDeviceFloppy,
  TbShield
} from 'react-icons/tb'

interface BinaryDeploymentPlaceholderProps {
  onBack?: () => void
}

const BinaryDeploymentPlaceholder: FC<BinaryDeploymentPlaceholderProps> = ({
  onBack
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <TbBinary className="w-8 h-8 text-primary" />
          <h3 className="text-2xl font-bold text-foreground">Binary Application Deployment</h3>
        </div>
        <p className="text-muted-foreground">
          Deploy pre-compiled binary applications for high-performance vehicle computing
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
              <TbUpload className="w-5 h-5 mr-2" />
              Binary Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload pre-compiled binary files with support for multiple architectures (ARM64, x86_64)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TbSettings className="w-5 h-5 mr-2" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure execution parameters, environment variables, and resource allocations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TbCpu className="w-5 h-5 mr-2" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Optimize performance with hardware acceleration and resource management
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder Form */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <TbDeviceFloppy className="w-5 h-5 mr-2" />
              Binary Configuration
            </span>
            <Badge variant="secondary">Preview</Badge>
          </CardTitle>
          <CardDescription>
            This is a preview of the binary deployment interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Binary File Upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Binary File
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <TbUpload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your binary file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: .bin, .elf, .exe (max 100MB)
              </p>
              <Button variant="outline" disabled className="mt-4">
                Choose File
              </Button>
            </div>
          </div>

          {/* Configuration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Application Name
              </label>
              <Input placeholder="my-vehicle-app" disabled />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Architecture
              </label>
              <Input placeholder="ARM64" disabled />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Memory Limit (MB)
              </label>
              <Input placeholder="512" disabled />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                CPU Priority
              </label>
              <Input placeholder="Normal" disabled />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center">
              <TbSettings className="w-4 h-4 mr-1" />
              Advanced Options
            </h4>
            <div className="space-y-3 pl-5">
              <div className="flex items-center justify-between">
                <span className="text-sm">Hardware Acceleration</span>
                <Button variant="outline" size="sm" disabled>
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Resource Monitoring</span>
                <Button variant="outline" size="sm" disabled>
                  Setup
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Debug Symbols</span>
                <Button variant="outline" size="sm" disabled>
                  Upload
                </Button>
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <div className="pt-4 border-t">
            <Button disabled className="w-full">
              <TbAlertCircle className="w-4 h-4 mr-2" />
              Binary Deployment Coming Soon
            </Button>
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
              <p className="text-sm font-medium">Q1 2024 - Basic Upload</p>
              <p className="text-xs text-muted-foreground">Simple binary file upload and deployment</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TbClock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Q2 2024 - Advanced Features</p>
              <p className="text-xs text-muted-foreground">Performance optimization and resource management</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TbClock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Q3 2024 - Full Integration</p>
              <p className="text-xs text-muted-foreground">Complete vehicle signal integration and debugging</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <TbShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Security & Performance
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Binary applications will be sandboxed and monitored for security. Performance metrics
              will be tracked in real-time with automatic resource optimization.
            </p>
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

export default BinaryDeploymentPlaceholder