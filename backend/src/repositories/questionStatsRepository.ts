/**
 * QuestionStats Repository
 */

import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Result, success, failure } from '../shared/result'
import { ErrorCode } from '../shared/errors'
import { QuestionStats } from '../domain/questionStats'

export class QuestionStatsRepository {
  private dynamoClient: DynamoDBDocumentClient

  constructor(private tableName: string) {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
    this.dynamoClient = DynamoDBDocumentClient.from(client)
  }

  /**
   * 問題統計を取得
   */
  async get(userId: string, questionId: string): Promise<Result<QuestionStats | null>> {
    try {
      const result = await this.dynamoClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: `QUESTION#${questionId}`,
          },
        })
      )

      if (!result.Item) {
        return success(null)
      }

      return success(result.Item as QuestionStats)
    } catch (error) {
      console.error('Failed to get question stats:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to get question stats'
      )
    }
  }

  /**
   * ユーザーの全統計を取得
   */
  async getByUserId(userId: string, examType?: 'FE' | 'AP'): Promise<Result<QuestionStats[]>> {
    try {
      const result = await this.dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
          },
        })
      )

      let items = (result.Items || []) as QuestionStats[]

      // examType でフィルタ
      if (examType) {
        items = items.filter((item) => item.examType === examType)
      }

      return success(items)
    } catch (error) {
      console.error('Failed to get user stats:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to get user stats'
      )
    }
  }

  /**
   * 統計を作成
   */
  async create(
    userId: string,
    questionId: string,
    examType: 'FE' | 'AP',
    category: string,
    isCorrect: boolean
  ): Promise<Result<QuestionStats>> {
    const now = new Date().toISOString()

    const item: QuestionStats = {
      PK: `USER#${userId}`,
      SK: `QUESTION#${questionId}`,
      GSI1PK: `USER#${userId}#EXAM#${examType}`,
      GSI1SK: `CATEGORY#${category}`,
      userId,
      questionId,
      examType,
      category,
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
      lastAnsweredAt: now,
      createdAt: now,
      updatedAt: now,
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
      console.error('Failed to create question stats:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to create question stats'
      )
    }
  }

  /**
   * 統計を更新（インクリメント）
   */
  async increment(
    userId: string,
    questionId: string,
    isCorrect: boolean
  ): Promise<Result<QuestionStats>> {
    const now = new Date().toISOString()

    try {
      const result = await this.dynamoClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: `QUESTION#${questionId}`,
          },
          UpdateExpression:
            'SET correctCount = correctCount + :correctInc, incorrectCount = incorrectCount + :incorrectInc, lastAnsweredAt = :now, updatedAt = :now',
          ExpressionAttributeValues: {
            ':correctInc': isCorrect ? 1 : 0,
            ':incorrectInc': isCorrect ? 0 : 1,
            ':now': now,
          },
          ReturnValues: 'ALL_NEW',
        })
      )

      return success(result.Attributes as QuestionStats)
    } catch (error) {
      console.error('Failed to increment question stats:', error)
      return failure(
        ErrorCode.DATABASE_ERROR,
        'Failed to increment question stats'
      )
    }
  }
}
