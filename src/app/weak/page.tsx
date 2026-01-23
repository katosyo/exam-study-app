'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { PageGuard } from '@/components/PageGuard'

export default function WeakPage() {
  const { isLoggedIn, logout } = useAuth()
  const router = useRouter()

  return (
    <PageGuard requireAuth={true}>
      <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button
              onClick={() => router.push('/home')}
              title="ホーム"
              style={{
                padding: '0.5rem 1rem',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              🏠 ホーム
            </button>
            <h1 
              onClick={() => router.push('/home')}
              style={{ textAlign: 'center', flex: 1, color: '#333', margin: 0, cursor: 'pointer' }}
            >
              🎯 苦手克服
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => router.push('/profile')}
                title="プロフィール編集"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                👤
              </button>
              <button
                onClick={logout}
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
                ログアウト
              </button>
            </div>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ textAlign: 'center', color: '#666' }}>
              苦手克服機能は今後実装予定です
            </p>
          </div>
        </div>
      </main>
    </PageGuard>
  )
}
