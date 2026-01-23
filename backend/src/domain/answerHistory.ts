/**
 * AnswerHistory Domain Model
 */

export interface AnswerHistory {
  PK: string // USER#{userId}
  SK: string // ANSWER#{timestamp}
  GSI1PK: string // QUESTION#{questionId}
  GSI1SK: string // USER#{userId}
  userId: string
  questionId: string
  examType: 'FE' | 'AP'
  category: string
  isCorrect: boolean
  selectedIndex: number
  answeredAt: string // ISO 8601
}

export interface CreateAnswerHistoryInput {
  userId: string
  questionId: string
  examType: 'FE' | 'AP'
  category: string
  isCorrect: boolean
  selectedIndex: number
}
