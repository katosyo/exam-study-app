'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp(email, password, displayName || undefined)
      if (result.needsEmailVerification) {
        setError('')
        router.push('/login?message=confirm_email')
        return
      }
      router.push('/home')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登録に失敗しました'
      if (typeof msg === 'string' && msg.includes('UsernameExistsException')) {
        setError('このメールアドレスは既に登録されています')
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '2rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
          🎓 新規登録
        </h1>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="displayName"
              style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontSize: '0.9rem' }}
            >
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="山田太郎"
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

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontSize: '0.9rem' }}
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
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

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="password"
              style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontSize: '0.9rem' }}
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
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
              htmlFor="confirmPassword"
              style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontSize: '0.9rem' }}
            >
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワードを再入力"
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

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isLoading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            {isLoading ? '登録中...' : '登録する'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
              すでにアカウントをお持ちですか？
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#0070f3',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ログインはこちら
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#999', fontSize: '0.9rem' }}>
          Cognito 利用時は確認メール送信後にログインできます
        </p>
      </div>
    </main>
  )
}
