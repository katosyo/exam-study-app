# Backend Rules（製品版）

## 基本方針

本プロジェクトのバックエンドは**第三者利用を前提**とし、
以下を重視する：

- ✅ セキュリティ・認証認可
- ✅ データの整合性・永続性
- ✅ エラーハンドリング・可用性
- ✅ パフォーマンス・スケーラビリティ
- ✅ テスタビリティ・保守性

---

## アーキテクチャ方針

### 基本構成

- AWS Lambda + API Gateway (HTTP API)
- DynamoDB（オンデマンドモード）
- Amazon Cognito（認証）
- AWS SAM によるインフラ管理

### レイヤ構造（厳守）

製品版では以下のレイヤ分離を**厳守**する：

```
┌─────────────────────────────────────┐
│ handler (API Gateway / Lambda 境界)  │ ← 薄く実装
├─────────────────────────────────────┤
│ service (ユースケース・処理の流れ)   │ ← ビジネスロジック
├─────────────────────────────────────┤
│ repository (データアクセス層)        │ ← DynamoDB操作
├─────────────────────────────────────┤
│ domain (型・純粋ロジック)           │ ← 副作用なし
└─────────────────────────────────────┘
```

**原則**:
- 上位層から下位層への依存のみ許可
- 下位層は上位層を知らない
- domain 層は完全に独立（AWS SDK に依存しない）

---

## Handler 層（API 境界）

### 責務

- リクエストのパース・バリデーション
- 認証トークンの検証（Lambda オーソライザー経由）
- Service 層の呼び出し
- レスポンスの整形・HTTP ステータスコード設定
- エラーの適切な変換（技術的詳細を隠す）
- ログの出力

### 実装ルール

```typescript
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // 1. ログ出力（リクエストID・ユーザーID）
  logger.info('Request received', {
    requestId: event.requestContext.requestId,
    userId: event.requestContext.authorizer?.jwt.claims.sub,
  })

  try {
    // 2. 入力値のパース・バリデーション
    const input = parseAndValidate(event)

    // 3. Service 呼び出し
    const result = await service.execute(input)

    // 4. Result型の処理
    if (!result.ok) {
      return handleError(result.error)
    }

    // 5. 成功レスポンス
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(result.value),
    }
  } catch (error) {
    // 6. 予期しないエラー
    logger.error('Unexpected error', { error })
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      }),
    }
  }
}
```

### 禁止事項

- ビジネスロジックを handler に書く
- DynamoDB を直接呼び出す
- 技術的詳細をレスポンスに含める

---

## Service 層（ユースケース）

### 責務

- ビジネスルールの実装
- 処理フローの制御
- Repository 層の呼び出し
- トランザクション的な処理の管理
- Result 型での結果返却

### 実装ルール

```typescript
export class SubmitAnswerService {
  constructor(
    private answerRepository: AnswerHistoryRepository,
    private questionRepository: QuestionRepository
  ) {}

  async execute(input: SubmitAnswerInput): Promise<Result<SubmitAnswerOutput>> {
    // 1. バリデーション
    const validationError = this.validate(input)
    if (validationError) return validationError

    // 2. 問題の存在確認
    const questionResult = await this.questionRepository.getById(input.questionId)
    if (!questionResult.ok) return questionResult

    // 3. 正誤判定
    const isCorrect = questionResult.value.answerIndex === input.selectedIndex

    // 4. 回答履歴の保存
    const saveResult = await this.answerRepository.save({
      userId: input.userId,
      questionId: input.questionId,
      selectedIndex: input.selectedIndex,
      isCorrect,
      answeredAt: new Date().toISOString(),
    })

    if (!saveResult.ok) return saveResult

    // 5. 結果返却
    return success({
      isCorrect,
      correctIndex: questionResult.value.answerIndex,
      explanation: questionResult.value.explanation,
    })
  }

  private validate(input: SubmitAnswerInput): Result<SubmitAnswerOutput> | null {
    // バリデーションロジック
  }
}
```

### 禁止事項

- AWS SDK への直接依存
- HTTP レスポンスの構築
- `throw` による例外（Result 型を使用）

---

## Repository 層（データアクセス）

### 責務

- DynamoDB への読み書き
- クエリ・スキャンの実行
- DynamoDB エラーの Result 型への変換
- トランザクション処理

### 実装ルール

```typescript
export class AnswerHistoryRepository {
  constructor(
    private tableName: string,
    private dynamoClient: DynamoDBDocumentClient
  ) {}

  async save(answer: AnswerHistory): Promise<Result<void>> {
    try {
      await this.dynamoClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: answer,
        })
      )
      return success(undefined)
    } catch (error) {
      logger.error('Failed to save answer', { error })
      return failure(ErrorCode.DATABASE_ERROR, 'Failed to save answer')
    }
  }

  async getByUserId(userId: string): Promise<Result<AnswerHistory[]>> {
    try {
      const result = await this.dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId,
          },
        })
      )
      return success(result.Items as AnswerHistory[])
    } catch (error) {
      logger.error('Failed to get answers', { error, userId })
      return failure(ErrorCode.DATABASE_ERROR, 'Failed to get answers')
    }
  }
}
```

