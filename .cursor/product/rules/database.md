# Database Design Rules（製品版）

## 目的

本プロジェクトは**第三者利用を前提**とするため、
データベース設計において以下を重視する：

- ✅ データの整合性・永続性
- ✅ スケーラビリティ
- ✅ パフォーマンス
- ✅ セキュリティ（ユーザーデータの分離）
- ✅ 拡張性（将来の機能追加に耐える）

---

## 基本方針

### DynamoDB の使用

- **NoSQL データベース**: DynamoDB
- **課金モデル**: オンデマンドモード
- **暗号化**: 有効化（AWS KMS）

### Single Table Design

製品版では **Single Table Design** を採用：

- 複数のエンティティを1つのテーブルに格納
- Partition Key (PK) と Sort Key (SK) で識別
- GSI（Global Secondary Index）で別の検索パターンに対応

---

## テーブル設計

### Main Table（すべてのデータを格納）

```
TableName: ExamStudyApp

PK (String) - Partition Key
SK (String) - Sort Key

Attributes:
- EntityType: string (USER | QUESTION | ANSWER | ANALYTICS)
- ... (エンティティ固有の属性)

GSI1PK (String) - GSI Partition Key
GSI1SK (String) - GSI Sort Key
```

---

## エンティティ設計

### 1. User（ユーザー）

```
PK: USER#{userId}
SK: PROFILE

Attributes:
- EntityType: "USER"
- userId: string (Cognito sub)
- email: string
- displayName: string
- createdAt: string (ISO 8601)
- updatedAt: string (ISO 8601)
```

**アクセスパターン**:
- ユーザー情報取得: `PK = USER#{userId} AND SK = PROFILE`

---

### 2. Question（問題）

```
PK: QUESTION#{questionId}
SK: METADATA

Attributes:
- EntityType: "QUESTION"
- questionId: string (例: FE-2023-01)
- examType: string (FE | AP)
- category: string
- subCategory: string
- difficulty: string (easy | medium | hard)
- text: string
- choices: string[]
- answerIndex: number
- explanation: string
- createdAt: string

GSI1PK: EXAM#{examType}#CATEGORY#{category}
GSI1SK: QUESTION#{questionId}
```

**アクセスパターン**:
1. 問題IDで取得: `PK = QUESTION#{questionId} AND SK = METADATA`
2. 試験種別で取得: GSI1 で `GSI1PK = EXAM#{examType}#CATEGORY#ALL`
3. カテゴリ別で取得: GSI1 で `GSI1PK = EXAM#{examType}#CATEGORY#{category}`

---

### 3. AnswerHistory（回答履歴）

```
PK: USER#{userId}
SK: ANSWER#{timestamp}#{questionId}

Attributes:
- EntityType: "ANSWER"
- userId: string
- questionId: string
- selectedIndex: number
- isCorrect: boolean
- answeredAt: string (ISO 8601)
- examType: string

GSI1PK: QUESTION#{questionId}
GSI1SK: USER#{userId}#{timestamp}
```

**アクセスパターン**:
1. ユーザーの回答履歴取得: `PK = USER#{userId} AND SK begins_with ANSWER#`
2. 特定問題の回答履歴: GSI1 で `GSI1PK = QUESTION#{questionId}`
3. ユーザー + 試験種別: Filter で `examType = FE`

---

### 4. WeakAreaAnalytics（苦手分野分析）

```
PK: USER#{userId}
SK: ANALYTICS#{examType}#{category}

Attributes:
- EntityType: "ANALYTICS"
- userId: string
- examType: string
- category: string
- totalAnswers: number
- correctAnswers: number
- accuracyRate: number
- lastUpdatedAt: string (ISO 8601)

GSI1PK: ANALYTICS#{examType}
GSI1SK: USER#{userId}#CATEGORY#{category}
```

**アクセスパターン**:
1. ユーザーの苦手分野取得: `PK = USER#{userId} AND SK begins_with ANALYTICS#`
2. 試験種別の分析: GSI1 で `GSI1PK = ANALYTICS#{examType}`

---

## GSI（Global Secondary Index）設計

### GSI1: エンティティ別・属性別検索

```
GSI1PK (String) - Partition Key
GSI1SK (String) - Sort Key

Projection: ALL
```

**用途**:
- 試験種別・カテゴリ別の問題検索
- 問題IDベースの回答履歴検索
- 苦手分野の集計

---

## アクセスパターン一覧

| パターン | 説明 | Key 設計 |
|---------|------|----------|
| ユーザー情報取得 | userId でユーザー情報取得 | `PK = USER#{userId}, SK = PROFILE` |
| 回答履歴取得 | userId で回答履歴取得 | `PK = USER#{userId}, SK begins_with ANSWER#` |
| 問題取得（試験種別） | examType で問題取得 | GSI1: `GSI1PK = EXAM#{examType}#CATEGORY#ALL` |
| 問題取得（カテゴリ） | examType + category で問題取得 | GSI1: `GSI1PK = EXAM#{examType}#CATEGORY#{category}` |
| 苦手分野取得 | userId で苦手分野取得 | `PK = USER#{userId}, SK begins_with ANALYTICS#` |
| 問題別回答履歴 | questionId で回答履歴取得 | GSI1: `GSI1PK = QUESTION#{questionId}` |

---

## データ整合性

### 1. トランザクション（必要な場合のみ）

DynamoDB のトランザクションを使用して、複数項目の更新を atomic に実行：

