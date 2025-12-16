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
import kitManagerService, { VehicleEdgeRuntimeKit } from '@/services/kitManager.service'
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
  const [detectedKits, setDetectedKits] = useState<VehicleEdgeRuntimeKit[]>([])
  const [selectedKit, setSelectedKit] = useState<VehicleEdgeRuntimeKit | null>(null)
  const [connectionTest, setConnectionTest] = useState<{ testing: boolean; success?: boolean; message?: string }>({
    testing: false
  })
  const [installationCommand, setInstallationCommand] = useState('')
  const [copiedCommand, setCopiedCommand] = useState(false)
  const [kitManagerConnected, setKitManagerConnected] = useState(false)
  const [showOfflineDevices, setShowOfflineDevices] = useState(false)

  const setupSteps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Vehicle Edge Runtime Setup',
      description: 'Deploy Vehicle Edge Runtime devices using our automated setup script',
      icon: TbDeviceDesktop,
      status: 'completed'
    },
    {
      id: 'kit_manager',
      title: 'Connect to Kit Manager',
      description: 'Verify connection to the kit-manager service',
      icon: TbServer,
      status: currentStep > 0 ? 'completed' : 'in_progress'
    },
    {
      id: 'installation',
      title: 'Install Runtime Device',
      description: 'Set up your Vehicle Edge Runtime device',
      icon: TbTerminal,
      status: currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: 'discovery',
      title: 'Discover Devices',
      description: 'Find Vehicle Edge Runtime devices via kit-manager',
      icon: TbWifi,
      status: currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      description: 'Your Vehicle Edge Runtime devices are ready to use',
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
        'Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+, Fedora 30+, or Raspberry Pi OS',
        'Any architecture: x86_64, arm64, armv7 (auto-detected)',
        '1GB RAM minimum (2GB+ recommended)',
        '2GB free disk space minimum',
        'Network connection for package downloads',
        'User account with sudo privileges (or root access)'
      ],
      installationSteps: [
        'Clone the Vehicle Edge Runtime repository with setup scripts',
        'Run automated setup script (./scripts/setup-runtime.sh)',
        'Script auto-detects system and architecture',
        'Installs all dependencies: Node.js, Python, Docker, etc.',
        'Creates Python virtual environment with required packages',
        'Builds and configures the Vehicle Edge Runtime application',
        'Sets up systemd service for auto-start on boot',
        'Configures firewall rules for security',
        'Creates management scripts and test applications',
        'Provides complete setup summary with next steps'
      ]
    },
    {
      id: 'linux-pc',
      name: 'Linux PC/Server',
      description: 'Ubuntu, Debian, or compatible Linux distributions (x86_64)',
      icon: TbDeviceDesktop,
      requirements: [
        'Ubuntu 20.04+, Debian 11+, CentOS 7+, RHEL 7+, Fedora 30+, or compatible',
        'x86_64 (Intel/AMD) architecture (auto-detected)',
        '1GB RAM minimum (4GB+ recommended)',
        '2GB free disk space minimum',
        'Network connection for package downloads',
        'User account with sudo privileges'
      ],
      installationSteps: [
        'Clone the Vehicle Edge Runtime repository with setup scripts',
        'Run automated setup script (./scripts/setup-runtime.sh)',
        'Script auto-detects Linux distribution',
        'Installs all dependencies: Node.js, Python, Docker, etc.',
        'Creates Python virtual environment with required packages',
        'Builds and configures the Vehicle Edge Runtime application',
        'Sets up systemd service for auto-start on boot',
        'Configures firewall rules and security',
        'Creates management scripts and test applications',
        'Provides complete setup with performance optimizations'
      ]
    },
    {
      id: 'existing',
      name: 'Existing Runtime Devices',
      description: 'I already have Vehicle Edge Runtime devices connected',
      icon: TbNetwork,
      requirements: [
        'Kit Manager service running (docker ps | grep kit-manager)',
        'Vehicle Edge Runtime devices already connected to kit-manager',
        'Network access to kit-manager on port 3090'
      ],
      installationSteps: [
        'Skip installation step',
        'Verify kit-manager connection',
        'Discover existing devices through kit-manager',
        'Test device connectivity and status',
        'Ready for deployment and management'
      ]
    }
  ]

  const [selectedDeviceType, setSelectedDeviceType] = useState(deviceTypes[0])

  useEffect(() => {
    generateInstallationCommand()
  }, [selectedDeviceType])

  const generateInstallationCommand = () => {
    const commands: Record<string, string> = {
      'raspberry-pi': `# Automated Vehicle Edge Runtime Setup (Recommended)
# This script will automatically install everything needed on your Raspberry Pi

# Step 1: Clone the repository with setup scripts
git clone https://github.com/your-org/vehicle-edge-runtime.git
cd vehicle-edge-runtime

# Step 2: Run the automated setup script (does everything!)
chmod +x scripts/setup-runtime.sh
./scripts/setup-runtime.sh

# The setup script automatically handles:
# ✅ System detection and requirements checking
# ✅ Installs Node.js, Python, Docker, and all dependencies
# ✅ Sets up Python virtual environment with required packages
# ✅ Creates and configures the Vehicle Edge Runtime application
# ✅ Sets up systemd service for auto-start on boot
# ✅ Configures firewall rules
# ✅ Creates management scripts (start.sh, stop.sh)
# ✅ Optimizes for Raspberry Pi (ARM64 architecture)

# After setup completes:
# 🚀 Runtime will be available at: http://localhost:3090
# 📊 Health check: http://localhost:3090/health
# 🔌 WebSocket: ws://localhost:3090
# 🔧 Management: sudo systemctl start/stop/status vehicle-edge-runtime`,

      'linux-pc': `# Automated Vehicle Edge Runtime Setup (Recommended)
# This script will automatically install everything needed on your Linux PC

# Step 1: Clone the repository with setup scripts
git clone https://github.com/your-org/vehicle-edge-runtime.git
cd vehicle-edge-runtime

# Step 2: Run the automated setup script (does everything!)
chmod +x scripts/setup-runtime.sh
./scripts/setup-runtime.sh

# The setup script automatically handles:
# ✅ System detection (Ubuntu, Debian, CentOS, RHEL, Fedora)
# ✅ Installs Node.js, Python, Docker, and all dependencies
# ✅ Sets up Python virtual environment with required packages
# ✅ Creates and configures the Vehicle Edge Runtime application
# ✅ Sets up systemd service for auto-start on boot
# ✅ Configures firewall rules for security
# ✅ Creates management scripts and test applications
# ✅ Optimizes for your specific architecture (x86_64/ARM64)

# After setup completes:
# 🚀 Runtime will be available at: http://localhost:3090
# 📊 Health check: http://localhost:3090/health
# 🔌 WebSocket: ws://localhost:3090
# 🔧 Management: sudo systemctl start/stop/status vehicle-edge-runtime`,

      'existing': '# Skip installation - kit-manager should already be connected\n\n# If kit-manager is not running:\ndocker ps | grep kit-manager  # Check if running\n# If not running, start it:\ndocker run -d --name kit-manager -p 3090:3090 kit-manager:sim\n\n# Verify connection:\ncurl http://localhost:3090/listAllKits\n\n# Check device status:\ncurl http://localhost:3090/listAllClient\n\n# To add new devices to existing setup:\ncd /path/to/vehicle-edge-runtime\n./scripts/setup-runtime.sh'
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

  const scanForKits = async () => {
    setIsScanning(true)
    setDetectedKits([])
    setScanProgress(0)

    try {
      // Simulate progress for better UX
      for (let i = 0; i <= 100; i += 20) {
        setScanProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const kitsResponse = await kitManagerService.listKits()
      setDetectedKits(kitsResponse.content || [])
    } catch (error) {
      console.error('Failed to discover kits:', error)
      throw error
    } finally {
      setIsScanning(false)
      setScanProgress(0)
    }
  }

  const testKitConnection = async (kit: VehicleEdgeRuntimeKit) => {
    setConnectionTest({ testing: true })

    try {
      // Test if the kit is responding by checking its last_seen status
      const isResponsive = kit.is_online && (Date.now() - kit.last_seen < 60000) // Online and seen within last minute

      setConnectionTest({
        testing: false,
        success: isResponsive,
        message: isResponsive
          ? `Successfully connected to ${kit.name}! Device is online and responsive.`
          : `Device ${kit.name} is ${kit.is_online ? 'online but not responding' : 'offline'}. Last seen: ${kit.last_seen ? new Date(kit.last_seen).toLocaleString() : 'Never'}`
      })
    } catch (error) {
      setConnectionTest({
        testing: false,
        success: false,
        message: 'Failed to test kit connection'
      })
    }
  }

  const testKitManagerConnection = async () => {
    setConnectionTest({ testing: true })

    try {
      await kitManagerService.connect()
      setKitManagerConnected(true)

      setConnectionTest({
        testing: false,
        success: true,
        message: 'Successfully connected to kit-manager service!'
      })
    } catch (error) {
      setKitManagerConnected(false)
      setConnectionTest({
        testing: false,
        success: false,
        message: `Failed to connect to kit-manager: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
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
    if (detectedKits.length > 0) {
      onComplete({
        kits: detectedKits,
        kitManagerConnected: true,
        totalKits: detectedKits.length,
        onlineKits: detectedKits.filter(kit => kit.is_online).length
      })
    }
    onClose()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true
      case 1: return !!selectedDeviceType
      case 2: return selectedDeviceType.id === 'existing' || true // Installation is manual
      case 3: return detectedKits.length > 0 || selectedDeviceType.id === 'existing'
      case 4: return true // Discovery step is complete
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
              This wizard will guide you through deploying Vehicle Edge Runtime on any Linux device using our automated setup script.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🚀 What this wizard provides:</h4>
              <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                <li><strong>Automated Setup:</strong> One-command installation for all requirements</li>
                <li><strong>Universal Support:</strong> Works on Raspberry Pi, Linux PC, and servers</li>
                <li><strong>Zero Configuration:</strong> Everything is installed and configured automatically</li>
                <li><strong>Production Ready:</strong> Includes systemd service for reliable operation</li>
                <li><strong>Developer Friendly:</strong> Includes test applications and examples</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">✨ What you'll need:</h4>
              <ul className="list-disc list-inside text-green-800 dark:text-green-200 space-y-1">
                <li><strong>Target Device:</strong> Raspberry Pi, Ubuntu/Debian/CentOS/RHEL/Fedora Linux system</li>
                <li><strong>Minimum Specs:</strong> 1GB RAM, 2GB free disk space, sudo access</li>
                <li><strong>Network:</strong> Internet connection for package downloads</li>
                <li><strong>Optional:</strong> Vehicle hardware (CAN bus, GPS, sensors) for vehicle integration</li>
              </ul>
            </div>
          </div>
        )

      case 1: // Kit Manager Connection
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Connect to Kit Manager</h3>
              <p className="text-muted-foreground">
                Verify that the kit-manager service is running and accessible.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">About Kit Manager</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                The kit-manager service acts as the central hub for managing Vehicle Edge Runtime devices.
                It handles device discovery, application deployment, and real-time communication.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={testKitManagerConnection}
                disabled={connectionTest.testing}
              >
                <TbRefresh className={`w-4 h-4 mr-2 ${connectionTest.testing ? 'animate-spin' : ''}`} />
                {connectionTest.testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>

            {connectionTest.message && (
              <div className={`p-4 rounded-lg ${
                connectionTest.success
                  ? 'bg-green-100 border border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-100 border border-red-200 text-red-800 dark:bg-red-900 dark:border-red-800 dark:text-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {connectionTest.success ? (
                    <TbCheck className="w-5 h-5 mt-0.5" />
                  ) : (
                    <TbAlertTriangle className="w-5 h-5 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium mb-2">
                      {connectionTest.success ? 'Connection Successful' : 'Connection Failed'}
                    </p>
                    <p className="text-sm">{connectionTest.message}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted border border-border rounded-lg p-4">
                <h4 className="font-medium mb-2">Kit Manager Endpoint</h4>
                <div className="font-mono text-xs bg-background dark:bg-background border border-border p-2 rounded mt-1">
                  ws://localhost:3090
                </div>
              </div>
              <div className="bg-muted border border-border rounded-lg p-4">
                <h4 className="font-medium mb-2">HTTP API</h4>
                <div className="font-mono text-xs bg-background dark:bg-background border border-border p-2 rounded mt-1">
                  http://localhost:3090/listAllKits
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <TbInfoCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-yellow-800 dark:text-yellow-200">
                  <h4 className="font-medium mb-2">Troubleshooting</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Check if kit-manager is running: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">docker ps | grep kit-manager</code></li>
                    <li>• If not running, start it: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">docker run -d --name kit-manager -p 3090:3090 kit-manager:sim</code></li>
                    <li>• Ensure port 3090 is accessible and not blocked by firewall</li>
                    <li>• Check Docker is running and has sufficient resources</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // Installation
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Set Up Your Vehicle Edge Runtime Device</h3>
              <p className="text-muted-foreground">
                Use our automated setup script to configure your Vehicle Edge Runtime device.
              </p>
            </div>

            {selectedDeviceType.id === 'existing' ? (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">⏭️ Skip Installation</h4>
                <p className="text-green-800 dark:text-green-200">
                  Since you already have Vehicle Edge Runtime devices connected to kit-manager,
                  let's skip to device discovery. Click "Next" to continue.
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
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🚀 Fully Automated Setup (Zero-Configuration)</h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      <div className="font-mono bg-blue-100 dark:bg-blue-900 p-2 rounded text-xs">
                        <div>git clone https://github.com/your-org/vehicle-edge-runtime.git</div>
                        <div>cd vehicle-edge-runtime</div>
                        <div>chmod +x scripts/setup-runtime.sh</div>
                        <div>./scripts/setup-runtime.sh  # One-command setup!</div>
                        <div># Everything installed and configured automatically</div>
                      </div>
                      <div className="text-xs space-y-1">
                        <p><strong>✨ What the script does automatically:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Detects your system and architecture</li>
                          <li>Installs Node.js, Python, Docker, and all dependencies</li>
                          <li>Sets up Python virtual environment with required packages</li>
                          <li>Creates and configures the Vehicle Edge Runtime application</li>
                          <li>Sets up systemd service for auto-start on boot</li>
                          <li>Configures firewall rules for security</li>
                          <li>Creates management scripts and test applications</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What the script does:</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <p><strong>🔧 System Configuration:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Detects operating system, architecture, and system requirements</li>
                      <li>Installs package manager dependencies (apt, dnf, yum, etc.)</li>
                      <li>Sets up Docker with proper user permissions</li>
                      <li>Creates necessary directories and file permissions</li>
                    </ul>

                    <p><strong>🐍 Runtime Environment:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Installs Node.js (latest stable version)</li>
                      <li>Sets up Python virtual environment with all required packages</li>
                      <li>Installs Vehicle Edge Runtime dependencies (Flask, Socket.IO, etc.)</li>
                      <li>Creates optimized configuration based on device specifications</li>
                    </ul>

                    <p><strong>🚀 Service Setup:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Creates and configures the Vehicle Edge Runtime application</li>
                      <li>Sets up systemd service for automatic startup</li>
                      <li>Configures firewall rules for secure operation</li>
                      <li>Creates management scripts (start.sh, stop.sh)</li>
                      <li>Includes test applications and examples</li>
                    </ul>

                    <p><strong>📋 Platform Optimization:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Raspberry Pi: ARM64 optimizations, resource limits for embedded systems</li>
                      <li>Linux PC/Server: Performance optimizations for production workloads</li>
                      <li>Universal: Works on any supported Linux distribution</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <TbInfoCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-yellow-800 dark:text-yellow-200">
                      <h4 className="font-medium mb-2">Setup Process:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Time Required:</strong> 5-15 minutes depending on internet speed</li>
                        <li>• <strong>Internet Required:</strong> For downloading packages and dependencies</li>
                        <li>• <strong>Interactive Setup:</strong> Script provides progress updates and asks for confirmation</li>
                        <li>• <strong>Automatic Reboot:</strong> Some configurations may require system restart</li>
                        <li>• <strong>Service Start:</strong> Runtime starts automatically after setup completion</li>
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
              <h3 className="text-lg font-semibold mb-2">Discover Vehicle Edge Runtime Devices</h3>
              <p className="text-muted-foreground">
                Find all Vehicle Edge Runtime devices connected to kit-manager.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <Button
                  onClick={scanForKits}
                  disabled={isScanning}
                >
                  <TbRefresh className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Discovering...' : 'Discover Devices'}
                </Button>
              </div>
              {detectedKits.length > 0 && (
                <Button
                  onClick={() => setShowOfflineDevices(!showOfflineDevices)}
                  variant={showOfflineDevices ? "default" : "outline"}
                  size="sm"
                  title={showOfflineDevices ? "Hide offline devices" : "Show offline devices"}
                >
                  {showOfflineDevices ? "Show All" : "Online Only"}
                </Button>
              )}
            </div>

            {isScanning && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <TbRefresh className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Querying Kit Manager...</span>
                </div>
                {scanProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800 dark:text-blue-200">Progress: {scanProgress}%</span>
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
                  Contacting kit-manager to discover connected Vehicle Edge Runtime devices...
                </p>
              </div>
            )}

            {detectedKits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Discovered Devices ({showOfflineDevices ? detectedKits.length : detectedKits.filter(kit => kit.is_online).length}):
                  </h4>
                  {!showOfflineDevices && detectedKits.filter(kit => !kit.is_online).length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {detectedKits.filter(kit => !kit.is_online).length} offline devices hidden
                    </span>
                  )}
                </div>
                {detectedKits
                  .filter(kit => showOfflineDevices || kit.is_online)
                  .map((kit, idx) => (
                  <div
                    key={kit.kit_id}
                    className={`p-4 border rounded-lg flex items-center justify-between ${
                      selectedKit?.kit_id === kit.kit_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <TbServer className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <h4 className="font-medium">{kit.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Kit ID: {kit.kit_id.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {kit.desc || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        kit.is_online
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {kit.is_online ? 'Online' : 'Offline'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {kit.last_seen ? `Last seen: ${new Date(kit.last_seen).toLocaleString()}` : 'Never seen'}
                      </div>
                      {kit.is_online && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testKitConnection(kit)}
                        >
                          Test
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!showOfflineDevices ? detectedKits.filter(kit => kit.is_online).length : detectedKits.length) === 0 && !isScanning && (
              <div className="text-center py-8 bg-muted rounded-lg">
                <TbWifi className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {showOfflineDevices ? "No devices found" : "No online devices found"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {showOfflineDevices
                    ? "Make sure your Vehicle Edge Runtime devices are running and connected to kit-manager"
                    : "All connected devices are currently offline. Click 'Show All' to view offline devices."
                  }
                </p>
                {!showOfflineDevices && detectedKits.length > 0 && (
                  <Button
                    onClick={() => setShowOfflineDevices(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Show Offline Devices ({detectedKits.length})
                  </Button>
                )}
              </div>
            )}

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
        )

      case 4: // Complete
        return (
          <div className="text-center py-8">
            <TbRocket className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your Vehicle Edge Runtime devices are now connected and ready to use.
            </p>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 max-w-2xl mx-auto text-left">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">Setup Summary</h4>
              <div className="space-y-3 text-green-800 dark:text-green-200">
                <div className="flex items-start space-x-2">
                  <TbCheck className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" />
                  <div>
                    <strong>Kit Manager Connected:</strong> Successfully connected to kit-manager service
                  </div>
                </div>
                {detectedKits.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <TbCheck className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" />
                    <div>
                      <strong>Devices Found:</strong> {detectedKits.length} devices discovered
                      <div className="text-sm mt-1">
                        Online: {detectedKits.filter(kit => kit.is_online).length} / {detectedKits.length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {detectedKits.length > 0 && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-2xl mx-auto text-left">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">What's Next?</h4>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                  <li className="flex items-start space-x-2">
                    <TbCheck className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <span>Deploy applications to your connected runtime devices</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <TbCheck className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <span>Monitor device status and application performance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <TbCheck className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <span>Access real-time console output from running applications</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <TbCheck className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <span>Manage multiple runtime devices from a single interface</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="mt-6 text-sm text-muted-foreground">
              {detectedKits.length > 0 && (
                <p>
                  <strong>Ready devices:</strong> {detectedKits.filter(kit => kit.is_online).length} online,
                  {detectedKits.filter(kit => !kit.is_online).length} offline
                </p>
              )}
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
              <h2 className="text-2xl font-bold text-foreground">Vehicle Edge Runtime Setup</h2>
              <p className="text-muted-foreground">Deploy Vehicle Edge Runtime devices with automated setup</p>
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
              disabled={detectedKits.length === 0}
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