// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { TbTerminal, TbTrash, TbDownload, TbArrowRight } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { ConsoleMessage } from '../hooks/useConsoleOutput'

interface ConsoleViewerProps {
  consoleOutput: ConsoleMessage[]
  selectedAppId: string | null
  isSubscribed: boolean
  onClear: () => void
  onSubscribe: (appId: string) => void
  onUnsubscribe: (appId: string) => void
  appsList: Array<{ id: string; name: string; status: string }>
  consoleEndRef: React.RefObject<HTMLDivElement>
  className?: string
}

const ConsoleViewer: FC<ConsoleViewerProps> = ({
  consoleOutput,
  selectedAppId,
  isSubscribed,
  onClear,
  onSubscribe,
  onUnsubscribe,
  appsList,
  consoleEndRef,
  className = ''
}) => {
  const formatConsoleOutput = (message: ConsoleMessage) => {
    const timestamp = new Date(message.timestamp).toLocaleTimeString()

    return (
      <div key={`${message.timestamp}-${Math.random()}`} className="group">
        <div className={`flex items-start gap-2 ${
          message.type === 'stderr' ? 'text-red-600' :
          message.type === 'system' ? 'text-blue-600' :
          'text-gray-800'
        }`}>
          <span className="text-xs text-gray-500 font-mono mt-0.5 whitespace-nowrap">
            [{timestamp}]
          </span>
          {message.appId && (
            <span className="text-xs text-gray-400 font-mono mt-0.5 whitespace-nowrap">
              {message.appId.substring(0, 8)}:
            </span>
          )}
          <span className="flex-1 font-mono text-sm break-all">
            {message.output}
          </span>
        </div>
      </div>
    )
  }

  const downloadConsoleOutput = () => {
    const content = consoleOutput.map(msg =>
      `[${new Date(msg.timestamp).toISOString()}] ${msg.type.toUpperCase()}: ${msg.output}`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `console-${selectedAppId || 'system'}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const runningApps = appsList.filter(app => app.status === 'running')

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TbTerminal className="w-5 h-5" />
            Console Output
            {selectedAppId && (
              <span className="text-sm font-normal text-gray-500">
                • {appsList.find(app => app.id === selectedAppId)?.name || 'Unknown App'}
              </span>
            )}
          </h3>

          <div className="flex items-center gap-2">
            {consoleOutput.length > 0 && (
              <Button
                onClick={downloadConsoleOutput}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <TbDownload className="w-4 h-4" />
                Download
              </Button>
            )}
            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <TbTrash className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* App Selector */}
        {runningApps.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Monitor App:</label>
            <select
              value={selectedAppId || ''}
              onChange={(e) => {
                const appId = e.target.value
                if (appId && selectedAppId) {
                  onUnsubscribe(selectedAppId)
                }
                if (appId) {
                  onSubscribe(appId)
                }
              }}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">System Messages</option>
              {runningApps.map(app => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
            {selectedAppId && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  isSubscribed ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {isSubscribed ? 'Subscribed' : 'Subscribing...'}
                </span>
              </div>
            )}
          </div>
        )}

        {runningApps.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            No running applications to monitor. Start an app to see its console output.
          </div>
        )}
      </div>

      {/* Console Output */}
      <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm h-96 overflow-y-auto">
        {consoleOutput.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <TbTerminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Console output will appear here</p>
              <p className="text-xs mt-1">Start and monitor an application to see its output</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {consoleOutput.map(formatConsoleOutput)}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsoleViewer