/**
 * API 呼び出し用の Id トークン保持
 * Cognito ログイン時にセットし、API Client が Authorization ヘッダーに付与する
 */

let currentIdToken: string | null = null

export function setAuthToken(token: string | null): void {
  currentIdToken = token
}

export function getAuthToken(): string | null {
  return currentIdToken
}
