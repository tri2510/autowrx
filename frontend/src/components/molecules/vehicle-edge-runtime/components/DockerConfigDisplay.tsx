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
  TbPlug,
  TbChevronDown,
  TbChevronRight
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { MarketplaceApp } from '../hooks/useMarketplaceApps'

interface DockerConfigDisplayProps {
  app: MarketplaceApp
  showConfig?: boolean
  onToggleConfig?: () => void
  className?: string
}

const DockerConfigDisplay: FC<DockerConfigDisplayProps> = ({
  app,
  showConfig = false,
  onToggleConfig,
  className = ''
}) => {
  const [copied, setCopied] = useState(false)
  const [localShowConfig, setLocalShowConfig] = useState(showConfig)
  const [expandedSection, setExpandedSection] = useState<string | null>('basic')

  const isDockerApp = app.type === 'docker' && app.dockerConfig

  const handleCopyConfig = async () => {
    if (!isDockerApp) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(app.dockerConfig, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy config:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = JSON.stringify(app.dockerConfig, null, 2)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleConfig = () => {
    const newState = !localShowConfig
    setLocalShowConfig(newState)
    onToggleConfig?.()
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (!isDockerApp) {
    return null
  }

  const config = app.dockerConfig!

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Docker App Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center">
          <TbPackage className="w-4 h-4 mr-2" />
          Docker Configuration
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleConfig}
          className="text-xs"
        >
          {localShowConfig ? (
            <>
              <TbEyeOff className="w-3 h-3 mr-1" />
              Hide
            </>
          ) : (
            <>
              <TbEye className="w-3 h-3 mr-1" />
              Show
            </>
          )}
        </Button>
      </div>

      {/* Configuration Preview */}
      {localShowConfig && (
        <div className="border rounded-lg overflow-hidden">
          {/* Config Header */}
          <div className="bg-muted px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TbServer className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Docker JSON Configuration</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyConfig}
              className="text-xs"
            >
              {copied ? (
                <>
                  <TbCheck className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <TbCopy className="w-3 h-3 mr-1" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>

          {/* Config Content */}
          <div className="p-4 space-y-4">
            {/* Basic Info */}
            <div>
              <button
                onClick={() => toggleSection('basic')}
                className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {expandedSection === 'basic' ? (
                  <TbChevronDown className="w-4 h-4" />
                ) : (
                  <TbChevronRight className="w-4 h-4" />
                )}
                Basic Configuration
              </button>
              {expandedSection === 'basic' && (
                <div className="mt-2 pl-6 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Image:</span>
                      <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">{config.image}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">{config.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Network:</span>
                      <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">{config.network || 'bridge'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Restart:</span>
                      <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">{config.restartPolicy || 'no'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ports */}
            {config.ports && config.ports.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('ports')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {expandedSection === 'ports' ? (
                    <TbChevronDown className="w-4 h-4" />
                  ) : (
                    <TbChevronRight className="w-4 h-4" />
                  )}
                  Port Mappings ({config.ports.length})
                </button>
                {expandedSection === 'ports' && (
                  <div className="mt-2 pl-6 space-y-1">
                    {config.ports.map((port, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <TbPlug className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {port.host}:{port.container}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Environment Variables */}
            {config.environment && Object.keys(config.environment).length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('env')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {expandedSection === 'env' ? (
                    <TbChevronDown className="w-4 h-4" />
                  ) : (
                    <TbChevronRight className="w-4 h-4" />
                  )}
                  Environment Variables ({Object.keys(config.environment).length})
                </button>
                {expandedSection === 'env' && (
                  <div className="mt-2 pl-6 space-y-1">
                    {Object.entries(config.environment).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 text-sm">
                        <span className="text-muted-foreground font-mono text-xs">{key}:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Volumes */}
            {config.volumes && config.volumes.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('volumes')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {expandedSection === 'volumes' ? (
                    <TbChevronDown className="w-4 h-4" />
                  ) : (
                    <TbChevronRight className="w-4 h-4" />
                  )}
                  Volume Mappings ({config.volumes.length})
                </button>
                {expandedSection === 'volumes' && (
                  <div className="mt-2 pl-6 space-y-1">
                    {config.volumes.map((volume, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {volume.host} → {volume.container}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Command */}
            {config.command && config.command.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('command')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {expandedSection === 'command' ? (
                    <TbChevronDown className="w-4 h-4" />
                  ) : (
                    <TbChevronRight className="w-4 h-4" />
                  )}
                  Container Command
                </button>
                {expandedSection === 'command' && (
                  <div className="mt-2 pl-6">
                    <div className="font-mono text-xs bg-muted p-2 rounded">
                      {config.command.join(' ')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DockerConfigDisplay