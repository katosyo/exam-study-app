'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { getStatsSummary, ProficiencyLevel, StatsSummaryResponse } from '@/lib/api/client'
import { PageGuard } from '@/components/PageGuard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorWithRetry } from '@/components/ErrorWithRetry'
import Link from 'next/link'

const DAILY_GOAL_KEY = 'study-site-daily-goal'
const DEFAULT_DAILY_GOAL = 10

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
  const { isLoggedIn, isLoading, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [stats, setStats] = useState<StatsSummaryResponse['result'] | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(DAILY_GOAL_KEY)
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n) && n > 0) setDailyGoal(n)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      loadStats()
    } else if (!isLoading && !isLoggedIn) {
      // 非ログイン時は統計情報を読み込まない
      setLoadingStats(false)
    }
  }, [isLoading, isLoggedIn])

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

  const handleSetDailyGoal = (value: number) => {
    if (value < 1 || value > 999) return
    setDailyGoal(value)
    if (typeof window !== 'undefined') localStorage.setItem(DAILY_GOAL_KEY, String(value))
  }

  if (loadingStats && isLoggedIn) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="読み込み中..." />
      </main>
    )
  }

  return (
    <PageGuard requireAuth={false}>
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 'clamp(1rem, 4vw, 2rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1
            onClick={() => router.push('/home')}
            style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            🎓 IT試験学習アプリ
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'ダークモード' : 'ライトモード'}
              style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {isLoggedIn ? (
              <>
                <button type="button" onClick={() => router.push('/profile')} title="プロフィール編集" style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  👤
                </button>
                <button type="button" onClick={logout} style={{ padding: '0.5rem 1rem', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => router.push('/login')} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  ログイン
                </button>
                <button type="button" onClick={() => router.push('/signup')} style={{ padding: '0.5rem 1rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  新規登録
                </button>
              </>
            )}
          </div>
        </div>

        {error && isLoggedIn && (
          <ErrorWithRetry message={error} onRetry={loadStats} />
        )}

        {/* 学習状況サマリー */}
        {isLoggedIn && stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* 今日の目標 */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px var(--shadow)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>🎯 今日の目標</h2>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', textAlign: 'center' }}>
                  {(stats.todayAnsweredCount ?? 0)} / {dailyGoal} 問
                </div>
                <div style={{ width: '100%', height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginTop: '0.5rem' }}>
                  <div
                    style={{
                      width: `${Math.min(100, ((stats.todayAnsweredCount ?? 0) / dailyGoal) * 100)}%`,
                      height: '100%',
                      background: (stats.todayAnsweredCount ?? 0) >= dailyGoal ? 'var(--success)' : 'var(--accent)',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>目標:</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={dailyGoal}
                  onChange={(e) => handleSetDailyGoal(parseInt(e.target.value, 10) || DEFAULT_DAILY_GOAL)}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v)) handleSetDailyGoal(v)
                  }}
                  style={{ width: '60px', padding: '0.25rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '1rem', background: 'var(--bg-page)', color: 'var(--text-primary)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>問/日</span>
              </div>
            </div>

            {/* 回答済み問題の割合 */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px var(--shadow)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>📊 学習進捗</h2>
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
        ) : !isLoggedIn ? (
          /* 非ログイン時の統計情報プレースホルダー */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.5 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#999' }}>📊 学習進捗</h2>
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#999' }}>
                <p style={{ fontSize: '0.9rem' }}>ログイン後に利用できます</p>
              </div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.5 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#999' }}>🔥 連続学習</h2>
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#999' }}>
                <p style={{ fontSize: '0.9rem' }}>ログイン後に利用できます</p>
              </div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.5 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#999' }}>📈 得意度分布</h2>
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#999' }}>
                <p style={{ fontSize: '0.9rem' }}>ログイン後に利用できます</p>
              </div>
            </div>
          </div>
        ) : null}

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

          {isLoggedIn ? (
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
          ) : (
            <div
              style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: 0.5,
                cursor: 'not-allowed',
                position: 'relative',
              }}
              title="ログイン後に利用できます"
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>📚</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center', color: '#999' }}>回答履歴</h3>
              <p style={{ color: '#999', textAlign: 'center', fontSize: '0.9rem' }}>
                これまで解いた問題の履歴を確認できます
              </p>
              <p style={{ color: '#f59e0b', textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '600' }}>
                ログイン後に利用できます
              </p>
            </div>
          )}

          {isLoggedIn ? (
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
          ) : (
            <div
              style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: 0.5,
                cursor: 'not-allowed',
                position: 'relative',
              }}
              title="ログイン後に利用できます"
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>🎯</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center', color: '#999' }}>苦手克服</h3>
              <p style={{ color: '#999', textAlign: 'center', fontSize: '0.9rem' }}>
                苦手な問題から最適な学習を提供します
              </p>
              <p style={{ color: '#f59e0b', textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '600' }}>
                ログイン後に利用できます
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
    </PageGuard>
  )
}
