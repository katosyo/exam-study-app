# Frontend Rules（製品版）

## 基本方針

本プロジェクトのフロントエンドは**第三者利用を前提**とし、
以下を重視する：

- ✅ ユーザー体験（UX）の質
- ✅ パフォーマンス・レスポンス速度
- ✅ エラーハンドリング・ユーザーへのフィードバック
- ✅ アクセシビリティ
- ✅ 保守性・拡張性

---

## 技術前提

### 基本構成

- React + TypeScript
- Next.js 14 (App Router + Static Export)
- AWS Amplify Hosting
- SSR は使用しない（Static Export を維持）

### 状態管理

- **認証状態**: Context API または Zustand
- **サーバー状態**: TanStack Query (React Query) を推奨
- **UI状態**: useState / useReducer

### 追加ライブラリ（検討）

- **フォームバリデーション**: React Hook Form + Zod
- **スタイリング**: Tailwind CSS または CSS Modules
- **UI コンポーネント**: shadcn/ui または Radix UI（アクセシビリティ対応）

---

## コンポーネント設計

### 設計原則

- **単一責任の原則**: 1コンポーネント = 1責務
- **Presentational / Container の分離**を厳守
- **Props の最小化**: 必要最小限のデータのみ受け取る
- **再利用性**: 3回以上使う場合はコンポーネント化

### コンポーネント分類

#### 1. Page Component（ページ）

- Next.js の `app/` 配下に配置
- データ取得・認証チェックを担当
- レイアウト・複数のコンテナを組み合わせ

#### 2. Container Component（コンテナ）

- ビジネスロジック・状態管理を担当
- API 呼び出し・副作用を持つ
- Presentational Component を組み合わせて構成

#### 3. Presentational Component（プレゼンテーション）

- 純粋な UI 表示のみ
- props を受け取り、JSX を返す
- 副作用を持たない
- テストが容易

#### 4. Utility Component（ユーティリティ）

- Layout / ErrorBoundary / Loading など
- アプリケーション全体で共通使用

---

## Hooks / 副作用の扱い

### Custom Hooks の設計

- **1 Hooks = 1 責務**
- 副作用（API・タイマー・localStorage）は Hooks に閉じる
- `useEffect` の依存配列を正しく設定
- クリーンアップ処理を必ず実装

### Hooks の命名規則

```
use{機能名}
```

例：
- `useAuth()`: 認証状態の管理
- `useQuiz()`: クイズロジックの管理
- `useAnswerHistory()`: 回答履歴の取得

### useEffect の使用ルール

- **依存配列を正しく設定**（ESLint の警告を無視しない）
- 無限ループに注意
- クリーンアップが必要な場合は必ず実装
- 可能な限り `useEffect` を減らす（React Query などで代替）

---

## 状態管理

### 状態の分類

#### 1. UI 状態（Local State）

- コンポーネント内部の表示制御
- `useState` / `useReducer` で管理
- 親コンポーネントに露出しない

#### 2. サーバー状態（Server State）

- API から取得したデータ
- **TanStack Query (React Query)** で管理
- キャッシュ・再取得・楽観的更新を活用

#### 3. グローバル状態（Global State）

- 認証情報・ユーザープロフィール
- Context API または Zustand で管理
- 過剰なグローバル化は禁止

### サーバー状態管理（React Query 推奨）

```tsx
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['questions', { exam, limit }],
  queryFn: () => fetchQuestions({ exam, limit }),
  staleTime: 5 * 60 * 1000, // 5分
})
```

**メリット**:
- キャッシュ管理が自動
- ローディング・エラー状態の統一
- 楽観的更新のサポート

---

## API 連携ルール

### API クライアントの設計

- `lib/api/` ディレクトリに集約
- 認証トークンの自動付与
- エラーハンドリングの統一
- リトライ・タイムアウトの設定

### エラーハンドリング

