-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Instagram Accounts Table
CREATE TABLE instagram_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- ユーザーごとにaccount_idはユニーク
  UNIQUE(user_id, account_id)
);

-- Instagram Records Table
CREATE TABLE instagram_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,

  -- 日付
  date DATE NOT NULL,

  -- 運用前のデータ
  posts_before INTEGER NOT NULL DEFAULT 0,
  followers_before INTEGER NOT NULL DEFAULT 0,
  following_before INTEGER NOT NULL DEFAULT 0,

  -- 運用後のデータ
  posts_after INTEGER NOT NULL DEFAULT 0,
  followers_after INTEGER NOT NULL DEFAULT 0,
  following_after INTEGER NOT NULL DEFAULT 0,

  -- 運用活動の詳細
  start_time TIME NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  main_loop INTEGER NOT NULL DEFAULT 0,
  operation_time INTEGER NOT NULL DEFAULT 0,
  other_memo TEXT,

  -- 自動計算フィールド
  follower_growth INTEGER GENERATED ALWAYS AS (followers_after - followers_before) STORED,
  following_growth INTEGER GENERATED ALWAYS AS (following_after - following_before) STORED,
  post_growth INTEGER GENERATED ALWAYS AS (posts_after - posts_before) STORED,
  follow_back_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN (following_after - following_before) > 0
      THEN ((followers_after - followers_before)::NUMERIC / (following_after - following_before)::NUMERIC) * 100
      ELSE 0
    END
  ) STORED,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- 同じユーザー、同じアカウント、同じ日付の記録は1つだけ
  UNIQUE(user_id, account_id, date)
);

-- OpenAI API Keys Table（ユーザーごとのAPIキー）
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  openai_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for better query performance
CREATE INDEX idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX idx_instagram_accounts_user_active ON instagram_accounts(user_id, is_active);
CREATE INDEX idx_instagram_records_user_id ON instagram_records(user_id);
CREATE INDEX idx_instagram_records_account_id ON instagram_records(user_id, account_id);
CREATE INDEX idx_instagram_records_date ON instagram_records(user_id, date DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_instagram_accounts_updated_at
  BEFORE UPDATE ON instagram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_records_updated_at
  BEFORE UPDATE ON instagram_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
