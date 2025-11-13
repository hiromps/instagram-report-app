-- 同じ日付に複数の記録を保存できるようにUNIQUE制約を削除
ALTER TABLE instagram_records
DROP CONSTRAINT IF EXISTS instagram_records_user_id_account_id_date_key;

-- 新しいインデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_instagram_records_user_account_date
ON instagram_records(user_id, account_id, date DESC);

-- 記録の作成時刻でソートできるようにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_instagram_records_created_at
ON instagram_records(user_id, account_id, date DESC, created_at DESC);
