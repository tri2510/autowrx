// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import {
  TbDeviceDesktop,
  TbRocket,
  TbTerminal,
  TbPlayerPlay,
  TbCheck,
  TbX,
  TbPlus,
  TbDownload,
  TbUpload,
  TbCpu,
  TbProgress,
  TbActivity,
  TbServer,
  TbCode,
  TbBinary,
  TbArrowRight,
  TbArrowLeft,
  TbCopy,
  TbWifi,
  TbNetwork,
  TbRefresh,
  TbAlertTriangle,
  TbInfoCircle,
  TbClock,
  TbTerminal2,
  TbShield,
  TbTool
} from 'react-icons/tb'
import useSocketIO from '@/hooks/useSocketIO'
import NetworkDiscovery, { DetectedDevice } from '@/utils/networkDiscovery'

interface DeviceSetupWizardProps {
  onClose: () => void
  onComplete: (deviceInfo: any) => void
}

interface SetupStep {
  id: string
  title: string
  description: string
  icon: any
  status: 'pending' | 'in_progress' | 'completed' | 'error'
}

// Removed duplicate DetectedDevice interface - now imported from networkDiscovery

const DaDeviceSetupWizard: FC<DeviceSetupWizardProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [currentScanningIP, setCurrentScanningIP] = useState('')
  const [detectedDevices, setDetectedDevices] = useState<DetectedDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<DetectedDevice | null>(null)
  const [connectionTest, setConnectionTest] = useState<{ testing: boolean; success?: boolean; message?: string }>({
    testing: false
  })
  const [installationCommand, setInstallationCommand] = useState('')
  const [copiedCommand, setCopiedCommand] = useState(false)

  const socket = useSocketIO()

  const websocketTestCommand = `echo '{"type":"ping"}' | websocat ws://localhost:3002/runtime`

  const setupSteps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Vehicle Edge Runtime',
      description: 'Let\'s set up your first Vehicle Edge Runtime device',
      icon: TbDeviceDesktop,
      status: 'completed'
    },
    {
      id: 'device_type',
      title: 'Choose Device Type',
      description: 'Select the type of device you want to set up',
      icon: TbServer,
      status: currentStep > 0 ? 'completed' : 'in_progress'
    },
    {
      id: 'installation',
      title: 'Install Vehicle Edge Runtime',
      description: 'Install the runtime software on your device',
      icon: TbTerminal,
      status: currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: 'discovery',
      title: 'Discover Device',
      description: 'Find your Vehicle Edge Runtime on the network',
      icon: TbWifi,
      status: currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 'connection',
      title: 'Connect & Test',
      description: 'Establish connection and verify everything works',
      icon: TbCheck,
      status: currentStep > 3 ? 'completed' : 'pending'
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      description: 'Your Vehicle Edge Runtime is ready to use',
      icon: TbRocket,
      status: 'pending'
    }
  ]

  const deviceTypes = [
    {
      id: 'raspberry-pi',
      name: 'Raspberry Pi',
      description: 'Raspberry Pi 4/5 with Ubuntu, Debian, or Raspberry Pi OS (64-bit)',
      icon: TbCpu,
      requirements: [
        'Ubuntu 22.04+, Debian 11+, or Raspberry Pi OS 64-bit',
        'ARM64 (aarch64) architecture',
        '2GB RAM minimum (4GB+ recommended)',
        '16GB+ storage (SD card or SSD)',
        'Network connection (Ethernet or WiFi)',
        'User account with sudo privileges'
      ],
      installationSteps: [
        'Download official installation script',
        'Script auto-detects Raspberry Pi and applies optimizations',
        'Installs Node.js 18+ if not present',
        'Installs Docker and Docker Compose',
        'Optimizes configuration for ARM64 (3 concurrent apps, 128MB memory limit)',
        'Creates required directories and permissions',
        'Installs Vehicle Edge Runtime with all dependencies',
        'Provides clear next steps for starting services'
      ]
    },
    {
      id: 'linux-pc',
      name: 'Linux PC/Server',
      description: 'Ubuntu, Debian, or compatible Linux distributions (x86_64)',
      icon: TbDeviceDesktop,
      requirements: [
        'Ubuntu 20.04+, Debian 11+, or compatible',
        'x86_64 (Intel/AMD) architecture',
        '4GB RAM minimum (8GB+ recommended)',
        '20GB+ available disk space',
        'Network connection',
        'User account with sudo privileges'
      ],
      installationSteps: [
        'Download official installation script',
        'Script auto-detects Linux distribution',
        'Installs Node.js 18+ if not present',
        'Installs Docker and Docker Compose',
        'Configures settings for x86_64 (10 concurrent apps, 512MB memory limit)',
        'Sets up proper user permissions and directories',
        'Installs Vehicle Edge Runtime with all dependencies',
        'Provides startup commands for both Docker and native modes'
      ]
    },
    {
      id: 'existing',
      name: 'Existing Runtime',
      description: 'I already have a running Vehicle Edge Runtime',
      icon: TbNetwork,
      requirements: [
        'Runtime already installed and running',
        'Network accessible from this machine',
        'WebSocket API available (port 3002)',
        'Health check endpoint available (port 3003)'
      ],
      installationSteps: [
        'Skip installation step',
        'Go to device discovery',
        'Automatic network scanning to find your runtime',
        'Manual IP addition if auto-discovery fails',
        'Connection testing and validation',
        'Verify runtime capabilities and status'
      ]
    }
  ]

  const [selectedDeviceType, setSelectedDeviceType] = useState(deviceTypes[0])

  useEffect(() => {
    generateInstallationCommand()
  }, [selectedDeviceType])

  const generateInstallationCommand = () => {
    const commands: Record<string, string> = {
      'raspberry-pi': `# Method 1: Automated Installation (Recommended)
# Download and run the official installation script
curl -fsSL https://raw.githubusercontent.com/tri2510/vehicle-edge-runtime/main/install.sh | bash

# Method 2: Manual Installation
# 1. Download the script first
curl -fsSL https://raw.githubusercontent.com/tri2510/vehicle-edge-runtime/main/install.sh -o install.sh
chmod +x install.sh

# 2. Review the script (optional but recommended)
nano install.sh

# 3. Run the installation
./install.sh

# The script will automatically:
# - Detect your Raspberry Pi and apply optimizations
# - Install Node.js 18+ if not present
# - Install Docker and Docker Compose
# - Clone the Vehicle Edge Runtime repository
# - Install all dependencies
# - Create optimized configuration for ARM64
# - Set up proper permissions and directories`,
      'linux-pc': `# Method 1: Automated Installation (Recommended)
# Download and run the official installation script
curl -fsSL https://raw.githubusercontent.com/tri2510/vehicle-edge-runtime/main/install.sh | bash

# Method 2: Manual Installation
# 1. Download the script first
curl -fsSL https://raw.githubusercontent.com/tri2510/vehicle-edge-runtime/main/install.sh -o install.sh
chmod +x install.sh

# 2. Review the script (optional but recommended)
nano install.sh

# 3. Run the installation
./install.sh

# The script will automatically:
# - Detect your Linux distribution and version
# - Install Node.js 18+ if not present
# - Install Docker and Docker Compose
# - Clone the Vehicle Edge Runtime repository
# - Install all dependencies
# - Create proper configuration for x86_64
# - Set up permissions and directories`,
      'existing': '# Skip installation - go to next step to discover your existing runtime'
    }

    setInstallationCommand(commands[selectedDeviceType.id] || '')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(installationCommand)
      setCopiedCommand(true)
      setTimeout(() => setCopiedCommand(false), 2000)
    } catch (err) {
      console.error('Failed to copy command')
    }
  }

  const scanNetwork = async () => {
    setIsScanning(true)
    setDetectedDevices([])
    setScanProgress(0)

    try {
      const foundDevices = await NetworkDiscovery.scanForDevices(
        (progress, currentIP) => {
          setScanProgress(progress)
          setCurrentScanningIP(currentIP)
        }
      )

      setDetectedDevices(foundDevices)
    } catch (error) {
      console.error('Network scan failed:', error)
    } finally {
      setIsScanning(false)
      setScanProgress(0)
      setCurrentScanningIP('')
    }
  }

  const testConnection = async (device: DetectedDevice) => {
    setConnectionTest({ testing: true })

    try {
      const success = await NetworkDiscovery.testConnection(device)

      setConnectionTest({
        testing: false,
        success,
        message: success
          ? 'Successfully connected to Vehicle Edge Runtime!'
          : 'Failed to connect - check if runtime is running on the device'
      })
    } catch (error) {
      setConnectionTest({
        testing: false,
        success: false,
        message: 'Connection test failed - please verify the device is accessible'
      })
    }
  }

  const addDeviceManually = () => {
    const ip = prompt('Enter Vehicle Edge Runtime IP address:', '192.168.1.100')
    if (ip) {
      try {
        const manualDevice = NetworkDiscovery.addDeviceManually(ip, 3002)
        setDetectedDevices([...detectedDevices, manualDevice])
      } catch (error) {
        alert('Invalid IP address format. Please enter a valid IP address.')
      }
    }
  }

  const handleNext = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    if (selectedDevice) {
      onComplete({
        id: `vehicle-runtime-${selectedDevice.ip}`,
        name: selectedDevice.hostname || `Vehicle Runtime (${selectedDevice.ip})`,
        status: 'online',
        lastSeen: new Date(),
        version: '1.0.0',
        capabilities: ['run_python_app', 'run_binary_app', 'console_subscribe', 'stop_app', 'get_app_status']
      })
    }
    onClose()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true
      case 1: return !!selectedDeviceType
      case 2: return selectedDeviceType.id === 'existing' || true // Installation is manual
      case 3: return detectedDevices.length > 0 || selectedDeviceType.id === 'existing'
      case 4: return selectedDevice && connectionTest.success
      case 5: return true
      default: return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center py-8">
            <TbDeviceDesktop className="w-16 h-16 mx-auto mb-4 text-da-primary-500" />
            <h3 className="text-xl font-semibold mb-2">Welcome to Vehicle Edge Runtime Setup</h3>
            <p className="text-da-gray-600 mb-6">
              This wizard will guide you through setting up your first Vehicle Edge Runtime device.
            </p>
            <div className="bg-da-blue-50 border border-da-blue-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <h4 className="font-medium text-da-blue-900 mb-2">What you'll need:</h4>
              <ul className="list-disc list-inside text-da-blue-800 space-y-1">
                <li>A device (Raspberry Pi, Linux PC, or existing runtime)</li>
                <li>Network connection between this device and your computer</li>
                <li>Basic command line knowledge</li>
                <li>Admin/sudo access on the target device</li>
              </ul>
            </div>
          </div>
        )

      case 1: // Device Type
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">What type of device are you setting up?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deviceTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedDeviceType(type)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDeviceType.id === type.id
                      ? 'border-da-primary-500 bg-da-primary-50'
                      : 'border-da-gray-200 hover:border-da-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <type.icon className="w-6 h-6 text-da-primary-500" />
                    <h4 className="font-medium">{type.name}</h4>
                  </div>
                  <p className="text-sm text-da-gray-600 mb-3">{type.description}</p>
                  <div className="text-xs text-da-gray-500">
                    <p className="font-medium mb-1">Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {type.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 2: // Installation
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Installation Instructions</h3>
              <p className="text-da-gray-600">
                Connect to your device terminal and run these commands:
              </p>
            </div>

            {selectedDeviceType.id === 'existing' ? (
              <div className="bg-da-green-50 border border-da-green-200 rounded-lg p-6">
                <h4 className="font-medium text-da-green-900 mb-2">⏭️ Skip Installation</h4>
                <p className="text-da-green-800">
                  Since you already have a running Vehicle Edge Runtime, let's skip to device discovery.
                  Click "Next" to continue.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-da-gray-50 border border-da-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Installation Commands</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center space-x-1 px-3 py-1 text-sm border border-da-gray-300 rounded hover:bg-da-gray-100"
                      >
                        <TbCopy className="w-4 h-4" />
                        <span>{copiedCommand ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{installationCommand}</pre>
                  </div>
                </div>

                <div className="bg-da-blue-50 border border-da-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-da-blue-900 mb-2">What the script does:</h4>
                  <ol className="list-decimal list-inside text-da-blue-800 space-y-1">
                    {selectedDeviceType.installationSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="bg-da-purple-50 border border-da-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-da-purple-900 mb-2">After Installation:</h4>
                  <div className="space-y-3 text-sm text-da-purple-800">
                    <div>
                      <strong>1. Apply Docker Group Changes:</strong>
                      <div className="bg-purple-100 p-2 rounded mt-1 font-mono text-xs">
                        newgrp docker
                      </div>
                      <p className="text-xs mt-1">OR log out and log back in to apply group changes</p>
                    </div>
                    <div>
                      <strong>2. Start Vehicle Edge Runtime:</strong>
                      <div className="bg-purple-100 p-2 rounded mt-1 font-mono text-xs">
                        cd vehicle-edge-runtime<br/>
                        # Docker deployment (recommended):<br/>
                        ./7-start-separate-services.sh<br/><br/>
                        # Or alternative Docker setup:<br/>
                        ./docker-setup.sh prod
                      </div>
                    </div>
                    <div>
                      <strong>3. Verify Installation:</strong>
                      <div className="bg-purple-100 p-2 rounded mt-1 font-mono text-xs">
                        # Health check:<br/>
                        curl http://localhost:3003/health<br/><br/>
                        # Test WebSocket:<br/>
                        {websocketTestCommand}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-da-yellow-50 border border-da-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <TbInfoCircle className="w-5 h-5 text-da-yellow-600 mt-0.5" />
                    <div className="text-da-yellow-800">
                      <h4 className="font-medium mb-2">Important Notes:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• The script automatically detects your system and applies appropriate optimizations</li>
                        <li>• Raspberry Pi gets ARM64-specific settings (3 concurrent apps, 128MB memory limit)</li>
                        <li>• Linux PCs get x86_64 settings (10 concurrent apps, 512MB memory limit)</li>
                        <li>• All services start on different ports: WebSocket API (3002), Health Check (3003), Kit Manager (3090)</li>
                        <li>• Configuration can be customized in <code className="bg-yellow-100 px-1 rounded">vehicle-edge-runtime/.env</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case 3: // Discovery
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Discover Your Vehicle Edge Runtime</h3>
              <p className="text-da-gray-600">
                Let's find your Vehicle Edge Runtime device on the network.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={scanNetwork}
                disabled={isScanning}
                className="flex items-center space-x-2 px-4 py-2 bg-da-primary-500 text-white rounded-lg hover:bg-da-primary-600 disabled:opacity-50"
              >
                <TbRefresh className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan Network'}</span>
              </button>
              <button
                onClick={addDeviceManually}
                className="flex items-center space-x-2 px-4 py-2 border border-da-gray-300 rounded-lg hover:bg-da-gray-50"
              >
                <TbPlus className="w-4 h-4" />
                <span>Add Manually</span>
              </button>
            </div>

            {isScanning && (
              <div className="bg-da-blue-50 border border-da-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <TbRefresh className="w-5 h-5 text-da-blue-600 animate-spin" />
                  <span className="font-medium text-da-blue-900">Scanning Network...</span>
                </div>
                {scanProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-da-blue-800">Progress: {scanProgress}%</span>
                      {currentScanningIP && (
                        <span className="text-da-blue-600">Checking: {currentScanningIP}</span>
                      )}
                    </div>
                    <div className="w-full bg-da-blue-100 rounded-full h-2">
                      <div
                        className="bg-da-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-da-blue-700 mt-2">
                  Scanning common network ranges for Vehicle Edge Runtime devices...
                </p>
              </div>
            )}

            {detectedDevices.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Found Devices:</h4>
                {detectedDevices.map((device, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedDevice(device)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDevice?.ip === device.ip
                        ? 'border-da-primary-500 bg-da-primary-50'
                        : 'border-da-gray-200 hover:border-da-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TbServer className="w-5 h-5 text-da-primary-500" />
                        <div>
                          <h4 className="font-medium">{device.hostname || device.ip}</h4>
                          <p className="text-sm text-da-gray-600">
                            {device.ip}:{device.port}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          device.status === 'online'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {device.status}
                        </div>
                        {selectedDevice?.ip === device.ip && (
                          <TbCheck className="w-5 h-5 text-da-primary-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detectedDevices.length === 0 && !isScanning && (
              <div className="text-center py-8 bg-da-gray-50 rounded-lg">
                <TbWifi className="w-12 h-12 text-da-gray-400 mx-auto mb-4" />
                <p className="text-da-gray-600">No devices found yet</p>
                <p className="text-sm text-da-gray-500 mt-2">
                  Make sure your Vehicle Edge Runtime is running and accessible on the network
                </p>
              </div>
            )}
          </div>
        )

      case 4: // Connection Test
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Test Connection</h3>
              <p className="text-da-gray-600">
                Let's verify we can connect to your Vehicle Edge Runtime.
              </p>
            </div>

            {selectedDevice && (
              <div className="bg-da-gray-50 border border-da-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TbServer className="w-6 h-6 text-da-primary-500" />
                    <div>
                      <h4 className="font-medium">{selectedDevice.hostname}</h4>
                      <p className="text-sm text-da-gray-600">
                        {selectedDevice.ip}:{selectedDevice.port}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => testConnection(selectedDevice)}
                    disabled={connectionTest.testing}
                    className="flex items-center space-x-2 px-4 py-2 bg-da-primary-500 text-white rounded-lg hover:bg-da-primary-600 disabled:opacity-50"
                  >
                    <TbRefresh className={`w-4 h-4 ${connectionTest.testing ? 'animate-spin' : ''}`} />
                    <span>{connectionTest.testing ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>

                {connectionTest.message && (
                  <div className={`p-3 rounded-lg ${
                    connectionTest.success
                      ? 'bg-green-100 border border-green-200 text-green-800'
                      : 'bg-red-100 border border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {connectionTest.success ? (
                        <TbCheck className="w-5 h-5 mt-0.5" />
                      ) : (
                        <TbAlertTriangle className="w-5 h-5 mt-0.5" />
                      )}
                      <p className="text-sm">{connectionTest.message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-da-blue-50 border border-da-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-da-blue-900 mb-2">Connection Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">WebSocket URL:</span>
                  <div className="font-mono text-xs bg-white p-2 rounded border border-da-blue-300 mt-1">
                    ws://{selectedDevice?.ip}:{selectedDevice?.port}/runtime
                  </div>
                </div>
                <div>
                  <span className="font-medium">Kit Manager URL:</span>
                  <div className="font-mono text-xs bg-white p-2 rounded border border-da-blue-300 mt-1">
                    ws://{selectedDevice?.ip}:3090
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 5: // Complete
        return (
          <div className="text-center py-8">
            <TbRocket className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
            <p className="text-da-gray-600 mb-6">
              Your Vehicle Edge Runtime is now connected and ready to use.
            </p>

            <div className="bg-da-green-50 border border-da-green-200 rounded-lg p-6 max-w-2xl mx-auto text-left">
              <h4 className="font-medium text-da-green-900 mb-3">What's Next?</h4>
              <ul className="space-y-2 text-da-green-800">
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600" />
                  <span>Deploy Python or binary applications to your runtime</span>
                </li>
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600" />
                  <span>Monitor application performance and console output</span>
                </li>
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600" />
                  <span>Configure resource limits and environment variables</span>
                </li>
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600" />
                  <span>Set up additional runtimes for scaling</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 text-sm text-da-gray-600">
              <p>Device added: <strong>{selectedDevice?.hostname || selectedDevice?.ip}</strong></p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-da-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-da-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TbTool className="w-8 h-8 text-da-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-da-gray-900">Device Setup Wizard</h2>
              <p className="text-da-gray-600">Add your first Vehicle Edge Runtime device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-da-gray-100 rounded-lg transition-colors"
          >
            <TbX className="w-5 h-5 text-da-gray-500" />
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex-shrink-0 bg-white border-b border-da-gray-200 px-6 py-4">
        {/* Mobile: Compact indicator */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-da-gray-900">
              Step {currentStep + 1} of {setupSteps.length}
            </span>
            <span className="text-sm text-da-primary-600 font-medium">
              {setupSteps[currentStep].title}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-da-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / setupSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop: Full step indicators */}
        <div className="hidden sm:block">
          {/* Compact horizontal layout */}
          <div className="flex items-center justify-center space-x-1">
            {setupSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0 ${
                  step.status === 'completed'
                    ? 'bg-da-primary-500 text-white'
                    : step.status === 'in_progress'
                    ? 'bg-da-primary-100 text-da-primary-600 border-2 border-da-primary-500'
                    : index < currentStep
                    ? 'bg-da-primary-500 text-white'
                    : 'bg-da-gray-200 text-da-gray-600'
                }`}>
                  {step.status === 'completed' || index < currentStep ? (
                    <TbCheck className="w-3 h-3" />
                  ) : step.status === 'in_progress' ? (
                    <step.icon className="w-3 h-3" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="ml-2 mr-3">
                  <h4 className={`text-xs font-medium ${
                    index === currentStep ? 'text-da-primary-600' : 'text-da-gray-900'
                  }`}>
                    {step.title}
                  </h4>
                </div>

                {/* Connector Line */}
                {index < setupSteps.length - 1 && (
                  <div className={`w-4 h-0.5 ${
                    index < currentStep ? 'bg-da-primary-500' : 'bg-da-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Vertical step list */}
        <div className="sm:hidden mt-3 space-y-2">
          {setupSteps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0 ${
                step.status === 'completed'
                  ? 'bg-da-primary-500 text-white'
                  : step.status === 'in_progress'
                  ? 'bg-da-primary-100 text-da-primary-600 border-2 border-da-primary-500'
                  : index < currentStep
                  ? 'bg-da-primary-500 text-white'
                  : 'bg-da-gray-200 text-da-gray-600'
              }`}>
                {step.status === 'completed' || index < currentStep ? (
                  <TbCheck className="w-3 h-3" />
                ) : step.status === 'in_progress' ? (
                  <step.icon className="w-3 h-3" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-xs font-medium ${
                  index === currentStep ? 'text-da-primary-600' : 'text-da-gray-900'
                }`}>
                  {step.title}
                </h4>
                <p className="text-xs text-da-gray-600 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 min-h-full">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 bg-white border-t border-da-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-da-gray-300 rounded-lg hover:bg-da-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TbArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-sm text-da-gray-600">
            Step {currentStep + 1} of {setupSteps.length}
          </div>

          {currentStep < setupSteps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center space-x-2 px-4 py-2 bg-da-primary-500 text-white rounded-lg hover:bg-da-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <TbArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!selectedDevice}
              className="flex items-center space-x-2 px-6 py-2 bg-da-green-500 text-white rounded-lg hover:bg-da-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TbRocket className="w-4 h-4" />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DaDeviceSetupWizard