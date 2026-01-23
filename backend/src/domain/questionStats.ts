/**
 * QuestionStats Domain Model
 */

export interface QuestionStats {
  PK: string // USER#{userId}
  SK: string // QUESTION#{questionId}
  GSI1PK: string // USER#{userId}#EXAM#{examType}
  GSI1SK: string // CATEGORY#{category}
  userId: string
  questionId: string
  examType: 'FE' | 'AP'
  category: string
  correctCount: number
  incorrectCount: number
  lastAnsweredAt: string // ISO 8601
  createdAt: string
  updatedAt: string
}

export type ProficiencyLevel = 'master' | 'good' | 'neutral' | 'weak' | 'very-weak'

export const ProficiencyLevelLabel: Record<ProficiencyLevel, string> = {
  master: '超得意',
  good: '得意',
  neutral: '普通',
  weak: '苦手',
  'very-weak': '超苦手',
}

/**
 * 得意度を算出
 */
export function calculateProficiencyLevel(
  correctCount: number,
  incorrectCount: number
): ProficiencyLevel {
  if (correctCount > incorrectCount + 2) {
    return 'master' // 超得意
  } else if (correctCount > incorrectCount) {
    return 'good' // 得意
  } else if (incorrectCount > correctCount + 3) {
    return 'very-weak' // 超苦手
  } else if (incorrectCount > correctCount) {
    return 'weak' // 苦手
  } else {
    return 'neutral' // 中立（初回未回答など）
  }
}

export interface QuestionStatsWithLevel extends QuestionStats {
  proficiencyLevel: ProficiencyLevel
}
