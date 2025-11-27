// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import DaText from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import {
  TbCube,
  TbDeviceDesktop,
  TbApps,
  TbDatabase,
  TbMessageCircle,
  TbActivity,
  TbCpu,
  TbDeviceFloppy,
  TbNetwork,
  TbClock,
  TbCloudUpload,
  TbRefresh,
  TbDownload,
  TbEye,
  TbBug,
  TbSettings,
  TbPlayerPlay,
  TbPlayerStop,
  TbCheck,
  TbX,
  TbAlertTriangle,
  TbPlug,
  TbWifi,
  TbServer
} from 'react-icons/tb'

interface DaUDASetupDashboardProps {
  onCancel?: () => void
  target?: any
  onFinish?: () => void
}

const DaUDASetupDashboard: FC<DaUDASetupDashboardProps> = ({
  onCancel,
  target,
  onFinish
}) => {
  const [activeTab, setActiveTab] = useState('setup')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [connectedAgents, setConnectedAgents] = useState<string[]>([])

  // Mock agents for discovery
  const [discoveredAgents, setDiscoveredAgents] = useState([
    {
      id: 'uda-agent-001',
      name: 'Test Vehicle 1',
      status: 'available',
      ip: '192.168.1.100',
      mac: 'AA:BB:CC:DD:EE:FF',
      lastSeen: '2 min ago'
    },
    {
      id: 'uda-agent-002',
      name: 'Lab Simulator',
      status: 'available',
      ip: '192.168.1.101',
      mac: '11:22:33:44:55:66',
      lastSeen: '1 min ago'
    },
    {
      id: 'uda-agent-003',
      name: 'Demo Unit',
      status: 'busy',
      ip: '192.168.1.102',
      mac: 'FF:EE:DD:CC:BB:AA',
      lastSeen: '30 sec ago'
    }
  ])

  const tabs = [
    { id: 'setup', label: 'Setup Guide', icon: <TbSettings className="w-4 h-4" /> },
    { id: 'deploy', label: 'Deploy Services', icon: <TbCloudUpload className="w-4 h-4" /> },
    { id: 'monitor', label: 'Monitor', icon: <TbActivity className="w-4 h-4" /> }
  ]

  const renderSetupGuide = () => (
    <div className="space-y-6">
      {/* Setup Steps */}
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold">Install UDA Agent</h3>
          </div>
          <div className="ml-11 space-y-2">
            <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
              <p className="text-sm font-medium mb-2">Installation Commands:</p>
              <code className="block bg-gray-800 text-white p-2 rounded text-xs">
                git clone https://github.com/tri2510/uda-deployment-agent.git
                <br />
                cd uda-deployment-agent
                <br />
                pip install -r config/requirements.txt
                <br />
                python3 src/uda_agent.py --server http://localhost:3090
              </code>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-green-600">2</span>
            </div>
            <h3 className="font-semibold">Start KUKSA Data Broker</h3>
          </div>
          <div className="ml-11 space-y-2">
            <div className="bg-gray-50 p-3 rounded border-l-4 border-green-500">
              <p className="text-sm font-medium mb-2">Docker Commands:</p>
              <code className="block bg-gray-800 text-white p-2 rounded text-xs">
                docker run -d --name kuksa-databroker \
                <br />
                &nbsp;&nbsp;-p 55555:55555 \
                <br />
                &nbsp;&nbsp;eclipse/kuksa-databroker:latest
              </code>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-purple-600">3</span>
            </div>
            <h3 className="font-semibold">Start MQTT Broker</h3>
          </div>
          <div className="ml-11 space-y-2">
            <div className="bg-gray-50 p-3 rounded border-l-4 border-purple-500">
              <p className="text-sm font-medium mb-2">Docker Commands:</p>
              <code className="block bg-gray-800 text-white p-2 rounded text-xs">
                docker run -d --name eclipse-mosquitto \
                <br />
                &nbsp;&nbsp;-p 1883:1883 \
                <br />
                &nbsp;&nbsp;eclipse-mosquitto:latest
              </code>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-orange-600">4</span>
            </div>
            <h3 className="font-semibold">Verify Connection</h3>
          </div>
          <div className="ml-11">
            <button
              onClick={handleAgentDiscovery}
              disabled={isConnecting}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              <TbRefresh className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              {isConnecting ? 'Discovering...' : 'Discover Agents'}
            </button>
          </div>
        </div>
      </div>

      {/* Discovered Agents */}
      {discoveredAgents.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TbDeviceDesktop className="w-5 h-5" />
            Discovered UDA Agents
          </h3>
          <div className="space-y-2">
            {discoveredAgents.map((agent) => (
              <div
                key={agent.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedAgent === agent.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-600">{agent.ip} • {agent.mac}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      agent.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {agent.status}
                    </span>
                    {selectedAgent === agent.id && (
                      <TbCheck className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderDeployServices = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TbDatabase className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">KUKSA Data Broker</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className="text-green-600">Running</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Port:</span>
              <span>55555</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Signals:</span>
              <span>156</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TbMessageCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">MQTT Broker</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className="text-green-600">Running</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Port:</span>
              <span>1883</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Topics:</span>
              <span>23</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TbApps className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Vehicle App</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className="text-yellow-600">Not Deployed</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Agent:</span>
              <span>{selectedAgent || 'None'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>App Type:</span>
              <span>Python</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TbAlertTriangle className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Ready to Deploy</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Select an agent and click deploy to start your vehicle application. The deployment includes:
        </p>
        <ul className="text-sm text-gray-700 space-y-1 mb-4">
          <li>• KUKSA Data Broker configuration</li>
          <li>• MQTT Broker setup</li>
          <li>• Vehicle application deployment</li>
          <li>• Persistent state management</li>
        </ul>

        <button
          onClick={handleDeploy}
          disabled={!selectedAgent || isDeploying}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDeploying ? (
            <>
              <TbRefresh className="w-4 h-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <TbCloudUpload className="w-4 h-4" />
              Deploy Vehicle App to {selectedAgent ? discoveredAgents.find(a => a.id === selectedAgent)?.name : 'Selected Agent'}
            </>
          )}
        </button>
      </div>
    </div>
  )

  const renderMonitor = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbServer className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Agent Status</span>
          </div>
          <div className="text-2xl font-bold text-green-600">Connected</div>
          <div className="text-sm text-gray-600">{selectedAgent || 'None'}</div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbCpu className="w-4 h-4 text-orange-500" />
            <span className="font-medium">CPU Usage</span>
          </div>
          <div className="text-2xl font-bold">12%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-orange-600 h-2 rounded-full" style={{ width: '12%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbDeviceFloppy className="w-4 h-4 text-green-500" />
            <span className="font-medium">Memory</span>
          </div>
          <div className="text-2xl font-bold">89MB</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '17%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbClock className="w-4 h-4 text-purple-500" />
            <span className="font-medium">Uptime</span>
          </div>
          <div className="text-2xl font-bold">5m 23s</div>
          <div className="text-sm text-gray-600">Since deployment</div>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-3">Application Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-green-50 rounded">
            <div className="flex items-center gap-2">
              <TbCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm">Vehicle App</span>
            </div>
            <span className="text-sm text-green-600">Running</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-50 rounded">
            <div className="flex items-center gap-2">
              <TbCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm">KUKSA Data Broker</span>
            </div>
            <span className="text-sm text-green-600">Ready</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-50 rounded">
            <div className="flex items-center gap-2">
              <TbCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm">MQTT Broker</span>
            </div>
            <span className="text-sm text-green-600">Ready</span>
          </div>
        </div>
      </div>
    </div>
  )

  const handleAgentDiscovery = async () => {
    setIsConnecting(true)
    // Simulate agent discovery
    setTimeout(() => {
      setIsConnecting(false)
      // Auto-select first available agent
      const firstAvailable = discoveredAgents.find(a => a.status === 'available')
      if (firstAvailable && !selectedAgent) {
        setSelectedAgent(firstAvailable.id)
      }
    }, 2000)
  }

  const handleDeploy = async () => {
    if (!selectedAgent) return

    setIsDeploying(true)
    // Simulate deployment
    setTimeout(() => {
      setIsDeploying(false)
      setConnectedAgents([...connectedAgents, selectedAgent])
      // Switch to monitor tab to show results
      setActiveTab('monitor')
    }, 3000)
  }

  return (
    <div className="min-h-[500px] w-full max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TbServer className="w-6 h-6 text-blue-500" />
            UDA Agent Setup Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Configure and deploy your SDV vehicle application to UDA agents
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {connectedAgents.length > 0 && (
            <button
              onClick={() => {
                // Mark UDA agent as connected
                localStorage.setItem('uda-agent-connected', 'true')
                onFinish?.()
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Finish Setup
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'setup' && renderSetupGuide()}
        {activeTab === 'deploy' && renderDeployServices()}
        {activeTab === 'monitor' && renderMonitor()}
      </div>
    </div>
  )
}

export default DaUDASetupDashboard