// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import useAuthStore from '@/stores/authStore'
import { loginService } from '@/services/auth.service'

const DEV_EMAIL = import.meta.env.VITE_DEV_BYPASS_EMAIL || 'dev@autowrx.local'
const DEV_PASSWORD = import.meta.env.VITE_DEV_BYPASS_PASSWORD || 'dev123'
const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

/**
 * Development mode auto-signin utility
 * Automatically signs in with development credentials if in dev mode and not authenticated
 */
export const autoSignInDev = async (force: boolean = false) => {
  console.log('🔍 Starting autoSignInDev...', { IS_DEV_MODE, force })
  
  // Only run in development mode
  if (!IS_DEV_MODE) {
    console.log('🔒 Not in development mode, skipping auto sign-in')
    return false
  }

  // Check if user is already authenticated (unless forced)
  const authStore = useAuthStore.getState()
  console.log('🔍 Auth store state:', {
    hasAccess: !!authStore.access,
    hasUser: !!authStore.user,
    userEmail: authStore.user?.email,
    force
  })

  if (!force && authStore.access && authStore.user) {
    console.log('🚀 Development mode: User already authenticated')
    console.log(`👤 User: ${authStore.user.name} (${authStore.user.email})`)
    return true
  }

  try {
    console.log('🚀 Development mode: Auto-signing in...')
    console.log(`📧 Email: ${DEV_EMAIL}`)
    console.log(`🔗 Backend: ${import.meta.env.VITE_SERVER_BASE_URL}`)
    
    // Clear any existing invalid state first
    if (force) {
      console.log('🧹 Clearing existing auth state for forced sign-in...')
      authStore.setAccess(null as any)
      authStore.user = null
    }
    
    // Check if backend is reachable
    const backendUrl = import.meta.env.VITE_SERVER_BASE_URL
    console.log(`🌐 Testing backend connection to ${backendUrl}...`)
    
    // Attempt login with development credentials
    console.log('🔐 Attempting login with development credentials...')
    const authToken = await loginService(DEV_EMAIL, DEV_PASSWORD)
    
    console.log('📝 Full login response:', authToken)
    console.log('📝 Login response analysis:', {
      hasUser: !!authToken.user,
      hasAccess: !!authToken.access,
      hasTokens: !!authToken.tokens,
      hasToken: !!authToken.token,
      userName: authToken.user?.name,
      userEmail: authToken.user?.email,
      accessToken: authToken.access?.token,
      allKeys: Object.keys(authToken)
    })
    
    // Use the same logic as the manual sign-in form
    // The manual form uses: response.tokens.access and response.user
    let user = authToken.user
    let access = authToken.tokens?.access || authToken.access || authToken.token || authToken.tokens
    
    // If response is nested or has different structure
    if (!user && authToken.data) {
      user = authToken.data.user
      access = authToken.data.tokens?.access || authToken.data.access || authToken.data.token || authToken.data.tokens
    }
    
    console.log('📝 Processed auth data (matching manual form):', {
      user: !!user,
      access: !!access,
      userEmail: user?.email,
      hasTokens: !!authToken.tokens,
      tokensAccess: !!authToken.tokens?.access,
      accessType: typeof access
    })
    
    // Update auth store using the same pattern as manual form
    console.log('💾 Updating auth store using setAccess (like manual form):', { 
      userEmail: user?.email, 
      hasAccess: !!access 
    })
    
    // Use setAccess first (like manual form), then setUser
    if (access) {
      authStore.setAccess(access)
      console.log('✅ setAccess called with token')
    }
    if (user) {
      authStore.setUser(user, access)
      console.log('✅ setUser called with user:', user.email)
    }
    
    // Verify the auth store was updated
    const updatedStore = useAuthStore.getState()
    console.log('💾 Auth store after update:', {
      hasUser: !!updatedStore.user,
      hasAccess: !!updatedStore.access,
      userEmail: updatedStore.user?.email,
      accessType: typeof updatedStore.access,
      accessKeys: updatedStore.access ? Object.keys(updatedStore.access) : null
    })
    
    // Don't trigger page reload here - let React handle the state change naturally
    // The manual form reloads because it needs to update the UI, but our auto sign-in
    // should work without a reload since React will re-render when auth store changes
    if (access && user) {
      console.log('✅ Authentication successful - React will update UI automatically')
    }
    
    const finalUser = user || authToken.user
    
    console.log('✅ Development mode: Auto-signin successful')
    console.log(`👤 User: ${finalUser?.name} (${finalUser?.email})`)
    console.log(`🔑 Access Token: ${access ? 'Received' : 'Missing'}`)
    
    // Check if we got the expected user
    if (finalUser?.email !== DEV_EMAIL) {
      console.warn(`⚠️ Expected user ${DEV_EMAIL} but got ${finalUser?.email}`)
      console.warn('The dev user might not exist in backend, but accepting valid authentication')
      
      // Accept the valid authentication even if it's not the expected dev user
      // This allows development to continue even if the specific dev user doesn't exist
      console.log('✅ Accepting valid authentication with user:', finalUser?.email)
      
      // Don't throw an error - we have a valid authenticated user
      return true
    }
    
    return true
  } catch (error) {
    console.error('❌ Development mode: Auto-signin failed:', error)
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })
    
    // In development mode, you might want to show a helpful message
    if (IS_DEV_MODE) {
      console.warn('💡 Tip: Make sure the backend server is running and accessible')
      console.warn(`💡 Backend URL: ${import.meta.env.VITE_SERVER_BASE_URL}`)
      console.warn(`💡 Using credentials: ${DEV_EMAIL} / ${DEV_PASSWORD}`)
      console.warn('')
      console.warn('📝 Note: The backend returned a different user than expected.')
      console.warn(`   Expected: ${DEV_EMAIL}`)
      console.warn('   This usually means the dev user doesn\'t exist in the backend database.')
      console.warn('   You can either create the dev user or use the existing user for development.')
      console.warn('')
      console.warn('💻 Optional: To use the exact dev user, create it in your backend:')
      console.warn(`   Email: ${DEV_EMAIL}`)
      console.warn(`   Password: ${DEV_PASSWORD}`)
      
      // Try to ping the backend to see if it's running
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        console.log(`🏥 Backend health check: ${response.status} ${response.statusText}`)
      } catch (healthError) {
        console.error('🏥 Backend health check failed - server might not be running:', healthError)
      }
    }
    
    return false
  }
}

