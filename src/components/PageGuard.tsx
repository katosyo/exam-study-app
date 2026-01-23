'use client'

/**
 * ページガードコンポーネント
 * 
 * ログイン必須のページで使用する
 * 非ログインユーザーはログインページにリダイレクト
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface PageGuardProps {
  children: React.ReactNode
  requireAuth?: boolean // デフォルト: true
}

export function PageGuard({ children, requireAuth = true }: PageGuardProps) {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && requireAuth && !isLoggedIn) {
      router.push('/login')
    }
  }, [isLoading, isLoggedIn, requireAuth, router])

  // ローディング中または認証不要の場合は表示
  if (isLoading || !requireAuth) {
    return <>{children}</>
  }

  // ログイン必須で未ログインの場合は何も表示しない（リダイレクト中）
  if (!isLoggedIn) {
    return null
  }

  return <>{children}</>
}
