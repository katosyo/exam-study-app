# AWS SAM Rules

## 目的
本プロジェクトは AWS SAM を用いたサーバーレスアプリケーションとして実装する。
AWS Well-Architected Framework（特に Serverless Best Practices）に準拠することを目的とする。

---

## インフラ構成の原則

- インフラ管理は **AWS SAM のみ** を使用する
- 手動での AWS コンソール操作を前提とした設計は禁止
- CloudFormation / SAM で再現可能であることを必須とする

---

## 使用を許可する AWS サービス

- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon S3
- Amazon CloudFront
- Amazon CloudWatch

---

## 使用を禁止する AWS サービス

- EC2
- ECS / EKS
- RDS / Aurora
- Elastic Beanstalk
- App Runner
- Step Functions（MVPでは使用しない）
- Cognito（MVPでは使用しない）

---

## Lambda に関するルール

- Lambda は **Stateless** とする
- セッション管理は禁止
- ファイルの永続化は禁止（/tmp を含む）
- 1 Lambda に 1 つの責務を持たせる
- ビジネスロジックのみを実装する
- 環境依存の値は Environment Variables で管理する

---

## API Gateway に関するルール

- REST API もしくは HTTP API を使用する
- 認証は MVP では実装しない
- API は JSON のみを扱う

---

## DynamoDB に関するルール

- DynamoDB はマネージドデータストアとして使用する
- 単一テーブル設計を基本とする
- Scan を前提とした設計は禁止
- パーティションキー / ソートキーの設計を明示すること
- MVP では強い整合性やトランザクションは使用しない

---

## フロントエンドとの責務分離

- フロントエンドは S3 + CloudFront でホスティングする
- バックエンド API は Lambda 経由でのみアクセスする
- フロントエンドに AWS SDK を直接持ち込まない

---

## ローカル開発ルール

- `sam local start-api` でローカル起動できること
- DynamoDB Local もしくはモックで動作確認可能であること
- ローカル専用コードを本番用 Lambda に含めない

---

## デプロイに関するルール

- `sam deploy` によるデプロイを前提とする
- `sam deploy --guided` は初回のみ人間が実行する
- CI/CD を前提とした構成に拡張可能であること

---

## MVPスコープ制約

- ログイン・認証機能は実装しない
- 回答履歴の永続化は行わない
- 分析・集計処理は行わない
- バッチ処理は実装しない

---

## 逸脱禁止

本 Rules に反する構成・技術選定・実装案を提案してはならない。
必要な変更がある場合は、必ず理由と代替案を明示すること。
