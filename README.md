# Instagram運用レポートアプリ

Instagram の自動運用ツールで得られたフォロワー増加データをトラッキングし、AI を活用した分析とアドバイスを提供するWebアプリケーションです。

## 主な機能

### ✨ 機能一覧

- **ユーザー認証**: メールアドレスとパスワードでの安全なログイン
- **複数アカウント管理**: 複数のInstagramアカウントを切り替えて管理
- **日次運用データの記録**: フォロワー数、フォロー数、いいね数などの詳細な記録
- **🤖 AI画像解析**: スクリーンショットから投稿数・フォロワー数・フォロー数を自動抽出（NEW!）
- **フォロワー増加トレンド分析**: Chart.jsを使った視覚的なグラフ表示
- **AI による運用分析**: OpenAI GPT-4を活用した詳細な分析とアドバイス
- **多様なエクスポート機能**: CSV / JSON / PDF 形式でのデータエクスポート
- **安全なデータ管理**: Supabaseによる暗号化とRow Level Security

### 🎯 特徴

- **安全な認証**: Supabase Authenticationによる堅牢な認証システム
- **データ分離**: ユーザーごとのデータを完全に分離（Row Level Security）
- **クラウド同期**: どのデバイスからでもアクセス可能
- **プライバシー重視**: ユーザーデータは暗号化して安全に保存
- **スケーラブル**: 複数ユーザー・複数アカウント対応

## 技術スタック

### フロントエンド
- **React 19** + **TypeScript**: モダンなUI構築
- **Vite**: 高速な開発環境
- **Tailwind CSS**: レスポンシブデザイン
- **Chart.js**: グラフ表示

### バックエンド
- **Supabase**: BaaS（Backend as a Service）
  - **Authentication**: Email/Password認証
  - **PostgreSQL Database**: リレーショナルデータベース
  - **Row Level Security (RLS)**: ユーザーごとのデータ分離
- **Papa Parse**: CSV処理
- **jsPDF**: PDFエクスポート

### AI機能
- **OpenAI API (GPT-4o-mini)**: データ分析とアドバイス生成
- **Google Gemini API**: スクリーンショットからのOCR・データ抽出（無料枠あり）
- **Supabase Edge Functions**: サーバーレスなAI処理

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseアカウント

### インストール

1. 依存関係をインストール:
```bash
npm install
```

2. Supabaseのセットアップ

詳細な手順は **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** を参照してください。

**概要:**
- Supabaseプロジェクトを作成
- `.env`ファイルを作成して環境変数を設定
- SQLマイグレーションを実行
- Row Level Securityポリシーを設定

3. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成：

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. 開発サーバーを起動:
```bash
npm run dev
```

5. ブラウザで `http://localhost:5173` を開く

### ビルド

