# Authentication & Authorization Rules（製品版）

## 目的

本プロジェクトは**第三者利用を前提**とするため、
適切な認証・認可の仕組みを実装する。

---

## 認証方式

### Amazon Cognito User Pool

- **ユーザー管理**: Cognito User Pool
- **認証方式**: JWT トークン
- **ID プロバイダー**: メール + パスワード

---

## ユーザー登録フロー

### 1. ユーザー登録（Sign Up）

```typescript
// フロントエンド
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({ region: 'ap-northeast-1' })

await client.send(
  new SignUpCommand({
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: displayName },
    ],
  })
)
```

### 2. メール検証

- Cognito が検証コードを送信
- ユーザーが検証コード入力

```typescript
await client.send(
  new ConfirmSignUpCommand({
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  })
)
```

### 3. 完了

- メール検証完了後、ログイン可能

---

## ログインフロー

### 1. ログイン（Sign In）

```typescript
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'

const response = await client.send(
  new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  })
)

const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult!
```

### 2. トークン保存

#### アクセストークン（短期）
- **有効期限**: 1時間
- **保存場所**: メモリ（または localStorage）
- **用途**: API 認証

#### リフレッシュトークン（長期）
- **有効期限**: 30日
- **保存場所**: httpOnly Cookie（推奨）または localStorage
- **用途**: アクセストークン再取得

```typescript
// フロントエンド（Context API）
type AuthState = {
  isAuthenticated: boolean
  accessToken: string | null
  user: User | null
}

const AuthContext = createContext<AuthState | null>(null)
```

---

## API 認証フロー

### 1. フロントエンドからの API 呼び出し

```typescript
const response = await fetch(`${API_URL}/questions`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
})
```

### 2. API Gateway での JWT 検証

SAM テンプレートで Lambda オーソライザーを設定：

```yaml
HttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    Auth:
      Authorizers:
        CognitoAuthorizer:
          IdentitySource: $request.header.Authorization
          JwtConfiguration:
            issuer: !Sub https://cognito-idp.${AWS::Region}.amazonaws.com/${CognitoUserPool}
            audience:
              - !Ref CognitoUserPoolClient
      DefaultAuthorizer: CognitoAuthorizer
```

### 3. Lambda 関数でユーザー情報取得

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  // JWT からユーザー ID を取得
  const userId = event.requestContext.authorizer?.jwt.claims.sub as string
  
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  // userId を使ってビジネスロジック実行
  const result = await service.execute({ userId, ...input })
  // ...
}
```

---

## トークンリフレッシュフロー

### アクセストークン期限切れ時

```typescript
// API クライアント
async function fetchWithAuth(url: string, options: RequestInit) {
  let accessToken = getAccessToken()

  // 初回リクエスト
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  // 401 エラー（トークン期限切れ）
  if (response.status === 401) {
    // リフレッシュトークンでアクセストークン再取得
    accessToken = await refreshAccessToken()
    
    // リトライ
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }

  return response
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  
  const response = await client.send(
    new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    })
  )

  const { AccessToken } = response.AuthenticationResult!
  setAccessToken(AccessToken)
  return AccessToken
}
```

---

## ログアウトフロー

### 1. クライアント側

```typescript
async function logout() {
  // Cognito からログアウト
  await client.send(
    new GlobalSignOutCommand({
      AccessToken: accessToken,
    })
  )

  // トークンをクリア
  clearAccessToken()
  clearRefreshToken()

  // ログイン画面にリダイレクト
  router.push('/login')
}
```

---

## 認可（Authorization）

### リソースオーナーシップの確認

すべての API で**ユーザーが自分のリソースにのみアクセス**できることを確認：

```typescript
// ✅ 良い例: 回答履歴取得
export class GetAnswerHistoryService {
  async execute(input: { requestUserId: string }): Promise<Result<AnswerHistory[]>> {
    // requestUserId のデータのみ取得
    const result = await this.repository.getByUserId(input.requestUserId)
    return result
  }
}

