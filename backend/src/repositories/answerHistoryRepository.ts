/**
 * AnswerHistory Repository
 */

import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Result, success, failure } from '../shared/result'
import { ErrorCode } from '../shared/errors'
import {
  AnswerHistory,
  CreateAnswerHistoryInput,
} from '../domain/answerHistory'

export class AnswerHistoryRepository {
  private dynamoClient: DynamoDBDocumentClient

  constructor(private tableName: string) {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
    this.dynamoClient = DynamoDBDocumentClient.from(client)
  }

  /**
   * 回答履歴を保存
   */
  async save(input: CreateAnswerHistoryInput): Promise<Result<AnswerHistory>> {
    const timestamp = new Date().toISOString()
    
    const item: AnswerHistory = {
      PK: `USER#${input.userId}`,
      SK: `ANSWER#${timestamp}`,
      GSI1PK: `QUESTION#${input.questionId}`,
      GSI1SK: `USER#${input.userId}`,
      userId: input.userId,
      questionId: input.questionId,
      examType: input.examType,
      category: input.category,
      isCorrect: input.isCorrect,
      selectedIndex: input.selectedIndex,
      answeredAt: timestamp,
    }

    try {
      await this.dynamoClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      )
      return success(item)
    } catch (error) {
      console.error('Failed to save answer history:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to save answer history'
      )
    }
  }

  /**
   * ユーザーの全回答履歴を取得
   */
  async getByUserId(userId: string): Promise<Result<AnswerHistory[]>> {
    try {
      const result = await this.dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
          },
          ScanIndexForward: false, // 新しい順
        })
      )

      const items = (result.Items || []) as AnswerHistory[]
      return success(items)
    } catch (error) {
      console.error('Failed to get answer history:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to get answer history'
      )
    }
  }
}
