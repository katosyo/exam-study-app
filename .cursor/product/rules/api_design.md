# API Design Rules（製品版）

## 目的

本プロジェクトの API は**第三者利用を前提**とし、
以下を重視する：

- ✅ 一貫性・予測可能性
- ✅ セキュリティ（認証・認可）
- ✅ 拡張性・後方互換性
- ✅ エラーハンドリングの明確さ
- ✅ ドキュメント化

---

## 基本方針

### REST API 設計

- RESTful な設計を基本とする
- リソース指向の URL 設計
- HTTP メソッドの適切な使用
- HTTP ステータスコードの正しい使用

### バージョニング

製品版では API バージョニングを導入：

```
https://api.example.com/v1/questions
```

- 破壊的変更時はバージョンを上げる
- 旧バージョンは一定期間サポート

---

## エンドポイント設計

### リソース一覧

| Method | Path | 認証 | 用途 |
|--------|------|------|------|
| POST | /auth/signup | - | ユーザー登録 |
| POST | /auth/login | - | ログイン |
| POST | /auth/refresh | - | トークンリフレッシュ |
| GET | /questions | ✅ | 問題取得 |
| POST | /answers | ✅ | 回答送信 |
| GET | /answers/history | ✅ | 回答履歴取得 |
| GET | /analytics/weak-areas | ✅ | 苦手分野分析 |
| GET | /users/me | ✅ | ユーザー情報取得 |
| PATCH | /users/me | ✅ | ユーザー情報更新 |

### URL 設計ルール

- **名詞を使用**（動詞は禁止）
- **複数形を使用**（`/questions` not `/question`）
- **階層は3階層まで**
- **キャメルケース禁止**（ケバブケースまたはスネークケース）

```
✅ GET /answers/history
✅ GET /analytics/weak-areas
❌ GET /getAnswerHistory
❌ GET /analyticsWeakAreas
```

---

## クエリパラメータ設計

### 問題取得 API

```
GET /questions?exam=FE&limit=10&category=algorithm&difficulty=medium
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| exam | `FE` \| `AP` | ✅ | 試験種別 |
| limit | number (1-50) | ✅ | 取得件数 |
| category | string | - | カテゴリフィルタ |
| difficulty | `easy` \| `medium` \| `hard` | - | 難易度フィルタ |

### 回答履歴取得 API

```
GET /answers/history?exam=FE&limit=20&offset=0
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| exam | `FE` \| `AP` | - | 試験種別フィルタ |
| limit | number (1-100) | - | 取得件数（デフォルト: 20） |
| offset | number | - | オフセット（ページネーション） |

---

## リクエストボディ設計

### POST /answers（回答送信）

```json
{
  "questionId": "FE-2023-01",
  "selectedIndex": 2
}
```

