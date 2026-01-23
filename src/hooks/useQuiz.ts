/**
 * クイズ状態管理 Hook
 */

import { useState } from 'react'
import { fetchQuestions, submitAnswer, SubmitAnswerResponse } from '@/lib/api/client'
import type { ExamType, Question } from '@/types/question'

type Stage = 'select' | 'loading' | 'quiz' | 'submitting' | 'complete'

export function useQuiz() {
  const [stage, setStage] = useState<Stage>('select')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answerResult, setAnswerResult] = useState<SubmitAnswerResponse['result'] | null>(null)
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

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return

    setStage('submitting')

    const currentQuestion = questions[currentIndex]
    const result = await submitAnswer({
      questionId: currentQuestion.id,
      selectedIndex: selectedAnswer,
    })

    if (!result.ok) {
      setError(result.error.message)
      setStage('quiz')
      return
    }

    setAnswerResult(result.data.result)
    setShowResult(true)

    if (result.data.result.isCorrect) {
      setScore((prev) => prev + 1)
    }

    setStage('quiz')
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setAnswerResult(null)
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
    setAnswerResult(null)
    setScore(0)
    setError(null)
  }

  return {
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
  }
}