```tsx
// ❌ 悪い例：エラーを無視
try {
  await api.submitAnswer(answerId)
} catch (e) {
  console.log(e)
}

// ✅ 良い例：ユーザーにフィードバック
try {
  await api.submitAnswer(answerId)
  toast.success('回答を送信しました')
} catch (e) {
  if (e instanceof ApiError) {
    toast.error(e.userMessage)
  } else {
    toast.error('予期しないエラーが発生しました')
  }
}
```

### レスポンス型の変換

- API レスポンスを**必ずフロントエンド用の型に変換**
- `zod` などでランタイムバリデーション

```tsx
import { z } from 'zod'

const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  choices: z.array(z.string()),
  answerIndex: z.number(),
  explanation: z.string(),
})

export type Question = z.infer<typeof QuestionSchema>
```

---

## エラーハンドリング・ユーザーフィードバック

### Error Boundary の実装

- アプリケーション全体を Error Boundary でラップ
- ページ単位でも Error Boundary を配置
- エラー時に適切なフォールバック UI を表示

### ローディング状態の表示

- API 呼び出し中は必ずローディング表示
- スケルトンスクリーンの活用
- 長時間かかる処理はプログレスバー

### トースト通知

- 成功・エラーをユーザーに明示
- 技術的詳細は露出しない
- 具体的なアクションを提示

```tsx
// ✅ 良い例
toast.error('問題の取得に失敗しました。しばらくしてから再度お試しください。')

// ❌ 悪い例
toast.error('Error: DynamoDB GetItem failed')
```

---

## パフォーマンス最適化

### 必須の最適化

- **コード分割**: 動的インポート (`React.lazy` / `next/dynamic`)
- **画像最適化**: Next.js Image コンポーネント使用
- **メモ化**: `React.memo` / `useMemo` / `useCallback` の適切な使用
- **仮想化**: 長いリストは `react-window` などで仮想化

### 最適化の判断基準

- 実測して遅い場合のみ最適化
- パフォーマンスプロファイラで測定
- 過剰な最適化は禁止（可読性を優先）

---

## アクセシビリティ

### 必須対応

- **セマンティック HTML**: `<button>` / `<nav>` / `<main>` など
- **キーボード操作**: Tab / Enter / Esc で操作可能
- **ARIA 属性**: 適切な `aria-label` / `aria-describedby`
- **コントラスト比**: WCAG AA 基準を満たす

### フォーカス管理

- モーダル表示時にフォーカスをトラップ
- モーダルクローズ時に元の位置に戻す
- フォーカスインジケーターを消さない

---

## ディレクトリ構成

```
src/
 ├─ app/                 # Next.js App Router（ページ）
 │   ├─ (auth)/         # 認証が必要な画面
 │   ├─ login/
 │   └─ layout.tsx
 ├─ components/          # UIコンポーネント
 │   ├─ ui/             # 基本UIコンポーネント
 │   ├─ features/       # 機能別コンポーネント
 │   └─ layouts/        # レイアウトコンポーネント
 ├─ hooks/              # Custom Hooks
 ├─ lib/                # ライブラリ・ユーティリティ
 │   ├─ api/           # API クライアント
 │   └─ utils/         # 汎用関数
 ├─ types/              # 型定義
 └─ context/            # Context API
```

---

## セキュリティ

### 認証トークンの管理

- **localStorage または httpOnly Cookie** に保存
- XSS 対策を徹底
- トークンの有効期限管理

### 機密情報の扱い

- API キー・シークレットはフロントエンドに露出しない
- 環境変数は `NEXT_PUBLIC_` プレフィックスのみ公開

---

## テスト

### 必須テスト

- **Presentational Component**: Storybook + Vitest
- **Custom Hooks**: `@testing-library/react-hooks`
- **ユーティリティ関数**: Vitest

### E2E テスト

- Playwright または Cypress
- 重要なユーザーフローのみ

---

## 禁止事項

- `any` の使用
- API レスポンスをそのまま UI で使用
- エラーを無視する実装
- 技術的詳細をユーザーに露出
- アクセシビリティを無視した実装
- グローバル状態の乱用

---

## 逸脱禁止

本 Rules に反するフロントエンド実装を提案してはならない。
例外が必要な場合は **理由・影響・代替案** を明示すること。
