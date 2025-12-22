// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState } from 'react'
import {
  TbCopy,
  TbCheck,
  TbTerminal,
  TbPackage,
  TbEye,
  TbEyeOff,
  TbServer,
  TbPlug
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { MarketplaceApp } from '../hooks/useMarketplaceApps'

interface DockerCommandDisplayProps {
  app: MarketplaceApp
  showCommand?: boolean
  onToggleCommand?: () => void
  className?: string
}

const DockerCommandDisplay: FC<DockerCommandDisplayProps> = ({
  app,
  showCommand = false,
  onToggleCommand,
  className = ''
}) => {
  const [copied, setCopied] = useState(false)
  const [localShowCommand, setLocalShowCommand] = useState(showCommand)

  const isDockerApp = app.type === 'docker' && app.dockerCommand && app.dockerCommand.length > 0

  const handleCopyCommand = async () => {
    if (!isDockerApp) return

    const fullCommand = `docker ${app.dockerCommand?.join(' ')}`

    try {
      await navigator.clipboard.writeText(fullCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy command:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = fullCommand
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleCommand = () => {
    const newState = !localShowCommand
    setLocalShowCommand(newState)
    onToggleCommand?.()
  }

  const formatDockerCommand = (command: string[]): string => {
    if (!command || command.length === 0) return ''

    // Format command with proper line breaks for readability
    let formatted = 'docker'
    let currentLine = 'docker'

    command.forEach((arg, index) => {
      if (index === 0) {
        formatted += ` ${arg}`
        currentLine += ` ${arg}`
      } else if (arg.startsWith('-') || currentLine.length > 80) {
        // Start new line for flags or if line is too long
        formatted += ` \\\n  ${arg}`
        currentLine = `  ${arg}`
      } else {
        formatted += ` ${arg}`
        currentLine += ` ${arg}`
      }
    })

    return formatted
  }

  if (!isDockerApp) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Docker App Header */}
      <div className="flex items-center space-x-2 text-sm">
        <TbPackage className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-blue-600">Docker Container</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">Image: {app.dockerImage}</span>
      </div>

      {/* Port Information */}
      {app.dockerPorts && app.dockerPorts.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <TbPlug className="w-3 h-3" />
          <span>Ports: {app.dockerPorts.join(', ')}</span>
        </div>
      )}

      {/* Toggle Command Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleCommand}
        className="w-full flex items-center justify-center space-x-2"
      >
        {localShowCommand ? (
          <>
            <TbEyeOff className="w-4 h-4" />
            <span>Hide Docker Command</span>
          </>
        ) : (
          <>
            <TbTerminal className="w-4 h-4" />
            <span>Show Docker Command</span>
          </>
        )}
      </Button>

      {/* Docker Command Display */}
      {localShowCommand && (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Command Header */}
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TbTerminal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                Docker Command
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCommand}
              className="flex items-center space-x-1 text-xs"
            >
              {copied ? (
                <>
                  <TbCheck className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <TbCopy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Command Content */}
          <div className="p-4 bg-gray-900">
            <pre className="text-green-400 font-mono text-sm overflow-x-auto whitespace-pre">
              {formatDockerCommand(app.dockerCommand || [])}
            </pre>
          </div>
        </div>
      )}

      {/* Additional Docker Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center space-x-1">
          <TbServer className="w-3 h-3" />
          <span>Deployment Type: {app.deploymentType || 'container'}</span>
        </div>

        {app.dockerVolumes && app.dockerVolumes.length > 0 && (
          <div className="flex items-center space-x-1">
            <span>📁</span>
            <span>Volumes: {app.dockerVolumes.join(', ')}</span>
          </div>
        )}

        {app.dockerEnvironment && Object.keys(app.dockerEnvironment).length > 0 && (
          <div className="flex items-center space-x-1">
            <span>🔧</span>
            <span>Environment Variables: {Object.keys(app.dockerEnvironment).length} configured</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default DockerCommandDisplay