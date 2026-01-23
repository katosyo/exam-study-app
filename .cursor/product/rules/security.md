# Security Rules（製品版）

## 目的

本プロジェクトは**第三者利用を前提**とするため、
セキュリティを最優先事項として扱う。

---

## 基本原則

1. **最小権限の原則**: 必要最小限の権限のみ付与
2. **多層防御**: 複数のセキュリティレイヤーを設ける
3. **デフォルト拒否**: 明示的に許可したもののみアクセス可能
4. **監査可能性**: すべての重要操作をログに記録

---

## 認証（Authentication）

### Amazon Cognito の使用

- **ユーザープール**でユーザー管理
- **JWT トークン**による認証
- **パスワードポリシー**の強制

### パスワードポリシー

```
- 最小長: 8文字
- 複雑さ: 大文字・小文字・数字・記号を含む
- 履歴: 過去3回のパスワード再利用禁止
- 有効期限: 90日（推奨）
```

### トークン管理

#### アクセストークン
- **有効期限**: 1時間
- **用途**: API 認証
- **保存場所**: メモリ または localStorage

#### リフレッシュトークン
- **有効期限**: 30日
- **用途**: アクセストークン再取得
- **保存場所**: httpOnly Cookie（推奨）

### トークンのライフサイクル

```
1. ログイン → アクセストークン + リフレッシュトークン取得
2. API 呼び出し → アクセストークンを Bearer ヘッダーに含める
3. トークン期限切れ → リフレッシュトークンで再取得
4. リフレッシュトークン期限切れ → 再ログイン
```

---

## 認可（Authorization）

### リソースアクセス制御

#### ユーザー自身のデータのみアクセス可能

```typescript
// ✅ 良い例
async function getAnswerHistory(userId: string, requestUserId: string) {
  if (userId !== requestUserId) {
    return failure(ErrorCode.FORBIDDEN, 'Access denied')
  }
  // ...
}

// ❌ 悪い例
async function getAnswerHistory(userId: string) {
  // requestUserId のチェックなし
  return await repository.getByUserId(userId)
}
```

#### Lambda オーソライザーの使用

- API Gateway で JWT 検証
- Lambda 関数に `event.requestContext.authorizer.jwt.claims` で渡す

```typescript
const userId = event.requestContext.authorizer?.jwt.claims.sub
if (!userId) {
  return unauthorized()
}
```

---

## 入力値検証

### すべての入力を疑う

- **型チェック**: 期待する型であることを確認
- **範囲チェック**: 許可された範囲内
- **形式チェック**: 正規表現で検証
- **長さ制限**: 最大長を設定

### バリデーションライブラリの使用

```typescript
import { z } from 'zod'

const SubmitAnswerSchema = z.object({
  questionId: z.string().regex(/^(FE|AP)-\d{4}-\d{2}$/),
  selectedIndex: z.number().int().min(0).max(3),
})

// 使用例
const parseResult = SubmitAnswerSchema.safeParse(input)
if (!parseResult.success) {
  return failure(ErrorCode.INVALID_PARAMETER, 'Invalid input')
}
```

### SQL / NoSQL インジェクション対策

- **プリペアドステートメント**相当の使用
- **パラメータ化されたクエリ**
- **ユーザー入力を直接クエリに埋め込まない**

```typescript
// ✅ 良い例（DynamoDB）
await dynamoClient.send(
  new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId, // パラメータ化
    },
  })
)

// ❌ 悪い例
await dynamoClient.send(
  new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: `userId = '${userId}'`, // 危険！
  })
)
```

---

## XSS（クロスサイトスクリプティング）対策

### フロントエンド

- **React のデフォルト動作を信頼**（自動エスケープ）
- **`dangerouslySetInnerHTML` の使用禁止**
- ユーザー入力を HTML として挿入しない

```tsx
// ✅ 良い例
<p>{userInput}</p>

// ❌ 悪い例
<p dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Content Security Policy (CSP)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
```

---

## CSRF（クロスサイトリクエストフォージェリ）対策

### JWT + Bearer トークン

- Cookie ではなく **Authorization ヘッダー**でトークン送信
- CSRF トークン不要（SameSite Cookie の場合は必要）

