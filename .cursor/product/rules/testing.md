# Testing Rules（製品版）

## 目的

本プロジェクトは**第三者利用を前提**とするため、
品質を担保するためのテストを必須とする。

---

## 基本方針

### テストファースト

- **実装前にテストを書く**（TDD 推奨）
- 失敗するテストを先に作成
- テストが通る最小限の実装
- リファクタリング

### テストピラミッド

```
        /\
       /E2E\         少ない（重要なフローのみ）
      /------\
     /  統合  \       中程度
    /----------\
   / ユニット  \      多い（すべてのロジック）
  /--------------\
```

---

## テスト種別

### 1. Unit Test（単体テスト）

**対象**: 
- Domain 層の純粋関数
- Service 層のビジネスロジック
- フロントエンドの Utility 関数

**ツール**:
- Vitest（バックエンド・フロントエンド共通）

**カバレッジ目標**:
- Domain 層: 100%
- Service 層: 90% 以上
- Utility 関数: 100%

### 2. Integration Test（統合テスト）

**対象**:
- API エンドポイント（Handler + Service + Repository）
- DynamoDB との連携

**ツール**:
- Vitest
- DynamoDB Local
- AWS SAM Local

**カバレッジ目標**:
- API エンドポイント: 主要な正常系・異常系

### 3. E2E Test（End-to-End テスト）

**対象**:
- 重要なユーザーフロー
  - ユーザー登録 → ログイン
  - 問題取得 → 回答 → 結果表示
  - 学習履歴の閲覧

**ツール**:
- Playwright

**カバレッジ目標**:
- 主要なユーザーフロー

---

## Unit Test

### Domain 層のテスト

```typescript
// src/domain/analytics.ts
export function calculateAccuracyRate(answers: AnswerHistory[]): number {
  if (answers.length === 0) return 0
  const correctCount = answers.filter((a) => a.isCorrect).length
  return correctCount / answers.length
}

// src/domain/analytics.test.ts
import { describe, it, expect } from 'vitest'
import { calculateAccuracyRate } from './analytics'

describe('calculateAccuracyRate', () => {
  it('正答率を正しく計算する', () => {
    const answers: AnswerHistory[] = [
      { isCorrect: true, /* ... */ },
      { isCorrect: false, /* ... */ },
      { isCorrect: true, /* ... */ },
    ]
    expect(calculateAccuracyRate(answers)).toBeCloseTo(0.666, 2)
  })

  it('回答がない場合は0を返す', () => {
    expect(calculateAccuracyRate([])).toBe(0)
  })

  it('すべて正解の場合は1を返す', () => {
    const answers: AnswerHistory[] = [
      { isCorrect: true, /* ... */ },
      { isCorrect: true, /* ... */ },
    ]
    expect(calculateAccuracyRate(answers)).toBe(1)
  })

  it('すべて不正解の場合は0を返す', () => {
    const answers: AnswerHistory[] = [
      { isCorrect: false, /* ... */ },
      { isCorrect: false, /* ... */ },
    ]
    expect(calculateAccuracyRate(answers)).toBe(0)
  })
})
```

### Service 層のテスト

```typescript
// src/functions/submitAnswer/service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { SubmitAnswerService } from './service'

describe('SubmitAnswerService', () => {
  it('正解の場合、isCorrect が true', async () => {
    // Repository のモック
    const mockQuestionRepo = {
      getById: vi.fn().mockResolvedValue({
        ok: true,
        value: { id: 'FE-2023-01', answerIndex: 2, /* ... */ },
      }),
    }
    const mockAnswerRepo = {
      save: vi.fn().mockResolvedValue({ ok: true }),
    }

    const service = new SubmitAnswerService(mockAnswerRepo, mockQuestionRepo)

    const result = await service.execute({
      userId: 'user1',
      questionId: 'FE-2023-01',
      selectedIndex: 2,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.isCorrect).toBe(true)
      expect(result.value.correctIndex).toBe(2)
    }

    // Repository が呼ばれたことを確認
    expect(mockQuestionRepo.getById).toHaveBeenCalledWith('FE-2023-01')
    expect(mockAnswerRepo.save).toHaveBeenCalled()
  })

  it('不正解の場合、isCorrect が false', async () => {
    // 同様のテスト
  })

  it('問題が存在しない場合、NOT_FOUND エラー', async () => {
    const mockQuestionRepo = {
      getById: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' },
      }),
    }
    const mockAnswerRepo = {
      save: vi.fn(),
    }

    const service = new SubmitAnswerService(mockAnswerRepo, mockQuestionRepo)

    const result = await service.execute({
      userId: 'user1',
      questionId: 'invalid-id',
      selectedIndex: 2,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND')
    }

    // save は呼ばれていないことを確認
    expect(mockAnswerRepo.save).not.toHaveBeenCalled()
  })
})
```

---

## Integration Test

### API エンドポイントのテスト

