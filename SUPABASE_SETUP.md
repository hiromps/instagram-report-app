# Supabase セットアップガイド

このガイドでは、Instagram運用レポートアプリのSupabase統合をセットアップする手順を説明します。

## 前提条件

- Supabaseアカウント（https://supabase.com/ で作成可能）
- 提供されたSupabase URLとAnon Key

## セットアップ手順

### 1. Supabaseプロジェクトの準備

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択または新規作成

### 2. データベーススキーマの作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-schema.sql`ファイルの内容をコピー
3. SQL Editorに貼り付けて実行

または、以下のコマンドでスキーマを作成できます：

```sql
-- アカウントテーブル
CREATE TABLE instagram_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- 記録テーブル
CREATE TABLE instagram_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  posts_before INTEGER DEFAULT 0,
  followers_before INTEGER NOT NULL,
  following_before INTEGER NOT NULL,
  posts_after INTEGER DEFAULT 0,
  followers_after INTEGER NOT NULL,
  following_after INTEGER NOT NULL,
  start_time TEXT,
  likes INTEGER DEFAULT 0,
  main_loop INTEGER DEFAULT 0,
  operation_time INTEGER DEFAULT 0,
  other_memo TEXT DEFAULT '',
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES instagram_accounts(account_id) ON DELETE CASCADE
);
```

### 3. Row Level Security (RLS) の設定

開発環境では、以下のポリシーで匿名アクセスを許可します：

```sql
-- RLSを有効化
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_records ENABLE ROW LEVEL SECURITY;

-- 匿名アクセスを許可（開発環境用）
CREATE POLICY "Allow anonymous access to instagram_accounts"
  ON instagram_accounts FOR ALL
  USING (true);

CREATE POLICY "Allow anonymous access to instagram_records"
  ON instagram_records FOR ALL
  USING (true);
```

**注意**: 本番環境では、適切な認証とアクセス制御を実装してください。

### 4. 環境変数の設定

1. `.env.example`を`.env`にコピー
2. SupabaseダッシュボードでAPIキーを取得
   - Settings > API > Project URL
   - Settings > API > Project API keys > anon public
3. `.env`ファイルに設定を記入：

```env
VITE_SUPABASE_URL=あなたのSupabase URL
VITE_SUPABASE_ANON_KEY=あなたのAnon Key
```

### 5. アプリケーションの起動

```bash
npm install
npm run dev
```

## データ移行

既存のlocalStorageデータをSupabaseに移行する場合：

1. ブラウザのコンソールを開く
2. 以下のスクリプトを実行：

```javascript
// アカウントの移行
const accounts = JSON.parse(localStorage.getItem('instagramAccounts') || '[]');
for (const account of accounts) {
  await dataService.saveAccount(account);
}

// 記録の移行
const records = JSON.parse(localStorage.getItem('instagramRecords') || '[]');
for (const record of records) {
  await dataService.saveRecord(record);
}
```

## トラブルシューティング

### 接続エラー

- 環境変数が正しく設定されているか確認
- Supabase URLとAnon Keyが有効か確認
- ブラウザのコンソールでエラーメッセージを確認

### データが保存されない

- Supabaseダッシュボードで「Table Editor」を開いてテーブルが作成されているか確認
- RLSポリシーが設定されているか確認
- ブラウザのネットワークタブでAPIリクエストを確認

### ローカルストレージへのフォールバック

アプリケーションは、Supabaseへの接続に失敗した場合、自動的にlocalStorageにフォールバックします。これにより、オフラインでもアプリケーションを使用できます。

## セキュリティ考慮事項

本番環境では以下を実装してください：

1. **認証**: Supabase Authを使用してユーザー認証を実装
2. **RLS**: ユーザーごとのデータアクセス制御
3. **環境変数**: 本番環境のSupabase URLとKeyを分離
4. **HTTPS**: 本番環境では必ずHTTPSを使用

## サポート

問題が発生した場合は、以下を確認してください：

- [Supabase公式ドキュメント](https://supabase.com/docs)
- プロジェクトのREADME.md
- Githubのissueセクション
