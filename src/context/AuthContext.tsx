'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { IAuthService, AuthUser } from '@/lib/auth/types'
import { MockAuthService } from '@/lib/auth/mockAuthService'
import { CognitoAuthService } from '@/lib/auth/cognitoAuthService'

const useCognito =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
  !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: { displayName?: string; avatarUrl?: string }) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ needsEmailVerification: boolean }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const authServiceRef = useRef<IAuthService | null>(null)
  if (!authServiceRef.current) {
    authServiceRef.current = useCognito
      ? new CognitoAuthService()
      : new MockAuthService()
  }
  const authService = authServiceRef.current

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初回ロード時のみユーザー同期
  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (mounted) setUser(currentUser)
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadUser()
    return () => {
      mounted = false
    }
  }, [authService])

  const login = async (email: string, password: string) => {
    await authService.login(email, password)
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const updateProfile = async (updates: { displayName?: string; avatarUrl?: string }) => {
    if (!authService.updateProfile) return
    await authService.updateProfile(updates)
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!authService.changePassword) return
    await authService.changePassword(currentPassword, newPassword)
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (authService.signUp) {
      await authService.signUp(email, password, displayName)
      return { needsEmailVerification: true }
    }
    await authService.login(email, password)
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
    return { needsEmailVerification: false }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoggedIn: user !== null,
        isLoading,
        login,
        logout,
        updateProfile,
        changePassword,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
