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
- TailwindCSS
- AWS Amplify Hosting

### バックエンド
- AWS Lambda (Node.js 20.x + TypeScript)
- API Gateway (HTTP API)
- DynamoDB (オンデマンドモード)
- AWS SAM

## 開発環境
- エディタ: Cursor
- バージョン管理: Git + GitHub
- デプロイ: AWS Amplify Hosting (フロントエンド) + AWS SAM (バックエンド)

## フェーズ
- **PoC**: 基本機能実装、認証なし
- **正式版**: Cognito 認証、CloudWatch メトリクス詳細

## セットアップ（予定）
```bash
# フロントエンド
cd frontend
npm install
npm run dev

# バックエンド
cd backend
npm install
sam build
sam local start-api
```

## デプロイ
- フロントエンド: Git push で自動デプロイ（Amplify）
- バックエンド: Cloud9 で `sam deploy`

## ライセンス
MIT