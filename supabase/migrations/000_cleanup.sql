-- ===============================================
-- クリーンアップスクリプト
-- ===============================================
-- 注意: このスクリプトは既存のデータを全て削除します
-- 開発環境でのみ使用してください
-- 本番環境では絶対に実行しないでください
-- ===============================================

-- テーブルを削除（CASCADEで関連する全てを削除）
-- CASCADE指定により、ポリシー、トリガー、制約なども自動削除される
DROP TABLE IF EXISTS instagram_records CASCADE;
DROP TABLE IF EXISTS instagram_accounts CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- トリガー関数を削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'クリーンアップが完了しました。';
  RAISE NOTICE '次に001_initial_schema.sqlを実行してください。';
END $$;
