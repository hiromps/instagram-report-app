# ユーザー認証のセットアップガイド

このガイドでは、メールアドレスとパスワードによるユーザー認証機能のセットアップ手順を説明します。

## 1. Supabase Email Authの有効化

### 1.1 Supabaseダッシュボードにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択
3. 左メニューから「Authentication」→「Providers」を開く

### 1.2 Email Authを有効化

1. 「Email」プロバイダーを探す
2. 「Enable Email provider」をONにする
3. 「Confirm email」をONにする（メール確認を必須にする）
4. 「Save」をクリック

### 1.3 メールテンプレートの設定（オプション）

1. 「Authentication」→「Email Templates」を開く
2. 「Confirm signup」テンプレートを編集
3. 日本語のメールテンプレートに変更（推奨）

```html
<h2>メールアドレスの確認</h2>
<p>Instagram運用レポートへようこそ！</p>
<p>以下のリンクをクリックして、アカウントを有効化してください：</p>
<p><a href="{{ .ConfirmationURL }}">アカウントを有効化</a></p>
```

## 2. 本番環境用RLSポリシーへの移行

現在のデータベースは開発環境用（匿名アクセス許可）です。
本番環境では、ユーザー認証ベースのRLSポリシーに切り替えます。

### 2.1 本番環境用スキーマの実行

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-schema-production.sql` の内容をコピー
3. SQL Editorに貼り付けて実行

これにより以下が実行されます：
- 既存の匿名アクセスポリシーを削除
- `user_id` カラムを追加
- ユーザー認証ベースのRLSポリシーを作成

### 2.2 既存データへのuser_id設定（必要な場合）

既存のアカウントや記録がある場合、それらに `user_id` を設定する必要があります。

#### テストユーザーの作成

1. アプリでサインアップ（テストユーザーを作成）
2. メール確認リンクをクリック
3. ログイン

#### user_idの確認

```sql
-- 現在ログインしているユーザーのIDを確認
SELECT auth.uid();
```

#### 既存データにuser_idを設定

```sql
-- 既存のすべてのアカウントに自分のuser_idを設定
UPDATE instagram_accounts
SET user_id = 'あなたのuser_id'
WHERE user_id IS NULL;

-- 既存のすべての記録に自分のuser_idを設定
UPDATE instagram_records
SET user_id = 'あなたのuser_id'
WHERE user_id IS NULL;
```

**重要**: 複数ユーザーがいる場合は、各ユーザーごとにデータを分ける必要があります。

## 3. メール送信の設定

### 3.1 開発環境（ローカルテスト）

Supabaseは自動的にメールを送信しますが、開発環境では以下の制限があります：

- 1時間に4通まで
- 確認メールのリンクは24時間有効

### 3.2 本番環境（カスタムSMTP）

本番環境では、カスタムSMTPを設定することを強く推奨します：

1. 「Authentication」→「Settings」を開く
2. 「SMTP Settings」セクションで「Enable Custom SMTP」をON
3. SMTPサーバー情報を入力：
   - SendGrid
   - AWS SES
   - Mailgun
   - など

## 4. アプリケーションの使い方

### 4.1 新規ユーザー登録

1. アプリにアクセス
2. 「アカウントをお持ちでないですか？新規登録」をクリック
3. メールアドレスとパスワード（6文字以上）を入力
4. 「アカウント作成」をクリック
5. 確認メールが届くので、リンクをクリック
6. ログイン画面に戻り、ログイン

### 4.2 ログイン

1. メールアドレスとパスワードを入力
2. 「ログイン」をクリック

### 4.3 ログアウト

- ヘッダー右上の「ログアウト」ボタンをクリック

## 5. セキュリティ設定

### 5.1 パスワードポリシー

Supabaseのデフォルト設定：
- 最小6文字
- 大文字、小文字、数字、記号の組み合わせは不要

変更する場合：
1. 「Authentication」→「Policies」を開く
2. 「Password Requirements」を編集

### 5.2 アカウントロックアウト

失敗ログイン試行の制限：
1. 「Authentication」→「Rate Limits」を開く
2. デフォルトで有効（5回失敗で15分ロック）

### 5.3 セッションタイムアウト

デフォルト設定：
- アクセストークン: 1時間
- リフレッシュトークン: 30日

変更する場合：
1. 「Authentication」→「Settings」を開く
2. 「JWT Expiry」を編集

## 6. トラブルシューティング

### ❌ メールが届かない

**原因**:
- スパムフォルダに入っている
- Supabaseの送信制限（開発環境: 1時間4通）

**解決策**:
1. スパムフォルダを確認
2. カスタムSMTPを設定
3. Supabaseダッシュボードで送信履歴を確認

### ❌ ログインできない

**原因**:
- メールアドレス未確認
- パスワードが間違っている
- アカウントがロックされている

**解決策**:
1. 確認メールのリンクをクリック
2. パスワードを確認（6文字以上）
3. 15分待ってから再試行

### ❌ データが表示されない

**原因**:
- RLSポリシーが正しく設定されていない
- `user_id` が設定されていない

**解決策**:
```sql
-- RLSポリシーを確認
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename LIKE 'instagram_%';

-- user_idを確認
SELECT * FROM instagram_accounts WHERE user_id IS NULL;
SELECT * FROM instagram_records WHERE user_id IS NULL;
```

### ❌ 「Email not confirmed」エラー

**原因**: メールアドレスが確認されていない

**解決策**:
1. 確認メールを再送信:
```sql
-- Supabase SQL Editorで実行
SELECT auth.resend_confirmation_email('user@example.com');
```

2. または、開発環境でメール確認をスキップ:
```sql
-- 開発環境のみ！本番では使わないでください
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

## 7. データ移行チェックリスト

- [ ] Supabase Email Authを有効化
- [ ] 本番環境用RLSポリシーを実行（`supabase-schema-production.sql`）
- [ ] テストユーザーでサインアップ
- [ ] メール確認リンクをクリック
- [ ] ログイン成功を確認
- [ ] 既存データに`user_id`を設定
- [ ] データが正しく表示されることを確認
- [ ] ログアウト→ログインを確認
- [ ] カスタムSMTPを設定（本番環境）

## 8. 参考リンク

- [Supabase Auth公式ドキュメント](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
