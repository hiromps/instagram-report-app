import { useState } from 'react';
import { authService } from '../services/authService';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      authService.login(email.trim(), displayName.trim() || undefined);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Instagram運用レポート
          </h1>
          <p className="text-gray-600">アカウントにログイン</p>
        </div>

        <Card title="ログイン" subtitle="メールアドレスでログイン">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="メールアドレス"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="表示名（オプション）"
              type="text"
              placeholder="山田太郎"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              helperText="未入力の場合はメールアドレスから自動設定されます"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">初めての方へ</p>
            <p className="text-xs text-blue-700">
              メールアドレスを入力するだけで自動的にアカウントが作成されます。
              パスワードは不要です。データは全てブラウザのローカルストレージに保存されます。
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>データは全てローカルに保存されます</p>
          <p className="mt-1">外部サーバーに送信されることはありません</p>
        </div>
      </div>
    </div>
  );
};
