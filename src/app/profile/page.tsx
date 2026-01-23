'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/home')
    }

    if (user) {
      setDisplayName(user.displayName)
      setEmail(user.email)
    }
  }, [isLoading, isAuthenticated, user, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // NOTE: Mock認証では保存機能は実装しない
    alert('プロフィールが更新されました（Mock）')
  }

  if (isLoading || !isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>読み込み中...</p>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#333' }}>プロフィール編集</h1>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '0.5rem 1rem',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            戻る
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="displayName"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#555',
                fontSize: '0.9rem',
                fontWeight: 'bold',
              }}
            >
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#555',
                fontSize: '0.9rem',
                fontWeight: 'bold',
              }}
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                background: '#f5f5f5',
                color: '#999',
                cursor: 'not-allowed',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
              メールアドレスは変更できません
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
              アカウント情報
            </h3>
            <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#888' }}>
              ユーザーID: {user?.userId}
            </p>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            保存する
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#999', fontSize: '0.85rem' }}>
          NOTE: Mock認証のため、変更は保存されません
        </p>
      </div>
    </main>
  )
}
