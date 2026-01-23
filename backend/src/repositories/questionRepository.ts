/**
 * Question Repository
 * 
 * DynamoDB アクセス層
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Question, QuestionDynamoDBItem, ExamType, fromDynamoDB } from '../domain/question'
import { Result, success, failure } from '../shared/result'
import { ErrorCode } from '../shared/errors'

export class QuestionRepository {
  private client: DynamoDBDocumentClient
  private tableName: string

  constructor(tableName: string) {
    const dynamoClient = new DynamoDBClient({})
    this.client = DynamoDBDocumentClient.from(dynamoClient)
    this.tableName = tableName
  }

  async getById(examType: ExamType, questionId: string): Promise<Result<Question>> {
    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            PK: `EXAM#${examType}`,
            SK: questionId,
          },
        })
      )

      if (!result.Item) {
        return failure(
          ErrorCode.NOT_FOUND,
          `Question not found: ${questionId}`
        )
      }

      const question = fromDynamoDB(result.Item as QuestionDynamoDBItem)
      if (!question) {
        return failure(
          ErrorCode.INVALID_DATA,
          'Invalid question data'
        )
      }

      return success(question)
    } catch (error) {
      console.error('DynamoDB error:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch question',
        error
      )
    }
  }

  async getByExamType(examType: ExamType): Promise<Result<Question[]>> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `EXAM#${examType}`,
          },
        })
      )

      if (!result.Items || result.Items.length === 0) {
        return success([])
      }

      const questions: Question[] = []
      for (const item of result.Items) {
        const question = fromDynamoDB(item as QuestionDynamoDBItem)
        if (question) {
          questions.push(question)
        }
      }

      return success(questions)
    } catch (error) {
      console.error('DynamoDB error:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch questions',
        error
      )
    }
  }
}
