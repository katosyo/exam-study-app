# デプロイ構成（AWS サーバーレス / MVP）

## 基本方針
- AWS Well-Architected Framework に準拠
- サーバレスを前提とする
- MVPではシンプルさを最優先する

## フロントエンド
- Next.js（Static Export）
- S3 に配置
- CloudFront で配信

## バックエンド
- AWS Lambda
- API Gateway 経由で公開
- Stateless API とする

## データベース
- DynamoDB
- 問題データを保存

## 認証
- MVPでは未実装

## インフラ管理
- AWS SAM を使用
- 手動リソース作成は禁止

## 将来拡張
- Cognito による認証追加
- 回答履歴用 DynamoDB テーブル追加
- 分析用 Lambda / Step Functions 追加