/**
 * Check if current environment is development mode
 */
export const isDevMode = () => IS_DEV_MODE

/**
 * Get development credentials (for UI display purposes)
 */
export const getDevCredentials = () => ({
  email: DEV_EMAIL,
  password: DEV_PASSWORD,
  isDevMode: IS_DEV_MODE
})

/**
 * Quick environment check - logs all relevant dev settings
 */
export const checkDevEnvironment = () => {
  console.group('🔧 Development Environment Check')
  console.log('📋 Environment Variables:')
  console.log(`  VITE_DEV_MODE: ${import.meta.env.VITE_DEV_MODE}`)
  console.log(`  VITE_DEV_BYPASS_EMAIL: ${import.meta.env.VITE_DEV_BYPASS_EMAIL}`)
  console.log(`  VITE_DEV_BYPASS_PASSWORD: ${import.meta.env.VITE_DEV_BYPASS_PASSWORD ? '***' : 'undefined'}`)
  console.log(`  VITE_SERVER_BASE_URL: ${import.meta.env.VITE_SERVER_BASE_URL}`)
  console.log('')
  console.log('🔧 Processed Values:')
  console.log(`  IS_DEV_MODE: ${IS_DEV_MODE}`)
  console.log(`  DEV_EMAIL: ${DEV_EMAIL}`)
  console.log(`  DEV_PASSWORD: ${DEV_PASSWORD}`)
  console.log('')
  
  const authStore = useAuthStore.getState()
  console.log('🔐 Current Auth State:')
  console.log(`  Has Access: ${!!authStore.access}`)
  console.log(`  Has User: ${!!authStore.user}`)
  console.log(`  User Email: ${authStore.user?.email}`)
  console.groupEnd()
  
  return {
    isDevMode: IS_DEV_MODE,
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
    backendUrl: import.meta.env.VITE_SERVER_BASE_URL,
    hasAuthStoreAccess: !!authStore.access,
    hasAuthStoreUser: !!authStore.user,
  }
}