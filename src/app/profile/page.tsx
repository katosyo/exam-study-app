'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box' as const,
}
const labelStyle = {
  display: 'block' as const,
  marginBottom: '0.5rem',
  color: '#555',
  fontSize: '0.9rem',
  fontWeight: 'bold' as const,
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, updateProfile, changePassword } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email, setEmail] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/home')
    }

    if (user) {
      setDisplayName(user.displayName)
      setEmail(user.email)
      setAvatarUrl(user.avatarUrl ?? '')
    }
  }, [isLoading, isAuthenticated, user, router])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSaved(false)
    try {
      await updateProfile({ displayName, avatarUrl: avatarUrl || undefined })
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードと確認が一致しません')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('新しいパスワードは6文字以上にしてください')
      return
    }
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'パスワードの変更に失敗しました')
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>読み込み中...</p>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '1rem 2rem' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0, color: '#333' }}>プロフィール編集</h1>
          <button
            type="button"
            onClick={() => router.push('/home')}
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

        <form onSubmit={handleProfileSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="displayName" style={labelStyle}>
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="avatarUrl" style={labelStyle}>
              アバターURL（任意）
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={labelStyle}>
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              style={{
                ...inputStyle,
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

          {profileError && (
            <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{profileError}</p>
          )}
          {profileSaved && (
            <p style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.9rem' }}>プロフィールを保存しました</p>
          )}

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
            プロフィールを保存する
          </button>
        </form>

        <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #eee' }} />

        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>パスワード変更</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="currentPassword" style={labelStyle}>
              現在のパスワード
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="newPassword" style={labelStyle}>
              新しいパスワード
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="confirmPassword" style={labelStyle}>
              新しいパスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>
          {passwordError && (
            <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{passwordError}</p>
          )}
          {passwordSaved && (
            <p style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.9rem' }}>パスワードを変更しました</p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            パスワードを変更する
          </button>
        </form>
      </div>
    </main>
  )
}
