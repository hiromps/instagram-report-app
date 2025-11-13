# マイグレーションガイド: 同じ日付に複数記録を保存可能にする

## 概要

この更新により、同じ日付に複数の運用記録を保存できるようになります。また、同じ日付の記録は自動的に集約され、合計値が表示されます。

## 変更内容

### データベース変更
- `instagram_records`テーブルのUNIQUE制約を削除
- 同じ日付に複数のレコードを保存可能に

### 新機能
1. **記録一覧タブ**: 個別の記録と日次集約データを表示
2. **日次集約**: 同じ日付の記録を自動的に合計して表示
3. **個別記録の表示**: 日付をクリックすると個別の記録を展開表示

## マイグレーション手順

### 1. Supabaseダッシュボードにアクセス

1. [Supabase](https://supabase.com/)にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」をクリック

### 2. マイグレーションの実行

1. 「New Query」をクリック
2. 以下のSQLをコピーして貼り付け：

```sql
-- 同じ日付に複数の記録を保存できるようにUNIQUE制約を削除
ALTER TABLE instagram_records
DROP CONSTRAINT IF EXISTS instagram_records_user_id_account_id_date_key;

-- 新しいインデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_instagram_records_user_account_date
ON instagram_records(user_id, account_id, date DESC);

-- 記録の作成時刻でソートできるようにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_instagram_records_created_at
ON instagram_records(user_id, account_id, date DESC, created_at DESC);
```

3. 「Run」をクリックしてSQLを実行

### 3. 確認

以下のクエリを実行して、UNIQUE制約が削除されたことを確認できます：

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'instagram_records'
  AND constraint_type = 'UNIQUE';
```

結果に`instagram_records_user_id_account_id_date_key`が表示されなければ成功です。

## 使い方

### 同じ日付に複数記録を追加

1. 「データ入力」タブで通常通り記録を入力
2. 同じ日付で再度記録を入力できます
3. 「記録一覧」タブで確認

### 記録一覧の表示

1. 「記録一覧」タブをクリック
2. 各日付のサマリーが表示されます
   - 複数記録がある場合は「○件」バッジが表示されます
   - 日次合計値が表示されます
3. 日付をクリックすると個別の記録が展開されます

### ダッシュボード

ダッシュボードは自動的に日次集約データを使用して統計を表示します。

## 注意事項

- 既存のデータは影響を受けません
- マイグレーション実行後も既存の1日1記録のデータは正常に動作します
- バックアップを取ることをお勧めします

## ロールバック（元に戻す）

万が一、元の仕様に戻したい場合は以下のSQLを実行してください：

```sql
-- UNIQUE制約を再度追加（既存の重複データがある場合はエラーになります）
ALTER TABLE instagram_records
ADD CONSTRAINT instagram_records_user_id_account_id_date_key
UNIQUE (user_id, account_id, date);

-- 追加したインデックスを削除
DROP INDEX IF EXISTS idx_instagram_records_user_account_date;
DROP INDEX IF EXISTS idx_instagram_records_created_at;
```

## トラブルシューティング

### エラー: constraint "instagram_records_user_id_account_id_date_key" does not exist

このエラーは、制約が既に削除されている場合に発生します。問題ありません、そのまま続けてください。

### 記録が表示されない

1. ブラウザをリフレッシュ
2. 「設定」タブでアカウントが正しく選択されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

## サポート

問題が発生した場合は、ブラウザのコンソール（F12キー）でエラーメッセージを確認してください。
