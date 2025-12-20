// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useRef, useEffect } from 'react'

export interface DeploymentResult {
  status: 'success' | 'error' | 'pending'
  message: string
  data?: any
}

export type ActiveTab = 'overview' | 'deploy' | 'marketplace' | 'apps' | 'console' | 'settings'

export interface DashboardState {
  // Tab and UI State
  activeTab: ActiveTab
  showSetupWizard: boolean
  
  // Console State
  consoleOutput: string[]
  
  // Deployment State
  isDeploying: boolean
  currentDeployment: {
    appId?: string
    executionId?: string
    canStop: boolean
  } | null
  deploymentResult: DeploymentResult | null
  
  // Display Preferences
  autoRefreshEnabled: boolean
  lastRefreshTime: Date | null
  
  // Refs
  fileInputRef: React.RefObject<HTMLInputElement>
  autoRefreshIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>
}

export const useDashboardState = (prototype?: any) => {
  // Tab and UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  
  // Console State
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  
  // Deployment State
  const [isDeploying, setIsDeploying] = useState(false)
  const [currentDeployment, setCurrentDeployment] = useState<{
    appId?: string
    executionId?: string
    canStop: boolean
  } | null>(null)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)
  
  // Display Preferences
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clear console output
  const clearConsole = () => {
    setConsoleOutput([])
  }

  // Add console output with timestamp
  const addConsoleOutput = (message: string, appName?: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const appNamePrefix = appName ? `[${appName}] ` : ''
    setConsoleOutput(prev => [...prev, `[${timestamp}] ${appNamePrefix}${message}`])
  }

  return {
    // State
    activeTab,
    setActiveTab,
    showSetupWizard,
    setShowSetupWizard,
    consoleOutput,
    setConsoleOutput,
    isDeploying,
    setIsDeploying,
    currentDeployment,
    setCurrentDeployment,
    deploymentResult,
    setDeploymentResult,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    lastRefreshTime,
    setLastRefreshTime,
    fileInputRef,
    autoRefreshIntervalRef,
    
    // Actions
    clearConsole,
    addConsoleOutput
  }
}