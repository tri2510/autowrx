// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useRoutes } from 'react-router-dom'
import routesConfig from './configs/routes'
import 'non.geist'
import 'non.geist/mono'
import useSelfProfileQuery from './hooks/useSelfProfile'
import { useEffect, useState } from 'react'
import { addLog } from './services/log.service'
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/molecules/toaster/use-toast'
import { autoSignInDev, isDevMode, getDevCredentials } from './utils/devAuth'
import useAuthStore from './stores/authStore'
import DaDevModeSignInButton from './components/molecules/DaDevModeSignInButton'

function App() {
  const routes = useRoutes(routesConfig)
  const navigate = useNavigate();
  const [devAutoSignInAttempted, setDevAutoSignInAttempted] = useState(false)
  
  useEffect(() => {
    (window as any).reactNavigate = navigate;
  }, [navigate]);

  const { toast } = useToast()
  useEffect(() => {
    (window as any).reactToast = toast;
  }, [toast])

  const { data: currentUser, isLoading: isUserLoading, error: userError } = useSelfProfileQuery()
  const authStore = useAuthStore()

  // Development mode auto-signin with improved timing
  useEffect(() => {
    const handleDevAutoSignIn = async () => {
      // Only attempt auto-signin in development mode
      if (!isDevMode()) {
        return
      }

      console.log('🔍 Dev mode check:', {
        isDevMode: isDevMode(),
        attempted: devAutoSignInAttempted,
        currentUser: !!currentUser,
        isUserLoading,
        userError: !!userError,
        hasAccess: !!authStore.access,
        hasUser: !!authStore.user
      })

      // Wait for user query to complete
      if (isUserLoading) {
        return
      }

      // Check if user is already authenticated in any way
      const isAuthenticated = currentUser || authStore.user || authStore.access
      
      // If already authenticated, don't attempt auto sign-in
      if (isAuthenticated) {
        console.log('✅ User already authenticated:', currentUser?.name || authStore.user?.name)
        return
      }

      // Don't attempt if already attempted (prevents multiple tries)
      if (devAutoSignInAttempted) {
        console.log('🔄 Auto sign-in already attempted, skipping...')
        return
      }

      // Set attempted flag to prevent multiple attempts
      setDevAutoSignInAttempted(true)
      
      // Try auto sign-in if no authenticated user found
      console.log('🚀 No user found, attempting auto sign-in...')
      
      try {
        const success = await autoSignInDev()
        
        if (success && toast) {
          const devCreds = getDevCredentials()
          toast({
            title: "🚀 Development Mode",
            description: `Auto-signed in as ${devCreds.email}`,
            duration: 3000,
          })
        }
      } catch (error) {
        console.error('Development auto-signin failed:', error)
        
        if (toast) {
          toast({
            title: "⚠️ Development Sign-in Failed",
            description: "Please check your backend server connection",
            variant: "destructive",
            duration: 5000,
          })
        }
      }
    }

    // Add a small delay to ensure auth store is hydrated
    const timer = setTimeout(handleDevAutoSignIn, 100)
    
    return () => clearTimeout(timer)
  }, [isDevMode, devAutoSignInAttempted, currentUser, isUserLoading, userError, authStore.access, authStore.user, toast])

  // Removed the problematic second effect that was causing infinite loops

  // Logging and analytics
  useEffect(() => {
    if (!currentUser) {
      return
    }
    
    let userId = 'anonymous'
    let userName = 'Anonymous'
    if (currentUser) {
      userId = currentUser.id
      userName = currentUser.name
    }
    let lastAnonymousView = localStorage.getItem(`lastview-${userId}`)
    let lastVisitTime = new Date(Number(lastAnonymousView || 0))
    let now = new Date()
    if (now.getTime() - lastVisitTime.getTime() > 60000 * 60) {
      localStorage.setItem(`lastview-${userId}`, now.getTime().toString())
      addLog({
        name: `User ${userName} visited`,
        create_by: userId,
        description: `User ${userName} visited`,
        type: 'visit',
        ref_id: userId,
        ref_type: 'user',
      })
    }
  }, [currentUser])

  // Development mode indicator
  useEffect(() => {
    if (isDevMode()) {
      console.log('🚀 Application running in Development Mode')
      console.log(`📧 Dev Email: ${getDevCredentials().email}`)
      console.log(`🔗 Backend: ${import.meta.env.VITE_SERVER_BASE_URL}`)
      
      // Add dev mode indicator to document
      document.body.classList.add('dev-mode')
    }
  }, [])

  return (
    <>
      {routes}
      
      {/* Development Mode Sign-In Button - only shows in dev mode when not authenticated */}
      <DaDevModeSignInButton />
    </>
  )
}

export default App
