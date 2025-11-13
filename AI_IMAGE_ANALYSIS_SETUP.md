# AI画像解析機能のセットアップガイド

このガイドでは、Instagramスクリーンショットから投稿数、フォロワー数、フォロー数を自動的に読み取るAI画像解析機能の設定方法を説明します。

## 前提条件

- Supabaseプロジェクトが作成済みであること
- Supabase CLIがインストール済みであること
- Google Gemini APIのAPIキーを取得していること

## 1. Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン
3. 「Get API Key」または「Create API Key」をクリック
4. 新しいAPIキーを作成
5. APIキーをコピーして安全な場所に保管

**注意**: Gemini APIは無料枠があり、月間15リクエスト/分、100万トークン/月まで無料で使用できます。

## 2. Supabase CLIのインストール

まだインストールしていない場合は、以下のコマンドでインストールします：

```bash
npm install -g supabase
```

## 3. Supabaseプロジェクトとのリンク

```bash
# プロジェクトディレクトリに移動
cd instagram-report-app

# Supabaseプロジェクトとリンク
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF`は、SupabaseダッシュボードのProject Settings > General > Reference IDで確認できます。

## 4. Edge Functionのデプロイ

```bash
# Edge Functionをデプロイ
supabase functions deploy analyze-instagram-screenshot
```

## 5. 環境変数の設定

Edge FunctionでGemini APIを使用するために、Supabaseに環境変数を設定します：

```bash
# GEMINI_API_KEYを設定
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

`your_gemini_api_key_here`を、ステップ1で取得したAPIキーに置き換えてください。

## 6. 動作確認

1. アプリケーションを起動：
   ```bash
   npm run dev
   ```

2. ログイン後、「データ入力」タブに移動

3. 「AI画像解析」セクションで「画像をアップロード」ボタンをクリック

4. 運用前と運用後のInstagramスクリーンショットをアップロード
   - スクリーンショットには、投稿数、フォロワー数、フォロー数が表示されている必要があります
   - 画像形式: PNG, JPG, JPEG（最大5MB）

5. 「画像を解析してデータを自動入力」ボタンをクリック

6. 解析が完了すると、フォームに自動的にデータが入力されます

## スクリーンショットの撮り方

### Instagramアプリの場合

1. 自分のプロフィールページに移動
2. 投稿数、フォロワー数、フォロー数が表示されている部分をスクリーンショット
3. 運用前と運用後で同じ形式のスクリーンショットを撮影

### 推奨事項

- できるだけ鮮明なスクリーンショットを使用
- 数値が読み取りやすいように、十分な明るさを確保
- 不要な部分が含まれていても問題ありませんが、数値部分が見切れないように注意

## トラブルシューティング

### エラー: "GEMINI_API_KEY が設定されていません"

Edge Functionの環境変数が設定されていません。ステップ5を再度実行してください。

### エラー: "画像の解析に失敗しました"

- インターネット接続を確認
- スクリーンショットが鮮明で、数値が読み取れることを確認
- Gemini APIの利用制限に達していないか確認（無料枠: 15リクエスト/分）
- Supabase Edge Functionのログを確認：
  ```bash
  supabase functions logs analyze-instagram-screenshot
  ```

### 解析結果が不正確

- より鮮明なスクリーンショットを使用
- 数値部分が画像の中央に配置されるようにトリミング
- 複数回試行してみる

## コスト

- **Gemini API（Google）**: 無料枠で使用可能
  - 無料枠: 15リクエスト/分、100万トークン/月
  - 画像解析1回あたり: 無料枠内であれば無料
  - 超過した場合の料金: 詳細は[Google AI Pricing](https://ai.google.dev/pricing)を参照
- **Supabase Edge Functions**: 無料枠内で十分使用可能（月間500,000リクエストまで無料）

**コスト優位性**: Gemini APIは無料枠が非常に大きく、個人利用であればほぼ無料で使用できます。

## セキュリティ

- APIキーは絶対に公開しないでください
- `.env`ファイルや`.env.local`ファイルは`.gitignore`に含まれていることを確認
- Supabase Edge Functionでのみ環境変数を使用（フロントエンドでは使用しない）

## サポート

問題が解決しない場合は、以下を確認してください：

1. Supabaseプロジェクトのダッシュボードでログを確認
2. ブラウザのコンソールでエラーメッセージを確認
3. GitHubのIssuesで報告またはサポートを求める
