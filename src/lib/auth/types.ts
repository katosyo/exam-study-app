/**
 * 認証関連の型定義
 * 
 * NOTE: 将来 Cognito に差し替えるため、インターフェースは本番想定で設計
 */

export interface AuthUser {
  userId: string
  email: string
  displayName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface IAuthService {
  /**
   * ログイン
   */
  login(email: string, password: string): Promise<AuthTokens>

  /**
   * ログアウト
   */
  logout(): Promise<void>

  /**
   * 現在のユーザー情報を取得
   */
  getCurrentUser(): Promise<AuthUser | null>

  /**
   * 認証状態を確認
   */
  isAuthenticated(): boolean
}
