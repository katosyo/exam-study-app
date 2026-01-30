# Cognito セットアップ手順

## 問題: IAM 権限不足

GitHub Actions のデプロイ時に以下のエラーが発生する場合：

```
is not authorized to perform: cognito-idp:CreateUserPool
```

原因: `GitHubActionsDeployRole` に Cognito の権限が不足しています。

## 解決方法

### 方法1: IAM ロールに Cognito 権限を追加（推奨）

1. AWS マネジメントコンソール → **IAM** → **ロール**
2. `GitHubActionsDeployRole` を選択
3. **権限を追加** → **インラインポリシーを作成**
4. JSON タブで以下を貼り付け:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:CreateUserPool",
        "cognito-idp:UpdateUserPool",
        "cognito-idp:DeleteUserPool",
        "cognito-idp:DescribeUserPool",
        "cognito-idp:CreateUserPoolClient",
        "cognito-idp:UpdateUserPoolClient",
        "cognito-idp:DeleteUserPoolClient",
        "cognito-idp:DescribeUserPoolClient",
        "cognito-idp:CreateUserPoolDomain",
        "cognito-idp:DeleteUserPoolDomain",
        "cognito-idp:DescribeUserPoolDomain"
      ],
      "Resource": "*"
    }
  ]
}
```

5. **次へ** → ポリシー名: `CognitoUserPoolManagement` → **ポリシーを作成**

これで `sam deploy` が Cognito User Pool を作成できるようになります。

### 方法2: Cognito を別スタックで管理

Cognito リソースを別スタック（例: `exam-study-app-cognito`）で作成し、メインスタックから参照する方法もあります。

1. Cognito 専用の SAM テンプレートを作成（`cognito-template.yaml`）
2. 手動で `sam deploy -t cognito-template.yaml --stack-name exam-study-app-cognito` を実行
3. メインの `template.yaml` で `!ImportValue` を使って User Pool ID を参照

この方法は、Cognito リソースを別途管理したい場合に適しています。
