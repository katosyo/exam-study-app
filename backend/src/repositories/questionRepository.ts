/**
 * Question Repository
 * 
 * DynamoDB アクセス層
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
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
