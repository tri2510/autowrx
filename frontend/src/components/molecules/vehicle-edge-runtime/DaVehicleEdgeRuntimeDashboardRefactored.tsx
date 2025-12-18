// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect, useRef } from 'react'
import {
  TbDeviceDesktop,
  TbRocket,
  TbTerminal,
  TbSettings,
  TbX,
  TbRefresh,
  TbAlertTriangle,
  TbArrowLeft
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import DaDeviceSetupWizard from './DaDeviceSetupWizard'
import kitManagerService, { VehicleEdgeRuntimeKit } from '@/services/kitManager.service'
import vehicleEdgeRuntimeDirectService, { VehicleApp } from '@/services/vehicleEdgeRuntimeDirect.service'

// Import modular components and hooks
import {
  useVehicleRuntimeState,
  useKitManagerState,
  useConsoleOutput,
  useMarketplaceApps
} from './hooks'

import {
  ConnectionStatusPanel,
  DeviceSelector,
  RunningAppsList,
  ConsoleViewer,
  AppDeploymentPanel
} from './components'

import { getStatusColor, getStatusBg, getStatusIcon } from './utils'

interface VehicleEdgeRuntimeDashboardProps {
  onClose: () => void
  prototype?: any
}

const DaVehicleEdgeRuntimeDashboard: FC<VehicleEdgeRuntimeDashboardProps> = ({
  onClose,
  prototype
}) => {
  // State for tabs and UI
  const [activeTab, setActiveTab] = useState<'overview' | 'deploy' | 'marketplace' | 'apps' | 'console' | 'settings'>('overview')
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [currentDeployment, setCurrentDeployment] = useState<{
    appId?: string
    executionId?: string
    canStop: boolean
  } | null>(null)
  const [deploymentResult, setDeploymentResult] = useState<{
    status: 'success' | 'error' | 'pending'
    message: string
    data?: any
  } | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  // Use custom hooks for state management
  const vehicleRuntime = useVehicleRuntimeState()
  const kitManager = useKitManagerState()
  const consoleOutput = useConsoleOutput()
  const marketplace = useMarketplaceApps()

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize connections when component mounts
  useEffect(() => {
    const initializeConnections = async () => {
      try {
        console.log('🚀 Initializing dashboard connections...')

        // Initialize Kit Manager first
        await kitManager.initializeKitManager()

        // Initialize Vehicle Runtime if kit is selected
        if (kitManager.selectedKit) {
          await vehicleRuntime.initializeVehicleRuntime()

          // Setup runtime connection through Kit Manager
          const connected = await kitManager.initializeRuntimeConnection(kitManager.selectedKit)
          if (connected) {
            consoleOutput.addSystemMessage(`✅ Connected to runtime via ${kitManager.selectedKit.name}`)
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize connections:', error)
        consoleOutput.addSystemMessage(`❌ Connection failed: ${error}`)
      }
    }

    initializeConnections()
  }, [kitManager.selectedKit])

  // Auto-select first online kit if none selected
  useEffect(() => {
    if (kitManager.kits.length > 0 && !kitManager.selectedKit) {
      const onlineKits = kitManager.kits.filter(kit => kit.is_online)
      if (onlineKits.length > 0) {
        kitManager.selectKit(onlineKits[0])
      }
    }
  }, [kitManager.kits, kitManager.selectedKit, kitManager.selectKit])

  // Handle kit selection
  useEffect(() => {
    if (kitManager.selectedKit) {
      consoleOutput.addSystemMessage(`🎯 Selected device: ${kitManager.selectedKit.name}`)
      vehicleRuntime.initializeVehicleRuntime()
    }
  }, [kitManager.selectedKit])

  // Kit selection handler
  const handleSelectKit = async (kit: VehicleEdgeRuntimeKit) => {
    console.log('🎯 Selected kit:', kit.name)
    kitManager.selectKit(kit)

    if (kit.is_online) {
      try {
        await kitManager.initializeRuntimeConnection(kit)
        consoleOutput.addSystemMessage(`✅ Connected to runtime via ${kit.name}`)
      } catch (error) {
        consoleOutput.addSystemMessage(`❌ Failed to connect to runtime: ${error}`)
      }
    }
  }

  // App deployment handler
  const handleDeployApp = async (appConfig: { name: string; code: string; vehicleId?: string }) => {
    try {
      console.log('🚀 Dashboard Debug before deployment:')
      console.log('  - appName:', appConfig.name)
      console.log('  - vehicleId:', appConfig.vehicleId)

      setIsDeploying(true)
      setDeploymentResult(null)
      setCurrentDeployment({ canStop: true })

      const timestamp = new Date().toLocaleTimeString()
      consoleOutput.addSystemMessage(`[${timestamp}] 🚀 Starting deployment: ${appConfig.name}`)

      const deployedAppId = await vehicleRuntime.deployApp(appConfig)

      const successTimestamp = new Date().toLocaleTimeString()
      consoleOutput.addSystemMessage(`[${successTimestamp}] ✅ App deployed: ${deployedAppId}`)

      setDeploymentResult({
        status: 'success',
        message: `Successfully deployed ${appConfig.name}`,
        data: { appId: deployedAppId }
      })

      // Switch to apps tab to see deployed app
      setActiveTab('apps')

      return deployedAppId
    } catch (error) {
      const errorTimestamp = new Date().toLocaleTimeString()
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      consoleOutput.addSystemMessage(`[${errorTimestamp}] ❌ Deployment failed: ${errorMessage}`)

      setDeploymentResult({
        status: 'error',
        message: `Deployment failed: ${errorMessage}`
      })

      throw error
    } finally {
      setIsDeploying(false)
      setCurrentDeployment(null)
    }
  }

  // Stop deployment handler
  const handleStopDeployment = async () => {
    try {
      const timestamp = new Date().toLocaleTimeString()
      consoleOutput.addSystemMessage(`[${timestamp}] ⏹️ Stopping deployment...`)

      setIsDeploying(false)
      setCurrentDeployment(null)

      consoleOutput.addSystemMessage(`[${timestamp}] ✅ Deployment stopped`)
    } catch (error) {
      console.error('Failed to stop deployment:', error)
    }
  }

  // View console handler
  const handleViewConsole = (app: VehicleApp) => {
    consoleOutput.subscribeToConsole(app.id)
    setActiveTab('console')
  }

  // Setup wizard completion handler
  const handleSetupWizardComplete = (deviceInfo: any) => {
    console.log('✅ Setup wizard completed:', deviceInfo)
    setShowSetupWizard(false)
    kitManager.refreshKits()
  }

  // Error handling
  useEffect(() => {
    const hasErrors = kitManager.connectionError || vehicleRuntime.connectionError
    if (hasErrors && !showErrors) {
      setShowErrors(true)
    }
  }, [kitManager.connectionError, vehicleRuntime.connectionError, showErrors])

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'deploy':
        return (
          <AppDeploymentPanel
            onDeploy={handleDeployApp}
            isDeploying={isDeploying}
            onStopDeployment={handleStopDeployment}
            selectedKit={kitManager.selectedKit}
          />
        )

      case 'apps':
        return (
          <RunningAppsList
            apps={vehicleRuntime.vehicleApps}
            isRefreshing={vehicleRuntime.isRefreshingApps}
            onStartApp={vehicleRuntime.startApp}
            onStopApp={vehicleRuntime.stopApp}
            onPauseApp={vehicleRuntime.pauseApp}
            onResumeApp={vehicleRuntime.resumeApp}
            onUninstallApp={vehicleRuntime.uninstallApp}
            onViewConsole={handleViewConsole}
            onRefresh={vehicleRuntime.refreshApps}
          />
        )

      case 'console':
        return (
          <ConsoleViewer
            consoleOutput={consoleOutput.consoleOutput}
            selectedAppId={consoleOutput.selectedAppId}
            isSubscribed={consoleOutput.isSubscribed}
            onClear={consoleOutput.clearConsole}
            onSubscribe={consoleOutput.subscribeToConsole}
            onUnsubscribe={consoleOutput.unsubscribeFromConsole}
            appsList={vehicleRuntime.vehicleApps}
            consoleEndRef={consoleOutput.consoleEndRef}
          />
        )

      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            <div className="text-gray-600">
              Settings panel coming soon...
            </div>
          </div>
        )

      default:
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Connection Status */}
              <ConnectionStatusPanel
                isKitManagerConnected={kitManager.isKitManagerConnected}
                isRuntimeConnected={vehicleRuntime.isRuntimeConnected}
                selectedKit={kitManager.selectedKit}
                connectionError={kitManager.connectionError || vehicleRuntime.connectionError}
                onReconnect={kitManager.reconnect}
                onRefreshKits={kitManager.refreshKits}
                isRefreshing={kitManager.isRefreshing}
              />

              {/* Quick Stats */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Runtime Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Deployed Apps:</span>
                    <span className="font-medium text-blue-900">{vehicleRuntime.vehicleApps.length}</span>
                  </div>
                  {vehicleRuntime.runtimeState && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Running:</span>
                        <span className="font-medium text-blue-900">
                          {vehicleRuntime.runtimeState.runningApplications?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Uptime:</span>
                        <span className="font-medium text-blue-900">
                          {Math.floor(vehicleRuntime.runtimeState.uptime || 0)}s
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => setActiveTab('deploy')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <TbRocket className="w-4 h-4 mr-2" />
                    Deploy App
                  </Button>
                  <Button
                    onClick={() => setActiveTab('apps')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <TbDeviceDesktop className="w-4 h-4 mr-2" />
                    Manage Apps
                  </Button>
                  <Button
                    onClick={vehicleRuntime.refreshApps}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    disabled={vehicleRuntime.isRefreshingApps}
                  >
                    <TbRefresh className="w-4 h-4 mr-2" />
                    Refresh Apps
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <TbArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TbDeviceDesktop className="w-6 h-6" />
                Vehicle Edge Runtime Dashboard
              </h1>
              <div className={`w-2 h-2 rounded-full ${
                kitManager.isKitManagerConnected && vehicleRuntime.isRuntimeConnected
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
              }`} />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSetupWizard(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <TbSettings className="w-4 h-4" />
                Setup Wizard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Notifications */}
        {(kitManager.connectionError || vehicleRuntime.connectionError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <TbAlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-red-900">Connection Issues Detected</div>
                <div className="text-sm text-red-700 mt-1">
                  {kitManager.connectionError && (
                    <div>Kit Manager: {kitManager.connectionError}</div>
                  )}
                  {vehicleRuntime.connectionError && (
                    <div>Vehicle Runtime: {vehicleRuntime.connectionError}</div>
                  )}
                </div>
                <div className="mt-3">
                  <Button
                    onClick={kitManager.reconnect}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <TbRefresh className="w-4 h-4" />
                    Reconnect All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Device Selector */}
        <DeviceSelector
          kits={kitManager.kits}
          selectedKit={kitManager.selectedKit}
          showOfflineDevices={kitManager.showOfflineDevices}
          isRefreshing={kitManager.isRefreshing}
          onSelectKit={handleSelectKit}
          onToggleShowOffline={kitManager.toggleShowOfflineDevices}
          onRefresh={kitManager.refreshKits}
        />

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <nav className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: TbDeviceDesktop },
              { id: 'deploy', label: 'Deploy', icon: TbRocket },
              { id: 'apps', label: 'Applications', icon: TbDeviceDesktop },
              { id: 'console', label: 'Console', icon: TbTerminal },
              { id: 'settings', label: 'Settings', icon: TbSettings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Setup Wizard Dialog */}
      {showSetupWizard && (
        <Dialog open={showSetupWizard} onOpenChange={setShowSetupWizard}>
          <DialogContent className="max-w-4xl">
            <DaDeviceSetupWizard onComplete={handleSetupWizardComplete} onClose={() => setShowSetupWizard(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Deployment Result Notification */}
      {deploymentResult && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md ${
          deploymentResult.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        } border`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              deploymentResult.status === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {deploymentResult.status === 'success' ? (
                <TbRefresh className="w-4 h-4 text-white" />
              ) : (
                <TbAlertTriangle className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className={`font-medium ${
                deploymentResult.status === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {deploymentResult.status === 'success' ? 'Deployment Successful' : 'Deployment Failed'}
              </div>
              <div className={`text-sm ${
                deploymentResult.status === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {deploymentResult.message}
              </div>
            </div>
            <Button
              onClick={() => setDeploymentResult(null)}
              variant="ghost"
              size="sm"
            >
              <TbX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DaVehicleEdgeRuntimeDashboard