プロダクションビルドを作成:
```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## 使い方

### 1. ユーザー登録とログイン

1. 新規登録画面でメールアドレスとパスワードを入力
2. アカウントを作成してログイン

### 2. Instagramアカウント設定

初回起動時に「設定」タブからInstagramアカウント情報を登録します。

- アカウント名（例: @myaccount）
- アカウントID（Instagram のユーザーID）

複数のアカウントを追加して切り替えることも可能です。

### 3. データ入力

「データ入力」タブから日次の運用データを記録します。

#### 🤖 AI画像解析（推奨）

運用前と運用後のInstagramスクリーンショットをアップロードするだけで、AIが自動的にデータを読み取ります。

**使用方法**:
1. 「画像をアップロード」ボタンをクリック
2. 運用前のスクリーンショットをアップロード
3. 運用後のスクリーンショットをアップロード
4. 「画像を解析してデータを自動入力」ボタンをクリック
5. 自動的にフォームにデータが入力されます

詳細なセットアップ方法は [AI_IMAGE_ANALYSIS_SETUP.md](./AI_IMAGE_ANALYSIS_SETUP.md) を参照してください。

#### 手動入力

**運用前データ**:
- 投稿数
- フォロワー数
- フォロー数

**運用後データ**:
- 投稿数
- フォロワー数
- フォロー数

**運用詳細**:
- 開始時刻
- いいね数
- ループ回数
- 運用時間（分）
- メモ

### 4. ダッシュボード

「ダッシュボード」タブで以下の情報を確認できます。

- 総記録数と総フォロワー増加
- 平均フォローバック率
- 総運用時間
- トレンド分析
- フォロワー増加トレンドグラフ
- ベストパフォーマンス日

### 5. AI分析

「AI分析」タブでOpenAI APIを使った詳細な分析を実行できます。

**使用方法**:
1. OpenAI APIキーを設定（初回のみ）
2. 「AI分析を実行」ボタンをクリック
3. AI による分析レポートを確認

**分析内容**:
- 総合評価
- ポジティブな傾向
- 改善が必要な点
- 具体的な洞察
- 推奨アクション
- 次のステップ

### 6. エクスポート

「エクスポート」タブからデータをエクスポートできます。

**対応形式**:
- **CSV**: Excel や Google Sheetsで開ける形式
- **JSON**: プログラムで処理可能な形式
- **PDF**: 印刷・共有に適したレポート形式
- **テキスト**: クリップボードにコピー

## API設定

### OpenAI APIキーの取得（AI分析機能用）

AI分析機能を使用するには、OpenAI APIキーが必要です。

1. [OpenAI プラットフォーム](https://platform.openai.com/)にアクセス
2. アカウントを作成（または既存アカウントでログイン）
3. 「API Keys」セクションから新しいAPIキーを生成
4. アプリの「AI分析」タブでAPIキーを設定

**注意**: APIキーはSupabaseデータベースに暗号化されて保存されます。

### Gemini APIキーの取得（画像解析機能用）

画像解析機能を使用するには、Google Gemini APIキーが必要です。

1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン
3. 「Get API Key」または「Create API Key」をクリック
4. 新しいAPIキーを作成
5. Supabase Edge Functionの環境変数として設定

**コスト**: Gemini APIは無料枠があり、月間15リクエスト/分、100万トークン/月まで無料で使用できます。

詳細なセットアップ方法は [AI_IMAGE_ANALYSIS_SETUP.md](./AI_IMAGE_ANALYSIS_SETUP.md) を参照してください。

## データ管理とセキュリティ

### データの保存場所

全てのデータはSupabaseのPostgreSQLデータベースに安全に保存されます。

- **ユーザー認証情報**: Supabase Authentication
- **アカウント情報**: `instagram_accounts` テーブル
- **運用記録**: `instagram_records` テーブル
- **ユーザー設定**: `user_settings` テーブル

### セキュリティ機能

- **暗号化**: 全ての通信はHTTPS経由で暗号化
- **Row Level Security (RLS)**: ユーザーごとのデータを完全に分離
- **認証**: Supabase Authenticationによる安全な認証
- **パスワードハッシュ化**: パスワードは暗号化されて保存

### データのバックアップ

Supabaseは自動バックアップ機能を提供していますが、重要なデータは定期的にエクスポートすることを推奨します。

1. 「エクスポート」タブを開く
2. 「JSON形式」でエクスポート
3. ファイルを安全な場所に保存

### データの削除

全てのデータを削除するには、「設定」タブから「全データを削除」ボタンをクリックします。

**警告**: この操作は取り消せません！

## トラブルシューティング

### ログインできない

- 環境変数（`.env`）が正しく設定されているか確認
- Supabaseプロジェクトが正しくセットアップされているか確認
- メールアドレスとパスワードが正しいか確認
- ブラウザのコンソールでエラーメッセージを確認

### データが表示されない

- ログインしているユーザーが正しいか確認
- Supabaseダッシュボードでデータが保存されているか確認
- Row Level Securityポリシーが正しく設定されているか確認

### グラフが表示されない

Chart.jsの読み込みに失敗している可能性があります。ブラウザをリロードしてください。

### AI分析が失敗する

- APIキーが正しく設定されているか確認
- OpenAI APIの利用上限を確認
- インターネット接続を確認

詳細なトラブルシューティングは **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** を参照してください。

## 開発

### プロジェクト構造

```
instagram-report-app/
├── src/
│   ├── components/      # Reactコンポーネント
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DataInput.tsx
│   │   ├── AIReportViewer.tsx
│   │   ├── ExportPanel.tsx
│   │   └── AccountSettings.tsx
│   ├── services/        # ビジネスロジック
│   │   ├── authService.ts
│   │   ├── dataService.ts
│   │   ├── aiService.ts
│   │   ├── statisticsService.ts
│   │   └── exportService.ts
│   ├── lib/             # ライブラリ設定
│   │   └── supabaseClient.ts
│   ├── types/           # TypeScript型定義
│   └── App.tsx          # メインアプリ
├── supabase/
│   └── migrations/      # SQLマイグレーション
│       ├── 001_initial_schema.sql
│       └── 002_row_level_security.sql
├── public/
├── .env.example
├── SUPABASE_SETUP.md
├── package.json
└── vite.config.ts
```

### 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# TypeScript型チェック
npx tsc --noEmit

# ビルド
npm run build

# プレビュー
npm run preview
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。

## 今後の機能

- [ ] チーム運用機能（複数ユーザー間でのデータ共有）
- [ ] より詳細な統計分析（週次・月次レポート）
- [ ] グラフの種類追加（円グラフ、棒グラフなど）
- [ ] データのインポート機能
- [ ] モバイルアプリ版
- [ ] 通知機能（目標達成時など）

---

作成日: 2025年11月12日
