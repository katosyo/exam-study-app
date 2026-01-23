'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ExamSelector } from '@/components/ExamSelector'
import { QuestionCard } from '@/components/QuestionCard'
import { useQuiz } from '@/hooks/useQuiz'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  const {
    stage,
    questions,
    currentIndex,
    selectedAnswer,
    showResult,
    score,
    error,
    handleStart,
    handleSelectAnswer,
    handleSubmitAnswer,
    handleNext,
    handleRestart,
  } = useQuiz()

  // 認証チェック
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (isLoading) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ textAlign: 'center', flex: 1, color: '#333', margin: 0 }}>
          🎓 IT試験学習アプリ
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            {user?.displayName} ({user?.email})
          </span>
          <button
            onClick={handleLogout}
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

      {stage === 'select' && (
        <>
          <ExamSelector onStart={handleStart} />
          {error && (
            <div style={{ textAlign: 'center', color: 'red', marginTop: '1rem' }}>
              エラー: {error}
            </div>
          )}
        </>
      )}

      {stage === 'loading' && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>問題を読み込み中...</p>
        </div>
      )}

      {stage === 'quiz' && questions.length > 0 && (
        <>
          <QuestionCard
            question={questions[currentIndex]}
            currentIndex={currentIndex}
            totalCount={questions.length}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            onSubmitAnswer={handleSubmitAnswer}
            showResult={showResult}
          />
          {showResult && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                onClick={handleNext}
                style={{
                  padding: '1rem 2rem',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                {currentIndex + 1 < questions.length ? '次の問題へ' : '結果を見る'}
              </button>
            </div>
          )}
        </>
      )}

      {stage === 'complete' && (
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto',
            padding: '2rem',
            background: 'white',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h2>お疲れ様でした！</h2>
          <p style={{ fontSize: '2rem', margin: '2rem 0' }}>
            {score} / {questions.length} 問正解
          </p>
          <p style={{ fontSize: '1.5rem', color: '#0070f3', marginBottom: '2rem' }}>
            正答率: {Math.round((score / questions.length) * 100)}%
          </p>
          <button
            onClick={handleRestart}
            style={{
              padding: '1rem 2rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            もう一度挑戦する
          </button>
        </div>
      )}
    </main>
  )
}
