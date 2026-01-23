# Backend Rules

## 基本方針

本プロジェクトのバックエンドは **PoC / MVP 前提** とし、
アーキテクチャの美しさよりも **実装スピード・理解しやすさ・壊しやすさ** を優先する。

* 主目的は **フロントエンドに必要なデータを返すこと**
* ビジネスロジックは最小限に留める
* 過剰なレイヤ分割・抽象化は行わない

---

## アーキテクチャ方針

* AWS Lambda + API Gateway を前提とする
* フレームワーク依存（AWS SDK / Lambda event 等）は **handler 層に閉じる**
* Clean Architecture は **思想のみ参考** にし、厳密適用はしない

---

## レイヤ構成（目安）

以下はあくまで **目安** であり、
小規模な Lambda では統合してもよい。

* handler（API Gateway / Lambda 境界）
* service（ユースケース・処理の流れ）
* repository（DynamoDB アクセス）
* domain（型・純粋ロジック）

※ 1 Lambda = 1 ユースケースを基本とする

---

## 実装ルール

* handler は **薄く** 実装する

* handler では以下のみを行う

  * 入力取得・バリデーション
  * service 呼び出し
  * レスポンス整形

* domain は **副作用を持たない**

* DB / 外部 API へのアクセスは repository に閉じる

* 共通処理の過剰な共通化は禁止

---

## エラーハンドリング

* 例外の多用は禁止（throw は境界でのみ許可）
* service / domain 層では **明示的な戻り値** を基本とする

例：

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppError }
```

* エラーは enum または union 型で定義する
* API レスポンス用のエラー変換は handler で行う

---

## ログ

* ログ出力は handler 層に集約する
* `console.log` / `console.error` の使用を許可する（PoC 前提）
* 機密情報をログに出力してはならない

---

## テスト方針（PoC）

* **テストは必須ではない**

* ただし以下は推奨とする

  * domain の純粋関数
  * 重要な service ロジック

* repository のテストは行わなくてよい

* in-memory 実装の強制はしない

* テストよりも **実際に動かして確認** を優先する

---

## 禁止事項

* 過剰なレイヤ分割（小規模 Lambda で 5 層以上）
* 汎用 repository / 汎用 service の作成
* フレームワーク都合を domain に漏らすこと
* 将来拡張を理由とした複雑化

---

## 逸脱禁止

本 Rules に反するバックエンド構成・実装案を提案してはならない。
例外が必要な場合は **理由・影響・代替案** を明示すること。
