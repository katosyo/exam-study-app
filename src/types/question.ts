/**
 * フロントエンド型定義
 */

export type ExamType = 'FE' | 'AP'

export interface Question {
  id: string
  examType: ExamType
  year: string
  questionNumber: string
  text: string
  choices: [string, string, string, string]
  answerIndex: 0 | 1 | 2 | 3
  explanation: string
  category?: string
}

export interface GetQuestionsResponse {
  questions: Question[]
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}
