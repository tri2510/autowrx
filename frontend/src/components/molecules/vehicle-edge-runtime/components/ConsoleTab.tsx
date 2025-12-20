// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useRef, useEffect } from 'react'
import { TbTerminal, TbTrash, TbRefresh } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { VehicleApp } from '@/services/vehicleEdgeRuntimeDirect.service'

interface RunningApp {
  id: string
  name: string
  type: 'python' | 'binary'
  status: 'running' | 'stopped' | 'error'
  startTime?: Date
}

interface ConsoleTabProps {
  selectedApp: RunningApp | null
  consoleOutput: string[]
  onClearConsole: () => void
  onViewConsole: (app: VehicleApp) => void
}

const ConsoleTab: FC<ConsoleTabProps> = ({
  selectedApp,
  consoleOutput,
  onClearConsole,
  onViewConsole
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new console output arrives
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [consoleOutput])

  const handleRefreshConsole = () => {
    if (selectedApp) {
      // Convert RunningApp to VehicleApp for console viewing
      const vehicleApp: VehicleApp = {
        id: selectedApp.id,
        name: selectedApp.name,
        version: '1.0.0',
        type: selectedApp.type as 'python' | 'binary',
        status: selectedApp.status as VehicleApp['status'],
        created_at: selectedApp.startTime ? selectedApp.startTime.toISOString() : new Date().toISOString()
      }
      onViewConsole(vehicleApp)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
            {selectedApp && (
              <p className="text-sm text-muted-foreground">{selectedApp.name} - {selectedApp.id}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearConsole}
            >
              <TbTrash className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshConsole}
            >
              <TbRefresh className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="p-6">
          {consoleOutput.length === 0 ? (
            <div className="text-center py-12">
              <TbTerminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No console output available</p>
              {selectedApp && (
                <p className="text-sm text-muted-foreground mt-2">Select an application to view its console output</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              {consoleOutput.map((line, index) => {
                // Parse timestamp if it exists at the start
                const timestampMatch = line.match(/^\[([\d:]+\s*[AP]M)\]\s*(.+)/)
                if (timestampMatch) {
                  return (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{timestampMatch[1]}]</span>{' '}
                      <span className={
                        // Color coding based on content
                        timestampMatch[2].includes('🚀') ? 'text-blue-400' :
                        timestampMatch[2].includes('✅') ? 'text-green-400' :
                        timestampMatch[2].includes('❌') || timestampMatch[2].includes('⚠️') ? 'text-yellow-400' :
                        timestampMatch[2].includes('📦') || timestampMatch[2].includes('📝') ? 'text-blue-300' :
                        timestampMatch[2].includes('📤') ? 'text-cyan-400' :
                        'text-green-300'
                      }>{timestampMatch[2]}</span>
                    </div>
                  )
                } else {
                  // Fallback for lines without timestamp
                  return (
                    <div key={index} className="mb-1 text-green-300">
                      {line}
                    </div>
                  )
                }
              })}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConsoleTab