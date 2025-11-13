# Supabase セットアップガイド

このアプリケーションはSupabaseをバックエンドとして使用します。以下の手順に従ってSupabaseプロジェクトをセットアップしてください。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウントを作成（既にある場合はログイン）
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `instagram-report-app`）
4. データベースパスワードを設定（安全な場所に保存してください）
5. リージョンを選択（日本の場合は`Northeast Asia (Tokyo)`を推奨）
6. 「Create new project」をクリック

プロジェクトが作成されるまで数分待ちます。

## 2. 環境変数の設定

1. Supabaseプロジェクトのダッシュボードで「Settings」→「API」に移動
2. 以下の情報をコピーします：
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` （長いトークン）

3. プロジェクトのルートディレクトリに`.env`ファイルを作成：

```bash
cp .env.example .env
```

4. `.env`ファイルを編集して、コピーした情報を貼り付けます：

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 3. データベースのセットアップ

1. Supabaseダッシュボードで「SQL Editor」に移動
2. 「New Query」をクリック

### 3.1 初期スキーマの作成

`supabase/migrations/001_initial_schema.sql`の内容をコピーしてSQL Editorに貼り付け、「Run」をクリックします。

これにより以下のテーブルが作成されます：
- `instagram_accounts` - ユーザーのInstagramアカウント情報
- `instagram_records` - 日次運用記録
- `user_settings` - ユーザー設定（APIキーなど）

### 3.2 Row Level Security (RLS)の設定

続けて、`supabase/migrations/002_row_level_security.sql`の内容をコピーしてSQL Editorに貼り付け、「Run」をクリックします。

これによりRLSポリシーが設定され、ユーザーごとにデータが完全に分離されます。

## 4. Email認証の設定

1. Supabaseダッシュボードで「Authentication」→「Providers」に移動
2. 「Email」プロバイダーが有効になっていることを確認
3. 「Email」をクリックして設定を開く
4. 以下の設定を確認：
   - **Enable Email provider**: ON
   - **Confirm email**: OFF（開発中はOFFを推奨、本番環境ではON）
   - **Secure email change**: ON

## 5. 動作確認

1. 開発サーバーを起動：

```bash
npm run dev
```

2. ブラウザで `http://localhost:5173` を開く
3. 新規登録画面でメールアドレスとパスワードを入力してアカウントを作成
4. ログインできることを確認
5. アカウント設定でInstagramアカウントを追加
6. データ入力画面で記録を追加
7. ダッシュボードで統計が表示されることを確認

## 6. トラブルシューティング

### エラー: "Supabaseの環境変数が設定されていません"

- `.env`ファイルが正しく作成されているか確認
- 環境変数のキー名が`VITE_`で始まっているか確認
- 開発サーバーを再起動（環境変数の変更後は必須）

### ログインできない

- Supabaseダッシュボードで「Authentication」→「Users」を確認
- ユーザーが正しく登録されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### データが保存されない

- Supabaseダッシュボードで「Table Editor」を開く
- テーブルが正しく作成されているか確認
- RLSポリシーが正しく設定されているか確認（「Authentication」→「Policies」）
- ブラウザのコンソールでエラーメッセージを確認

### RLSエラーが発生する

- SQL Editorで以下のクエリを実行してRLSが有効か確認：

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

- `rowsecurity`が`true`になっていることを確認
- ポリシーが正しく作成されているか確認：

```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## 7. 本番環境へのデプロイ

### Email確認を有効化

本番環境では必ずEmail確認を有効にしてください：

1. 「Authentication」→「Providers」→「Email」
2. 「Confirm email」を**ON**に設定
3. 「Email Templates」でメールテンプレートをカスタマイズ（オプション）

### セキュリティ設定

1. 「Authentication」→「URL Configuration」で許可するURLを設定
2. 「Authentication」→「Settings」で適切なセキュリティ設定を確認

### バックアップ

Supabaseは自動バックアップを提供していますが、重要なデータは定期的に手動でエクスポートすることを推奨します。

## サポート

問題が解決しない場合は、以下のリソースを確認してください：

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase認証ガイド](https://supabase.com/docs/guides/auth)
- [SupabaseのRLSガイド](https://supabase.com/docs/guides/auth/row-level-security)
