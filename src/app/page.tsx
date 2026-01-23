'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getStatsSummary, ProficiencyLevel } from '@/lib/api/client'
import Link from 'next/link'

const proficiencyLevelLabels: Record<ProficiencyLevel, string> = {
  master: '超得意',
  good: '得意',
  neutral: '普通',
  weak: '苦手',
  'very-weak': '超苦手',
}

const proficiencyLevelColors: Record<ProficiencyLevel, string> = {
  master: '#10b981', // 緑
  good: '#3b82f6', // 青
  neutral: '#6b7280', // グレー
  weak: '#f59e0b', // オレンジ
  'very-weak': '#ef4444', // 赤
}

export default function HomePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      loadStats()
    }
  }, [isLoading, isAuthenticated, router])

  const loadStats = async () => {
    setLoadingStats(true)
    setError(null)
    const result = await getStatsSummary()
    if (result.ok) {
      setStats(result.data.result)
    } else {
      setError(result.error.message)
    }
    setLoadingStats(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未学習'
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading || loadingStats) {
    return (
      <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>読み込み中...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>🎓 IT試験学習アプリ</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => router.push('/profile')} title="プロフィール編集" style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              👤
            </button>
            <button onClick={logout} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              ログアウト
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '2rem', color: '#991b1b' }}>
            <p>エラー: {error}</p>
          </div>
        )}

        {/* 学習状況サマリー */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* 回答済み問題の割合 */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>📊 学習進捗</h2>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#666' }}>回答済み問題</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.answeredRatio}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${stats.answeredRatio}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  {stats.answeredQuestions} / {stats.totalQuestions} 問
                </p>
              </div>
            </div>

            {/* 連続学習日数 */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>🔥 連続学習</h2>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                  {stats.consecutiveDays}
                </div>
                <p style={{ color: '#666' }}>日連続</p>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                最終学習: {formatDate(stats.lastStudiedAt)}
              </p>
            </div>

            {/* 得意度分布 */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>📈 得意度分布</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.proficiencyDistribution.map((item) => (
                  <div key={item.level}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: proficiencyLevelColors[item.level], fontWeight: '600' }}>
                        {proficiencyLevelLabels[item.level]}
                      </span>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        {item.count}問 ({item.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.percentage}%`,
                          height: '100%',
                          background: proficiencyLevelColors[item.level],
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 機能へのリンク */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <Link
            href="/dashboard"
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>📝</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>問題を解く</h3>
            <p style={{ color: '#666', textAlign: 'center', fontSize: '0.9rem' }}>
              IT試験の問題にチャレンジして学習を進めましょう
            </p>
          </Link>

          <Link
            href="/history"
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>📚</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>回答履歴</h3>
            <p style={{ color: '#666', textAlign: 'center', fontSize: '0.9rem' }}>
              これまで解いた問題の履歴を確認できます
            </p>
          </Link>

          <Link
            href="/weak"
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>🎯</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>苦手克服</h3>
            <p style={{ color: '#666', textAlign: 'center', fontSize: '0.9rem' }}>
              苦手な問題から最適な学習を提供します
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