### POST /auth/signup（ユーザー登録）

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "山田太郎"
}
```

**ルール**:
- 必須フィールドと任意フィールドを明確に区別
- ネストは2階層まで
- 配列の最大長を定義

---

## レスポンス設計

### 成功レスポンス（GET /questions）

```json
{
  "questions": [
    {
      "id": "FE-2023-01",
      "examType": "FE",
      "category": "algorithm",
      "subCategory": "sort",
      "difficulty": "medium",
      "text": "〇〇について正しいものはどれか",
      "choices": ["A", "B", "C", "D"],
      "answerIndex": 2,
      "explanation": "〇〇の理由によりCが正しい"
    }
  ],
  "metadata": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

### 成功レスポンス（POST /answers）

```json
{
  "result": {
    "isCorrect": true,
    "correctIndex": 2,
    "explanation": "〇〇の理由によりCが正しい",
    "answeredAt": "2026-01-23T10:30:00Z"
  }
}
```

### ルール

- **一貫した構造**（すべてのエンドポイントで統一）
- **不要な階層は作らない**
- **ISO 8601 形式の日時**
- **null より空配列・空オブジェクト**

---

## エラーレスポンス設計

### 基本構造

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "入力内容に誤りがあります",
    "details": {
      "field": "exam",
      "reason": "exam must be FE or AP"
    }
  }
}
```

### HTTP ステータスコードとエラーコード

| Status | Code | Message | Description |
|--------|------|---------|-------------|
| 400 | INVALID_PARAMETER | 入力内容に誤りがあります | パラメータ不正 |
| 401 | UNAUTHORIZED | ログインが必要です | 認証トークンなし・無効 |
| 403 | FORBIDDEN | この操作を実行する権限がありません | 認可エラー |
| 404 | NOT_FOUND | 指定されたリソースが見つかりませんでした | リソース不存在 |
| 409 | CONFLICT | リソースが既に存在します | 重複エラー |
| 429 | RATE_LIMIT_EXCEEDED | リクエスト数が上限を超えました | レート制限 |
| 500 | INTERNAL_ERROR | サーバーエラーが発生しました | 内部エラー |
| 503 | SERVICE_UNAVAILABLE | 一時的にサービスを利用できません | メンテナンス |

### エラーメッセージのルール

- **技術的詳細を含めない**
- **ユーザーが取るべきアクションを示す**
- **具体的すぎるエラーメッセージは避ける**（セキュリティリスク）

```
✅ 「メールアドレスまたはパスワードが正しくありません」
❌ 「パスワードが一致しません」（メールアドレスの存在が判明してしまう）
```

---

## 認証・認可

### 認証フロー

1. **ユーザー登録** → `POST /auth/signup`
2. **ログイン** → `POST /auth/login` → JWT トークン取得
3. **API 呼び出し** → `Authorization: Bearer <token>`
4. **トークンリフレッシュ** → `POST /auth/refresh`

### 認証ヘッダー

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 認可チェック

- ユーザーは**自分のデータのみ**アクセス可能
- 管理者権限が必要な操作は明示

---

## バリデーションルール

### 入力値検証

すべての入力値に対して以下を検証：

1. **型チェック**（string / number / boolean）
2. **必須チェック**（required fields）
3. **範囲チェック**（min / max）
4. **形式チェック**（email / URL / date）
5. **長さチェック**（minLength / maxLength）

### バリデーションエラーの詳細

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "入力内容に誤りがあります",
    "details": {
      "fields": [
        {
          "field": "email",
          "reason": "有効なメールアドレスを入力してください"
        },
        {
          "field": "password",
          "reason": "パスワードは8文字以上である必要があります"
        }
      ]
    }
  }
}
```

---

## ページネーション

### Offset-based Pagination

```
GET /answers/history?limit=20&offset=40
```

レスポンス:

```json
{
  "data": [...],
  "metadata": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasNext": true
  }
}
```

### Cursor-based Pagination（将来検討）

大量データの場合は Cursor-based を検討：

```
GET /answers/history?limit=20&cursor=abc123
```

---

## レート制限

### 制限値

- **認証済みユーザー**: 1000リクエスト/時間
- **未認証**: 100リクエスト/時間

### レート制限ヘッダー

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643068800
```

### レート制限超過時

```
HTTP/1.1 429 Too Many Requests

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "リクエスト数が上限を超えました。しばらくしてから再度お試しください。",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

---

## CORS 設定

### 許可する設定

```
Access-Control-Allow-Origin: https://your-app.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### プリフライトリクエスト

OPTIONS リクエストに適切に応答：

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://your-app.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## API ドキュメント

### OpenAPI (Swagger) の使用

製品版では**OpenAPI 仕様書を必須**とする：

```yaml
openapi: 3.0.0
info:
  title: Exam Study App API
  version: 1.0.0
paths:
  /questions:
    get:
      summary: 問題取得
      parameters:
        - name: exam
          in: query
          required: true
          schema:
            type: string
            enum: [FE, AP]
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuestionsResponse'
```

### ドキュメントの自動生成

- コードから OpenAPI 仕様を生成（`tsoa` など）
- Swagger UI でドキュメント公開

---

## 禁止事項

- 動詞を含む URL（`/getQuestions`）
- HTTP メソッドの誤用（GET で更新操作など）
- 技術的詳細を含むエラーメッセージ
- 認証なしでユーザーデータにアクセス
- バリデーションの省略
- ドキュメントなしの API 公開

---

## 逸脱禁止

本 Rules に反する API 設計・実装を提案してはならない。
例外が必要な場合は **理由・影響・代替案** を明示すること。
