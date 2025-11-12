# Supabase セットアップガイド

このガイドでは、Instagram運用レポートアプリのSupabase統合をセットアップする手順を説明します。

## 前提条件

- Supabaseアカウント（https://supabase.com/ で作成可能）
- 提供されたSupabase URLとAnon Key

## セットアップ手順

### 1. Supabaseプロジェクトの準備

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択または新規作成
3. プロジェクトのURLとAnon Keyをメモ

### 2. データベーススキーマの作成

#### 開発環境用（匿名アクセス許可）

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-schema.sql`ファイルの内容をコピー
3. SQL Editorに貼り付けて実行
4. 実行結果を確認：
   - ✅ Tables created: instagram_accounts, instagram_records
   - ✅ Indexes created: 5 indexes
   - ✅ Triggers created: 2 triggers
   - ✅ RLS policies created: 8 policies (4 per table)

#### 本番環境用（ユーザー認証ベース）

本番環境でユーザー認証を使用する場合：

1. 開発環境用スキーマ（`supabase-schema.sql`）を先に実行
2. Supabase Authを有効化
3. `supabase-schema-production.sql`を実行
4. 既存データに`user_id`を設定（必要な場合）

### 3. スキーマの特徴

#### データ整合性
- ✅ 空文字列のバリデーション（account_name, account_id）
- ✅ 負の数値の防止（フォロワー数、いいね数など）
- ✅ 外部キー制約（CASCADE削除対応）
- ✅ 自動タイムスタンプ更新（updated_at）

#### パフォーマンス最適化
- ✅ account_idにインデックス
- ✅ dateに降順インデックス
- ✅ 複合インデックス（account_id + date）
- ✅ is_active用の部分インデックス

#### セキュリティ
- ✅ Row Level Security (RLS) 有効化
- ✅ 操作別ポリシー（SELECT, INSERT, UPDATE, DELETE）
- ✅ WITH CHECK句で挿入/更新時のバリデーション

### 4. Row Level Security (RLS) ポリシー

#### 開発環境（`supabase-schema.sql`）

すべてのユーザーに完全なアクセスを許可：

```sql
-- 読み取り
CREATE POLICY "Allow anonymous read access to instagram_accounts"
  ON instagram_accounts FOR SELECT USING (true);

-- 書き込み
CREATE POLICY "Allow anonymous insert access to instagram_accounts"
  ON instagram_accounts FOR INSERT WITH CHECK (true);

-- 更新
CREATE POLICY "Allow anonymous update access to instagram_accounts"
  ON instagram_accounts FOR UPDATE
  USING (true) WITH CHECK (true);

-- 削除
CREATE POLICY "Allow anonymous delete access to instagram_accounts"
  ON instagram_accounts FOR DELETE USING (true);
```

#### 本番環境（`supabase-schema-production.sql`）

認証済みユーザーのみが自分のデータにアクセス可能：

```sql
-- 自分のアカウントのみ閲覧可能
CREATE POLICY "Users can view their own accounts"
  ON instagram_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のアカウントのみ作成可能
CREATE POLICY "Users can insert their own accounts"
  ON instagram_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のアカウントのみ更新可能
CREATE POLICY "Users can update their own accounts"
  ON instagram_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分のアカウントのみ削除可能
CREATE POLICY "Users can delete their own accounts"
  ON instagram_accounts FOR DELETE
  USING (auth.uid() = user_id);
```

**注意**: 本番環境用ポリシーを使用する場合は、テーブルに`user_id`カラムが必要です。

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

### 5. 環境変数の設定

1. プロジェクトルートに`.env`ファイルを作成（`.env.example`を参考）
2. Supabaseダッシュボードから以下の情報を取得：
   - **Project URL**: Settings > API > Project URL
   - **Anon Key**: Settings > API > Project API keys > anon public
3. `.env`ファイルに設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**重要**: `.env`ファイルはGitにコミットしないでください（`.gitignore`で除外済み）

### 6. アプリケーションの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルドテスト
npm run build
```

## データ移行

### localStorageからSupabaseへの移行

既存のlocalStorageデータをSupabaseに移行する場合：

1. アプリケーションを起動
2. ブラウザの開発者ツールを開く（F12）
3. コンソールタブで以下のスクリプトを実行：

```javascript
// アカウントの移行
const accounts = JSON.parse(localStorage.getItem('instagramAccounts') || '[]');
console.log(`移行するアカウント数: ${accounts.length}`);

for (const account of accounts) {
  await dataService.saveAccount(account);
  console.log(`✓ アカウント移行完了: ${account.accountName}`);
}

// 記録の移行
const records = JSON.parse(localStorage.getItem('instagramRecords') || '[]');
console.log(`移行する記録数: ${records.length}`);

for (const record of records) {
  await dataService.saveRecord(record);
}
console.log('✓ 全ての記録の移行が完了しました');
```

