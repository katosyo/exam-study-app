/**
 * GetStatsSummary Lambda Handler
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { QuestionRepository } from '../../repositories/questionRepository'
import { QuestionStatsRepository } from '../../repositories/questionStatsRepository'
import { AnswerHistoryRepository } from '../../repositories/answerHistoryRepository'
import { GetStatsSummaryService } from './service'
import { getHttpStatus } from '../../shared/errors'
import { getUserIdFromEvent } from '../../shared/auth'

const questionsTableName = process.env.QUESTIONS_TABLE_NAME || ''
const questionStatsTableName = process.env.QUESTION_STATS_TABLE_NAME || ''
const answerHistoryTableName = process.env.ANSWER_HISTORY_TABLE_NAME || ''

const questionRepository = new QuestionRepository(questionsTableName)
const questionStatsRepository = new QuestionStatsRepository(questionStatsTableName)
const answerHistoryRepository = new AnswerHistoryRepository(answerHistoryTableName)

const service = new GetStatsSummaryService(
  questionRepository,
  questionStatsRepository,
  answerHistoryRepository
)

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Event:', JSON.stringify(event))

  const userId = getUserIdFromEvent(event)
  console.log('UserId:', userId)

  try {
    const result = await service.execute(userId)

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
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
