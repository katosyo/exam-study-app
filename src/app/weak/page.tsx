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
import type { HistoryQuestionsResponse } from '@/lib/api/client'
import { useBookmarks } from '@/hooks/useBookmarks'

type WeakItem = HistoryQuestionsResponse['result']['items'][number]

export default function WeakPage() {
  const { isLoggedIn, logout } = useAuth()
  const { isBookmarked, toggleBookmark, getNote, setNote } = useBookmarks()
  const router = useRouter()
  const [items, setItems] = useState<WeakItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (isLoggedIn) {
      loadWeakQuestions()
    }
  }, [isLoggedIn, selectedCategory, selectedExamType])

  const loadWeakQuestions = async () => {
    setLoading(true)
    setError(null)

    const [weakResult, veryWeakResult] = await Promise.all([
      getHistoryQuestions({
        proficiencyLevel: 'weak',
        category: selectedCategory ?? undefined,
        examType: selectedExamType ?? undefined,
      }),
      getHistoryQuestions({
        proficiencyLevel: 'very-weak',
        category: selectedCategory ?? undefined,
        examType: selectedExamType ?? undefined,
      }),
    ])

    if (!weakResult.ok) {
      setError(weakResult.error.message)
      setLoading(false)
      return
    }
    if (!veryWeakResult.ok) {
      setError(veryWeakResult.error.message)
      setLoading(false)
      return
    }

    const merged = [
      ...weakResult.data.result.items,
      ...veryWeakResult.data.result.items,
    ]
    merged.sort((a, b) => new Date(b.lastAnsweredAt).getTime() - new Date(a.lastAnsweredAt).getTime())
    setItems(merged)

    const uniqueCategories = Array.from(new Set(merged.map((item) => item.category))).sort()
    setCategories(uniqueCategories)
    setLoading(false)
  }

  const handleRetry = (questionId: string, examType: ExamType) => {
    router.push(`/dashboard?questionId=${questionId}&examType=${examType}`)
  }

  return (
    <PageGuard requireAuth={true}>
      <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => router.push('/home')}
              title="ホーム"
              style={{ padding: '0.5rem 1rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              🏠 ホーム
            </button>
            <h1
              onClick={() => router.push('/home')}
              style={{ textAlign: 'center', flex: 1, color: '#333', margin: 0, cursor: 'pointer', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push('/home')}
            >
              🎯 苦手克服
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                title="プロフィール編集"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                👤
              </button>
              <button type="button" onClick={() => logout()} style={{ padding: '0.5rem 1rem', background: '#666', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', cursor: 'pointer' }}>
                ログアウト
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '2rem', color: '#991b1b' }}>
              <p>エラー: {error}</p>
            </div>
          )}

          <HistoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            selectedProficiencyLevel={null}
            selectedExamType={selectedExamType}
            onCategoryChange={setSelectedCategory}
            onProficiencyLevelChange={() => {}}
            onExamTypeChange={setSelectedExamType}
            showProficiencyFilter={false}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>読み込み中...</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              message="苦手な問題はまだありません"
              subMessage="問題を解くと、苦手・超苦手と判定された問題がここに表示されます"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item) => (
                <HistoryItem
                  key={`${item.examType}-${item.questionId}`}
                  questionId={item.questionId}
                  questionText={item.questionText}
                  examType={item.examType}
                  category={item.category}
                  correctCount={item.correctCount}
                  incorrectCount={item.incorrectCount}
                  proficiencyLevel={item.proficiencyLevel}
                  lastAnsweredAt={item.lastAnsweredAt}
                  onRetry={handleRetry}
                  isBookmarked={isBookmarked(item.questionId, item.examType)}
                  onToggleBookmark={toggleBookmark}
                  note={getNote(item.examType, item.questionId)}
                  onNoteChange={(text) => setNote(item.examType, item.questionId, text)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </PageGuard>
  )
}