### 移行の確認

Supabaseダッシュボードで確認：
1. 「Table Editor」を開く
2. `instagram_accounts`と`instagram_records`テーブルを確認
3. データが正しく移行されていることを確認

## トラブルシューティング

### ❌ 接続エラー

**症状**: "Supabaseの設定が見つかりません"エラー

**解決策**:
- `.env`ファイルが存在するか確認
- 環境変数名が正しいか確認（`VITE_`プレフィックスが必要）
- 開発サーバーを再起動（環境変数の変更後は必須）

### ❌ データが保存されない

**症状**: データが保存されているように見えるが、Supabaseに反映されない

**解決策**:
1. Supabaseダッシュボードで「Table Editor」を確認
2. テーブルが正しく作成されているか確認
3. ブラウザのネットワークタブでAPIリクエストを確認
4. RLSポリシーが正しく設定されているか確認：

```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('instagram_accounts', 'instagram_records');

-- ポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('instagram_accounts', 'instagram_records');
```

### ❌ RLSポリシーエラー

**症状**: "new row violates row-level security policy"エラー

**解決策**:
- 開発環境用スキーマ（`supabase-schema.sql`）を使用しているか確認
- ポリシーが正しく作成されているか確認
- ポリシーを再作成：

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Allow anonymous read access to instagram_accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Allow anonymous insert access to instagram_accounts" ON instagram_accounts;
-- ... 他のポリシーも削除

-- supabase-schema.sqlのRLSセクションを再実行
```

### ✅ ローカルストレージへのフォールバック

アプリケーションは、Supabaseへの接続に失敗した場合、自動的にlocalStorageにフォールバックします。

**確認方法**:
- ブラウザのコンソールで警告メッセージを確認
- "記録の保存に失敗しました（Supabase）"が表示される場合、フォールバック中

**利点**:
- オフラインでもアプリケーションを使用可能
- Supabase障害時でもデータが失われない
- localStorageとSupabaseの自動同期

## スキーマの確認

作成されたテーブル、インデックス、ポリシーを確認：

```sql
-- テーブル一覧
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'instagram_%';

-- インデックス一覧
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'instagram_%';

-- トリガー一覧
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table LIKE 'instagram_%';

-- RLSポリシー一覧
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename LIKE 'instagram_%';
```

## セキュリティ考慮事項

### 開発環境

現在のスキーマ（`supabase-schema.sql`）は開発環境用です：
- ✅ 匿名アクセスを許可
- ✅ すべての操作が可能
- ⚠️ **本番環境では使用しないでください**

### 本番環境への移行

本番環境では以下を実装してください：

1. **Supabase Authの実装**
   - ユーザー登録/ログイン機能
   - セッション管理
   - パスワードリセット

2. **本番環境用RLSポリシー**
   ```bash
   # supabase-schema-production.sqlを実行
   ```

3. **環境変数の分離**
   ```env
   # .env.production
   VITE_SUPABASE_URL=https://production-project.supabase.co
   VITE_SUPABASE_ANON_KEY=production-anon-key
   ```

4. **HTTPSの使用**
   - Vercel、Netlifyなどで自動的にHTTPSが有効化されます

5. **APIキーの保護**
   - Anon Keyはクライアント側で使用可能
   - Service Role Keyは絶対にクライアント側で使用しない

## パフォーマンスの最適化

### インデックスの活用

データ量が増えた場合のクエリ最適化：

```sql
-- account_idとdateで効率的に検索
SELECT * FROM instagram_records
WHERE account_id = 'your-account-id'
ORDER BY date DESC
LIMIT 30;

-- 複合インデックスが使用されます
```

### データ保持ポリシー

古いデータのアーカイブ：

```sql
-- 1年以上前のデータを別テーブルに移動
INSERT INTO instagram_records_archive
SELECT * FROM instagram_records
WHERE date < CURRENT_DATE - INTERVAL '1 year';

DELETE FROM instagram_records
WHERE date < CURRENT_DATE - INTERVAL '1 year';
```

## サポート

問題が発生した場合は、以下を確認してください：

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase RLSガイド](https://supabase.com/docs/guides/auth/row-level-security)
- プロジェクトの`README.md`
- GitHubのissueセクション

### デバッグ情報の収集

問題を報告する際は、以下の情報を含めてください：

1. エラーメッセージの全文
2. ブラウザのコンソールログ
3. ネットワークタブのAPIレスポンス
4. 使用しているスキーマファイル（開発環境用 or 本番環境用）
5. Supabaseのバージョン情報
