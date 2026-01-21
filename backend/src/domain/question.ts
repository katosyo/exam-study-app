/**
 * Question ドメインモデル
 */

/**
 * 試験種別
 */
export type ExamType = 'FE' | 'AP'

/**
 * 問題データ
 */
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

/**
 * DynamoDB アイテム型
 */
export interface QuestionDynamoDBItem {
  PK: string  // EXAM#{examType}
  SK: string  // QUESTION#{year}#{questionNumber}
  examType: ExamType
  year: string
  questionNumber: string
  text: string
  choices: string[]
  answerIndex: number
  explanation: string
  category?: string
}

/**
 * DynamoDB → ドメインモデル変換
 */
export function fromDynamoDB(item: QuestionDynamoDBItem): Question | null {
  if (item.choices.length !== 4) return null
  if (item.answerIndex < 0 || item.answerIndex > 3) return null

  return {
    id: item.SK,
    examType: item.examType,
    year: item.year,
    questionNumber: item.questionNumber,
    text: item.text,
    choices: item.choices as [string, string, string, string],
    answerIndex: item.answerIndex as 0 | 1 | 2 | 3,
    explanation: item.explanation,
    category: item.category,
  }
}

/**
 * ドメインモデル → DynamoDB 変換
 */
export function toDynamoDB(question: Question): QuestionDynamoDBItem {
  return {
    PK: `EXAM#${question.examType}`,
    SK: question.id,
    examType: question.examType,
    year: question.year,
    questionNumber: question.questionNumber,
    text: question.text,
    choices: question.choices,
    answerIndex: question.answerIndex,
    explanation: question.explanation,
    category: question.category,
  }
}
