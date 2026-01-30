'use client'

/**
 * 認証コンテキスト
 * 環境変数 NEXT_PUBLIC_COGNITO_USER_POOL_ID / NEXT_PUBLIC_COGNITO_CLIENT_ID が設定されていれば Cognito を使用。
 * 未設定時は開発用フォールバック（ローカルでログイン可能、セッションはメモリのみ）。
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IAuthService, AuthUser } from '@/lib/auth/types'
import { MockAuthService } from '@/lib/auth/mockAuthService'
import { CognitoAuthService } from '@/lib/auth/cognitoAuthService'

const useCognito =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
  !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

const authService: IAuthService = useCognito ? new CognitoAuthService() : new MockAuthService()

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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初回ロード時にユーザー情報を取得
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    await authService.login(email, password)
    
    // ログイン成功後、ユーザー情報を取得
    // Cognito のセッションが localStorage に保存されるまで待つ（最大2秒）
    let attempts = 0
    let currentUser: AuthUser | null = null
    
    while (attempts < 20 && !currentUser) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      currentUser = await authService.getCurrentUser()
      attempts++
    }
    
    if (!currentUser) {
      throw new Error('ログインに成功しましたが、ユーザー情報の取得に失敗しました。')
    }
    
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

  const isAuthenticated = user !== null
  const isLoggedIn = isAuthenticated

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoggedIn,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
