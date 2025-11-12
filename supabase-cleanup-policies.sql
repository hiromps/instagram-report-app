-- ============================================================================
-- RLSポリシークリーンアップスクリプト
-- ============================================================================
-- エラーが発生した場合、このスクリプトを実行してから
-- supabase-schema-production.sqlを再実行してください
-- ============================================================================

-- 開発環境用ポリシーを削除
DROP POLICY IF EXISTS "Allow anonymous read access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous insert access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous update access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous delete access to instagram_accounts" ON instagram_accounts;

DROP POLICY IF EXISTS "Allow anonymous read access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous insert access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous update access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous delete access to instagram_records" ON instagram_records;

-- 本番環境用ポリシーを削除
DROP POLICY IF EXISTS "Users can view their own accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON instagram_accounts;

DROP POLICY IF EXISTS "Users can view their own records" ON instagram_records;
DROP POLICY IF EXISTS "Users can insert their own records" ON instagram_records;
DROP POLICY IF EXISTS "Users can update their own records" ON instagram_records;
DROP POLICY IF EXISTS "Users can delete their own records" ON instagram_records;

-- 確認用クエリ
SELECT
  'Cleanup completed!' as message,
  COUNT(*) as remaining_policies
FROM pg_policies
WHERE tablename IN ('instagram_accounts', 'instagram_records');
