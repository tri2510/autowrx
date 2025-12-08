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
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'

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
      'raspberry-pi': `# Method 1: Quick Start with Simulation (Recommended for Testing)
git clone https://github.com/tri2510/vehicle-edge-runtime.git
cd vehicle-edge-runtime/simulation
./0-start-pi-ci.sh        # Start Raspberry Pi simulation container
./1-install-runtime.sh     # Install Node.js 18+ and dependencies
./2b-start-native.sh       # Start Vehicle Edge Runtime (fast)
# OR: ./2a-start-docker.sh  # Start with Docker containers

# Method 2: Manual Production Installation
# Download and run the official installation script
curl -fsSL https://raw.githubusercontent.com/tri2510/vehicle-edge-runtime/main/install.sh | bash

# The script will automatically:
# - Detect your Raspberry Pi and apply ARM64 optimizations
# - Install Node.js 18+ using binary distribution
# - Install Docker and Docker Compose if needed
# - Clone the Vehicle Edge Runtime repository
# - Install all npm dependencies
# - Create optimized configuration for ARM64 (3 concurrent apps, 128MB memory limit)
# - Set up proper user permissions and directories
# - Initialize data directories and environment files`,
      'linux-pc': `# Method 1: Quick Start with Simulation (Recommended for Testing)
git clone https://github.com/tri2510/vehicle-edge-runtime.git
cd vehicle-edge-runtime/simulation
./0-start-pi-ci.sh        # Start simulation container (works on Linux too)
./1-install-runtime.sh     # Install Node.js 18+ and dependencies
./2b-start-native.sh       # Start Vehicle Edge Runtime (fast)
# OR: ./2a-start-docker.sh  # Start with Docker containers

# Method 2: Manual Production Installation
# Download and run the official installation script
curl -fsSL https://raw.githubusercontent.com/tri2510/vehicle-edge-runtime/main/install.sh | bash

# The script will automatically:
# - Detect your Linux distribution and version
# - Install Node.js 18+ using binary distribution
# - Install Docker and Docker Compose if needed
# - Clone the Vehicle Edge Runtime repository
# - Install all npm dependencies
# - Create optimized configuration for x86_64 (10 concurrent apps, 512MB memory limit)
# - Set up proper user permissions and directories
# - Initialize data directories and environment files`,
      'existing': '# Skip installation - go to next step to discover your existing runtime\n\n# Or use the simulation framework:\ngit clone https://github.com/tri2510/vehicle-edge-runtime.git\ncd vehicle-edge-runtime/simulation\n./0-start-pi-ci.sh  # Start simulation container\n./1-install-runtime.sh  # Install dependencies\n./2b-start-native.sh  # Start in native mode (fast)\n# Or: ./2a-start-docker.sh  # Start in Docker mode\n\nThen discover at localhost:3002'
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
            <TbDeviceDesktop className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Welcome to Vehicle Edge Runtime Setup</h3>
            <p className="text-muted-foreground mb-6">
              This wizard will guide you through setting up your first Vehicle Edge Runtime device.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What you'll need:</h4>
              <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {deviceTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedDeviceType(type)}
                  className={`relative cursor-pointer rounded-lg border-2 transition-all overflow-hidden ${
                    selectedDeviceType.id === type.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div className="p-4 h-full">
                    <div className="flex items-center space-x-3 mb-3">
                      <type.icon className={`w-6 h-6 flex-shrink-0 ${
                        selectedDeviceType.id === type.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <h4 className={`font-semibold text-base ${
                        selectedDeviceType.id === type.id ? 'text-primary' : 'text-foreground'
                      }`}>{type.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{type.description}</p>
                    <div className="text-xs">
                      <p className={`font-medium mb-2 ${
                        selectedDeviceType.id === type.id ? 'text-primary' : 'text-foreground'
                      }`}>Requirements:</p>
                      <ul className="space-y-1">
                        {type.requirements.map((req, idx) => (
                          <li key={idx} className="text-muted-foreground leading-relaxed">
                            • {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {selectedDeviceType.id === type.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <TbCheck className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
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
              <p className="text-muted-foreground">
                Connect to your device terminal and run these commands:
              </p>
            </div>

            {selectedDeviceType.id === 'existing' ? (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">⏭️ Skip Installation</h4>
                <p className="text-green-800 dark:text-green-200">
                  Since you already have a running Vehicle Edge Runtime, let's skip to device discovery.
                  Click "Next" to continue.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Installation Commands</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      <TbCopy className="w-4 h-4 mr-1" />
                      {copiedCommand ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{installationCommand}</pre>
                  </div>
                </div>

                {(selectedDeviceType.id === 'raspberry-pi' || selectedDeviceType.id === 'linux-pc') && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🚀 Simulation Quick Start (Perfect for Testing)</h4>
                    <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
                      <div className="font-mono bg-green-100 dark:bg-green-900 p-2 rounded text-xs">
                        <div>git clone https://github.com/tri2510/vehicle-edge-runtime.git</div>
                        <div>cd vehicle-edge-runtime/simulation</div>
                        <div>./0-start-pi-ci.sh        # Start simulation container</div>
                        <div>./1-install-runtime.sh     # Install Node.js & deps</div>
                        <div>./2b-start-native.sh       # Start runtime (fast)</div>
                        <div># OR: ./2a-start-docker.sh  # Docker mode</div>
                        <div>./4-check-status.sh       # Verify everything works</div>
                      </div>
                      <p className="text-xs">
                        <strong>Benefits:</strong> No hardware required, works on any system, instant setup, perfect for development and testing!
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What the script does:</h4>
                  <ol className="list-decimal list-inside text-blue-800 dark:text-blue-200 space-y-1">
                    {selectedDeviceType.installationSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <TbInfoCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-yellow-800 dark:text-yellow-200">
                      <h4 className="font-medium mb-2">Important Notes:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• The script automatically detects your system and applies appropriate optimizations</li>
                        <li>• Raspberry Pi gets ARM64-specific settings (3 concurrent apps, 128MB memory limit)</li>
                        <li>• Linux PCs get x86_64 settings (10 concurrent apps, 512MB memory limit)</li>
                        <li>• All services start on different ports: WebSocket API (3002), Health Check (3003), Kit Manager (3090)</li>
                        <li>• Configuration can be customized in <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">vehicle-edge-runtime/.env</code></li>
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
              <p className="text-muted-foreground">
                Let's find your Vehicle Edge Runtime device on the network.
              </p>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={scanNetwork}
                disabled={isScanning}
              >
                <TbRefresh className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Network'}
              </Button>
              <Button
                variant="outline"
                onClick={addDeviceManually}
              >
                <TbPlus className="w-4 h-4 mr-2" />
                Add Manually
              </Button>
            </div>

            {isScanning && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <TbRefresh className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Scanning Network...</span>
                </div>
                {scanProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800 dark:text-blue-200">Progress: {scanProgress}%</span>
                      {currentScanningIP && (
                        <span className="text-blue-600 dark:text-blue-300">Checking: {currentScanningIP}</span>
                      )}
                    </div>
                    <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Scanning common network ranges for Vehicle Edge Runtime devices...
                </p>
              </div>
            )}

            {detectedDevices.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Found Devices:</h4>
                {detectedDevices.map((device, idx) => (
                  <Button
                    key={idx}
                    variant={selectedDevice?.ip === device.ip ? 'default' : 'outline'}
                    onClick={() => setSelectedDevice(device)}
                    className="w-full p-4 h-auto flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <TbServer className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <h4 className="font-medium">{device.hostname || device.ip}</h4>
                        <p className="text-sm text-muted-foreground">
                          {device.ip}:{device.port}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        device.status === 'online'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {device.status}
                      </div>
                      {selectedDevice?.ip === device.ip && (
                        <TbCheck className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {detectedDevices.length === 0 && !isScanning && (
              <div className="text-center py-8 bg-muted rounded-lg">
                <TbWifi className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No devices found yet</p>
                <p className="text-sm text-muted-foreground mt-2">
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
              <p className="text-muted-foreground">
                Let's verify we can connect to your Vehicle Edge Runtime.
              </p>
            </div>

            {selectedDevice && (
              <div className="bg-muted border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TbServer className="w-6 h-6 text-primary" />
                    <div>
                      <h4 className="font-medium">{selectedDevice.hostname}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedDevice.ip}:{selectedDevice.port}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => testConnection(selectedDevice)}
                    disabled={connectionTest.testing}
                  >
                    <TbRefresh className={`w-4 h-4 mr-2 ${connectionTest.testing ? 'animate-spin' : ''}`} />
                    {connectionTest.testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

                {connectionTest.message && (
                  <div className={`p-3 rounded-lg ${
                    connectionTest.success
                      ? 'bg-green-100 border border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-200'
                      : 'bg-red-100 border border-red-200 text-red-800 dark:bg-red-900 dark:border-red-800 dark:text-red-200'
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

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Connection Details</h4>

              {/* Simulation-specific info */}
              {(selectedDevice?.ip === 'localhost' || selectedDevice?.ip?.includes('127.0.0.1')) && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                  <h5 className="font-medium text-green-800 dark:text-green-200 mb-1">🎯 Simulation Detected!</h5>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Using simulation container - services run on standard ports (3002, 3003, 3090)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">WebSocket API:</span>
                  <div className="font-mono text-xs bg-background dark:bg-background border border-border p-2 rounded mt-1">
                    ws://{selectedDevice?.ip}:3002/runtime
                  </div>
                </div>
                <div>
                  <span className="font-medium">Health Check:</span>
                  <div className="font-mono text-xs bg-background dark:bg-background border border-border p-2 rounded mt-1">
                    http://{selectedDevice?.ip}:3003/health
                  </div>
                </div>
                <div>
                  <span className="font-medium">Kit Manager:</span>
                  <div className="font-mono text-xs bg-background dark:bg-background border border-border p-2 rounded mt-1">
                    ws://{selectedDevice?.ip}:3090
                  </div>
                </div>
                <div>
                  <span className="font-medium">API Endpoint:</span>
                  <div className="font-mono text-xs bg-background dark:bg-background border border-border p-2 rounded mt-1">
                    http://{selectedDevice?.ip}:3090/listAllKits
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                <p><strong>Simulation Status Check:</strong> <code className="bg-muted px-1 rounded">./4-check-status.sh</code></p>
                <p><strong>Manual Test:</strong> <code className="bg-muted px-1 rounded">curl http://{selectedDevice?.ip}:3003/health</code></p>
              </div>
            </div>
          </div>
        )

      case 5: // Complete
        return (
          <div className="text-center py-8">
            <TbRocket className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your Vehicle Edge Runtime is now connected and ready to use.
            </p>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 max-w-2xl mx-auto text-left">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">What's Next?</h4>
              <ul className="space-y-2 text-green-800 dark:text-green-200">
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" />
                  <span>Deploy Python or binary applications to your runtime</span>
                </li>
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" />
                  <span>Monitor application performance and console output</span>
                </li>
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" />
                  <span>Configure resource limits and environment variables</span>
                </li>
                <li className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" />
                  <span>Set up additional runtimes for scaling</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">
              <p>Device added: <strong>{selectedDevice?.hostname || selectedDevice?.ip}</strong></p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TbTool className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Device Setup Wizard</h2>
              <p className="text-muted-foreground">Add your first Vehicle Edge Runtime device</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <TbX className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        {/* Mobile: Compact indicator */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Step {currentStep + 1} of {setupSteps.length}
            </span>
            <span className="text-sm text-primary font-medium">
              {setupSteps[currentStep].title}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
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
                    ? 'bg-primary text-primary-foreground'
                    : step.status === 'in_progress'
                    ? 'bg-primary/10 text-primary border-2 border-primary'
                    : index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
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
                    index === currentStep ? 'text-primary' : 'text-foreground'
                  }`}>
                    {step.title}
                  </h4>
                </div>

                {/* Connector Line */}
                {index < setupSteps.length - 1 && (
                  <div className={`w-4 h-0.5 ${
                    index < currentStep ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 min-h-full">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 border-t border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <TbArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {setupSteps.length}
          </div>

          {currentStep < setupSteps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <TbArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!selectedDevice}
              className="bg-green-600 hover:bg-green-700"
            >
              <TbRocket className="w-4 h-4 mr-2" />
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DaDeviceSetupWizard