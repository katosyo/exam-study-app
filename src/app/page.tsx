'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function RootPage() {
  const router = useRouter()
  const { isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      // ルートURLにアクセスしたら常にdashboardにリダイレクト
      router.push('/dashboard')
    }
  }, [isLoading, router])

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>読み込み中...</p>
    </main>
  )
}
