/**
 * API Gateway HTTP API (v2) の JWT オーソライザーから userId を取得
 * Cognito の ID トークンには sub (ユーザーID) が含まれる
 */

import { APIGatewayProxyEvent } from 'aws-lambda'

const MOCK_USER_ID = 'mock-user-id'

export function getUserIdFromEvent(event: APIGatewayProxyEvent): string {
  const claims = event.requestContext?.authorizer?.jwt?.claims as Record<string, string> | undefined
  const sub = claims?.sub
  if (sub && typeof sub === 'string') {
    return sub
  }
  return MOCK_USER_ID
}
