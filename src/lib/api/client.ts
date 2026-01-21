/**
 * API Client
 */

import type { ExamType, GetQuestionsResponse, ApiError } from '@/types/question'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export async function fetchQuestions(
  examType: ExamType,
  limit: number
): Promise<ApiResult<GetQuestionsResponse>> {
  try {
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
