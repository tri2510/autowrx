// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import {
  TbDeviceDesktop,
  TbRocket,
  TbTerminal,
  TbSettings,
  TbShoppingCart,
  TbCode
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'

interface DashboardTab {
  id: string
  label: string
  icon: any
  count?: number
}

interface DashboardTabsProps {
  activeTab: 'overview' | 'deploy' | 'marketplace' | 'apps' | 'settings'
  onTabChange: (tabId: 'overview' | 'deploy' | 'marketplace' | 'apps' | 'settings') => void
  runningAppsCount: number
}

const DashboardTabs: FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
  runningAppsCount
}) => {
  const tabs: DashboardTab[] = [
    { id: 'overview', label: 'Overview', icon: TbDeviceDesktop },
    { id: 'deploy', label: 'Deploy', icon: TbRocket },
    { id: 'marketplace', label: 'Marketplace', icon: TbShoppingCart },
    { id: 'apps', label: 'Applications', icon: TbCode, count: runningAppsCount },
    { id: 'settings', label: 'Settings', icon: TbSettings }
  ]

  return (
    <div className="border-b border-border px-6">
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => onTabChange(tab.id)}
            className="flex items-center space-x-2"
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default DashboardTabs