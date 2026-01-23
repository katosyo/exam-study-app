'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ExamSelector } from '@/components/ExamSelector'
import { QuestionCard } from '@/components/QuestionCard'
import { useQuiz } from '@/hooks/useQuiz'

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading, logout } = useAuth()
  const router = useRouter()

  const {
    stage,
    questions,
    currentIndex,
    selectedAnswer,
    showResult,
    answerResult,
    score,
    error,
    handleStart,
    handleSelectAnswer,
    handleSubmitAnswer,
    handleNext,
    handleRestart,
  } = useQuiz()

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

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        {isLoggedIn ? (
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
        ) : (
          <button
            onClick={() => router.push('/login')}
            title="ログイン"
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
            🔐 ログイン
          </button>
        )}
        <h1 
          onClick={() => router.push('/home')}
          style={{ textAlign: 'center', flex: 1, color: '#333', margin: 0, cursor: 'pointer' }}
        >
          🎓 IT試験学習アプリ
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isLoggedIn ? (
            <>
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
            </>
          ) : (
            <button
              onClick={() => router.push('/signup')}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              新規登録
            </button>
          )}
        </div>
      </div>

      {/* 非ログイン時の注意文 */}
      {!isLoggedIn && (
        <div
          style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'center',
            color: '#856404',
          }}
        >
          <p style={{ margin: 0, fontWeight: '600' }}>
            ※ ログアウト状態では回答履歴は保存されません
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            ログインすると、学習状況の確認や苦手問題の分析が利用できます
          </p>
        </div>
      )}

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

      {(stage === 'quiz' || stage === 'submitting') && questions.length > 0 && (
        <>
          <QuestionCard
            question={questions[currentIndex]}
            currentIndex={currentIndex}
            totalCount={questions.length}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            onSubmitAnswer={handleSubmitAnswer}
            showResult={showResult}
            answerResult={answerResult}
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
