// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import DaText from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import {
  TbDeviceLaptop,
  TbNetwork,
  TbSettings,
  TbRefresh,
  TbCheck,
  TbAlertTriangle,
  TbLoader2,
  TbWifi,
  TbWifiOff,
  TbPlug,
  TbPlugConnected,
  TbServer,
  TbCar,
  TbRouter,
  TbPlus,
  TbTrash,
  TbEdit,
  TbPlayerPlay,
  TbPlayerStop,
  TbCircleCheck,
  TbCircleX,
  TbActivity,
} from 'react-icons/tb'
import { cn } from '@/lib/utils'

interface Device {
  id: string
  name: string
  type: 'raspberry-pi' | 'nvidia-jetson' | 'desktop' | 'vehicle-edge'
  status: 'online' | 'offline' | 'connecting'
  ip: string
  lastSeen: Date
  capabilities: {
    cpu: string
    memory: string
    storage: string
  }
  apps: number
  latency?: number
  connectionType: 'wifi' | 'ethernet' | 'usb'
}

interface UDADashboardProps {
  onClose?: () => void
  prototypeId?: string
}

const DaUDADashboard: React.FC<UDADashboardProps> = ({ onClose, prototypeId }) => {
  // Phase management
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'connect'>('setup')
  
  // Device management
  const [devices, setDevices] = useState<Device[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  
  // Connection status
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle')

  // Mock devices for demonstration
  const mockDevices: Device[] = [
    {
      id: 'device-001',
      name: 'raspberrypi-001.local',
      type: 'raspberry-pi',
      status: 'online',
      ip: '192.168.1.100',
      lastSeen: new Date(),
      capabilities: { cpu: '45%', memory: '2.1GB', storage: '8.5GB' },
      apps: 4,
      latency: 2,
      connectionType: 'ethernet'
    },
    {
      id: 'device-002',
      name: 'jetson-nx-002.lan',
      type: 'nvidia-jetson',
      status: 'online',
      ip: '192.168.1.105',
      lastSeen: new Date(),
      capabilities: { cpu: '67%', memory: '3.8GB', storage: '12.1GB' },
      apps: 7,
      latency: 15,
      connectionType: 'wifi'
    },
    {
      id: 'device-003',
      name: 'desktop-003',
      type: 'desktop',
      status: 'offline',
      ip: '192.168.1.110',
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      capabilities: { cpu: '0%', memory: '0GB', storage: '0GB' },
      apps: 0,
      connectionType: 'ethernet'
    }
  ]

  useEffect(() => {
    // Initialize with mock devices
    setDevices(mockDevices)
  }, [])

  const handleDeviceDiscovery = async () => {
    setIsScanning(true)
    // Simulate device discovery
    await new Promise(resolve => setTimeout(resolve, 3000))
    setDevices(mockDevices)
    setIsScanning(false)
  }

  const handleDeviceConnect = async (device: Device) => {
    setSelectedDevice(device)
    setIsConnecting(true)
    setConnectionStatus('connecting')
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1
    setConnectionStatus(success ? 'connected' : 'failed')
    setIsConnecting(false)
    
    if (success) {
      setCurrentPhase('connect')
    }
  }

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'raspberry-pi':
        return <TbDeviceLaptop className="w-6 h-6" />
      case 'nvidia-jetson':
        return <TbServer className="w-6 h-6" />
      case 'desktop':
        return <TbDeviceLaptop className="w-6 h-6" />
      case 'vehicle-edge':
        return <TbCar className="w-6 h-6" />
      default:
        return <TbDeviceLaptop className="w-6 h-6" />
    }
  }

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return <TbCircleCheck className="w-4 h-4 text-green-500" />
      case 'offline':
        return <TbCircleX className="w-4 h-4 text-red-500" />
      case 'connecting':
        return <TbLoader2 className="w-4 h-4 text-yellow-500 animate-spin" />
      default:
        return <TbCircleX className="w-4 h-4 text-gray-500" />
    }
  }

  const getConnectionIcon = (type: Device['connectionType']) => {
    switch (type) {
      case 'wifi':
        return <TbWifi className="w-4 h-4 text-blue-500" />
      case 'ethernet':
        return <TbRouter className="w-4 h-4 text-blue-500" />
      case 'usb':
        return <TbPlug className="w-4 h-4 text-blue-500" />
      default:
        return <TbWifiOff className="w-4 h-4 text-gray-500" />
    }
  }

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'text-gray-500'
    if (latency <= 10) return 'text-green-500'
    if (latency <= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const renderSetupPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <DaText variant="title" className="text-da-primary-500">
          UDA Agent Setup
        </DaText>
        <DaText variant="body" className="text-da-gray-medium mt-2">
          Discover and connect to UDA-enabled devices for persistent vehicle app deployment
        </DaText>
      </div>

      {/* Discovery Section */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TbNetwork className="w-5 h-5 text-da-primary-500" />
            <DaText variant="subheading">Device Discovery</DaText>
          </div>
          <DaButton
            variant="outline"
            size="sm"
            onClick={handleDeviceDiscovery}
            disabled={isScanning}
            className="flex items-center space-x-2"
          >
            {isScanning ? (
              <>
                <TbLoader2 className="w-4 h-4 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <TbRefresh className="w-4 h-4" />
                <span>Discover</span>
              </>
            )}
          </DaButton>
        </div>

        <DaText variant="small" className="text-da-gray-medium">
          Scan your local network to discover UDA-enabled devices. Devices must be on the same network and running UDA Agent.
        </DaText>
      </div>

      {/* Device List */}
      <div className="space-y-3">
        <DaText variant="subheading" className="flex items-center space-x-2">
          <TbDeviceLaptop className="w-5 h-5" />
          <span>Available Devices ({devices.length})</span>
        </DaText>

        {devices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <TbDeviceLaptop className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <DaText variant="body" className="text-da-gray-medium">
              No devices found
            </DaText>
            <DaText variant="small" className="text-da-gray-medium mt-1">
              Click "Discover" to scan for UDA-enabled devices on your network
            </DaText>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {devices.map((device) => (
              <div
                key={device.id}
                className={cn(
                  "border rounded-lg p-3 transition-all duration-200",
                  device.status === 'online' 
                    ? "border-green-200 bg-green-50 hover:bg-green-100" 
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <DaText variant="small-bold" className="truncate">
                          {device.name}
                        </DaText>
                        {getStatusIcon(device.status)}
                        {getConnectionIcon(device.connectionType)}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <DaText variant="small" className="text-da-gray-medium">
                          {device.ip}
                        </DaText>
                        {device.latency && (
                          <DaText variant="small" className={getLatencyColor(device.latency)}>
                            {device.latency}ms
                          </DaText>
                        )}
                        <DaText variant="small" className="text-da-gray-medium">
                          {device.apps} apps
                        </DaText>
                      </div>
                      {device.status === 'online' && (
                        <div className="flex items-center space-x-2 mt-1">
                          <DaText variant="small" className="text-da-gray-medium">
                            CPU: {device.capabilities.cpu} | Memory: {device.capabilities.memory}
                          </DaText>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {device.status === 'online' ? (
                      <DaButton
                        variant="solid"
                        size="sm"
                        onClick={() => handleDeviceConnect(device)}
                        disabled={isConnecting}
                        className="flex items-center space-x-1"
                      >
                        {isConnecting && selectedDevice?.id === device.id ? (
                          <>
                            <TbLoader2 className="w-4 h-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <TbPlugConnected className="w-4 h-4" />
                            <span>Connect</span>
                          </>
                        )}
                      </DaButton>
                    ) : (
                      <DaButton variant="outline-nocolor" size="sm" disabled>
                        <TbPlug className="w-4 h-4" />
                        <span>Offline</span>
                      </DaButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Status */}
      {connectionStatus !== 'idle' && (
        <div className={cn(
          "rounded-lg p-4 border",
          connectionStatus === 'connected' 
            ? "bg-green-50 border-green-200" 
            : connectionStatus === 'failed'
            ? "bg-red-50 border-red-200"
            : "bg-blue-50 border-blue-200"
        )}>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' && <TbCircleCheck className="w-5 h-5 text-green-500" />}
            {connectionStatus === 'failed' && <TbAlertTriangle className="w-5 h-5 text-red-500" />}
            {connectionStatus === 'connecting' && <TbLoader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            
            <DaText variant="subheading">
              {connectionStatus === 'connected' && 'Connection Successful'}
              {connectionStatus === 'failed' && 'Connection Failed'}
              {connectionStatus === 'connecting' && 'Connecting to Device...'}
            </DaText>
          </div>
          
          <DaText variant="small" className="text-da-gray-medium mt-1">
            {connectionStatus === 'connected' && `Successfully connected to ${selectedDevice?.name}`}
            {connectionStatus === 'failed' && 'Failed to establish connection. Please check device status and try again.'}
            {connectionStatus === 'connecting' && 'Establishing secure connection to the UDA Agent...'}
          </DaText>
        </div>
      )}
    </div>
  )

  const renderConnectPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <DaText variant="title" className="text-da-primary-500">
          UDA Agent Connected
        </DaText>
        <DaText variant="body" className="text-da-gray-medium mt-2">
          Managing vehicle applications on {selectedDevice?.name}
        </DaText>
      </div>

      {/* Connected Device Info */}
      {selectedDevice && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TbCircleCheck className="w-8 h-8 text-green-500" />
              <div>
                <DaText variant="subheading">{selectedDevice.name}</DaText>
                <DaText variant="small" className="text-da-gray-medium">
                  {selectedDevice.ip} • {selectedDevice.latency}ms latency
                </DaText>
              </div>
            </div>
            <DaButton
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPhase('setup')
                setConnectionStatus('idle')
                setSelectedDevice(null)
              }}
            >
              Disconnect
            </DaButton>
          </div>
        </div>
      )}

      {/* Device Capabilities */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <DaText variant="subheading" className="flex items-center space-x-2 mb-3">
          <TbSettings className="w-5 h-5" />
          <span>Device Capabilities</span>
        </DaText>
        
        {selectedDevice && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <DaText variant="small-bold" className="text-da-primary-500">
                {selectedDevice.capabilities.cpu}
              </DaText>
              <DaText variant="small" className="text-da-gray-medium">
                CPU Usage
              </DaText>
            </div>
            <div className="text-center">
              <DaText variant="small-bold" className="text-da-primary-500">
                {selectedDevice.capabilities.memory}
              </DaText>
              <DaText variant="small" className="text-da-gray-medium">
                Memory Used
              </DaText>
            </div>
            <div className="text-center">
              <DaText variant="small-bold" className="text-da-primary-500">
                {selectedDevice.apps}
              </DaText>
              <DaText variant="small" className="text-da-gray-medium">
                Running Apps
              </DaText>
            </div>
          </div>
        )}
      </div>

      {/* App Deployment Status */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <DaText variant="subheading" className="flex items-center space-x-2 mb-3">
          <TbActivity className="w-5 h-5" />
          <span>Ready for Deployment</span>
        </DaText>
        
        <DaText variant="small" className="text-da-gray-medium">
          The UDA Agent is ready to receive vehicle applications. Apps deployed through this interface will persist on the device and automatically start when the device boots.
        </DaText>
        
        <div className="mt-4 flex items-center space-x-3">
          <DaButton variant="solid" className="flex items-center space-x-2">
            <TbPlayerPlay className="w-4 h-4" />
            <span>Deploy Current App</span>
          </DaButton>
          <DaButton variant="outline" size="sm">
            Manage Apps
          </DaButton>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center space-x-3">
        <DaButton variant="outline" onClick={onClose}>
          Close Dashboard
        </DaButton>
        <DaButton variant="solid">
          Open Advanced Settings
        </DaButton>
      </div>
    </div>
  )

  return (
    <div className="min-h-[400px] max-h-[90vh] w-[95vw] min-w-[600px] max-w-[800px] p-6">
      {currentPhase === 'setup' && renderSetupPhase()}
      {currentPhase === 'connect' && renderConnectPhase()}
    </div>
  )
}

export default DaUDADashboard