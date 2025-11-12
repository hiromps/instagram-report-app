import { useState, useEffect } from 'react';
import type { InstagramAccount } from '../types';
import { dataService } from '../services/dataService';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';

interface AccountSettingsProps {
  onSave: (account: InstagramAccount | null) => void;
  onAccountSwitch?: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onSave, onAccountSwitch }) => {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<InstagramAccount | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAccounts = () => {
    const loadedAccounts = dataService.loadAccounts();
    const active = dataService.getActiveAccount();
    setAccounts(loadedAccounts);
    setActiveAccount(active);

    // アカウントが1つもない場合は追加フォームを表示
    if (loadedAccounts.length === 0) {
      setShowAddForm(true);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName.trim() || !accountId.trim()) {
      alert('アカウント名とアカウントIDを入力してください');
      return;
    }

    // 既に同じIDのアカウントが存在しないかチェック
    const exists = accounts.find(a => a.accountId === accountId.trim());
    if (exists) {
      alert('このアカウントIDは既に登録されています');
      return;
    }

    setSaving(true);

    try {
      const account: InstagramAccount = {
        accountName: accountName.trim(),
        accountId: accountId.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dataService.saveAccount(account);
      loadAccounts();

      // フォームをリセット
      setAccountName('');
      setAccountId('');
      setShowAddForm(false);

      // 最初のアカウントの場合はonSaveを呼ぶ
      if (accounts.length === 0) {
        onSave(account);
      }

      alert('アカウントを追加しました');
    } catch (error) {
      alert('保存に失敗しました');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    try {
      dataService.setActiveAccount(accountId);
      loadAccounts();

      const newActiveAccount = dataService.getActiveAccount();
      onSave(newActiveAccount);

      if (onAccountSwitch) {
        onAccountSwitch();
      }

      alert('アカウントを切り替えました');
    } catch (error) {
      alert('アカウントの切り替えに失敗しました');
      console.error(error);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = accounts.find(a => a.accountId === accountId);
    if (!account) return;

    if (
      window.confirm(
        `「${account.accountName}」を削除しますか？\nこのアカウントに紐づく全ての記録も削除されます。\nこの操作は取り消せません。`
      )
    ) {
      try {
        dataService.deleteAccount(accountId);
        loadAccounts();

        const newActiveAccount = dataService.getActiveAccount();
        onSave(newActiveAccount);

        alert('アカウントを削除しました');
      } catch (error) {
        alert('削除に失敗しました');
        console.error(error);
      }
    }
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        '本当に全てのデータを削除しますか？\n全てのアカウントと記録が削除されます。\nこの操作は取り消せません。'
      )
    ) {
      dataService.clearAllData();
      setAccounts([]);
      setActiveAccount(null);
      setAccountName('');
      setAccountId('');
      setShowAddForm(true);
      onSave(null);
      alert('全てのデータを削除しました');
    }
  };

  return (
    <div className="space-y-6">
      <Card title="アカウント管理" subtitle="複数のInstagramアカウントを管理できます">
        <div className="space-y-4">
          {/* アカウント一覧 */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">登録済みアカウント</h4>
              {accounts.map((account) => (
                <div
                  key={account.accountId}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activeAccount?.accountId === account.accountId
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900">{account.accountName}</h5>
                        {activeAccount?.accountId === account.accountId && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded">
                            アクティブ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">ID: {account.accountId}</p>
                    </div>
                    <div className="flex gap-2">
                      {activeAccount?.accountId !== account.accountId && (
                        <Button
                          variant="secondary"
                          onClick={() => handleSwitchAccount(account.accountId)}
                        >
                          切り替え
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteAccount(account.accountId)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 新規アカウント追加フォーム */}
          {!showAddForm && (
            <div>
              <Button onClick={() => setShowAddForm(true)}>
                + 新しいアカウントを追加
              </Button>
            </div>
          )}

          {showAddForm && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-4">新しいアカウントを追加</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="アカウント名"
                  type="text"
                  placeholder="例: @myaccount"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />

                <Input
                  label="アカウントID"
                  type="text"
                  placeholder="例: 123456789"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  helperText="InstagramのユーザーID（数字）"
                  required
                />

                <div className="flex justify-end gap-2">
                  {accounts.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowAddForm(false);
                        setAccountName('');
                        setAccountId('');
                      }}
                    >
                      キャンセル
                    </Button>
                  )}
                  <Button type="submit" disabled={saving}>
                    {saving ? '保存中...' : '追加'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Card>

      <Card title="データ管理">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">データの削除</h4>
            <p className="text-sm text-gray-600 mb-4">
              全てのアカウントと記録を削除します。この操作は取り消せません。
            </p>
            <Button variant="danger" onClick={handleClearAllData}>
              全データを削除
            </Button>
          </div>
        </div>
      </Card>

      <Card title="アプリについて">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Instagram運用レポートアプリ</strong>
          </p>
          <p>
            Instagram の自動運用ツールで得られたフォロワー増加データをトラッキングし、
            AI を活用した分析とアドバイスを提供します。
          </p>
          <p className="mt-4">
            <strong>主な機能：</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>複数アカウントの管理とアカウント切り替え</li>
            <li>日次運用データの記録</li>
            <li>フォロワー増加トレンドのグラフ表示</li>
            <li>AI による運用分析とアドバイス</li>
            <li>CSV / JSON / PDF エクスポート</li>
            <li>ローカルデータ保存（プライバシー保護）</li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            データは全てブラウザのローカルストレージに保存されます。
            <br />
            外部サーバーに送信されることはありません。
          </p>
        </div>
      </Card>
    </div>
  );
};
