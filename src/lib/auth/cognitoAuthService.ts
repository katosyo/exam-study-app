/**
 * Cognito 認証サービス
 * 環境変数: NEXT_PUBLIC_COGNITO_USER_POOL_ID, NEXT_PUBLIC_COGNITO_CLIENT_ID, NEXT_PUBLIC_AWS_REGION
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'
import { IAuthService, AuthTokens, AuthUser } from './types'
import { setAuthToken, getAuthToken } from './authToken'

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ''
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || ''
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1'

function getPool(): CognitoUserPool {
  return new CognitoUserPool({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
  })
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return {}
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

function authUserFromSession(session: CognitoUserSession): AuthUser {
  const idToken = session.getIdToken()
  const jwt = idToken.getJwtToken()
  const payload = decodeJwtPayload(jwt)
  const sub = (payload.sub as string) || ''
  const email = (payload.email as string) || ''
  const preferredUsername = (payload['cognito:username'] as string) || (payload.preferred_username as string) || email || sub
  const picture = (payload.picture as string) || ''
  return {
    userId: sub,
    email,
    displayName: preferredUsername,
    avatarUrl: picture || undefined,
  }
}

export class CognitoAuthService implements IAuthService {
  private _cognitoUser: CognitoUser | null = null
  private _authenticated = false

  async login(email: string, password: string): Promise<AuthTokens> {
    const pool = getPool()
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    })
    const userData = {
      Username: email,
      Pool: pool,
    }
    const cognitoUser = new CognitoUser(userData)
    this._cognitoUser = cognitoUser

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session: CognitoUserSession) => {
          this._authenticated = true
          const idToken = session.getIdToken().getJwtToken()
          const accessToken = session.getAccessToken().getJwtToken()
          const refreshToken = session.getRefreshToken().getToken()
          setAuthToken(idToken)
          resolve({
            accessToken,
            refreshToken,
          })
        },
        onFailure: (err) => {
          this._cognitoUser = null
          this._authenticated = false
          setAuthToken(null)
          reject(err)
        },
      })
    })
  }

  async logout(): Promise<void> {
    if (this._cognitoUser) {
      this._cognitoUser.signOut()
      this._cognitoUser = null
    }
    this._authenticated = false
    setAuthToken(null)
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const pool = getPool()
    const cognitoUser = pool.getCurrentUser()
    if (!cognitoUser) {
      this._cognitoUser = null
      setAuthToken(null)
      return null
    }
    this._cognitoUser = cognitoUser

    return new Promise((resolve) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          this._authenticated = false
          setAuthToken(null)
          resolve(null)
          return
        }
        this._authenticated = true
        const idToken = session.getIdToken().getJwtToken()
        setAuthToken(idToken)
        resolve(authUserFromSession(session))
      })
    })
  }

  isAuthenticated(): boolean {
    return this._authenticated || getAuthToken() != null
  }

  async updateProfile(updates: { displayName?: string; avatarUrl?: string }): Promise<void> {
    const user = this._cognitoUser ?? getPool().getCurrentUser()
    if (!user) return

    const attrs: CognitoUserAttribute[] = []
    if (updates.displayName !== undefined) {
      attrs.push(new CognitoUserAttribute({ Name: 'preferred_username', Value: updates.displayName }))
    }
    if (updates.avatarUrl !== undefined) {
      attrs.push(new CognitoUserAttribute({ Name: 'picture', Value: updates.avatarUrl }))
    }
    if (attrs.length === 0) return

    return new Promise((resolve, reject) => {
      user.updateAttributes(attrs, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      })
    })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this._cognitoUser ?? getPool().getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    return new Promise((resolve, reject) => {
      user.changePassword(currentPassword, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      })
    })
  }

  async signUp(email: string, password: string, displayName?: string): Promise<void> {
    const pool = getPool()
    const attributes: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ]
    if (displayName) {
      attributes.push(new CognitoUserAttribute({ Name: 'preferred_username', Value: displayName }))
    }

    return new Promise((resolve, reject) => {
      pool.signUp(email, password, attributes, [], (err, result) => {
        if (err) {
          reject(err)
          return
        }
        if (result?.userConfirmed === false) {
          resolve()
          return
        }
        resolve()
      })
    })
  }
}
