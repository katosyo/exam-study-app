'use client'

import { useState } from 'react'
import { ExamSelector } from '@/components/ExamSelector'
import { QuestionCard } from '@/components/QuestionCard'
import { fetchQuestions } from '@/lib/api/client'
import type { ExamType, Question } from '@/types/question'

export default function Home() {
  const [stage, setStage] = useState<'select' | 'loading' | 'quiz' | 'complete'>('select')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async (examType: ExamType, limit: number) => {
    setStage('loading')
    setError(null)

    const result = await fetchQuestions(examType, limit)

    if (!result.ok) {
      setError(result.error.message)
      setStage('select')
      return
    }

    setQuestions(result.data.questions)
    setStage('quiz')
    setCurrentIndex(0)
    setScore(0)
  }

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    setShowResult(true)
    if (selectedAnswer === questions[currentIndex].answerIndex) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setStage('complete')
    }
  }

  const handleRestart = () => {
    setStage('select')
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setError(null)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
        🎓 IT試験学習アプリ
      </h1>

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
