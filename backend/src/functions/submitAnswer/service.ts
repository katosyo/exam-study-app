/**
 * SubmitAnswer Service
 */

import { Result, success, failure } from '../../shared/result'
import { ErrorCode } from '../../shared/errors'
import { QuestionRepository } from '../../repositories/questionRepository'
import { AnswerHistoryRepository } from '../../repositories/answerHistoryRepository'
import { QuestionStatsRepository } from '../../repositories/questionStatsRepository'
import { calculateProficiencyLevel, ProficiencyLevel } from '../../domain/questionStats'

export interface SubmitAnswerInput {
  userId: string
  examType: 'FE' | 'AP'
  questionId: string
  selectedIndex: number
}

export interface SubmitAnswerOutput {
  isCorrect: boolean
  correctIndex: number
  explanation: string
  stats: {
    correctCount: number
    incorrectCount: number
    proficiencyLevel: ProficiencyLevel
  }
}

export class SubmitAnswerService {
  constructor(
    private questionRepository: QuestionRepository,
    private answerHistoryRepository: AnswerHistoryRepository,
    private questionStatsRepository: QuestionStatsRepository
  ) {}

  async execute(input: SubmitAnswerInput): Promise<Result<SubmitAnswerOutput>> {
    // 1. バリデーション
    const validationError = this.validate(input)
    if (validationError) {
      return validationError
    }

    // 2. 問題を取得
    const questionResult = await this.questionRepository.getById(input.examType, input.questionId)
    if (!questionResult.ok) {
      return questionResult as Result<SubmitAnswerOutput>
    }

    const question = questionResult.value

    // 3. 正誤判定
    const isCorrect = question.answerIndex === input.selectedIndex

    // 4. 回答履歴を保存
    const saveHistoryResult = await this.answerHistoryRepository.save({
      userId: input.userId,
      questionId: input.questionId,
      examType: question.examType,
      category: question.category,
      isCorrect,
      selectedIndex: input.selectedIndex,
    })

    if (!saveHistoryResult.ok) {
      return saveHistoryResult as Result<SubmitAnswerOutput>
    }

    // 5. 統計を更新
    const statsResult = await this.updateStats(
      input.userId,
      input.questionId,
      question.examType,
      question.category,
      isCorrect
    )

    if (!statsResult.ok) {
      return statsResult as Result<SubmitAnswerOutput>
    }

    const stats = statsResult.value

    // 6. 結果を返却
    return success({
      isCorrect,
      correctIndex: question.answerIndex,
      explanation: question.explanation,
      stats: {
        correctCount: stats.correctCount,
        incorrectCount: stats.incorrectCount,
        proficiencyLevel: calculateProficiencyLevel(
          stats.correctCount,
          stats.incorrectCount
        ),
      },
    })
  }

  private validate(input: SubmitAnswerInput): Result<SubmitAnswerOutput> | null {
    if (!input.questionId) {
      return failure(
        ErrorCode.INVALID_PARAMETER,
        'questionId is required'
      )
    }

    if (input.selectedIndex === undefined || input.selectedIndex < 0 || input.selectedIndex > 3) {
      return failure(
        ErrorCode.INVALID_PARAMETER,
        'selectedIndex must be between 0 and 3'
      )
    }

    return null
  }

  private async updateStats(
    userId: string,
    questionId: string,
    examType: 'FE' | 'AP',
    category: string,
    isCorrect: boolean
  ) {
    // 既存の統計を取得
    const existingStatsResult = await this.questionStatsRepository.get(userId, questionId)
    if (!existingStatsResult.ok) {
      return existingStatsResult
    }

    const existingStats = existingStatsResult.value

    if (existingStats) {
      // 既存統計をインクリメント
      return await this.questionStatsRepository.increment(userId, questionId, isCorrect)
    } else {
      // 新規作成
      return await this.questionStatsRepository.create(
        userId,
        questionId,
        examType,
        category,
        isCorrect
      )
    }
  }
}
