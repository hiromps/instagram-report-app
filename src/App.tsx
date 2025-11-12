import { useState, useEffect } from 'react';
import type { InstagramAccount, InstagramRecord } from './types';
import { dataService } from './services/dataService';
import { Dashboard } from './components/Dashboard';
import { DataInput } from './components/DataInput';
import { AIReportViewer } from './components/AIReportViewer';
import { ExportPanel } from './components/ExportPanel';
import { AccountSettings } from './components/AccountSettings';

type TabType = 'dashboard' | 'input' | 'ai' | 'export' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [records, setRecords] = useState<InstagramRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedAccount = dataService.loadAccount();
    const loadedRecords = dataService.loadRecords();

    setAccount(loadedAccount);
    setRecords(loadedRecords);

    // アカウントが未設定の場合は設定タブを表示
    if (!loadedAccount) {
      setActiveTab('settings');
    }
  };

  const handleAccountSave = (newAccount: InstagramAccount) => {
    setAccount(newAccount);
    if (activeTab === 'settings' && newAccount) {
      setActiveTab('dashboard');
    }
  };

  const handleRecordSave = () => {
    loadData();
    setActiveTab('dashboard');
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'ダッシュボード', icon: '📊' },
    { id: 'input' as TabType, label: 'データ入力', icon: '✏️' },
    { id: 'ai' as TabType, label: 'AI分析', icon: '🤖' },
    { id: 'export' as TabType, label: 'エクスポート', icon: '📥' },
    { id: 'settings' as TabType, label: '設定', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="instagram-gradient text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Instagram運用レポート</h1>
          {account && (
            <p className="text-xs sm:text-sm mt-1 opacity-90">
              {account.accountName} で運用中
            </p>
          )}
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-0.5 sm:space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium whitespace-nowrap transition-all flex items-center gap-1 sm:gap-2 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {activeTab === 'dashboard' && <Dashboard records={records} />}
        {activeTab === 'input' && (
          <DataInput account={account} onSave={handleRecordSave} />
        )}
        {activeTab === 'ai' && <AIReportViewer records={records} />}
        {activeTab === 'export' && (
          <ExportPanel
            records={records}
            accountName={account?.accountName || '未設定'}
          />
        )}
        {activeTab === 'settings' && (
          <AccountSettings onSave={handleAccountSave} onAccountSwitch={loadData} />
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Instagram運用レポートアプリ</p>
          <p className="mt-1">データは全てローカルに保存されます</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
