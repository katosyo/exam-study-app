# 基本情報・応用情報技術者試験 学習アプリ

## 概要
基本情報技術者試験（FE）・応用情報技術者試験（AP）の過去問を4択形式で学習できる Web アプリケーションです。

## 主要機能
- 過去問を4択形式で出題
- 回答後に正誤判定と詳細な解説を表示
- 試験種別（FE/AP）と出題数を指定可能

## 技術スタック

### フロントエンド
- Next.js 14 (App Router + Static Export)
- TypeScript
- React
- AWS Amplify Hosting

### バックエンド
- AWS Lambda (Node.js 20.x + TypeScript)
- API Gateway (HTTP API)
- DynamoDB (オンデマンドモード)
- AWS SAM

## プロジェクト構成

```
.
├── src/                    # Next.js フロントエンド
│   ├── app/               # App Router
│   ├── components/        # UI コンポーネント
│   ├── lib/               # API クライアント
│   └── types/             # 型定義
├── backend/               # Lambda バックエンド
│   └── src/
│       ├── domain/        # ドメインモデル
│       ├── shared/        # 共通ライブラリ
│       ├── repositories/  # DynamoDB アクセス
│       ├── functions/     # Lambda 関数
│       └── scripts/       # データ投入スクリプト
└── template.yaml          # SAM テンプレート
```

## セットアップ

### 1. フロントエンド

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

### 2. バックエンド

```bash
cd backend

# 依存関係インストール
npm install

# ビルド
npm run build
```

### 3. デプロイ（AWS Cloud9 で実行）

#### バックエンド
```bash
# SAM ビルド
sam build

# 初回デプロイ
sam deploy --guided

# 2回目以降
sam deploy
```

#### サンプルデータ投入
```bash
cd backend
export QUESTIONS_TABLE_NAME=<your-table-name>
npx ts-node scripts/seedData.ts
```

#### フロントエンド
```bash
# GitHub に push するだけ
git push

# Amplify が自動でビルド・デプロイ
```

## 環境変数

フロントエンドで以下の環境変数を設定：

```
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.ap-northeast-1.amazonaws.com
```

## 開発フロー

1. **Cursor でコード作成**（ローカル）
2. **Git commit & push**
3. **フロントエンド**: Amplify が自動デプロイ
4. **バックエンド**: Cloud9 で `sam deploy`

## ライセンス
MIT
