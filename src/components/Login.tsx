import { useState } from 'react';
import { authService } from '../services/authService';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!password.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await authService.signUp(
          email.trim(),
          password.trim(),
          displayName.trim() || undefined
        );
        setSuccessMessage('新規登録が完了しました！');
      } else {
        await authService.login(email.trim(), password.trim());
      }
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Instagram運用レポート
          </h1>
          <p className="text-gray-600">
            {isSignUp ? '新規アカウント作成' : 'アカウントにログイン'}
          </p>
        </div>

        <Card
          title={isSignUp ? '新規登録' : 'ログイン'}
          subtitle={
            isSignUp
              ? 'メールアドレスとパスワードで登録'
              : 'メールアドレスとパスワードでログイン'
          }
        >
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
              label="パスワード"
              type="password"
              placeholder="6文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              helperText="パスワードは6文字以上で設定してください"
            />

            {isSignUp && (
              <>
                <Input
                  label="パスワード（確認）"
                  type="password"
                  placeholder="パスワードを再入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <Input
                  label="表示名（オプション）"
                  type="text"
                  placeholder="山田太郎"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  helperText="未入力の場合はメールアドレスから自動設定されます"
                />
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading
                ? isSignUp
                  ? '登録中...'
                  : 'ログイン中...'
                : isSignUp
                ? '新規登録'
                : 'ログイン'}
            </Button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={toggleMode}
              className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {isSignUp
                ? 'すでにアカウントをお持ちの方はこちら'
                : '新規アカウント作成はこちら'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              {isSignUp ? '新規登録について' : 'ログインについて'}
            </p>
            <p className="text-xs text-blue-700">
              {isSignUp
                ? 'メールアドレスとパスワードでアカウントを作成します。データは安全に管理され、ユーザーごとに完全に分離されます。'
                : 'メールアドレスとパスワードでログインします。データはSupabaseで安全に管理されています。'}
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>データは安全に暗号化されて保存されます</p>
          <p className="mt-1">ユーザーごとにデータは完全に分離されています</p>
        </div>
      </div>
    </div>
  );
};
