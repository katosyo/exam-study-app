# Cognito 認証の適用

## 概要

- **未設定時**: Mock 認証（常にログイン成功、userId は `mock-user-id`）
- **環境変数設定時**: Amazon Cognito User Pool でログイン・サインアップ・プロフィール・パスワード変更

## バックエンド（SAM）

1. `sam build && sam deploy` でデプロイすると以下が作成されます。
   - **Cognito User Pool**（メールアドレスをユーザー名、preferred_username / picture を属性）
   - **User Pool Client**（クライアントシークレットなし、USER_PASSWORD_AUTH / USER_SRP_AUTH / REFRESH_TOKEN）
   - **User Pool Domain**（ホストUI用。必要に応じて利用）
   - **HttpApi** の JWT オーソライザー（Cognito の issuer / audience を指定）

2. 認証が必要な API:
   - `POST /answers` … 回答送信
   - `GET /stats/summary` … 学習サマリー
   - `GET /history/questions` … 回答履歴

3. 認証不要の API:
   - `GET /questions` … 問題一覧取得

4. デプロイ後の Output から以下を取得し、フロント用の環境変数に設定します。
   - `UserPoolId`
   - `UserPoolClientId`
   - `UserPoolRegion`（または `AWS::Region`）
   - `ApiEndpoint`

## フロントエンド（Next.js）

### 環境変数

Cognito を使う場合は以下を設定します（未設定の場合は Mock 認証になります）。

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | User Pool ID（SAM Output の UserPoolId） |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | User Pool Client ID（SAM Output の UserPoolClientId） |
| `NEXT_PUBLIC_AWS_REGION` | リージョン（例: ap-northeast-1） |
| `NEXT_PUBLIC_API_URL` | API Gateway の URL（SAM Output の ApiEndpoint） |

例（`.env.local`）:

```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com
```

### フロー

- **ログイン**: メール + パスワードで `authenticateUser`。成功時に Id トークンを保持し、API 呼び出しで `Authorization: Bearer <IdToken>` を付与。
- **サインアップ**: `signUp` でユーザー作成。Cognito のメール確認が有効な場合は「確認メールを送りました」と表示し、ログイン画面へリダイレクト。
- **プロフィール**: `updateUserAttributes`（preferred_username / picture）。
- **パスワード変更**: `changePassword`。

## 注意

- User Pool Domain はテンプレートで `{StackName}-{AccountId}` として作成しています。ホストUIを使う場合はこのドメインを利用するか、必要に応じて変更してください。
- メール確認を無効にして即ログイン可能にしたい場合は、User Pool の「メッセージのカスタマイズ」や Pre Sign-up Lambda で自動確認するなどの対応が必要です。