```typescript
// src/functions/getQuestions/handler.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { handler } from './handler'
import { APIGatewayProxyEventV2 } from 'aws-lambda'

describe('GET /questions Integration Test', () => {
  beforeAll(async () => {
    // DynamoDB Local のセットアップ
    // テストデータの投入
  })

  afterAll(async () => {
    // クリーンアップ
  })

  it('正常系: 問題を取得できる', async () => {
    const event: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        exam: 'FE',
        limit: '5',
      },
      requestContext: {
        authorizer: {
          jwt: {
            claims: { sub: 'user1' },
          },
        },
        // ...
      },
      // ...
    }

    const response = await handler(event)

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.questions).toHaveLength(5)
    expect(body.questions[0]).toHaveProperty('id')
    expect(body.questions[0]).toHaveProperty('text')
  })

  it('異常系: exam パラメータが不正', async () => {
    const event: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        exam: 'INVALID',
        limit: '5',
      },
      // ...
    }

    const response = await handler(event)

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('INVALID_PARAMETER')
  })

  it('異常系: 認証トークンなし', async () => {
    const event: APIGatewayProxyEventV2 = {
      queryStringParameters: {
        exam: 'FE',
        limit: '5',
      },
      requestContext: {
        // authorizer なし
      },
      // ...
    }

    const response = await handler(event)

    expect(response.statusCode).toBe(401)
  })
})
```

### DynamoDB Local の使用

```typescript
// backend/test/setup.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { beforeAll, afterAll } from 'vitest'

let dynamoClient: DynamoDBDocumentClient

beforeAll(async () => {
  // DynamoDB Local に接続
  const client = new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'local',
    credentials: {
      accessKeyId: 'dummy',
      secretAccessKey: 'dummy',
    },
  })

  dynamoClient = DynamoDBDocumentClient.from(client)

  // テーブル作成
  // テストデータ投入
})

afterAll(async () => {
  // テーブル削除
})

export { dynamoClient }
```

---

## E2E Test

### Playwright の使用

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test('ユーザー登録 → ログイン → 問題取得', async ({ page }) => {
    // 1. ユーザー登録
    await page.goto('/signup')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="displayName"]', 'テストユーザー')
    await page.click('button[type="submit"]')

    // 検証コード入力画面が表示されることを確認
    await expect(page).toHaveURL('/verify')

    // 2. ログイン（検証コードスキップ）
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    // ダッシュボード画面に遷移
    await expect(page).toHaveURL('/dashboard')

    // 3. 問題取得
    await page.click('button:has-text("クイズを開始")')
    
    // 問題が表示されることを確認
    await expect(page.locator('.question-card')).toBeVisible()
    await expect(page.locator('.choices')).toHaveCount(4)
  })

  test('ログアウト → 保護されたページにアクセスできない', async ({ page }) => {
    // ログイン済み状態
    await loginAsUser(page, 'test@example.com', 'Password123!')

    // ログアウト
    await page.click('button:has-text("ログアウト")')

    // ログイン画面にリダイレクト
    await expect(page).toHaveURL('/login')

    // 保護されたページにアクセス
    await page.goto('/dashboard')

    // ログイン画面にリダイレクトされることを確認
    await expect(page).toHaveURL('/login')
  })
})
```

---

## テストデータ管理

### Fixture の使用

```typescript
// backend/test/fixtures/questions.ts
export const testQuestions: Question[] = [
  {
    id: 'FE-2023-01',
    examType: 'FE',
    category: 'algorithm',
    subCategory: 'sort',
    difficulty: 'medium',
    text: 'バブルソートの計算量は？',
    choices: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)'],
    answerIndex: 2,
    explanation: 'バブルソートは O(n^2) の計算量です。',
  },
  // ...
]

export async function seedQuestions(dynamoClient: DynamoDBDocumentClient, tableName: string) {
  for (const question of testQuestions) {
    await dynamoClient.send(
      new PutCommand({
        TableName: tableName,
        Item: question,
      })
    )
  }
}
```

---

## CI/CD でのテスト実行

### GitHub Actions

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      dynamodb:
        image: amazon/dynamodb-local
        ports:
          - 8000:8000

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install
          cd backend && npm install

      - name: Run backend unit tests
        run: cd backend && npm run test

      - name: Run backend integration tests
        run: cd backend && npm run test:integration
        env:
          DYNAMODB_ENDPOINT: http://localhost:8000

      - name: Run frontend tests
        run: npm run test

      - name: Check coverage
        run: |
          cd backend && npm run test:coverage
          if [ $(cat coverage/coverage-summary.json | jq '.total.lines.pct') -lt 80 ]; then
            echo "Coverage is below 80%"
            exit 1
          fi
```

---

## テストカバレッジ

### カバレッジ目標

- **Domain 層**: 100%
- **Service 層**: 90% 以上
- **Handler 層**: 80% 以上
- **全体**: 85% 以上

### カバレッジ測定

```bash
# バックエンド
cd backend
npm run test:coverage

# フロントエンド
npm run test:coverage
```

### カバレッジレポート

```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
    },
  },
})
```

---

## テストのベストプラクティス

### 1. テストは独立している

- 他のテストに依存しない
- 実行順序に依存しない
- テストデータは各テストで準備

### 2. テストは高速

- 外部依存をモック化
- 不要な待機を避ける

### 3. テストは明確

- テスト名でテスト内容が分かる
- AAA パターン（Arrange / Act / Assert）

```typescript
it('正解の場合、isCorrect が true', async () => {
  // Arrange: テストデータの準備
  const mockRepo = createMockRepository()
  const service = new Service(mockRepo)

  // Act: 実行
  const result = await service.execute(input)

  // Assert: 検証
  expect(result.ok).toBe(true)
  expect(result.value.isCorrect).toBe(true)
})
```

### 4. エッジケースをテスト

- 境界値
- null / undefined
- 空配列・空文字列
- エラーケース

---

## 禁止事項

- テストなしの実装
- テストのスキップ（`test.skip`）
- テストのみの実装（実装なし）
- テストデータのハードコード（Fixture を使用）
- テスト間の依存関係

---

## 逸脱禁止

本 Rules に反するテスト実装を行ってはならない。
テストは品質担保の最後の砦である。
