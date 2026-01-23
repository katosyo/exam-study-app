'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { PageGuard } from '@/components/PageGuard'
import { HistoryFilter } from '@/components/HistoryFilter'
import { HistoryItem } from '@/components/HistoryItem'
import { EmptyState } from '@/components/EmptyState'
import { getHistoryQuestions, ProficiencyLevel } from '@/lib/api/client'
import type { ExamType } from '@/types/question'

export default function HistoryPage() {
  const { isLoggedIn, logout } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // フィルタ状態
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProficiencyLevel, setSelectedProficiencyLevel] = useState<ProficiencyLevel | null>(null)
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)

  // 利用可能なカテゴリ一覧
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (isLoggedIn) {
      loadHistory()
    }
  }, [isLoggedIn, selectedCategory, selectedProficiencyLevel, selectedExamType])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)

    const params: any = {}
    if (selectedCategory) params.category = selectedCategory
    if (selectedProficiencyLevel) params.proficiencyLevel = selectedProficiencyLevel
    if (selectedExamType) params.examType = selectedExamType

    const result = await getHistoryQuestions(params)

    if (result.ok) {
      setItems(result.data.result.items)

      // カテゴリ一覧を抽出（重複除去）
      const uniqueCategories = Array.from(
        new Set(result.data.result.items.map((item) => item.category))
      ).sort()
      setCategories(uniqueCategories)
    } else {
      setError(result.error.message)
    }

    setLoading(false)
  }

  const handleRetry = (questionId: string, examType: ExamType) => {
    // 問題を解くページに遷移（特定の問題を解く機能は将来実装）
    router.push(`/dashboard?questionId=${questionId}&examType=${examType}`)
  }

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
              📚 回答履歴
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

          {error && (
            <div
              style={{
                padding: '1rem',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                marginBottom: '2rem',
                color: '#991b1b',
              }}
            >
              <p>エラー: {error}</p>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p>読み込み中...</p>
            </div>
          ) : (
            <>
              <HistoryFilter
                selectedCategory={selectedCategory}
                selectedProficiencyLevel={selectedProficiencyLevel}
                selectedExamType={selectedExamType}
                categories={categories}
                onCategoryChange={setSelectedCategory}
                onProficiencyLevelChange={setSelectedProficiencyLevel}
                onExamTypeChange={setSelectedExamType}
              />

              {items.length === 0 ? (
                <EmptyState message="まだ回答履歴がありません" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                    全{items.length}件
                  </div>
                  {items.map((item) => (
                    <HistoryItem
                      key={item.questionId}
                      questionId={item.questionId}
                      questionText={item.questionText}
                      examType={item.examType}
                      category={item.category}
                      correctCount={item.correctCount}
                      incorrectCount={item.incorrectCount}
                      proficiencyLevel={item.proficiencyLevel}
                      lastAnsweredAt={item.lastAnsweredAt}
                      onRetry={handleRetry}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </PageGuard>
  )
}
