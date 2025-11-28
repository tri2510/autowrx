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
  TbApps,
  TbDatabase,
  TbMessageCircle,
  TbActivity,
  TbCpu,
  TbDeviceFloppy,
  TbNetwork,
  TbClock,
  TbRefresh,
  TbDownload,
  TbEye,
  TbBug,
  TbChartLine,
  TbSignalG,
  TbServer,
  TbSettings
} from 'react-icons/tb'

const PrototypeTabSDVRuntime: FC = () => {
  const [activeTab, setActiveTab] = useState('services')

  // Local SDV Runtime services (managed by Docker)
  const runtimeServices = [
    {
      name: 'KUKSA Data Broker',
      icon: <TbDatabase className="w-4 h-4" />,
      status: 'running',
      version: '0.4.0',
      cpu: 5,
      memory: 45,
      uptime: '2h 34m',
      port: 55555,
      signals: 156,
      managedBy: 'sdv-runtime'
    },
    {
      name: 'MQTT Broker',
      icon: <TbMessageCircle className="w-4 h-4" />,
      status: 'running',
      version: '5.0',
      cpu: 2,
      memory: 22,
      uptime: '2h 34m',
      port: 1883,
      topics: 23,
      managedBy: 'sdv-runtime'
    }
  ]

  const tabs = [
    { id: 'services', label: 'Services', icon: <TbDatabase className="w-4 h-4" /> },
    { id: 'signals', label: 'Signals', icon: <TbSignalG className="w-4 h-4" /> },
    { id: 'state', label: 'State Management', icon: <TbCube className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Performance', icon: <TbChartLine className="w-4 h-4" /> }
  ]

  const renderServices = () => (
    <div className="space-y-4">
      {/* Runtime Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <TbServer className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Local SDV Runtime</h3>
            <p className="text-sm text-blue-700">Docker-based runtime environment for vehicle services</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-blue-800">
          <span>Version: 2.1.0</span>
          <span>•</span>
          <span>Deployment: Docker</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Running
          </span>
        </div>
      </div>

      {/* Services */}
      <div className="flex items-center gap-2 mb-4">
        <TbDatabase className="w-5 h-5 text-blue-500" />
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
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">SDV Runtime</span>
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

      {/* Note about UDA Agent Integration */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <TbSettings className="w-5 h-5 text-yellow-600" />
          <div>
            <h4 className="font-semibold text-yellow-800">UDA Agent Integration</h4>
            <p className="text-sm text-yellow-700">
              For fleet management and vehicle app deployment, use the "Deploy to UDA Agent" feature.
              This tab focuses on monitoring local SDV Runtime services only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSignals = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TbSignalG className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Vehicle Signal Catalog</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Available Signals</h4>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">156</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              'Vehicle.Speed',
              'Vehicle.Acceleration.Longitudinal',
              'Vehicle.Acceleration.Lateral',
              'Vehicle.Acceleration.Vertical',
              'Vehicle.Position.Latitude',
              'Vehicle.Position.Longitude',
              'Vehicle.Position.Altitude',
              'Vehicle.Cabin.Door.Row1.Left.IsOpen',
              'Vehicle.Cabin.Door.Row1.Right.IsOpen',
              'Vehicle.Cabin.Seat.Row1.Left.Position',
              'Vehicle.Cabin.Seat.Row1.Right.Position',
              'Vehicle.Powertrain.Transmission.CurrentGear',
              'Vehicle.Powertrain.ElectricMotor.RPM',
              'Vehicle.Powertrain.Battery.RemainingCharge',
              'Vehicle.OBD.Speed',
              'Vehicle.ADAS.ABS.IsActive',
              'Vehicle.ADAS.CruiseControl.IsEnabled',
              'Vehicle.ADAS.LaneKeepingAssist.IsEngaged'
            ].map((signal) => (
              <div key={signal} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{signal}</span>
                <span className="text-sm text-gray-600">•</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Signal Categories</h4>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <TbDownload className="inline w-4 h-4 mr-1" />
              Export VSS
            </button>
          </div>
          <div className="space-y-2">
            {[
              { category: 'Powertrain', count: 23, status: 'active' },
              { category: 'Cabin', count: 45, status: 'active' },
              { category: 'ADAS', count: 31, status: 'active' },
              { category: 'Chassis', count: 18, status: 'active' },
              { category: 'Body', count: 27, status: 'active' },
              { category: 'OBD', count: 12, status: 'active' }
            ].map((cat) => (
              <div key={cat.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                    {cat.count} signals
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderState = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TbCube className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Persistent State Management</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">KUKSA Signals State</h4>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <TbDownload className="inline w-4 h-4 mr-1" />
              Export
            </button>
          </div>
          <div className="space-y-2">
            {['Vehicle.Speed: 45 km/h', 'Vehicle.Position.Latitude: 52.5200', 'Vehicle.Cabin.Door.Row1.Left.IsOpen: false'].map((signal) => (
              <div key={signal} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{signal}</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Current</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">MQTT Topic State</h4>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <TbEye className="inline w-4 h-4 mr-1" />
              Monitor
            </button>
          </div>
          <div className="space-y-2">
            {['/vehicle/speed: active', '/vehicle/gps: active', '/vehicle/sensors/*: active'].map((topic) => (
              <div key={topic} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{topic}</span>
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
            <div className="text-2xl font-bold text-green-600">156</div>
            <div className="text-sm text-gray-600">Signals Managed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">23</div>
            <div className="text-sm text-gray-600">MQTT Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">24KB</div>
            <div className="text-sm text-gray-600">State Size</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMonitoring = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TbChartLine className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Performance Monitoring</h3>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbCpu className="w-4 h-4 text-orange-500" />
            <span className="font-medium">Total CPU</span>
          </div>
          <div className="text-2xl font-bold">7%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-orange-600 h-2 rounded-full" style={{ width: '7%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbDeviceFloppy className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Total Memory</span>
          </div>
          <div className="text-2xl font-bold">67MB</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '13%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbNetwork className="w-4 h-4 text-green-500" />
            <span className="font-medium">Network I/O</span>
          </div>
          <div className="text-2xl font-bold">1.2MB/s</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '12%' }} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TbClock className="w-4 h-4 text-purple-500" />
            <span className="font-medium">Uptime</span>
          </div>
          <div className="text-2xl font-bold">2h 34m</div>
          <div className="text-sm text-gray-600">Runtime total</div>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">System Logs</h4>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            <TbBug className="inline w-4 h-4 mr-1" />
            Debug
          </button>
        </div>
        <div className="space-y-2">
          {[
            { time: '2 min ago', action: 'KUKSA Data Broker: 156 signals registered', status: 'info' },
            { time: '5 min ago', action: 'MQTT Broker: Client connected', status: 'success' },
            { time: '12 min ago', action: 'State synchronization completed', status: 'success' },
            { time: '34 min ago', action: 'SDV Runtime services started', status: 'success' },
            { time: '1h ago', action: 'Docker container initialized', status: 'info' }
          ].map((log, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{log.time}</span>
                <span className="text-sm">{log.action}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                log.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {log.status}
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
        {activeTab === 'services' && renderServices()}
        {activeTab === 'signals' && renderSignals()}
        {activeTab === 'state' && renderState()}
        {activeTab === 'monitoring' && renderMonitoring()}
      </div>
    </div>
  )
}

export default PrototypeTabSDVRuntime