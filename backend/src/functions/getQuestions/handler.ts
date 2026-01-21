/**
 * GetQuestions Lambda Handler
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { QuestionRepository } from '../../repositories/questionRepository'
import { GetQuestionsService } from './service'
import { getHttpStatus } from '../../shared/errors'

const tableName = process.env.QUESTIONS_TABLE_NAME || ''
const repository = new QuestionRepository(tableName)
const service = new GetQuestionsService(repository)

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Event:', JSON.stringify(event))

  try {
    const exam = event.queryStringParameters?.exam || ''
    const limitStr = event.queryStringParameters?.limit || '10'
    const limit = parseInt(limitStr, 10)

    const result = await service.execute({ exam, limit })

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
      body: JSON.stringify(result.value),
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
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
