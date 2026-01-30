'use client'

/**
 * 認証コンテキスト
 * 環境変数 NEXT_PUBLIC_COGNITO_USER_POOL_ID / NEXT_PUBLIC_COGNITO_CLIENT_ID が設定されていれば Cognito を使用。
 * 未設定時は開発用フォールバック（ローカルでログイン可能、セッションはメモリのみ）。
 */

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
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
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ユーザー状態の同期（初回ロード + 定期的なチェック）
  useEffect(() => {
    const syncUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to sync user:', error)
        setUser(null)
      }
    }

    // 初回ロード
    syncUser().finally(() => setIsLoading(false))

    // 定期的な同期（5秒ごと）
    syncIntervalRef.current = setInterval(syncUser, 5000)

    // ウィンドウフォーカス時に同期
    const handleFocus = () => {
      syncUser()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // login: 認証成功/失敗のみを責務とする
  const login = async (email: string, password: string) => {
    await authService.login(email, password)
    // 認証成功後、次の同期サイクルでuserが更新される
    // 明示的なuser取得は行わない
  }

  // logout: 認証解除とuserクリア
  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const updateProfile = async (updates: { displayName?: string; avatarUrl?: string }) => {
    if (!authService.updateProfile) return
    await authService.updateProfile(updates)
    // プロフィール更新後、次の同期サイクルでuserが更新される
    // 明示的なuser取得は行わない
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
    // Mock認証時は即ログイン
    await authService.login(email, password)
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
