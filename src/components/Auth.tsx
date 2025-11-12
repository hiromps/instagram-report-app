import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // バリデーション
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // サインアップ
        const { error: signUpError } = await signUp(email, password);

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('このメールアドレスは既に登録されています');
          } else {
            setError(signUpError.message || 'サインアップに失敗しました');
          }
        } else {
          setMessage(
            '登録完了しました！確認メールを送信しましたので、メールのリンクをクリックしてアカウントを有効化してください。'
          );
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        // ログイン
        const { error: signInError } = await signIn(email, password);

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('メールアドレスまたはパスワードが間違っています');
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('メールアドレスが確認されていません。確認メールのリンクをクリックしてください。');
          } else {
            setError(signInError.message || 'ログインに失敗しました');
          }
        }
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold instagram-gradient bg-clip-text text-transparent mb-2">
            Instagram運用レポート
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'アカウントを作成して始めましょう' : 'ログインしてデータを管理'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                disabled={loading}
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード（確認）
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワードを再入力"
                  disabled={loading}
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              disabled={loading}
            >
              {isSignUp
                ? 'すでにアカウントをお持ちですか？ログイン'
                : 'アカウントをお持ちでないですか？新規登録'}
            </button>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>アカウントを作成することで、利用規約とプライバシーポリシーに同意したものとみなします。</p>
        </div>
      </div>
    </div>
  );
};
