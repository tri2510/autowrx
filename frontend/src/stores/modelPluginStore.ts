// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ModelPluginState {
  disabledPlugins: Record<string, string[]>
  isEnabled: (modelId: string, pluginId: string) => boolean
  setEnabled: (modelId: string, pluginId: string, enabled: boolean) => void
  resetForModel: (modelId: string) => void
}

const useModelPluginStore = create<ModelPluginState>()(
  persist(
    (set, get) => ({
      disabledPlugins: {},
      isEnabled: (modelId: string, pluginId: string) => {
        const disabled = get().disabledPlugins[modelId]
        if (!disabled || disabled.length === 0) {
          return true
        }
        return !disabled.includes(pluginId)
      },
      setEnabled: (modelId: string, pluginId: string, enabled: boolean) => {
        set((state) => {
          const next = { ...state.disabledPlugins }
          const current = new Set(next[modelId] || [])
          if (enabled) {
            current.delete(pluginId)
          } else {
            current.add(pluginId)
          }
          if (current.size === 0) {
            delete next[modelId]
          } else {
            next[modelId] = Array.from(current)
          }
          state.disabledPlugins = next
        })
      },
      resetForModel: (modelId: string) => {
        set((state) => {
          if (!state.disabledPlugins[modelId]) {
            return state
          }
          const next = { ...state.disabledPlugins }
          delete next[modelId]
          state.disabledPlugins = next
        })
      }
    }),
    {
      name: 'autowrx-model-plugin-preferences'
    }
  )
)

export default useModelPluginStore