### 禁止事項

- ビジネスロジックの実装
- 直接的な `throw`（Result 型で返す）

---

## Domain 層（ドメインモデル）

### 責務

- 型定義
- 純粋関数・ビジネスルール
- バリデーションロジック
- 副作用を持たない計算

### 実装ルール

```typescript
// 型定義
export type ExamType = 'FE' | 'AP'

export interface Question {
  id: string
  examType: ExamType
  category: string
  subCategory: string
  text: string
  choices: string[]
  answerIndex: number
  explanation: string
}

// 純粋関数
export function calculateAccuracyRate(
  answers: AnswerHistory[]
): number {
  if (answers.length === 0) return 0
  const correctCount = answers.filter((a) => a.isCorrect).length
  return correctCount / answers.length
}

// バリデーション
export function isValidExamType(value: unknown): value is ExamType {
  return value === 'FE' || value === 'AP'
}
```

### 禁止事項

- AWS SDK への依存
- 副作用（DB・API・IO）
- グローバル変数の参照

---

## エラーハンドリング

### Result 型の継続使用

```typescript
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppError }

export interface AppError {
  code: ErrorCodeType
  message: string
  details?: unknown
}
```

### エラーコードの定義

```typescript
export const ErrorCode = {
  // 400系
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  
  // 500系
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]
```

### ユーザー向けエラーメッセージ

技術的詳細を含めず、**ユーザーが取るべきアクション**を明示：

```typescript
export const UserErrorMessage: Record<ErrorCodeType, string> = {
  [ErrorCode.INVALID_PARAMETER]: '入力内容に誤りがあります。もう一度ご確認ください。',
  [ErrorCode.UNAUTHORIZED]: 'ログインが必要です。',
  [ErrorCode.FORBIDDEN]: 'この操作を実行する権限がありません。',
  [ErrorCode.NOT_FOUND]: '指定されたリソースが見つかりませんでした。',
  [ErrorCode.DATABASE_ERROR]: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。',
  [ErrorCode.INTERNAL_ERROR]: '予期しないエラーが発生しました。',
}
```

---

## ログ

### 構造化ログの使用

`console.log` は禁止。構造化ログライブラリ（例：`pino`）を使用：

```typescript
import { logger } from './logger'

// ✅ 良い例
logger.info('Answer submitted', {
  userId: input.userId,
  questionId: input.questionId,
  isCorrect,
})

logger.error('Database error', {
  error: error.message,
  userId: input.userId,
  operation: 'PutItem',
})

// ❌ 悪い例
console.log('Answer submitted', input)
console.error(error)
```

### ログレベル

- **ERROR**: システムエラー・予期しない例外
- **WARN**: 異常だが処理継続可能
- **INFO**: 重要なイベント（ユーザー操作）
- **DEBUG**: デバッグ用詳細情報

### 機密情報の除外

- パスワード・トークン
- 個人を特定できる詳細情報（必要な場合はマスク）

---

## テスト方針

### 必須テスト

#### 1. Unit Test（必須）

- **Domain 層**: 100% カバレッジ
- **Service 層**: 全メソッド・全分岐
- Repository はモック化

```typescript
describe('CalculateAccuracyRate', () => {
  it('正答率を正しく計算する', () => {
    const answers: AnswerHistory[] = [
      { isCorrect: true, /* ... */ },
      { isCorrect: false, /* ... */ },
      { isCorrect: true, /* ... */ },
    ]
    expect(calculateAccuracyRate(answers)).toBe(2/3)
  })

  it('回答がない場合は0を返す', () => {
    expect(calculateAccuracyRate([])).toBe(0)
  })
})
```

#### 2. Integration Test（推奨）

- DynamoDB Local を使用
- API エンドポイントの E2E テスト

---

## パフォーマンス

### DynamoDB 最適化

- **適切なキー設計**（Partition Key / Sort Key）
- **GSI の活用**（クエリパターンに応じて）
- **BatchGetItem / BatchWriteItem** の活用
- **ページネーション**（大量データの取得時）

### Lambda 最適化

- **依存関係の最小化**（バンドルサイズ削減）
- **コールドスタート対策**（Provisioned Concurrency の検討）
- **メモリ設定の最適化**

---

## セキュリティ

### 入力値検証

- **すべての入力値を検証**（型・範囲・形式）
- `zod` などのバリデーションライブラリ使用
- SQL インジェクション / NoSQL インジェクション対策

### 認可チェック

- ユーザーが自分のデータのみアクセス可能
- リソースオーナーシップの確認

```typescript
// ✅ 良い例
if (answer.userId !== requestUserId) {
  return failure(ErrorCode.FORBIDDEN, 'Access denied')
}
```

---

## 禁止事項

- テストなしの実装
- `console.log` / `console.error`（構造化ログを使用）
- `any` の使用
- ビジネスロジックを handler に書く
- 技術的詳細をユーザーに露出
- 認可チェックの省略

---

## 逸脱禁止

本 Rules に反するバックエンド実装を提案してはならない。
例外が必要な場合は **理由・影響・代替案** を明示すること。
