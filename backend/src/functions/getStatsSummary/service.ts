/**
 * GetStatsSummary Service
 */

import { Result, success, failure } from '../../shared/result'
import { ErrorCode } from '../../shared/errors'
import { QuestionRepository } from '../../repositories/questionRepository'
import { QuestionStatsRepository } from '../../repositories/questionStatsRepository'
import { AnswerHistoryRepository } from '../../repositories/answerHistoryRepository'
import { calculateProficiencyLevel, ProficiencyLevel } from '../../domain/questionStats'

export interface StatsSummaryOutput {
  answeredRatio: number // 回答済み問題の割合（0-100）
  consecutiveDays: number // 連続学習日数
  proficiencyDistribution: {
    level: ProficiencyLevel
    count: number
    percentage: number
  }[]
  lastStudiedAt: string | null // 直近学習日時（ISO 8601）
  totalQuestions: number // 全問題数
  answeredQuestions: number // 回答済み問題数
  todayAnsweredCount: number // 今日回答した問題数（重複除く）
}

export class GetStatsSummaryService {
  constructor(
    private questionRepository: QuestionRepository,
    private questionStatsRepository: QuestionStatsRepository,
    private answerHistoryRepository: AnswerHistoryRepository
  ) {}

  async execute(userId: string): Promise<Result<StatsSummaryOutput>> {
    try {
      // 1. 全問題数を取得（FE + AP）
      const feQuestionsResult = await this.questionRepository.getByExamType('FE')
      const apQuestionsResult = await this.questionRepository.getByExamType('AP')

      if (!feQuestionsResult.ok || !apQuestionsResult.ok) {
        return failure(
          ErrorCode.DATABASE_ERROR,
          'Failed to fetch questions'
        )
      }

      const totalQuestions = feQuestionsResult.value.length + apQuestionsResult.value.length

      // 2. ユーザーの統計を取得
      const statsResult = await this.questionStatsRepository.getByUserId(userId)
      if (!statsResult.ok) {
        return statsResult as Result<StatsSummaryOutput>
      }

      const stats = statsResult.value
      const answeredQuestions = stats.length

      // 3. 回答履歴を取得（連続学習日数の計算に必要）
      const historyResult = await this.answerHistoryRepository.getByUserId(userId)
      if (!historyResult.ok) {
        return historyResult as Result<StatsSummaryOutput>
      }

      const history = historyResult.value

      // 4. 回答済み問題の割合を計算
      const answeredRatio = totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0

      // 5. 連続学習日数を計算
      const consecutiveDays = this.calculateConsecutiveDays(history)

      // 6. 得意度分布を計算
      const proficiencyDistribution = this.calculateProficiencyDistribution(stats)

      // 7. 直近学習日時を取得
      const lastStudiedAt = history.length > 0 ? history[0].answeredAt : null

      // 8. 今日回答した問題数（重複除く）
      const todayAnsweredCount = this.countTodayAnswered(history)

      return success({
        answeredRatio,
        consecutiveDays,
        proficiencyDistribution,
        lastStudiedAt,
        totalQuestions,
        answeredQuestions,
        todayAnsweredCount,
      })
    } catch (error) {
      console.error('Failed to get stats summary:', error)
      return failure(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get stats summary'
      )
    }
  }

  /**
   * 今日（UTC）回答した問題のユニーク数を返す
   */
  private countTodayAnswered(
    history: Array<{ answeredAt: string; questionId: string; examType: string }>
  ): number {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const seen = new Set<string>()
    for (const item of history) {
      const dateStr = new Date(item.answeredAt).toISOString().split('T')[0]
      if (dateStr === todayStr) {
        seen.add(`${item.examType}#${item.questionId}`)
      }
    }
    return seen.size
  }

  /**
   * 連続学習日数を計算
   */
  private calculateConsecutiveDays(history: Array<{ answeredAt: string }>): number {
    if (history.length === 0) return 0

    // 日付でグループ化（UTC日付として扱う）
    const dates = new Set<string>()
    for (const item of history) {
      const date = new Date(item.answeredAt)
      const dateStr = date.toISOString().split('T')[0]
      dates.add(dateStr)
    }

    const sortedDates = Array.from(dates).sort().reverse() // 新しい順

    // 今日の日付を取得（UTC）
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // 今日から連続している日数を計算
    let consecutiveDays = 0
    let expectedDate = new Date(todayStr + 'T00:00:00Z')

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr + 'T00:00:00Z')
      const diffDays = Math.floor((expectedDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // 期待する日付と一致
        consecutiveDays++
        // 次の日を期待（1日前）
        expectedDate = new Date(date)
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else if (diffDays > 0) {
        // 期待する日付より過去の日付が来た（連続が途切れた）
        break
      } else {
        // 未来の日付（ありえないが、念のため）
        continue
      }
    }

    return consecutiveDays
  }

  /**
   * 得意度分布を計算
   */
  private calculateProficiencyDistribution(
    stats: Array<{ correctCount: number; incorrectCount: number }>
  ): Array<{ level: ProficiencyLevel; count: number; percentage: number }> {
    const distribution: Record<ProficiencyLevel, number> = {
      master: 0,
      good: 0,
      neutral: 0,
      weak: 0,
      'very-weak': 0,
    }

    for (const stat of stats) {
      const level = calculateProficiencyLevel(stat.correctCount, stat.incorrectCount)
      distribution[level]++
    }

    const total = stats.length
    const levels: ProficiencyLevel[] = ['master', 'good', 'neutral', 'weak', 'very-weak']

    return levels.map((level) => ({
      level,
      count: distribution[level],
      percentage: total > 0 ? Math.round((distribution[level] / total) * 100) : 0,
    }))
  }
}
