// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { 
  TbBolt, 
  TbUser, 
  TbUserOff,
  TbLoader2,
  TbCheck,
  TbX
} from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useAuthStore from '@/stores/authStore'
import { autoSignInDev, isDevMode, getDevCredentials } from '@/utils/devAuth'
import { useToast } from './toaster/use-toast'

interface DaDevModeSignInButtonProps {
  className?: string
}

const DaDevModeSignInButton: React.FC<DaDevModeSignInButtonProps> = ({ className = '' }) => {
  const { toast } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signStatus, setSignStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { data: currentUser } = useSelfProfileQuery()
  const { user: authUser } = useAuthStore()

  // Only show in development mode
  if (!isDevMode()) {
    return null
  }

  const isAuthenticated = currentUser || authUser
  const devCreds = getDevCredentials()

  const handleAutoSignIn = async () => {
    if (isSigningIn) return

    setIsSigningIn(true)
    setSignStatus('idle')
    
    try {
      console.log('🚀 Manual auto sign-in triggered from floating button')
      const success = await autoSignInDev(true) // Force sign-in
      
      if (success) {
        setSignStatus('success')
        // Get the actual user that was authenticated
        const authStore = useAuthStore.getState()
        const actualUser = authStore.user?.email || devCreds.email
        
        toast({
          title: "⚡ Auto Sign-In Successful!",
          description: `Signed in as ${actualUser}`,
          duration: 3000,
        })
        
        // Reset status after 2 seconds
        setTimeout(() => setSignStatus('idle'), 2000)
      } else {
        setSignStatus('error')
        toast({
          title: "⚠️ Sign-In Failed",
          description: "Check browser console for details",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Auto sign-in failed:', error)
      setSignStatus('error')
      
      toast({
        title: "❌ Auto Sign-In Failed",
        description: "Please check your backend server connection",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSigningIn(false)
      
      // Reset error status after 3 seconds
      if (signStatus === 'error') {
        setTimeout(() => setSignStatus('idle'), 3000)
      }
    }
  }

  // Only show button when not authenticated in dev mode
  if (isAuthenticated) {
    return null // Don't show the floating sign-in button when already signed in
  }

  const getButtonContent = () => {
    if (isSigningIn) {
      return (
        <>
          <TbLoader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Signing In...</span>
        </>
      )
    }
    
    if (signStatus === 'success') {
      return (
        <>
          <TbCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Success!</span>
        </>
      )
    }
    
    if (signStatus === 'error') {
      return (
        <>
          <TbX className="w-4 h-4" />
          <span className="hidden sm:inline">Failed</span>
        </>
      )
    }
    
    if (isAuthenticated) {
      return (
        <>
          <TbUser className="w-4 h-4" />
          <span className="hidden sm:inline">Signed In</span>
        </>
      )
    }
    
    return (
      <>
        <TbBolt className="w-4 h-4" />
        <span className="hidden sm:inline">Dev Sign-In</span>
      </>
    )
  }

  const getButtonVariant = () => {
    if (signStatus === 'success') return 'outline'
    if (signStatus === 'error') return 'destructive'
    return 'solid'
  }

  const getButtonClassName = () => {
    const baseClass = "fixed top-20 right-4 z-40 shadow-lg transition-all duration-300 hover:scale-105"
    
    if (signStatus === 'success') {
      return `${baseClass} bg-green-600 hover:bg-green-700 text-white border-green-400`
    }
    
    if (signStatus === 'error') {
      return `${baseClass} bg-red-600 hover:bg-red-700 text-white border-red-400`
    }
    
    if (isAuthenticated) {
      return `${baseClass} bg-green-500 hover:bg-green-600 text-white border-green-300`
    }
    
    // Add pulse animation for default state (not authenticated)
    return `${baseClass} bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-yellow-400 dev-signin-button-pulse`
  }

  const getButtonTitle = () => {
    if (isAuthenticated) {
      return `Signed in as ${(currentUser as any)?.name || (authUser as any)?.name || 'Dev User'} - Click to sign in again`
    }
    return `Click to auto sign-in as ${devCreds.email}`
  }

  return (
    <DaButton
      variant={getButtonVariant() as any}
      size="sm"
      onClick={handleAutoSignIn}
      disabled={isSigningIn}
      className={`${getButtonClassName()} ${className}`}
      title={getButtonTitle()}
    >
      <div className="flex items-center space-x-2 px-1">
        {getButtonContent()}
      </div>
    </DaButton>
  )
}

export default DaDevModeSignInButton