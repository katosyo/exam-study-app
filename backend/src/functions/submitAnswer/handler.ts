/**
 * SubmitAnswer Lambda Handler
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { QuestionRepository } from '../../repositories/questionRepository'
import { AnswerHistoryRepository } from '../../repositories/answerHistoryRepository'
import { QuestionStatsRepository } from '../../repositories/questionStatsRepository'
import { SubmitAnswerService } from './service'
import { getHttpStatus } from '../../shared/errors'

const questionsTableName = process.env.QUESTIONS_TABLE_NAME || ''
const answerHistoryTableName = process.env.ANSWER_HISTORY_TABLE_NAME || ''
const questionStatsTableName = process.env.QUESTION_STATS_TABLE_NAME || ''

const questionRepository = new QuestionRepository(questionsTableName)
const answerHistoryRepository = new AnswerHistoryRepository(answerHistoryTableName)
const questionStatsRepository = new QuestionStatsRepository(questionStatsTableName)

const service = new SubmitAnswerService(
  questionRepository,
  answerHistoryRepository,
  questionStatsRepository
)

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Event:', JSON.stringify(event))

  // NOTE: Mock認証 - 将来 Cognito JWT から取得
  const userId = 'mock-user-id'
  console.log('UserId:', userId)

  try {
    // リクエストボディをパース
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Request body is required',
          },
        }),
      }
    }

    const body = JSON.parse(event.body)
    const { questionId, selectedIndex } = body

    // Service を実行
    const result = await service.execute({
      userId,
      questionId,
      selectedIndex,
    })

    if (!result.ok) {
      const status = getHttpStatus(result.error.code)
      return {
        statusCode: status,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: result.error,
        }),
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        result: result.value,
      }),
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      }),
    }
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