### SameSite Cookie の使用

リフレッシュトークンを Cookie に保存する場合：

```
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

---

## 機密情報の管理

### AWS Secrets Manager / SSM Parameter Store

- **DB 接続情報**
- **API キー**
- **暗号化キー**

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const client = new SecretsManagerClient({ region: 'ap-northeast-1' })
const response = await client.send(
  new GetSecretValueCommand({ SecretId: 'prod/db-password' })
)
const secret = JSON.parse(response.SecretString!)
```

### 環境変数

- **フロントエンド**: `NEXT_PUBLIC_` プレフィックスのみ公開
- **バックエンド**: Lambda 環境変数（暗号化推奨）

### ハードコード禁止

```typescript
// ❌ 絶対に禁止
const API_KEY = 'sk_live_abc123...'

// ✅ 良い例
const API_KEY = process.env.API_KEY
if (!API_KEY) {
  throw new Error('API_KEY is not set')
}
```

---

## データ暗号化

### 転送時の暗号化

- **HTTPS 必須**（HTTP は禁止）
- TLS 1.2 以上
- API Gateway で強制

### 保存時の暗号化

#### DynamoDB
- **暗号化を有効化**（AWS KMS）
- 機密データ項目は追加暗号化を検討

#### S3
- **S3 バケットの暗号化**を有効化
- パブリックアクセスブロック

---

## ログ・監視

### ログに含めてはならない情報

- ❌ パスワード・トークン
- ❌ クレジットカード情報
- ❌ 個人識別番号

### ログに含めるべき情報

- ✅ リクエスト ID
- ✅ ユーザー ID（匿名化された ID）
- ✅ タイムスタンプ
- ✅ 操作内容（CRUD）
- ✅ エラー詳細（技術者向け）

### CloudWatch Logs

- **ログの保持期間**: 30日以上
- **ログの暗号化**: 有効化
- **アラート設定**: エラー率・認証失敗率

---

## レート制限

### API Gateway レート制限

```yaml
# SAM テンプレート
HttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    ThrottleSettings:
      BurstLimit: 100
      RateLimit: 50
```

### ユーザー単位のレート制限

DynamoDB で最終リクエスト時刻を記録：

```typescript
const lastRequestTime = await getLastRequestTime(userId)
const now = Date.now()
if (now - lastRequestTime < 1000) { // 1秒以内
  return failure(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many requests')
}
```

---

## CORS 設定

### 本番環境

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-production-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}
```

### 開発環境のみ

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development'
    ? '*'
    : 'https://your-production-domain.com',
  // ...
}
```

---

## 依存関係の管理

### 定期的な更新

- **脆弱性スキャン**: `npm audit` を CI/CD で実行
- **依存関係の更新**: Dependabot または Renovate Bot
- **Critical な脆弱性**: 即座に対応

```bash
# CI/CD で実行
npm audit --audit-level=moderate
```

### バージョンの固定

- `package-lock.json` をコミット
- 予期しない更新を防ぐ

---

## セキュリティヘッダー

### 必須ヘッダー

```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}
```

---

## セキュリティテスト

### 必須テスト

- [ ] **認証テスト**: トークンなし・無効トークンで403/401
- [ ] **認可テスト**: 他人のデータにアクセスできないこと
- [ ] **入力値検証テスト**: 不正な入力でエラー
- [ ] **XSS テスト**: スクリプトタグが実行されないこと
- [ ] **SQL インジェクションテスト**: 不正なクエリが実行されないこと

---

## インシデント対応

### セキュリティインシデント発生時

1. **即座にサービス停止**（必要に応じて）
2. **影響範囲の特定**
3. **ログの保全**
4. **原因の調査**
5. **修正・再発防止策**
6. **ユーザーへの通知**（必要に応じて）

---

## 禁止事項

- パスワード・トークンのハードコード
- 機密情報のログ出力
- HTTP での通信
- 認証・認可チェックの省略
- ユーザー入力の無検証使用
- 過度な権限の付与
- セキュリティヘッダーの省略

---

## 逸脱禁止

本 Rules に反するセキュリティ実装を行ってはならない。
セキュリティは妥協してはならない最優先事項である。
