-- Enable Row Level Security on all tables
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =====================================
-- Instagram Accounts RLS Policies
-- =====================================

-- ユーザーは自分のアカウントのみ閲覧可能
CREATE POLICY "Users can view their own accounts"
  ON instagram_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のアカウントのみ作成可能
CREATE POLICY "Users can create their own accounts"
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

-- =====================================
-- Instagram Records RLS Policies
-- =====================================

-- ユーザーは自分の記録のみ閲覧可能
CREATE POLICY "Users can view their own records"
  ON instagram_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の記録のみ作成可能
CREATE POLICY "Users can create their own records"
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

-- =====================================
-- User Settings RLS Policies
-- =====================================

-- ユーザーは自分の設定のみ閲覧可能
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の設定のみ作成可能
CREATE POLICY "Users can create their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の設定のみ更新可能
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の設定のみ削除可能
CREATE POLICY "Users can delete their own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);
