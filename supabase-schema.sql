-- Instagram運用レポートアプリ用のSupabaseスキーマ

-- アカウントテーブル
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- 記録テーブル
CREATE TABLE IF NOT EXISTS instagram_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,

  -- 運用前のデータ
  posts_before INTEGER DEFAULT 0,
  followers_before INTEGER NOT NULL,
  following_before INTEGER NOT NULL,

  -- 運用後のデータ
  posts_after INTEGER DEFAULT 0,
  followers_after INTEGER NOT NULL,
  following_after INTEGER NOT NULL,

  -- 運用活動の詳細
  start_time TEXT,
  likes INTEGER DEFAULT 0,
  main_loop INTEGER DEFAULT 0,
  operation_time INTEGER DEFAULT 0,
  other_memo TEXT DEFAULT '',

  -- アカウント情報
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,

  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 外部キー
  FOREIGN KEY (account_id) REFERENCES instagram_accounts(account_id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_instagram_records_account_id ON instagram_records(account_id);
CREATE INDEX IF NOT EXISTS idx_instagram_records_date ON instagram_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_account_id ON instagram_accounts(account_id);

-- Row Level Security (RLS) を有効化（必要に応じて）
-- ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE instagram_records ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーにアクセスを許可（開発環境用）
-- CREATE POLICY "Allow anonymous access to instagram_accounts" ON instagram_accounts FOR ALL USING (true);
-- CREATE POLICY "Allow anonymous access to instagram_records" ON instagram_records FOR ALL USING (true);

-- updated_at自動更新用のトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instagram_accounts_updated_at BEFORE UPDATE ON instagram_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instagram_records_updated_at BEFORE UPDATE ON instagram_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
