// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { DaPopup } from '@/components/atoms/DaPopup'
import {
  TbRocket,
  TbPackage,
  TbSearch,
  TbServer,
  TbCheck,
  TbArrowRight,
  TbSettings,
  TbDevice,
  TbCloudUpload,
  TbTerminal
} from 'react-icons/tb'
import { toast } from 'react-toastify'

import DaAppPackager from '@/components/molecules/deployment/DaAppPackager'
import DaDeviceScanner, { DeviceInfo } from '@/components/molecules/deployment/DaDeviceScanner'
import DaDeploymentManager from '@/components/molecules/deployment/DaDeploymentManager'
import DaKuksaConfig from '@/components/molecules/deployment/DaKuksaConfig'

interface SDVAppPackage {
  name: string
  version: string
  description: string
  code?: string
  runtimeMode: 'docker' | 'native'
  kuksaConfig: {
    brokerAutoDetect: boolean
    fallbackBroker: boolean
    vssVersion: string
    customBrokerUrl?: string
  }
  deployment: {
    targetDevices: string[]
    hotSwap: boolean
    otaEnabled: boolean
    resourceLimits: {
      memory: string
      cpu: string
    }
  }
  security: {
    sandboxLevel: 'basic' | 'advanced' | 'military'
    dataAccess: 'open' | 'restricted' | 'encrypted'
    interAppCommunication: boolean
  }
}

interface KuksaBrokerInfo {
  host: string
  port: number
  version: string
  status: 'online' | 'offline' | 'unknown'
  responseTime?: number
  vssVersion?: string
}

interface SDVDeploymentHubProps {
  pythonCode: string
  prototypeName?: string
  isOpen: boolean
  onClose: () => void
}

type DeploymentStep = 'configure' | 'package' | 'devices' | 'kuksa' | 'deploy' | 'complete'

