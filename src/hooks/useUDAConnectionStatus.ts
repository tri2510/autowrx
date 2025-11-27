// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'

export const useUDAConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check initial connection status
    const checkConnection = () => {
      const connected = localStorage.getItem('uda-agent-connected') === 'true'
      setIsConnected(connected)
    }

    checkConnection()

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'uda-agent-connected') {
        setIsConnected(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return isConnected
}