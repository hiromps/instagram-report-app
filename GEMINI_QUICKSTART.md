# Gemini API 画像解析機能クイックスタート

このガイドでは、Gemini APIを使ったAI画像解析機能を最短でセットアップする手順を説明します。

## なぜGemini API？

- ✅ **無料枠が大きい**: 月間100万トークンまで無料
- ✅ **コスト効率**: 個人利用なら無料枠内で十分
- ✅ **高精度**: Gemini 1.5 Flashモデルで高速・高精度な画像認識
- ✅ **簡単**: Googleアカウントがあればすぐに利用可能

## セットアップ（5ステップ）

### 1. Gemini APIキーを取得

```bash
# ブラウザで以下のURLにアクセス
https://aistudio.google.com/app/apikey
```

1. Googleアカウントでログイン
2. 「Create API Key」をクリック
3. APIキーをコピー

### 2. Supabase CLIをインストール（未インストールの場合）

```bash
npm install -g supabase
```

### 3. Supabaseプロジェクトとリンク

```bash
# プロジェクトディレクトリに移動
cd instagram-report-app

# Supabaseプロジェクトとリンク（初回のみ）
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF`は、SupabaseダッシュボードのProject Settings > General > Reference IDで確認できます。

### 4. Edge Functionをデプロイ

```bash
supabase functions deploy analyze-instagram-screenshot
```

### 5. Gemini APIキーを環境変数に設定

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

`your_gemini_api_key_here`をステップ1で取得したAPIキーに置き換えてください。

## 使い方

1. アプリケーションを起動:
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:5173` を開く

3. ログイン後、「データ入力」タブに移動

4. 「AI画像解析」セクションで「画像をアップロード」をクリック

5. 運用前と運用後のInstagramスクリーンショットをアップロード

6. 「画像を解析してデータを自動入力」ボタンをクリック

7. AIが自動的にデータを読み取り、フォームに入力されます

## 対応している画像形式

- PNG
- JPEG / JPG
- 最大5MB

## 動作確認

Edge Functionが正しくデプロイされているか確認:

```bash
# Edge Functionのログを確認
supabase functions logs analyze-instagram-screenshot

# 最新のログをリアルタイムで表示
supabase functions logs analyze-instagram-screenshot --follow
```

## トラブルシューティング

### エラー: "GEMINI_API_KEY が設定されていません"

```bash
# 環境変数を再設定
supabase secrets set GEMINI_API_KEY=your_api_key_here

# 設定済みの環境変数を確認
supabase secrets list
```

### エラー: "画像の解析に失敗しました"

1. APIキーが正しく設定されているか確認
2. Gemini APIの利用制限に達していないか確認（15リクエスト/分）
3. スクリーンショットが鮮明で数値が読み取れるか確認
4. Edge Functionのログを確認:
   ```bash
   supabase functions logs analyze-instagram-screenshot
   ```

### 解析結果が不正確

- より鮮明なスクリーンショットを使用
- 数値部分がはっきり見えるようにトリミング
- 明るさを調整（暗すぎる画像は認識精度が低下）
- 複数回試行してみる

## コスト情報

### Gemini API無料枠
- **リクエスト数**: 15リクエスト/分
- **トークン数**: 100万トークン/月
- **画像解析**: 無料枠内であれば完全無料

### 使用例での試算
- 1日10回の画像解析 × 30日 = 月300回
- 1回あたり約500トークン使用
- 月間トータル: 約15万トークン（無料枠の15%）

**結論**: 個人利用では無料枠内で十分使用可能です。

## 次のステップ

- 詳細なセットアップ方法: [AI_IMAGE_ANALYSIS_SETUP.md](./AI_IMAGE_ANALYSIS_SETUP.md)
- アプリの使い方: [README.md](./README.md)
- Supabaseの設定: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## サポート

問題が発生した場合は、以下を確認してください:

1. [Google AI Studio](https://aistudio.google.com/)でAPIキーが有効か確認
2. Supabaseプロジェクトが正しくリンクされているか確認
3. Edge Functionが正しくデプロイされているか確認
4. ブラウザのコンソールでエラーメッセージを確認

それでも解決しない場合は、GitHubのIssuesで報告してください。
