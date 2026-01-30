/**
 * API 呼び出し用トークン保持
 * ログイン時にセットし、API Client が Authorization ヘッダーに付与する（Cognito 時は Id トークン）
 */

let currentIdToken: string | null = null

export function setAuthToken(token: string | null): void {
  currentIdToken = token
}

export function getAuthToken(): string | null {
  return currentIdToken
}
