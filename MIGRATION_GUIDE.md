# データベース移行ガイド

## エラーが発生した場合の対処方法

「policy already exists」エラーが発生した場合は、以下の手順で解決できます。

## 手順1: ポリシーのクリーンアップ

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-cleanup-policies.sql` の内容をコピー
3. SQL Editorに貼り付けて実行
4. "Cleanup completed!" メッセージを確認

## 手順2: 本番環境用スキーマの実行

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-schema-production.sql` の内容をコピー
3. SQL Editorに貼り付けて実行
4. 実行完了を確認

## 手順3: user_idの設定（既存データがある場合）

### 3.1 自分のuser_idを確認

```sql
-- 現在ログインしているユーザーのIDを取得
SELECT auth.uid();
```

このコマンドを実行して表示されたUUID（例：`123e4567-e89b-12d3-a456-426614174000`）をコピーしてください。

### 3.2 既存データにuser_idを設定

```sql
-- あなたのuser_idに置き換えてください
UPDATE instagram_accounts
SET user_id = 'あなたのuser_id'
WHERE user_id IS NULL;

UPDATE instagram_records
SET user_id = 'あなたのuser_id'
WHERE user_id IS NULL;
```

**例**:
```sql
UPDATE instagram_accounts
SET user_id = '123e4567-e89b-12d3-a456-426614174000'
WHERE user_id IS NULL;

UPDATE instagram_records
SET user_id = '123e4567-e89b-12d3-a456-426614174000'
WHERE user_id IS NULL;
```

### 3.3 更新を確認

```sql
-- user_idが設定されていないアカウントを確認（0件であればOK）
SELECT COUNT(*) as accounts_without_user_id
FROM instagram_accounts
WHERE user_id IS NULL;

-- user_idが設定されていない記録を確認（0件であればOK）
SELECT COUNT(*) as records_without_user_id
FROM instagram_records
WHERE user_id IS NULL;
```

## 手順4: 動作確認

1. アプリケーションにアクセス
2. ログイン
3. アカウント一覧が表示されることを確認
4. 記録が表示されることを確認

## トラブルシューティング

### ❌ データが表示されない

**原因**: user_idが設定されていない

**解決策**:
```sql
-- データを確認
SELECT id, account_name, user_id FROM instagram_accounts;

-- user_idがNULLの場合は、手順3を実行
```

### ❌ ログインできない

**原因**: メールアドレスが確認されていない

**解決策**:
1. 確認メールのリンクをクリック
2. または、開発環境では以下のSQLで強制的に確認:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'あなたのメールアドレス';
```

### ❌ アカウントを作成できない

**原因**: user_idが自動設定されていない

**解決策**: dataService.tsとsupabaseService.tsを確認してください。
`createAccount()`メソッドでuser_idを自動設定する必要があります。

## 現在の状態を確認

```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('instagram_accounts', 'instagram_records');

-- ポリシー一覧を確認
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('instagram_accounts', 'instagram_records')
ORDER BY tablename, cmd;

-- user_idカラムの存在確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'instagram_accounts'
  AND column_name = 'user_id';
```

## チェックリスト

- [ ] `supabase-cleanup-policies.sql`を実行
- [ ] `supabase-schema-production.sql`を実行
- [ ] 自分のuser_idを確認
- [ ] 既存データにuser_idを設定
- [ ] データが表示されることを確認
- [ ] 新しいアカウントを作成できることを確認
- [ ] 新しい記録を作成できることを確認
- [ ] ログアウト→ログインを確認

## さらにヘルプが必要な場合

`AUTH_SETUP.md`を参照してください。詳しいセットアップ手順とトラブルシューティングが記載されています。
