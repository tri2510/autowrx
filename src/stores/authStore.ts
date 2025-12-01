// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Token } from '@/types/token.type'
import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { persist, createJSONStorage } from 'zustand/middleware'
import { logoutService } from '@/services/auth.service'
import { create } from 'zustand'

type AuthState = {
  access?: Token | null
  user: any
  openLoginDialog: boolean
}

// Check if token is expired
const isTokenExpired = (token: Token | null | undefined): boolean => {
  if (!token) return true
  return new Date(token.expires) <= new Date()
}

type Actions = {
  setAccess: (_: Token) => void
  setUser: (user: any, access: any) => void
  logOut: () => void
  setOpenLoginDialog: (isOpen: boolean) => void
  validateAndClearExpiredToken: () => void
  getValidToken: () => Token | null
}

const useAuthStore = create<AuthState & Actions>()(
  persist(
    immer((set, get) => ({
      access: undefined,
      user: undefined,
      openLoginDialog: false,
      setUser: (user, access) =>
        set((state) => {
          state.access = access
          state.user = user
        }),
      setAccess: (access) =>
        set((state) => {
          state.access = access
        }),
      logOut: () =>
        set((state) => {
          if (state.access) {
            logoutService().then(() => {
              window.location.pathname = '/'
            })
          }
          state.access = null
          state.user = null
        }),
      setOpenLoginDialog: (isOpen) =>
        set((state) => {
          state.openLoginDialog = isOpen
        }),
      validateAndClearExpiredToken: () =>
        set((state) => {
          if (isTokenExpired(state.access)) {
            state.access = null
            state.user = null
          }
        }),
      getValidToken: () => {
        const currentState = get()
        if (isTokenExpired(currentState.access)) {
          // Clear expired token
          set((state) => {
            state.access = null
            state.user = null
          })
          return null
        }
        return currentState.access || null
      },
    })),
    {
      name: 'autowrx-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only store what we need to persist
      partialize: (state) => ({
        access: state.access,
        user: state.user,
        openLoginDialog: state.openLoginDialog,
      }),
      // Validate token on rehydrate
      onRehydrateStorage: () => (state) => {
        if (state && isTokenExpired(state.access)) {
          state.access = null
          state.user = null
        }
      },
    }
  ),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('AuthStore', useAuthStore)
}

export default useAuthStore
