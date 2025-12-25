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
      title: 'Setup Vehicle Edge Runtime',
      description: '3 simple steps to get started',
      icon: TbDeviceDesktop,
      status: 'completed'
    },
    {
      id: 'kit_manager',
      title: 'Connect Kit Manager',
      description: 'Verify connection',
      icon: TbServer,
      status: currentStep > 0 ? 'completed' : 'in_progress'
    },
    {
      id: 'installation',
      title: 'Install Runtime',
      description: 'One command on your device',
      icon: TbTerminal,
      status: currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: 'discovery',
      title: 'Discover Devices',
      description: 'Find and connect',
      icon: TbWifi,
      status: currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 'complete',
      title: 'Ready!',
      description: 'Start deploying apps',
      icon: TbRocket,
      status: 'pending'
    }
  ]

  const deviceTypes = [
    {
      id: 'raspberry-pi',
      name: 'Raspberry Pi',
      description: 'Raspberry Pi 4/5 with Ubuntu, Debian, or Pi OS',
      icon: TbCpu,
      requirements: [
        '2GB+ RAM',
        '2GB+ free disk space',
        'Network connection',
        'Sudo access'
      ],
      installationSteps: [
        'Run setup script (installs everything)',
        'Runtime auto-starts on boot',
        'Ready at http://localhost:3090'
      ]
    },
    {
      id: 'linux-pc',
      name: 'Linux PC/Server',
      description: 'Ubuntu, Debian, or compatible Linux',
      icon: TbDeviceDesktop,
      requirements: [
        '1GB+ RAM (4GB+ recommended)',
        '2GB+ free disk space',
        'Network connection',
        'Sudo access'
      ],
      installationSteps: [
        'Run setup script (installs everything)',
        'Runtime auto-starts on boot',
        'Ready at http://localhost:3090'
      ]
    },
    {
      id: 'existing',
      name: 'Already Connected',
      description: 'I have Vehicle Edge Runtime devices running',
      icon: TbNetwork,
      requirements: [
        'Kit Manager running',
        'Devices already connected'
      ],
      installationSteps: [
        'Skip to device discovery',
        'Verify connections',
        'Start deploying'
      ]
    }
  ]

  const [selectedDeviceType, setSelectedDeviceType] = useState(deviceTypes[0])

  useEffect(() => {
    generateInstallationCommand()
  }, [selectedDeviceType])

  const generateInstallationCommand = () => {
    const commands: Record<string, string> = {
      'raspberry-pi': `git clone https://github.com/your-org/vehicle-edge-runtime.git
cd vehicle-edge-runtime
chmod +x scripts/setup-runtime.sh
./scripts/setup-runtime.sh`,

      'linux-pc': `git clone https://github.com/your-org/vehicle-edge-runtime.git
cd vehicle-edge-runtime
chmod +x scripts/setup-runtime.sh
./scripts/setup-runtime.sh`,

      'existing': `# If kit-manager is running, skip to discovery step
# Otherwise check if running:
docker ps | grep kit-manager

# Runtime will be at: http://localhost:3090`
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
            <h3 className="text-xl font-semibold mb-2">Setup Vehicle Edge Runtime</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              One command to install everything. Start deploying vehicle apps in minutes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl mb-2">📦</div>
                <div className="font-medium mb-1">Install</div>
                <div className="text-sm text-muted-foreground">One command on your device</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl mb-2">🔗</div>
                <div className="font-medium mb-1">Connect</div>
                <div className="text-sm text-muted-foreground">Auto-discover devices</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-medium mb-1">Deploy</div>
                <div className="text-sm text-muted-foreground">Start building apps</div>
              </div>
            </div>
          </div>
        )

      case 1: // Kit Manager Connection
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Connect Kit Manager</h3>
              <p className="text-muted-foreground">
                Verify connection to the kit-manager service
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
                      {connectionTest.success ? 'Connected!' : 'Connection Failed'}
                    </p>
                    <p className="text-sm">{connectionTest.message}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-muted border border-border rounded-lg p-4">
              <h4 className="font-medium mb-2">Kit Manager</h4>
              <p className="text-sm text-muted-foreground">
                Manages device discovery and application deployment
              </p>
            </div>
          </div>
        )

      case 2: // Installation
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Install on Your Device</h3>
              <p className="text-muted-foreground">
                Run these commands on your Raspberry Pi or Linux device
              </p>
            </div>

            {selectedDeviceType.id === 'existing' ? (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Already Connected</h4>
                <p className="text-green-800 dark:text-green-200">
                  Click "Next" to discover your devices
                </p>
              </div>
            ) : (
              <>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Run on your device</h4>
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

                <div className="bg-muted border border-border rounded-lg p-4">
                  <p className="text-sm">
                    <strong>What happens:</strong> Script installs everything automatically (Node.js, Python, Docker, dependencies, configures system, starts service)
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Takes 5-15 minutes. Runtime will be available at http://localhost:3090
                  </p>
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