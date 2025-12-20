// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useCallback } from 'react'
import vehicleEdgeRuntimeService from '@/services/vehicleEdgeRuntime.service'
import { MarketplaceApp } from './useMarketplaceApps'
import { DeploymentResult } from './useDashboardState'

export interface DeploymentConfig {
  type: 'python' | 'binary'
  code: string
  entryPoint: string
  envVars: Record<string, string>
  resourceLimits: {
    memory: number
    cpu: number
  }
}

export interface DeploymentState {
  deploymentConfig: DeploymentConfig
  isDeploying: boolean
  currentDeployment: {
    appId?: string
    executionId?: string
    canStop: boolean
  } | null
  deploymentResult: DeploymentResult | null
}

export const useDeployment = (prototype?: any) => {
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    type: 'python' as 'python' | 'binary',
    code: prototype?.code || `import time
import asyncio

print("🚗 Vehicle Edge Runtime Application")
print("=" * 50)

try:
    for i in range(60):  # 60 cycles = 10 minutes (10 seconds each)
        print(f"📡 Processing cycle {i + 1}/60")
        print(f"⏰ Timestamp: {time.strftime('%H:%M:%S')}")

        await asyncio.sleep(10)  # 10 seconds per cycle

        print(f"✅ Cycle {i + 1} completed")
        print("-" * 30)

    print("🎉 Application completed successfully!")
    print("📊 Total runtime: 10 minutes")

except Exception as e:
    print(f"❌ Error: {e}")

print("📊 Application execution finished")`,
    entryPoint: 'main.py',
    envVars: {} as Record<string, string>,
    resourceLimits: {
      memory: 512,
      cpu: 50
    }
  })

  const [isDeploying, setIsDeploying] = useState(false)
  const [currentDeployment, setCurrentDeployment] = useState<{
    appId?: string
    executionId?: string
    canStop: boolean
  } | null>(null)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)

  const deployApp = useCallback(async (kitId: string) => {
    setIsDeploying(true)
    setCurrentDeployment(null)
    setDeploymentResult(null)

    try {
      console.log('🚀 Starting deployment...')
      console.log('📋 Deployment config:', deploymentConfig)

      // Create deployment request
      const deploymentRequest = {
        to_kit_id: kitId,
        type: deploymentConfig.type,
        id: `custom-${Date.now()}`,
        cmd: 'run_python_app',
        code: deploymentConfig.code,
        filters: {}
      }

      console.log('📤 Sending deployment request:', deploymentRequest)

      // Send deployment request
      const deployResponse = await vehicleEdgeRuntimeService.deployPythonApp(deploymentRequest)

      if (deployResponse && deployResponse.execution_id) {
        console.log('✅ Deployment started:', deployResponse)
        
        setCurrentDeployment({
          appId: deploymentRequest.id,
          executionId: deployResponse.execution_id,
          canStop: true
        })

        setDeploymentResult({
          status: 'pending',
          message: 'Deployment in progress...',
          data: deployResponse
        })

        return deployResponse.execution_id
      } else {
        throw new Error('No execution ID returned from deployment')
      }

    } catch (error) {
      console.error('❌ Deployment failed:', error)
      
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Deployment failed',
        data: { error }
      })

      throw error
    } finally {
      setIsDeploying(false)
    }
  }, [deploymentConfig])

  const deployMarketplaceApp = useCallback(async (app: MarketplaceApp, kitId: string) => {
    setIsDeploying(true)
    setCurrentDeployment(null)
    setDeploymentResult(null)

    try {
      console.log(`🚀 Deploying marketplace app: ${app.name}`)

      if (!app.code) {
        throw new Error('App code not available')
      }

      // Create deployment request for marketplace app
      const deploymentRequest = {
        to_kit_id: kitId,
        type: app.type,
        id: app.id,
        cmd: app.type === 'python' ? 'run_python_app' : 'run_binary_app',
        code: app.code,
        filters: {}
      }

      console.log('📤 Sending marketplace app deployment request:', deploymentRequest)

      // Send deployment request
      const deployResponse = await vehicleEdgeRuntimeService.deployPythonApp(deploymentRequest)

      if (deployResponse && deployResponse.execution_id) {
        console.log('✅ Marketplace app deployment started:', deployResponse)
        
        setCurrentDeployment({
          appId: app.id,
          executionId: deployResponse.execution_id,
          canStop: true
        })

        setDeploymentResult({
          status: 'success',
          message: `Successfully deployed ${app.name}`,
          data: deployResponse
        })

        return deployResponse.execution_id
      } else {
        throw new Error('No execution ID returned from deployment')
      }

    } catch (error) {
      console.error(`❌ Marketplace app deployment failed:`, error)
      
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Marketplace app deployment failed',
        data: { error }
      })

      throw error
    } finally {
      setIsDeploying(false)
    }
  }, [])

  const stopDeployment = useCallback(async () => {
    if (!currentDeployment || !currentDeployment.executionId) {
      console.warn('⚠️ No active deployment to stop')
      return
    }

    try {
      console.log('🛑 Stopping deployment:', currentDeployment.executionId)
      
      // Call stop deployment API
      await vehicleEdgeRuntimeService.stopDeployment(currentDeployment.executionId)
      
      console.log('✅ Deployment stopped successfully')
      
      setCurrentDeployment(null)
      setDeploymentResult({
        status: 'success',
        message: 'Deployment stopped successfully'
      })

    } catch (error) {
      console.error('❌ Failed to stop deployment:', error)
      
      setDeploymentResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to stop deployment',
        data: { error }
      })
    }
  }, [currentDeployment])

  const retryDeployment = useCallback(async () => {
    if (!deploymentConfig) {
      console.error('❌ No deployment config to retry')
      return
    }

    // Reset deployment state and retry
    setCurrentDeployment(null)
    setDeploymentResult(null)
    
    console.log('🔄 Retrying deployment...')
    // The actual retry logic would depend on the selected kit
    // This will be handled by the component that calls this hook
  }, [deploymentConfig])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setDeploymentConfig(prev => ({
          ...prev,
          code: content,
          entryPoint: file.name
        }))
      }
      reader.readAsText(file)
    }
  }, [])

  return {
    // State
    deploymentConfig,
    setDeploymentConfig,
    isDeploying,
    currentDeployment,
    deploymentResult,
    setDeploymentResult,
    
    // Actions
    deployApp,
    deployMarketplaceApp,
    stopDeployment,
    retryDeployment,
    handleFileUpload
  }
}