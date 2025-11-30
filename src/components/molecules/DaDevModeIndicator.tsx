// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import DaText from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import { 
  TbCode, 
  TbUser, 
  TbLogin, 
  TbLogout, 
  TbSettings,
  TbRefresh,
  TbAlertTriangle,
  TbCircleCheck,
  TbBolt
} from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useAuthStore from '@/stores/authStore'
import { loginService } from '@/services/auth.service'
import { isDevMode, getDevCredentials, autoSignInDev } from '@/utils/devAuth'
import { useToast } from './toaster/use-toast'

interface DaDevModeIndicatorProps {
  className?: string
}

const DaDevModeIndicator: React.FC<DaDevModeIndicatorProps> = ({ className = '' }) => {
  const { toast } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const { data: currentUser } = useSelfProfileQuery()
  const { setUser, logOut, access } = useAuthStore()

  // Only show in development mode
  if (!isDevMode()) {
    return null
  }

  const devCreds = getDevCredentials()

  const handleSignIn = async () => {
    if (isSigningIn) return

    setIsSigningIn(true)
    try {
      const authToken = await loginService(devCreds.email, devCreds.password)
      setUser(authToken.user as any, authToken.tokens?.access as any)
      
      toast({
        title: "✅ Sign-in Successful",
        description: `Signed in as ${devCreds.email}`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Dev sign-in failed:', error)
      toast({
        title: "❌ Sign-in Failed",
        description: "Please check backend connection",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = () => {
    logOut()
    toast({
      title: "👋 Signed Out",
      description: "Successfully signed out",
      duration: 2000,
    })
  }

  const handleForceSignIn = async () => {
    if (isSigningIn) return

    setIsSigningIn(true)
    try {
      const success = await autoSignInDev(true) // Force sign-in
      
      if (success) {
        toast({
          title: "⚡ Force Sign-In Successful",
          description: `Signed in as ${devCreds.email}`,
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Force sign-in failed:', error)
      toast({
        title: "❌ Force Sign-In Failed",
        description: "Please check backend connection",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-black text-white p-3 rounded-lg shadow-lg max-w-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <TbCode className="w-4 h-4 text-yellow-400" />
          <DaText variant="small-bold" className="text-yellow-400">
            Development Mode
          </DaText>
        </div>
        <div className="flex items-center space-x-1">
          {currentUser ? (
            <TbCircleCheck className="w-4 h-4 text-green-400" />
          ) : (
            <TbAlertTriangle className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {/* Backend URL */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Backend:</span>
          <span className="font-mono text-blue-300">
            {import.meta.env.VITE_SERVER_BASE_URL?.replace('http://', '').replace('https://', '')}
          </span>
        </div>

        {/* User Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">User:</span>
          {currentUser ? (
            <span className="text-green-300 font-medium truncate max-w-[120px]" title={currentUser.email}>
              {currentUser.name}
            </span>
          ) : (
            <span className="text-red-300">Not signed in</span>
          )}
        </div>

        {/* Auth Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Auth:</span>
          <span className={access ? "text-green-300" : "text-red-300"}>
            {access ? "✅ Active" : "❌ None"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 space-y-2">
        {!currentUser ? (
          <>
            <DaButton
              variant="outline"
              size="sm"
              onClick={handleForceSignIn}
              disabled={isSigningIn}
              className="w-full h-7 text-xs border-yellow-600 text-yellow-400 hover:bg-yellow-900 hover:bg-opacity-30"
            >
              {isSigningIn ? (
                <>
                  <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  Auto Signing In...
                </>
              ) : (
                <>
                  <TbBolt className="w-3 h-3" />
                  ⚡ Auto Sign-In
                </>
              )}
            </DaButton>
            <DaButton
              variant="outline-nocolor"
              size="sm"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full h-7 text-xs border-gray-600 text-white hover:bg-gray-800"
            >
              <TbLogin className="w-3 h-3" />
              Manual Sign-In
            </DaButton>
          </>
        ) : (
          <div className="flex items-center justify-between space-x-2">
            <DaButton
              variant="outline-nocolor"
              size="sm"
              onClick={handleSignOut}
              className="flex-1 h-7 text-xs border-gray-600 text-white hover:bg-gray-800"
            >
              <TbLogout className="w-3 h-3" />
              Sign Out
            </DaButton>
            <DaText variant="small" className="text-green-400 text-xs">
              ✅ Signed In
            </DaText>
          </div>
        )}
      </div>

      {/* Development Credentials Info */}
      <div className="mt-2 pt-2 border-t border-gray-700">
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-200">
            Dev Credentials
          </summary>
          <div className="mt-1 space-y-1 font-mono">
            <div><span className="text-gray-400">Email:</span> {devCreds.email}</div>
            <div><span className="text-gray-400">Pass:</span> {devCreds.password.replace(/./g, '•')}</div>
          </div>
        </details>
      </div>
    </div>
  )
}

export default DaDevModeIndicator