// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback } from 'react'
import { PROTOTYPE_APPS, MARKETPLACE_CATEGORIES } from '../utils'

export interface MarketplaceApp {
  id: string
  name: string
  description: string
  category: string
  version: string
  author: string
  rating: number
  downloads: number
  price: 'free' | 'paid'
  icon: string
  tags: string[]
  size: string
  lastUpdated: string
  code?: string
  entryPoint?: string
  type: 'python' | 'binary'
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime?: string
}

export interface MarketplaceState {
  marketplaceApps: MarketplaceApp[]
  selectedMarketplaceApp: MarketplaceApp | null
  selectedCategory: string
  searchQuery: string
  isLoading: boolean
  error: string | null
}

export const useMarketplaceApps = () => {
  const [state, setState] = useState<MarketplaceState>({
    marketplaceApps: [],
    selectedMarketplaceApp: null,
    selectedCategory: 'all',
    searchQuery: '',
    isLoading: false,
    error: null
  })

  const loadMarketplaceApps = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      console.log('🛒 Loading marketplace apps...')

      // For now, use prototype apps as marketplace data
      // In a real implementation, this would fetch from a marketplace API
      const apps: MarketplaceApp[] = PROTOTYPE_APPS.map(app => ({
        ...app,
        version: '1.0.0',
        author: 'AutoWrx Team',
        rating: 4.5,
        downloads: Math.floor(Math.random() * 1000) + 100,
        price: 'free' as const,
        icon: '🚗',
        tags: [app.category.toLowerCase(), 'vehicle', 'edge'],
        size: '2.5 MB',
        lastUpdated: new Date().toISOString(),
        type: 'python' as const
      }))

      setState(prev => ({
        ...prev,
        marketplaceApps: apps,
        isLoading: false
      }))

      console.log(`✅ Loaded ${apps.length} marketplace apps`)
    } catch (error) {
      console.error('❌ Failed to load marketplace apps:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load marketplace',
        isLoading: false
      }))
    }
  }, [])

  const selectMarketplaceApp = useCallback((app: MarketplaceApp | null) => {
    setState(prev => ({ ...prev, selectedMarketplaceApp: app }))
    if (app) {
      console.log(`📱 Selected marketplace app: ${app.name}`)
    }
  }, [])

  const setSelectedCategory = useCallback((category: string) => {
    setState(prev => ({ ...prev, selectedCategory: category }))
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const deployMarketplaceApp = useCallback(async (app: MarketplaceApp, deployFunction: (config: { name: string; code: string; vehicleId?: string }) => Promise<string>) => {
    try {
      console.log(`🚀 Deploying marketplace app: ${app.name}`)

      if (!app.code) {
        throw new Error('App code not available')
      }

      const deployConfig = {
        name: app.name,
        code: app.code,
        vehicleId: 'default-vehicle'
      }

      const deployedAppId = await deployFunction(deployConfig)
      console.log(`✅ Marketplace app deployed: ${deployedAppId}`)
      return deployedAppId
    } catch (error) {
      console.error(`❌ Failed to deploy marketplace app ${app.name}:`, error)
      throw error
    }
  }, [])

  // Filter apps based on category and search query
  const filteredMarketplaceApps = state.marketplaceApps.filter(app => {
    const matchesCategory = state.selectedCategory === 'all' || app.category === state.selectedCategory
    const matchesSearch = app.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         app.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const categories = ['all', ...Array.from(new Set(state.marketplaceApps.map(app => app.category)))]

  // Load apps on component mount
  useEffect(() => {
    loadMarketplaceApps()
  }, [loadMarketplaceApps])

  return {
    ...state,
    filteredMarketplaceApps,
    categories,
    loadMarketplaceApps,
    selectMarketplaceApp,
    setSelectedCategory,
    setSearchQuery,
    deployMarketplaceApp
  }
}