/**
 * Mock 認証サービス
 * 
 * NOTE: 常に認証成功する仮実装
 * 将来 Cognito に差し替える際は、このファイルを CognitoAuthService に置き換える
 */

import { IAuthService, AuthTokens, AuthUser } from './types'

export class MockAuthService implements IAuthService {
  private isLoggedIn = false
  private currentUser: AuthUser | null = null

  async login(email: string, password: string): Promise<AuthTokens> {
    // Mock: 常に成功
    this.isLoggedIn = true
    this.currentUser = {
      userId: 'mock-user-id',
      email: email,
      displayName: 'Mock User',
    }

    // Mock トークンを返す
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }
  }

  async logout(): Promise<void> {
    // Mock: 状態をクリア
    this.isLoggedIn = false
    this.currentUser = null
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Mock: ログイン中ならユーザー情報を返す
    return this.currentUser
  }

  isAuthenticated(): boolean {
    // Mock: ログイン状態を返す
    return this.isLoggedIn
  }
}
