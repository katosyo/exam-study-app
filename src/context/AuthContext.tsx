'use client'

/**
 * 認証コンテキスト
 * 
 * NOTE: 将来 Cognito に差し替える際は、authService の初期化部分のみ変更
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IAuthService, AuthUser } from '@/lib/auth/types'
import { MockAuthService } from '@/lib/auth/mockAuthService'

// NOTE: 将来の差し替え箇所
// import { CognitoAuthService } from '@/lib/auth/cognitoAuthService'
const authService: IAuthService = new MockAuthService()

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
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
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const isAuthenticated = authService.isAuthenticated()

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
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
