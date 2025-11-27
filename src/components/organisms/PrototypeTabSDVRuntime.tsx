// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState } from 'react'
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
  TbBug
} from 'react-icons/tb'

const PrototypeTabSDVRuntime: FC = () => {
  const [selectedAgent, setSelectedAgent] = useState('uda-agent-001')
  const [activeTab, setActiveTab] = useState('overview')
  const [isDeploying, setIsDeploying] = useState(false)

  // Mock data for demo
  const agents = [
    {
      id: 'uda-agent-001',
      name: 'Test Vehicle 1',
      status: 'online',
      ip: '192.168.1.100',
      version: 'v1.0.0',
      services: 3,
      apps: 2
    },
    {
      id: 'uda-agent-002',
      name: 'Lab Simulator',
      status: 'online',
      ip: '192.168.1.101',
      version: 'v1.0.0',
      services: 3,
      apps: 1
    },
    {
      id: 'uda-agent-003',
      name: 'Demo Unit',
      status: 'offline',
      ip: '192.168.1.102',
      version: 'v0.9.0',
      services: 0,
      apps: 0
    }
  ]

  const runtimeServices = [
    {
      name: 'KUKSA Data Broker',
      icon: <TbDatabase className="w-4 h-4" />,
      status: 'running',
      version: 'latest',
      cpu: 5,
      memory: 45,
      uptime: '2h 34m',
      port: 55555,
      signals: 156
    },
    {
      name: 'MQTT Broker',
      icon: <TbMessageCircle className="w-4 h-4" />,
      status: 'running',
      version: '2.0.18',
      cpu: 2,
      memory: 22,
      uptime: '2h 34m',
      port: 1883,
      topics: 23
    },
    {
      name: 'Vehicle App',
      icon: <TbApps className="w-4 h-4" />,
      status: 'running',
      version: 'custom',
      cpu: 8,
      memory: 67,
      uptime: '1h 45m',
      type: 'Python',
      signals: 12
    }
  ]

  const applications = [
    {
      id: 'speed-monitor',
      name: 'Speed Monitor',
      status: 'running',
      version: 'v1.2.0',
      cpu: 3,
      memory: 34,
      lastUpdated: '5 min ago',
      signals: ['Vehicle.Speed', 'Vehicle.Acceleration']
    },
    {
      id: 'gps-tracker',
      name: 'GPS Tracker',
      status: 'running',
      version: 'v1.0.5',
      cpu: 5,
      memory: 33,
      lastUpdated: '2 min ago',
      signals: ['Vehicle.Position.Latitude', 'Vehicle.Position.Longitude']
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TbCube className="w-4 h-4" /> },
    { id: 'services', label: 'Services', icon: <TbDatabase className="w-4 h-4" /> },
    { id: 'state', label: 'State', icon: <TbApps className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Monitoring', icon: <TbActivity className="w-4 h-4" /> }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Agent Selection */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <TbDeviceDesktop className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Select UDA Agent</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedAgent === agent.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{agent.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  agent.status === 'online'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {agent.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">{agent.ip}</div>
              <div className="text-sm text-gray-500">{agent.version}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Runtime Status */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TbCube className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Runtime Services</h3>
          </div>
          <div className="space-y-3">
            {runtimeServices.map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {service.icon}
                  <span className="text-sm">{service.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Running</span>
                  <span className="text-xs text-gray-500">CPU: {service.cpu}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TbApps className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Applications</h3>
          </div>
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm">{app.name}</div>
                  <div className="text-sm text-gray-500">{app.version}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
                  <span className="text-xs text-gray-500">{app.cpu}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deploy Actions */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Deployment Actions</h3>
            <div className="text-sm text-gray-600">
              Deploy complete SDV runtime or individual components
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={isDeploying}
              onClick={() => setIsDeploying(true)}
            >
              <TbRefresh className="inline w-4 h-4 mr-2" />
              Update Runtime
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={isDeploying}
              onClick={() => setTimeout(() => setIsDeploying(false), 3000)}
            >
              <TbCloudUpload className="inline w-4 h-4 mr-2" />
              {isDeploying ? 'Deploying...' : 'Deploy Current App'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderServices = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TbCube className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Runtime Services</h3>
      </div>

      {runtimeServices.map((service, index) => (
        <div key={service.name} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                {service.icon}
              </div>
              <div>
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-gray-600">
                  {service.version} • Port: {service.port}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Running</span>
              <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                <TbRefresh className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">CPU Usage</div>
              <div className="font-medium">{service.cpu}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${service.cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Memory</div>
              <div className="font-medium">{service.memory}MB</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(service.memory/100)*100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Uptime</div>
              <div className="font-medium">{service.uptime}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">
                {service.signals ? 'Signals' : 'Topics'}
              </div>
              <div className="font-medium">
                {service.signals || service.topics}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderState = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TbApps className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Persistent State Management</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">KUKSA Signals</h4>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <TbDownload className="inline w-4 h-4 mr-1" />
              Export
            </button>
          </div>
          <div className="space-y-2">
            {['Vehicle.Speed', 'Vehicle.Acceleration', 'Vehicle.Position.*'].map((signal) => (
              <div key={signal} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{signal}</span>
                <span className="text-sm text-gray-600">Last: {Math.floor(Math.random() * 100)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">MQTT Topics</h4>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <TbEye className="inline w-4 h-4 mr-1" />
              Monitor
            </button>
          </div>
          <div className="space-y-2">
            {['/vehicle/speed', '/vehicle/gps', '/vehicle/sensors/*'].map((topic) => (
              <div key={topic} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{topic}</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">State Synchronization</h4>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <TbRefresh className="inline w-4 h-4 mr-1" />
              Sync
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <TbDownload className="inline w-4 h-4 mr-1" />
              Backup
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">234</div>
            <div className="text-sm text-gray-600">Signals Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">45</div>
            <div className="text-sm text-gray-600">MQTT Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">12KB</div>
            <div className="text-sm text-gray-600">State Size</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMonitoring = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TbActivity className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">System Monitoring</h3>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbCpu className="w-4 h-4 text-orange-500" />
            <span className="font-medium">CPU Usage</span>
          </div>
          <div className="text-2xl font-bold">15%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-orange-600 h-2 rounded-full" style={{ width: '15%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbDeviceFloppy className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Memory</span>
          </div>
          <div className="text-2xl font-bold">156MB</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbNetwork className="w-4 h-4 text-green-500" />
            <span className="font-medium">Network</span>
          </div>
          <div className="text-2xl font-bold">2.3MB/s</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbClock className="w-4 h-4 text-purple-500" />
            <span className="font-medium">Uptime</span>
          </div>
          <div className="text-2xl font-bold">2h 34m</div>
          <div className="text-sm text-gray-600">Total runtime</div>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Recent Activity</h4>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            <TbBug className="inline w-4 h-4 mr-1" />
            Debug
          </button>
        </div>
        <div className="space-y-2">
          {[
            { time: '2 min ago', action: 'Deployed speed-monitor app', status: 'success' },
            { time: '5 min ago', action: 'Updated KUKSA signals', status: 'info' },
            { time: '12 min ago', action: 'MQTT client connected', status: 'success' },
            { time: '34 min ago', action: 'Runtime services started', status: 'success' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{activity.time}</span>
                <span className="text-sm">{activity.action}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                activity.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full">
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'state' && renderState()}
        {activeTab === 'monitoring' && renderMonitoring()}
      </div>
    </div>
  )
}

export default PrototypeTabSDVRuntime