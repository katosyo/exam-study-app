# AWS SAM Rules

## 目的

本プロジェクトは AWS SAM を用いたサーバーレスバックエンドとして実装する。
PoC / MVP フェーズでは **工数最小・低コスト・構成単純化** を最優先としつつ、
AWS Well-Architected Framework（特に Serverless Best Practices）に**過剰適用しない範囲で**準拠することを目的とする。

---

## インフラ構成の原則

* **可用性・スケーラビリティ・マルチリージョンは考慮しない（PoC前提）**
* すべてのバックエンドリソースは **AWS SAM で管理** する
* 手動構築は禁止（AWS Console 操作は原則不可）
* 構成は「理解しやすさ・壊しやすさ」を優先する
* 本番相当環境は 1 環境のみとする

---

## 使用を許可する AWS サービス

* AWS Lambda
* Amazon API Gateway
* Amazon DynamoDB
* Amazon CloudWatch
* AWS Amplify Hosting（※ フロントエンド専用）
* Amazon CloudFront（Amplify が内部利用する範囲のみ）

---

## 使用を禁止する AWS サービス

* EC2
* ECS / EKS
* RDS / Aurora
* Elastic Beanstalk
* App Runner
* Step Functions（MVPでは使用しない）
* Cognito（MVPでは使用しない）
* SQS / SNS（MVPでは使用しない）

---

## Lambda に関するルール

* Lambda は **Stateless** とする
* セッション管理は禁止
* ファイルの永続化は禁止（`/tmp` を含む）
* 1 Lambda に 1 つの責務を持たせる
* ビジネスロジックのみを実装する
* インフラ制御・AWS SDK 操作は最小限にする
* 環境依存の値は Environment Variables で管理する
* 処理時間は数秒以内を前提とする

---

## API Gateway に関するルール

* REST API または HTTP API を使用する
* MVP フェーズでは **認証・認可は実装しない**
* API は JSON のみを扱う
* フロントエンドから直接呼ばれる API のみを公開する
* API 設計はフロントエンド都合を優先する（過度な汎用化は禁止）

---

## DynamoDB に関するルール

* DynamoDB はマネージドデータストアとして使用する
* **単一テーブル設計を基本** とする
* Scan を前提とした設計は禁止
* パーティションキー / ソートキーの設計を README 等に明示すること
* MVP では以下を使用しない

  * 強い整合性
  * トランザクション
  * 複雑な GSI

---

## フロントエンドとの責務分離

* フロントエンドは **AWS Amplify Hosting** でホスティングする
* バックエンドは **SAM + API Gateway + Lambda** のみで構成する
* フロントエンドは API Gateway 経由でのみバックエンドにアクセスする
* フロントエンドに AWS SDK を直接持ち込まない
* 認証情報・AWS クレデンシャルをフロントエンドに置かない

---

## ローカル開発ルール

* `sam local start-api` でローカル起動できること
* DynamoDB Local またはモックで動作確認可能であること
* ローカル専用コード・分岐を本番用 Lambda に含めない
* ローカル検証が困難な場合は **AWS 上の dev 相当環境で代替確認** してよい

---

## デプロイに関するルール

* バックエンドは `sam deploy` によるデプロイを前提とする
* `sam deploy --guided` は初回のみ手動実行を許可する
* フロントエンドは Git push による Amplify 自動デプロイとする
* CI/CD への拡張を妨げない構成とする

---

## MVPスコープ制約

* ログイン・認証機能は実装しない
* 回答履歴の永続化は行わない
* 分析・集計処理は行わない
* バッチ処理・定期実行は実装しない

---

## 逸脱禁止

本 Rules に反する構成・技術選定・実装案を提案してはならない。
必要な変更がある場合は、**理由・影響範囲・代替案** を必ず明示すること。