```typescript
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

await dynamoClient.send(
  new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: tableName,
          Item: answerHistory,
        },
      },
      {
        Update: {
          TableName: tableName,
          Key: {
            PK: `USER#{userId}`,
            SK: `ANALYTICS#{examType}#{category}`,
          },
          UpdateExpression: 'SET totalAnswers = totalAnswers + :inc, correctAnswers = correctAnswers + :correct',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':correct': isCorrect ? 1 : 0,
          },
        },
      },
    ],
  })
)
```

### 2. Optimistic Locking

バージョン番号を使用して、同時更新による不整合を防止：

```typescript
// Item に version 属性を追加
const item = {
  PK: `USER#{userId}`,
  SK: 'PROFILE',
  version: 1,
  // ...
}

// 更新時に version をチェック
await dynamoClient.send(
  new UpdateCommand({
    TableName: tableName,
    Key: { PK: `USER#{userId}`, SK: 'PROFILE' },
    UpdateExpression: 'SET displayName = :name, version = :newVersion',
    ConditionExpression: 'version = :oldVersion',
    ExpressionAttributeValues: {
      ':name': newName,
      ':oldVersion': 1,
      ':newVersion': 2,
    },
  })
)
```

---

## パフォーマンス最適化

### 1. 適切な Partition Key 設計

- **Partition Key は均等に分散**
- ユーザーデータは `USER#{userId}` で分散
- 問題データは `QUESTION#{questionId}` で分散

### 2. Hot Partition の回避

- 特定の Partition Key に集中しない設計
- カテゴリ別の問題取得は GSI を使用

### 3. Batch 操作の活用

複数項目の取得・書き込みは Batch 操作を使用：

```typescript
import { BatchGetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'

// Batch Get
const result = await dynamoClient.send(
  new BatchGetCommand({
    RequestItems: {
      [tableName]: {
        Keys: [
          { PK: 'QUESTION#FE-2023-01', SK: 'METADATA' },
          { PK: 'QUESTION#FE-2023-02', SK: 'METADATA' },
        ],
      },
    },
  })
)

// Batch Write（最大25項目）
await dynamoClient.send(
  new BatchWriteCommand({
    RequestItems: {
      [tableName]: items.map((item) => ({
        PutRequest: { Item: item },
      })),
    },
  })
)
```

### 4. ページネーション

大量データの取得時は必ずページネーション：

```typescript
let lastEvaluatedKey: Record<string, any> | undefined

const allItems: any[] = []

do {
  const result = await dynamoClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `USER#{userId}` },
      Limit: 100,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  )

  allItems.push(...(result.Items || []))
  lastEvaluatedKey = result.LastEvaluatedKey
} while (lastEvaluatedKey)
```

---

## セキュリティ

### 1. 暗号化

- **保存時の暗号化**: AWS KMS を使用
- **転送時の暗号化**: HTTPS

```yaml
# SAM テンプレート
QuestionsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    SSESpecification:
      SSEEnabled: true
      SSEType: KMS
      KMSMasterKeyId: !Ref KMSKey
```

### 2. IAM ポリシー

Lambda 関数には最小権限を付与：

```yaml
Policies:
  - DynamoDBCrudPolicy:
      TableName: !Ref MainTable
  - Statement:
      - Effect: Allow
        Action:
          - dynamodb:Query
          - dynamodb:GetItem
          - dynamodb:PutItem
          - dynamodb:UpdateItem
        Resource:
          - !GetAtt MainTable.Arn
          - !Sub '${MainTable.Arn}/index/GSI1'
```

---

## データマイグレーション

### スキーマ変更時の戦略

#### 1. 非破壊的変更（推奨）

- 新しい属性を追加
- 古い属性は残す
- アプリケーション側で両方に対応

```typescript
// 古いデータと新しいデータの両方に対応
const displayName = item.displayName ?? item.name ?? 'Unknown'
```

#### 2. バッチマイグレーション

- Scan でデータを取得
- 変換してバッチ書き込み

```typescript
async function migrateData() {
  const items = await scanAllItems(tableName)
  
  for (const item of items) {
    if (item.EntityType === 'USER' && !item.displayName) {
      await dynamoClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: item.PK, SK: item.SK },
          UpdateExpression: 'SET displayName = :name',
          ExpressionAttributeValues: {
            ':name': item.name,
          },
        })
      )
    }
  }
}
```

---

## バックアップ・リカバリ

### Point-in-Time Recovery (PITR)

```yaml
# SAM テンプレート
MainTable:
  Type: AWS::DynamoDB::Table
  Properties:
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
```

### オンデマンドバックアップ

- 重要な変更前に手動バックアップ
- AWS Backup で自動バックアップ

---

## モニタリング

### CloudWatch メトリクス

- **ConsumedReadCapacityUnits**: 読み込みキャパシティ
- **ConsumedWriteCapacityUnits**: 書き込みキャパシティ
- **UserErrors**: クライアントエラー
- **SystemErrors**: システムエラー

### アラート設定

```yaml
# SAM テンプレート
DynamoDBAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: DynamoDB-SystemErrors
    MetricName: SystemErrors
    Namespace: AWS/DynamoDB
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
```

---

## テスト用データ

### DynamoDB Local

開発・テスト環境では DynamoDB Local を使用：

```bash
# Docker で起動
docker run -p 8000:8000 amazon/dynamodb-local
```

```typescript
// テスト用クライアント
const testClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
})
```

---

## 禁止事項

- Scan の多用（Query を使用）
- Hot Partition の放置
- 暗号化の無効化
- バックアップなしの本番運用
- トランザクションの過剰使用（コスト増）
- 適切でない Partition Key（均等分散しない）

---

## 逸脱禁止

本 Rules に反するデータベース設計を行ってはならない。
データは資産であり、適切に保護・管理する必要がある。
