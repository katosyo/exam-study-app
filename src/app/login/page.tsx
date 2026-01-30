'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const m = searchParams.get('message')
    if (m === 'confirm_email') {
      setMessage('確認メールを送りました。メール内のリンクで確認後、ログインしてください。')
      setErrorMessage(null)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      await login(email, password)
      // login() が成功したら即ホームへ遷移
      router.push('/home')
    } catch (error) {
      console.error('Login failed:', error)
      
      // Cognito のエラーオブジェクトからメッセージを抽出
      let errorMsg = 'メールアドレスまたはパスワードが正しくありません。'
      
      if (error instanceof Error) {
        errorMsg = error.message
      } else if (error && typeof error === 'object') {
        // Cognito のエラーオブジェクト（code と message を持つ）
        const cognitoError = error as { code?: string; message?: string; name?: string }
        if (cognitoError.message) {
          errorMsg = cognitoError.message
        } else if (cognitoError.code) {
          // エラーコードに応じたメッセージ
          switch (cognitoError.code) {
            case 'UserNotFoundException':
              errorMsg = 'このメールアドレスは登録されていません。'
              break
            case 'NotAuthorizedException':
              errorMsg = 'メールアドレスまたはパスワードが正しくありません。'
              break
            case 'UserNotConfirmedException':
              errorMsg = 'メールアドレスの確認が完了していません。確認メールをご確認ください。'
              break
            default:
              errorMsg = cognitoError.message || 'ログインに失敗しました。'
          }
        }
      }
      
      setErrorMessage(errorMsg)
      setIsLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          🎓 ログイン
        </h1>

        {message && (
          <div
            style={{
              padding: '0.75rem',
              background: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '4px',
              color: '#065f46',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {message}
          </div>
        )}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem',
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              color: '#991b1b',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <div style={{ marginBottom: '1.5rem' }}>
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
              placeholder="********"
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
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
              アカウントをお持ちでない方
            </p>
            <button
              type="button"
              onClick={() => router.push('/signup')}
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
              新規登録はこちら
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>読み込み中...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
