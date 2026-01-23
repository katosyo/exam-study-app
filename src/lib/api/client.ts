/**
 * API Client
 */

import type { ExamType, GetQuestionsResponse, ApiError } from '@/types/question'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export type ProficiencyLevel = 'master' | 'good' | 'neutral' | 'weak' | 'very-weak'

export interface SubmitAnswerRequest {
  examType: ExamType
  questionId: string
  selectedIndex: number
}

export interface SubmitAnswerResponse {
  result: {
    isCorrect: boolean
    correctIndex: number
    explanation: string
    stats: {
      correctCount: number
      incorrectCount: number
      proficiencyLevel: ProficiencyLevel
    }
  }
}

export interface StatsSummaryResponse {
  result: {
    answeredRatio: number
    consecutiveDays: number
    proficiencyDistribution: {
      level: ProficiencyLevel
      count: number
      percentage: number
    }[]
    lastStudiedAt: string | null
    totalQuestions: number
    answeredQuestions: number
  }
}

export interface HistoryQuestionsResponse {
  result: {
    items: {
      questionId: string
      questionText: string
      examType: ExamType
      category: string
      correctCount: number
      incorrectCount: number
      proficiencyLevel: ProficiencyLevel
      lastAnsweredAt: string
    }[]
    total: number
  }
}

export interface GetHistoryQuestionsParams {
  category?: string
  proficiencyLevel?: ProficiencyLevel
  examType?: ExamType
}

export async function fetchQuestions(
  examType: ExamType,
  limit: number
): Promise<ApiResult<GetQuestionsResponse>> {
  try {
    // NOTE: Mock認証では Authorization ヘッダーは不要
    // 将来 Cognito 導入時に Authorization ヘッダーを追加
    const url = `${API_BASE_URL}/questions?exam=${examType}&limit=${limit}`
    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      return {
        ok: false,
        error: error.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to fetch questions',
        },
      }
    }

    const data = await response.json()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        details: error,
      },
    }
  }
}

export async function submitAnswer(
  request: SubmitAnswerRequest
): Promise<ApiResult<SubmitAnswerResponse>> {
  try {
    const url = `${API_BASE_URL}/answers`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        ok: false,
        error: error.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to submit answer',
        },
      }
    }

    const data = await response.json()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        details: error,
      },
    }
  }
}

export async function getStatsSummary(): Promise<ApiResult<StatsSummaryResponse>> {
  try {
    const url = `${API_BASE_URL}/stats/summary`
    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      return {
        ok: false,
        error: error.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to fetch stats summary',
        },
      }
    }

    const data = await response.json()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        details: error,
      },
    }
  }
}

export async function getHistoryQuestions(
  params?: GetHistoryQuestionsParams
): Promise<ApiResult<HistoryQuestionsResponse>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.category) {
      queryParams.append('category', params.category)
    }
    if (params?.proficiencyLevel) {
      queryParams.append('proficiencyLevel', params.proficiencyLevel)
    }
    if (params?.examType) {
      queryParams.append('examType', params.examType)
    }

    const queryString = queryParams.toString()
    const url = `${API_BASE_URL}/history/questions${queryString ? `?${queryString}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      return {
        ok: false,
        error: error.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to fetch history questions',
        },
      }
    }

    const data = await response.json()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        details: error,
      },
    }
  }
}
