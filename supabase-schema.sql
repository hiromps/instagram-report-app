-- ============================================================================
-- Instagram運用レポートアプリ用のSupabaseスキーマ
-- ============================================================================
-- このスクリプトは、Instagram運用レポートアプリで使用する
-- データベーステーブル、インデックス、RLSポリシー、トリガーを作成します。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. テーブル作成
-- ----------------------------------------------------------------------------

-- アカウントテーブル
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- 制約: account_nameは空文字列不可
  CONSTRAINT account_name_not_empty CHECK (length(trim(account_name)) > 0),
  CONSTRAINT account_id_not_empty CHECK (length(trim(account_id)) > 0)
);

-- 記録テーブル
CREATE TABLE IF NOT EXISTS instagram_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,

  -- 運用前のデータ
  posts_before INTEGER DEFAULT 0 CHECK (posts_before >= 0),
  followers_before INTEGER NOT NULL CHECK (followers_before >= 0),
  following_before INTEGER NOT NULL CHECK (following_before >= 0),

  -- 運用後のデータ
  posts_after INTEGER DEFAULT 0 CHECK (posts_after >= 0),
  followers_after INTEGER NOT NULL CHECK (followers_after >= 0),
  following_after INTEGER NOT NULL CHECK (following_after >= 0),

  -- 運用活動の詳細
  start_time TEXT,
  likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  main_loop INTEGER DEFAULT 0 CHECK (main_loop >= 0),
  operation_time INTEGER DEFAULT 0 CHECK (operation_time >= 0),
  other_memo TEXT DEFAULT '',

  -- アカウント情報
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,

  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 外部キー: account_idはinstagram_accountsテーブルを参照
  CONSTRAINT fk_instagram_records_account_id
    FOREIGN KEY (account_id)
    REFERENCES instagram_accounts(account_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- 制約: account_nameは空文字列不可
  CONSTRAINT record_account_name_not_empty CHECK (length(trim(account_name)) > 0),
  CONSTRAINT record_account_id_not_empty CHECK (length(trim(account_id)) > 0)
);

-- ----------------------------------------------------------------------------
-- 2. インデックス作成
-- ----------------------------------------------------------------------------

-- instagram_accountsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_account_id
  ON instagram_accounts(account_id);

CREATE INDEX IF NOT EXISTS idx_instagram_accounts_is_active
  ON instagram_accounts(is_active)
  WHERE is_active = true;

-- instagram_recordsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_instagram_records_account_id
  ON instagram_records(account_id);

CREATE INDEX IF NOT EXISTS idx_instagram_records_date
  ON instagram_records(date DESC);

-- 複合インデックス: account_idとdateで効率的に検索
CREATE INDEX IF NOT EXISTS idx_instagram_records_account_id_date
  ON instagram_records(account_id, date DESC);

-- ----------------------------------------------------------------------------
-- 3. 関数とトリガー
-- ----------------------------------------------------------------------------

-- updated_at自動更新用の関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存のトリガーを削除してから再作成
DROP TRIGGER IF EXISTS update_instagram_accounts_updated_at ON instagram_accounts;
CREATE TRIGGER update_instagram_accounts_updated_at
  BEFORE UPDATE ON instagram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instagram_records_updated_at ON instagram_records;
CREATE TRIGGER update_instagram_records_updated_at
  BEFORE UPDATE ON instagram_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. Row Level Security (RLS) ポリシー
-- ----------------------------------------------------------------------------

-- RLSを有効化
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_records ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Allow anonymous read access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous insert access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous update access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous delete access to instagram_accounts" ON instagram_accounts;

DROP POLICY IF EXISTS "Allow anonymous read access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous insert access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous update access to instagram_records" ON instagram_records;
DROP POLICY IF EXISTS "Allow anonymous delete access to instagram_records" ON instagram_records;

-- instagram_accountsテーブルのポリシー（開発環境用）
CREATE POLICY "Allow anonymous read access to instagram_accounts"
  ON instagram_accounts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert access to instagram_accounts"
  ON instagram_accounts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to instagram_accounts"
  ON instagram_accounts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to instagram_accounts"
  ON instagram_accounts
  FOR DELETE
  USING (true);

-- instagram_recordsテーブルのポリシー（開発環境用）
CREATE POLICY "Allow anonymous read access to instagram_records"
  ON instagram_records
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert access to instagram_records"
  ON instagram_records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to instagram_records"
  ON instagram_records
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to instagram_records"
  ON instagram_records
  FOR DELETE
  USING (true);

-- ----------------------------------------------------------------------------
-- 5. 確認用クエリ
-- ----------------------------------------------------------------------------

-- テーブルが正しく作成されたか確認
DO $$
BEGIN
  RAISE NOTICE 'Schema setup completed successfully!';
  RAISE NOTICE 'Tables created: instagram_accounts, instagram_records';
  RAISE NOTICE 'Indexes created: 5 indexes';
  RAISE NOTICE 'Triggers created: 2 triggers';
  RAISE NOTICE 'RLS policies created: 8 policies (4 per table)';
END $$;
