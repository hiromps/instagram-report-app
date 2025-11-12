-- ============================================================================
-- Instagram運用レポートアプリ用のSupabaseスキーマ（本番環境用）
-- ============================================================================
-- このスクリプトは、Supabase Authを使用したユーザー認証ベースの
-- Row Level Security (RLS) ポリシーを実装します。
-- ============================================================================

-- 注意: このスクリプトを実行する前に、基本的なテーブル構造が
--       supabase-schema.sqlによって作成されていることを確認してください。

-- ----------------------------------------------------------------------------
-- 1. 既存の開発環境用ポリシーを削除
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow anonymous read access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous insert access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous update access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous delete access to instagram_accounts" ON instagram_accounts;

DROP POLICY IF EXISTS "Allow anonymous read access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous insert access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous update access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous delete access to instagram_records" ON instagram_records;

-- ----------------------------------------------------------------------------
-- 2. テーブルにuser_idカラムを追加（Supabase Auth連携用）
-- ----------------------------------------------------------------------------

-- instagram_accountsテーブルにuser_idカラムを追加
ALTER TABLE instagram_accounts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 既存データに対してuser_idを設定する場合は、手動で実行してください
-- UPDATE instagram_accounts SET user_id = 'your-user-id' WHERE user_id IS NULL;

-- instagram_recordsテーブルにuser_idカラムを追加
ALTER TABLE instagram_records
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 既存データに対してuser_idを設定する場合は、手動で実行してください
-- UPDATE instagram_records SET user_id = 'your-user-id' WHERE user_id IS NULL;

-- ----------------------------------------------------------------------------
-- 3. インデックスの追加
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id
  ON instagram_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_instagram_records_user_id
  ON instagram_records(user_id);

-- 複合インデックス: user_idとaccount_idで効率的に検索
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id_account_id
  ON instagram_accounts(user_id, account_id);

CREATE INDEX IF NOT EXISTS idx_instagram_records_user_id_account_id
  ON instagram_records(user_id, account_id);

-- ----------------------------------------------------------------------------
-- 4. 本番環境用RLSポリシー（認証済みユーザーのみアクセス可能）
-- ----------------------------------------------------------------------------

-- 既存の本番環境用ポリシーを削除（再実行時のエラー防止）
DROP POLICY IF EXISTS "Users can view their own accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON instagram_accounts;

DROP POLICY IF EXISTS "Users can view their own records" ON instagram_records;
DROP POLICY IF EXISTS "Users can insert their own records" ON instagram_records;
DROP POLICY IF EXISTS "Users can update their own records" ON instagram_records;
DROP POLICY IF EXISTS "Users can delete their own records" ON instagram_records;

-- instagram_accountsテーブルのポリシー
-- ユーザーは自分のアカウントのみ閲覧可能
CREATE POLICY "Users can view their own accounts"
  ON instagram_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のアカウントのみ作成可能
CREATE POLICY "Users can insert their own accounts"
  ON instagram_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のアカウントのみ更新可能
CREATE POLICY "Users can update their own accounts"
  ON instagram_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のアカウントのみ削除可能
CREATE POLICY "Users can delete their own accounts"
  ON instagram_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- instagram_recordsテーブルのポリシー
-- ユーザーは自分の記録のみ閲覧可能
CREATE POLICY "Users can view their own records"
  ON instagram_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の記録のみ作成可能
CREATE POLICY "Users can insert their own records"
  ON instagram_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の記録のみ更新可能
CREATE POLICY "Users can update their own records"
  ON instagram_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の記録のみ削除可能
CREATE POLICY "Users can delete their own records"
  ON instagram_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. 確認用クエリ
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE 'Production RLS policies setup completed!';
  RAISE NOTICE 'User-based access control enabled';
  RAISE NOTICE 'Each user can only access their own data';
  RAISE NOTICE 'Please ensure user_id is set for all existing records';
END $$;

-- ----------------------------------------------------------------------------
-- 6. 既存データのマイグレーション例
-- ----------------------------------------------------------------------------

-- 既存データに対してuser_idを設定する必要がある場合は、
-- 以下のクエリを参考にしてください（実際のuser_idに置き換えてください）

/*
-- 例: 特定のユーザーIDを既存のすべてのアカウントに設定
UPDATE instagram_accounts
SET user_id = 'your-actual-user-id-here'
WHERE user_id IS NULL;

-- 例: 特定のユーザーIDを既存のすべての記録に設定
UPDATE instagram_records
SET user_id = 'your-actual-user-id-here'
WHERE user_id IS NULL;

-- 例: account_idに基づいて異なるuser_idを設定
UPDATE instagram_accounts
SET user_id = CASE
  WHEN account_id = 'account1' THEN 'user-id-1'
  WHEN account_id = 'account2' THEN 'user-id-2'
  ELSE user_id
END
WHERE user_id IS NULL;
*/
