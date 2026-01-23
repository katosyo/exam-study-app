/**
 * GetHistoryQuestions Service
 */

import { Result, success, failure } from '../../shared/result'
import { ErrorCode } from '../../shared/errors'
import { QuestionRepository } from '../../repositories/questionRepository'
import { QuestionStatsRepository } from '../../repositories/questionStatsRepository'
import {
  calculateProficiencyLevel,
  ProficiencyLevel,
} from '../../domain/questionStats'

export interface HistoryQuestionItem {
  questionId: string
  questionText: string
  examType: 'FE' | 'AP'
  category: string
  correctCount: number
  incorrectCount: number
  proficiencyLevel: ProficiencyLevel
  lastAnsweredAt: string
}

export interface GetHistoryQuestionsInput {
  userId: string
  category?: string
  proficiencyLevel?: ProficiencyLevel
  examType?: 'FE' | 'AP'
}

export interface GetHistoryQuestionsOutput {
  items: HistoryQuestionItem[]
  total: number
}

export class GetHistoryQuestionsService {
  constructor(
    private questionRepository: QuestionRepository,
    private questionStatsRepository: QuestionStatsRepository
  ) {}

  async execute(
    input: GetHistoryQuestionsInput
  ): Promise<Result<GetHistoryQuestionsOutput>> {
    try {
      // 1. ユーザーの統計を取得
      const statsResult = await this.questionStatsRepository.getByUserId(
        input.userId,
        input.examType
      )
      if (!statsResult.ok) {
        return statsResult as Result<GetHistoryQuestionsOutput>
      }

      let stats = statsResult.value

      // 2. カテゴリでフィルタ
      if (input.category) {
        stats = stats.filter((stat) => stat.category === input.category)
      }

      // 3. 得意度でフィルタ
      if (input.proficiencyLevel) {
        stats = stats.filter((stat) => {
          const level = calculateProficiencyLevel(
            stat.correctCount,
            stat.incorrectCount
          )
          return level === input.proficiencyLevel
        })
      }

      // 4. 各統計に対して問題詳細を取得
      const items: HistoryQuestionItem[] = []
      for (const stat of stats) {
        const questionResult = await this.questionRepository.getById(
          stat.examType,
          stat.questionId
        )

        if (!questionResult.ok) {
          // 問題が見つからない場合はスキップ
          console.warn(`Question not found: ${stat.questionId}`)
          continue
        }

        const question = questionResult.value
        const proficiencyLevel = calculateProficiencyLevel(
          stat.correctCount,
          stat.incorrectCount
        )

        // 問題文を100文字に切り詰め
        const questionText =
          question.text.length > 100
            ? question.text.substring(0, 100) + '...'
            : question.text

        items.push({
          questionId: stat.questionId,
          questionText,
          examType: stat.examType,
          category: stat.category,
          correctCount: stat.correctCount,
          incorrectCount: stat.incorrectCount,
          proficiencyLevel,
          lastAnsweredAt: stat.lastAnsweredAt,
        })
      }

      // 5. 最終回答日時でソート（新しい順）
      items.sort((a, b) => {
        return (
          new Date(b.lastAnsweredAt).getTime() -
          new Date(a.lastAnsweredAt).getTime()
        )
      })

      return success({
        items,
        total: items.length,
      })
    } catch (error) {
      console.error('Failed to get history questions:', error)
      return failure(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get history questions'
      )
    }
  }
}
