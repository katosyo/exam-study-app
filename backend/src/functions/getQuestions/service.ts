/**
 * GetQuestions Service
 * 
 * ビジネスロジック層
 */

import { Question, ExamType } from '../../domain/question'
import { Result, success, failure } from '../../shared/result'
import { ErrorCode } from '../../shared/errors'
import { QuestionRepository } from '../../repositories/questionRepository'

export interface GetQuestionsInput {
  exam: string
  limit: number
}

export interface GetQuestionsOutput {
  questions: Question[]
}

export class GetQuestionsService {
  constructor(private repository: QuestionRepository) {}

  async execute(input: GetQuestionsInput): Promise<Result<GetQuestionsOutput>> {
    // バリデーション
    const validationError = this.validate(input)
    if (validationError) {
      return validationError
    }

    const examType = input.exam as ExamType

    // 問題取得
    const result = await this.repository.getByExamType(examType)
    if (!result.ok) {
      return result
    }

    const allQuestions = result.value

    // ランダムサンプリング
    const sampled = this.randomSample(allQuestions, input.limit)

    return success({ questions: sampled })
  }

  private validate(input: GetQuestionsInput): Result<GetQuestionsOutput> | null {
    if (!input.exam || (input.exam !== 'FE' && input.exam !== 'AP')) {
      return failure(
        ErrorCode.INVALID_PARAMETER,
        'exam must be FE or AP'
      )
    }

    if (!input.limit || input.limit < 1 || input.limit > 50) {
      return failure(
        ErrorCode.INVALID_PARAMETER,
        'limit must be between 1 and 50'
      )
    }

    return null
  }

  private randomSample<T>(array: T[], count: number): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }
}
