'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ExamSelector } from '@/components/ExamSelector'
import { QuestionCard } from '@/components/QuestionCard'
import { useQuiz } from '@/hooks/useQuiz'
import { useBookmarks } from '@/hooks/useBookmarks'

declare global {
  interface Window {
    difyChatbotConfig?: {
      token: string
      inputs?: Record<string, string>
      systemVariables?: Record<string, string>
      userVariables?: Record<string, string>
      containerProps?: {
        style?: Record<string, string | number>
        className?: string
      }
    }
  }
}

const DIFY_CHATBOT_TOKEN = 'Z11LFp7Y14y4oHok'
const DIFY_EMBED_URL = 'https://udify.app/embed.min.js'

export default function DashboardPage() {
  const { isLoggedIn, isLoading, logout } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()
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
  } = useQuiz({ persistResults: isLoggedIn })

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Dify チャットボットの埋め込み（初回のみスクリプト読み込み）
  useEffect(() => {
    if (typeof window === 'undefined') return
    const styleId = 'study-site-dify-embed-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        #dify-chatbot-bubble-button {
          --dify-chatbot-bubble-button-bg-color: #1C64F2 !important;
        }
        #dify-chatbot-bubble-window {
          width: 24rem !important;
          height: 40rem !important;
        }
      `
      document.head.appendChild(style)
    }
    window.difyChatbotConfig = {
      token: DIFY_CHATBOT_TOKEN,
      inputs: {},
      systemVariables: {},
      userVariables: {},
      containerProps: {
        style: {
          backgroundColor: '#1C64F2',
          width: '50px',
          height: '50px',
          borderRadius: '25px',
        },
      },
    }
    if (document.getElementById(DIFY_CHATBOT_TOKEN)) return
    const script = document.createElement('script')
    script.src = DIFY_EMBED_URL
    script.id = DIFY_CHATBOT_TOKEN
    script.defer = true
    document.body.appendChild(script)
    return () => {
      const el = document.getElementById(DIFY_CHATBOT_TOKEN)
      if (el) el.remove()
      const styleEl = document.getElementById(styleId)
      if (styleEl) styleEl.remove()
    }
  }, [])

  // 現在表示中の問題をチャットボットの inputs に渡す（Dify の Start ノードで current_question 変数を使う場合）
  useEffect(() => {
    if (typeof window === 'undefined' || !window.difyChatbotConfig) return
    const currentQuestion = stage === 'quiz' && questions[currentIndex] ? questions[currentIndex] : null
    const questionText = currentQuestion ? (currentQuestion.text.length > 500 ? currentQuestion.text.slice(0, 500) + '...' : currentQuestion.text) : ''
    window.difyChatbotConfig.inputs = questionText ? { current_question: questionText } : {}
  }, [stage, questions, currentIndex])

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
            isBookmarked={isBookmarked(questions[currentIndex].id, questions[currentIndex].examType)}
            onToggleBookmark={toggleBookmark}
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
