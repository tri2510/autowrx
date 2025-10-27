// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { AutoWRXPluginAPI } from '../../frontend/src/types/plugin.types'
import AspiceTabComponent from './components/AspiceTabComponent'

declare global {
  interface Window {
    AutoWRXPluginAPI: AutoWRXPluginAPI
  }
}

class AspicePlugin {
  private api: AutoWRXPluginAPI

  constructor() {
    this.api = window.AutoWRXPluginAPI
  }

  async activate(): Promise<void> {
    console.log('ASPICE Plugin activated')
    
    this.api.registerTab({
      id: 'aspice-assessment',
      label: 'ASPICE',
      icon: '🔍',
      path: '/aspice',
      component: 'AspiceTabComponent',
      position: 6
    })

    this.api.subscribeToVehicleUpdates((data) => {
      console.log('ASPICE Plugin: Vehicle data updated:', data)
    })

    this.api.showToast('ASPICE Plugin loaded successfully', 'success')
  }

  async deactivate(): Promise<void> {
    console.log('ASPICE Plugin deactivated')
    this.api.unregisterTab('aspice-assessment')
  }

  getComponent(componentName: string): React.ComponentType | null {
    switch (componentName) {
      case 'AspiceTabComponent':
        return AspiceTabComponent
      default:
        return null
    }
  }
}

export default AspicePlugin