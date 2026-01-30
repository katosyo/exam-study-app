/**
 * 開発用認証フォールバック
 * Cognito 環境変数が未設定のときのみ使用。常にログイン成功、セッションはメモリのみ（リロードで解除）。
 */

import { IAuthService, AuthTokens, AuthUser } from './types'
import { setAuthToken } from './authToken'

export class MockAuthService implements IAuthService {
  private currentUser: AuthUser | null = null

  async login(email: string, password: string): Promise<AuthTokens> {
    this.currentUser = {
      userId: 'dev-user-id',
      email,
      displayName: email.split('@')[0] || 'User',
    }
    setAuthToken('dev-token')
    return {
      accessToken: 'dev-access-token',
      refreshToken: 'dev-refresh-token',
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
    setAuthToken(null)
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  async updateProfile(updates: { displayName?: string; avatarUrl?: string }): Promise<void> {
    if (!this.currentUser) return
    if (updates.displayName !== undefined) this.currentUser.displayName = updates.displayName
    if (updates.avatarUrl !== undefined) this.currentUser.avatarUrl = updates.avatarUrl
  }

  async changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
    // 開発用: 何もしない
  }
}
