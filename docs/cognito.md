# Cognito 認証の適用

## 概要

- **未設定時**: Mock 認証（常にログイン成功、userId は `mock-user-id`）
- **環境変数設定時**: Amazon Cognito User Pool でログイン・サインアップ・プロフィール・パスワード変更

## バックエンド（SAM）

1. `sam build && sam deploy` でデプロイすると以下が作成されます。
   - **Cognito User Pool**（メールアドレスをユーザー名、preferred_username / picture を属性）
   - **User Pool Client**（クライアントシークレットなし、USER_PASSWORD_AUTH / USER_SRP_AUTH / REFRESH_TOKEN）
   - User Pool Domain はテンプレートに含めていません（リージョン内で一意のため競合しやすい）。Hosted UI を使う場合はコンソールで手動追加してください。
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

- User Pool Domain はテンプレートに含めていません。ホストUIを使う場合は Cognito コンソールでドメインを追加してください（リージョン内で一意の名前が必要）。
- メール確認を無効にして即ログイン可能にしたい場合は、User Pool の「メッセージのカスタマイズ」や Pre Sign-up Lambda で自動確認するなどの対応が必要です。

## ログイン後に 401 が出る場合

「Failed to load resource: the server responded with a status of 401」は **認証エラー** です。次を確認してください。

1. **NEXT_PUBLIC_API_URL が正しいか**
   - 未設定や空だと、リクエストがフロントと同じオリジン（例: Amplify の URL）に飛び、API Gateway に届きません。デプロイ先の環境変数に SAM の `ApiEndpoint` をそのまま設定してください。

2. **NEXT_PUBLIC_COGNITO_CLIENT_ID がバックエンドと一致しているか**
   - フロントの Client ID と、SAM でデプロイした User Pool Client が同じである必要があります。JWT の `aud` と API Gateway のオーソライザー設定が一致しないと 401 になります。

3. **どのリクエストが 401 か**
   - ブラウザの開発者ツール → Network タブで、ステータス 401 のリクエストの URL を確認してください。
   - `/stats/summary` や `/answers` など認証必須の API なら、上記 1・2 とトークン送信の有無を確認します。
   - 別ドメイン（例: チャットボット用）の 401 の場合は、そのサービス側の設定を確認してください。

4. **CORS**
   - API Gateway の CORS で `Authorization` ヘッダーが許可されている必要があります（本テンプレートでは許可済み）。