// ❌ 悪い例: 任意のユーザーの回答履歴取得
export class GetAnswerHistoryService {
  async execute(input: { userId: string }): Promise<Result<AnswerHistory[]>> {
    // userId のチェックなし → 他人のデータにアクセス可能
    const result = await this.repository.getByUserId(input.userId)
    return result
  }
}
```

### DynamoDB のアクセス制御

Partition Key に `userId` を含める設計：

```
PK: USER#{userId}
SK: ANSWER#{timestamp}
```

これにより、ユーザーごとにデータを分離：

```typescript
await dynamoClient.send(
  new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
    },
  })
)
```

---

## パスワードリセットフロー

### 1. パスワードリセット要求

```typescript
await client.send(
  new ForgotPasswordCommand({
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    Username: email,
  })
)
```

### 2. 検証コード入力 + 新パスワード設定

```typescript
await client.send(
  new ConfirmForgotPasswordCommand({
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  })
)
```

---

## セッション管理

### セッションの有効期限

- **アクセストークン**: 1時間
- **リフレッシュトークン**: 30日
- **アイドルタイムアウト**: 検討（フロントエンドで実装）

### アイドルタイムアウトの実装

```typescript
let lastActivityTime = Date.now()

// ユーザー操作時に更新
function updateActivity() {
  lastActivityTime = Date.now()
}

// 定期的にチェック
setInterval(() => {
  const idleTime = Date.now() - lastActivityTime
  if (idleTime > 30 * 60 * 1000) { // 30分
    logout()
  }
}, 60 * 1000) // 1分ごとにチェック
```

---

## DynamoDB テーブル設計（ユーザーデータ）

### Users テーブル

```
PK: USER#{userId}  (Partition Key)
SK: PROFILE        (Sort Key)

Attributes:
- email: string
- displayName: string
- createdAt: string (ISO 8601)
- updatedAt: string (ISO 8601)
```

### AnswerHistory テーブル

```
PK: USER#{userId}         (Partition Key)
SK: ANSWER#{timestamp}    (Sort Key)

Attributes:
- questionId: string
- selectedIndex: number
- isCorrect: boolean
- answeredAt: string (ISO 8601)

GSI: QuestionIndex
- PK: QUESTION#{questionId}
- SK: USER#{userId}
```

---

## 認証エラーハンドリング

### エラーコードとメッセージ

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | ログインが必要です |
| 401 | TOKEN_EXPIRED | トークンの有効期限が切れました |
| 403 | FORBIDDEN | この操作を実行する権限がありません |
| 401 | INVALID_CREDENTIALS | メールアドレスまたはパスワードが正しくありません |

### フロントエンドでのエラーハンドリング

```typescript
try {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  
  if (response.status === 401) {
    // トークンリフレッシュまたはログアウト
    await handleUnauthorized()
  } else if (response.status === 403) {
    // アクセス権限なし
    showErrorMessage('この操作を実行する権限がありません')
  }
} catch (error) {
  // ...
}
```

---

## テスト

### 認証テスト（必須）

```typescript
describe('Authentication', () => {
  it('有効なトークンで API にアクセスできる', async () => {
    const token = await getValidToken()
    const response = await fetch('/questions', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.status).toBe(200)
  })

  it('無効なトークンで 401 エラー', async () => {
    const response = await fetch('/questions', {
      headers: { Authorization: 'Bearer invalid-token' },
    })
    expect(response.status).toBe(401)
  })

  it('トークンなしで 401 エラー', async () => {
    const response = await fetch('/questions')
    expect(response.status).toBe(401)
  })
})
```

### 認可テスト（必須）

```typescript
describe('Authorization', () => {
  it('自分の回答履歴にはアクセスできる', async () => {
    const userAToken = await getUserToken('userA')
    const response = await fetch('/answers/history', {
      headers: { Authorization: `Bearer ${userAToken}` },
    })
    expect(response.status).toBe(200)
  })

  it('他人の回答履歴にはアクセスできない', async () => {
    const userAToken = await getUserToken('userA')
    const response = await fetch('/answers/history?userId=userB', {
      headers: { Authorization: `Bearer ${userAToken}` },
    })
    expect(response.status).toBe(403)
  })
})
```

---

## 禁止事項

- トークンのハードコード
- トークンを URL パラメータに含める
- 認可チェックの省略
- 他人のデータへのアクセス許可
- パスワードの平文保存（Cognito が管理）

---

## 逸脱禁止

本 Rules に反する認証・認可実装を行ってはならない。
セキュリティは最優先事項である。
