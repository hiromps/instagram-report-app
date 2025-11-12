import { useState, useEffect } from 'react';
import type { InstagramAccount } from '../types';
import { dataService } from '../services/dataService';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';

interface AccountSettingsProps {
  onSave: (account: InstagramAccount) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onSave }) => {
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const account = dataService.loadAccount();
    if (account) {
      setAccountName(account.accountName);
      setAccountId(account.accountId);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName.trim() || !accountId.trim()) {
      alert('アカウント名とアカウントIDを入力してください');
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
      onSave(account);
      alert('アカウント情報を保存しました');
    } catch (error) {
      alert('保存に失敗しました');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        '本当に全てのデータを削除しますか？\nこの操作は取り消せません。'
      )
    ) {
      dataService.clearAllData();
      setAccountName('');
      setAccountId('');
      onSave(null as any);
      alert('全てのデータを削除しました');
    }
  };

  return (
    <div className="space-y-6">
      <Card title="アカウント設定" subtitle="Instagram アカウント情報を設定します">
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

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="データ管理">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">データの削除</h4>
            <p className="text-sm text-gray-600 mb-4">
              全ての記録とアカウント情報を削除します。この操作は取り消せません。
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