const SDVDeploymentHub: FC<SDVDeploymentHubProps> = ({
  pythonCode,
  prototypeName,
  isOpen,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<DeploymentStep>('configure')
  const [appPackage, setAppPackage] = useState<SDVAppPackage | null>(null)
  const [selectedDevices, setSelectedDevices] = useState<DeviceInfo[]>([])
  const [detectedBroker, setDetectedBroker] = useState<KuksaBrokerInfo | null>(null)
  const [deploymentResults, setDeploymentResults] = useState<any[]>([])

  // Deployment steps configuration
  const deploymentSteps = [
    { id: 'configure', name: 'Configure', icon: TbSettings, completed: false },
    { id: 'package', name: 'Package App', icon: TbPackage, completed: false },
    { id: 'devices', name: 'Select Devices', icon: TbDevice, completed: false },
    { id: 'kuksa', name: 'Kuksa Setup', icon: TbServer, completed: false },
    { id: 'deploy', name: 'Deploy', icon: TbRocket, completed: false },
    { id: 'complete', name: 'Complete', icon: TbCheck, completed: false }
  ] as const

  const updateStepCompletion = useCallback((step: DeploymentStep, completed: boolean) => {
    // Update step completion state
  }, [])

  const handlePackageCreated = useCallback((pkg: SDVAppPackage) => {
    setAppPackage(pkg)
    updateStepCompletion('package', true)
    setCurrentStep('devices')
    toast.success('App package created successfully!')
  }, [updateStepCompletion])

  const handleDevicesSelected = useCallback((devices: DeviceInfo[]) => {
    setSelectedDevices(devices)
    updateStepCompletion('devices', devices.length > 0)
  }, [updateStepCompletion])

  const handleBrokerDetected = useCallback((broker: KuksaBrokerInfo) => {
    setDetectedBroker(broker)
    updateStepCompletion('kuksa', true)
  }, [updateStepCompletion])

  const handleDeviceSelect = useCallback((deviceId: string, selected: boolean) => {
    setSelectedDevices(prev => {
      if (selected) {
        const device = prev.find(d => d.id === deviceId)
        if (!device) return prev
        return [...prev.filter(d => d.id !== deviceId), device]
      } else {
        return prev.filter(d => d.id !== deviceId)
      }
    })
  }, [])

  const handleDeploymentComplete = useCallback((results: any[]) => {
    setDeploymentResults(results)
    updateStepCompletion('deploy', true)
    setCurrentStep('complete')
  }, [updateStepCompletion])

  const goToStep = useCallback((step: DeploymentStep) => {
    // Only allow going to completed steps or next logical step
    const currentStepIndex = deploymentSteps.findIndex(s => s.id === currentStep)
    const targetStepIndex = deploymentSteps.findIndex(s => s.id === step)

    if (targetStepIndex <= currentStepIndex + 1) {
      setCurrentStep(step)
    }
  }, [currentStep])

  const canProceedToNext = useCallback(() => {
    switch (currentStep) {
      case 'configure':
        return pythonCode.trim().length > 0
      case 'package':
        return appPackage !== null
      case 'devices':
        return selectedDevices.length > 0
      case 'kuksa':
        return detectedBroker !== null || (appPackage?.kuksaConfig.fallbackBroker)
      case 'deploy':
        return true
      default:
        return false
    }
  }, [currentStep, pythonCode, appPackage, selectedDevices, detectedBroker])

  const getNextStep = useCallback((): DeploymentStep | null => {
    const stepOrder: DeploymentStep[] = ['configure', 'package', 'devices', 'kuksa', 'deploy', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)
    return currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null
  }, [currentStep])

  const getNextStepName = useCallback(() => {
    const nextStep = getNextStep()
    if (!nextStep) return null
    const step = deploymentSteps.find(s => s.id === nextStep)
    return step?.name || null
  }, [getNextStep])

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 'configure':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">SDV Deployment Configuration</h3>
              <p className="text-gray-600 mb-6">
                Configure your Python app for deployment to SDV-compatible devices.
                The app will be packaged with Kuksa integration for seamless vehicle communication.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TbPackage className="text-da-primary-500" />
                  App Information
                </h4>
                <p className="text-sm text-gray-600">
                  Package your Python app with proper SDV configuration
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TbDevice className="text-da-primary-500" />
                  Device Targeting
                </h4>
                <p className="text-sm text-gray-600">
                  Deploy to Jetson Orin, Linux devices, and automotive prototypes
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TbServer className="text-da-primary-500" />
                  Kuksa Integration
                </h4>
                <p className="text-sm text-gray-600">
                  Auto-discover Kuksa Databroker or start fallback instance
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TbRocket className="text-da-primary-500" />
                  One-Click Deploy
                </h4>
                <p className="text-sm text-gray-600">
                  Deploy to multiple devices with hot-swapping support
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <DaButton
                variant="solid"
                onClick={() => setCurrentStep('package')}
                disabled={!pythonCode.trim()}
                className="flex items-center gap-2"
              >
                Get Started
                <TbArrowRight />
              </DaButton>
            </div>
          </div>
        )

      case 'package':
        return (
          <DaAppPackager
            pythonCode={pythonCode}
            prototypeName={prototypeName}
            onPackageCreated={handlePackageCreated}
            onClose={() => setCurrentStep('configure')}
          />
        )

      case 'devices':
        return (
          <DaDeviceScanner
            onDevicesFound={handleDevicesSelected}
            selectedDevices={selectedDevices.map(d => d.id)}
            onDeviceSelect={handleDeviceSelect}
            autoScan={true}
          />
        )

      case 'kuksa':
        return (
          <DaKuksaConfig
            config={appPackage?.kuksaConfig || {
              brokerAutoDetect: true,
              fallbackBroker: true,
              vssVersion: 'latest'
            }}
            onConfigChange={(config) => {
              if (appPackage) {
                setAppPackage(prev => prev ? { ...prev, kuksaConfig: config } : null)
              }
            }}
            onBrokerDetected={handleBrokerDetected}
            showAdvanced={true}
          />
        )

      case 'deploy':
        if (!appPackage || selectedDevices.length === 0) {
          return (
            <div className="text-center py-12">
              <TbAlertTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Missing Configuration</h3>
              <p className="text-gray-600">Please complete the previous steps before deploying.</p>
            </div>
          )
        }

        return (
          <DaDeploymentManager
            appPackage={appPackage}
            selectedDevices={selectedDevices}
            onDeploymentComplete={handleDeploymentComplete}
            onClose={() => setCurrentStep('kuksa')}
          />
        )

      case 'complete':
        return (
          <div className="text-center py-12">
            <TbCheck className="text-6xl text-green-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Deployment Complete!
            </h3>

            <div className="mb-8">
              <p className="text-lg text-gray-700 mb-2">
                Your SDV app <span className="font-semibold">{appPackage?.name}</span> has been successfully deployed
              </p>
              <p className="text-gray-600">
                {deploymentResults.filter(r => r.status === 'success').length} device(s) are now running your app
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
              <h4 className="font-semibold mb-4">Next Steps:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <TbCheck className="text-green-500 mt-0.5" />
                  Monitor app performance through the device dashboard
                </li>
                <li className="flex items-start gap-2">
                  <TbCheck className="text-green-500 mt-0.5" />
                  Test vehicle signal communication via Kuksa Databroker
                </li>
                <li className="flex items-start gap-2">
                  <TbCheck className="text-green-500 mt-0.5" />
                  Use hot-swapping for updates without vehicle downtime
                </li>
                <li className="flex items-start gap-2">
                  <TbCheck className="text-green-500 mt-0.5" />
                  Configure OTA updates for production deployments
                </li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              <DaButton
                variant="outline"
                onClick={() => {
                  setCurrentStep('configure')
                  setAppPackage(null)
                  setSelectedDevices([])
                  setDetectedBroker(null)
                  setDeploymentResults([])
                }}
              >
                Deploy Another App
              </DaButton>
              <DaButton
                variant="solid"
                onClick={onClose}
              >
                Done
              </DaButton>
            </div>
          </div>
        )

      default:
        return null
    }
  }, [
    currentStep,
    pythonCode,
    prototypeName,
    appPackage,
    selectedDevices,
    detectedBroker,
    deploymentResults,
    handlePackageCreated,
    handleDevicesSelected,
    handleBrokerDetected,
    handleDeviceSelect,
    handleDeploymentComplete,
    onClose
  ])

  if (!isOpen) return null

  return (
    <DaPopup
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-6xl max-h-[90vh] overflow-y-auto"
    >
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <TbRocket className="text-da-primary-500" />
              SDV Deployment Hub
            </h2>
            <p className="text-gray-600 mt-1">
              Deploy your Python vehicle app to SDV-compatible devices
            </p>
          </div>

          {currentStep !== 'complete' && (
            <DaButton variant="outline" onClick={onClose}>
              Cancel
            </DaButton>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {deploymentSteps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = index < deploymentSteps.findIndex(s => s.id === currentStep)
              const Icon = step.icon

              return (
                <div
                  key={step.id}
                  className={`flex items-center ${index < deploymentSteps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => goToStep(step.id)}
                      disabled={!isCompleted && !isActive}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? 'bg-da-primary-500 text-white shadow-lg'
                          : isCompleted
                          ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Icon className="text-xl" />
                    </button>
                    <span className={`text-xs mt-2 text-center ${
                      isActive ? 'text-da-primary-600 font-semibold' :
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>

                  {index < deploymentSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      index < deploymentSteps.findIndex(s => s.id === currentStep) - 1
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep !== 'configure' && currentStep !== 'complete' && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <DaButton
              variant="outline"
              onClick={() => {
                const prevSteps: DeploymentStep[] = ['configure', 'package', 'devices', 'kuksa', 'deploy', 'complete']
                const currentIndex = prevSteps.indexOf(currentStep)
                if (currentIndex > 0) {
                  setCurrentStep(prevSteps[currentIndex - 1])
                }
              }}
            >
              Previous
            </DaButton>

            {canProceedToNext() && getNextStep() && getNextStep() !== 'complete' && (
              <DaButton
                variant="solid"
                onClick={() => {
                  const nextStep = getNextStep()
                  if (nextStep) setCurrentStep(nextStep)
                }}
                className="flex items-center gap-2"
              >
                {getNextStepName()}
                <TbArrowRight />
              </DaButton>
            )}
          </div>
        )}
      </div>
    </DaPopup>
  )
}

export default SDVDeploymentHub