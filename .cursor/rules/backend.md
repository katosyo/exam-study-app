# Backend Rules

## 基本方針

- ビジネスロジックを最優先
- フレームワーク依存は境界に閉じ込める

---

## レイヤ構成（例）

- handler / controller
- service / usecase
- repository
- domain

---

## 実装ルール

- handler は薄く
- domain は副作用を持たない
- DB / 外部API は adapter 経由

---

## エラー処理

- 例外を投げない
- Result型 or 明示的な戻り値
- エラーは列挙型で定義

---

## テスト

- domain / service は必ず単体テスト
- repository は in-memory 実装でテスト
