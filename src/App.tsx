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
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [records, setRecords] = useState<InstagramRecord[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedAccount = dataService.getActiveAccount();
    const loadedAccounts = await dataService.loadAccounts();
    const loadedRecords = await dataService.loadRecords();

    setAccount(loadedAccount);
    setAccounts(loadedAccounts);
    setRecords(loadedRecords);

    // アカウントが未設定の場合は設定タブを表示
    if (!loadedAccount) {
      setActiveTab('settings');
    }
  };

  const handleAccountSave = (newAccount: InstagramAccount | null) => {
    setAccount(newAccount);
    loadData(); // アカウント一覧も更新
    if (activeTab === 'settings' && newAccount) {
      setActiveTab('dashboard');
    }
  };

  const handleAccountSwitch = async (accountId: string) => {
    if (account?.accountId === accountId) {
      setShowAccountMenu(false);
      return;
    }

    try {
      dataService.setActiveAccount(accountId);
      await loadData();
      setShowAccountMenu(false);
    } catch (error) {
      console.error('アカウントの切り替えに失敗しました:', error);
    }
  };

  const handleAddAccount = () => {
    setActiveTab('settings');
    setShowAccountMenu(false);
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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Instagram運用レポート</h1>
              {account && (
                <p className="text-xs sm:text-sm mt-1 opacity-90">
                  {account.accountName} で運用中
                </p>
              )}
            </div>

            {/* アカウント切り替えドロップダウン */}
            {accounts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm border border-white/30"
                  title="アカウントを切り替え"
                >
                  <span className="text-base sm:text-lg">👤</span>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs opacity-80">アカウント</span>
                    <span className="text-sm font-semibold leading-tight">
                      {account?.accountName || '未選択'}
                    </span>
                  </div>
                  <div className="md:hidden">
                    <span className="text-sm font-medium">
                      {accounts.length}
                    </span>
                  </div>
                  <span className="text-xs ml-1">{showAccountMenu ? '▲' : '▼'}</span>
                </button>

                {/* ドロップダウンメニュー */}
                {showAccountMenu && (
                  <>
                    {/* 背景オーバーレイ */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAccountMenu(false)}
                    />

                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="py-2">
                        <div className="px-4 py-3 bg-gray-50 border-b">
                          <div className="text-xs font-semibold text-gray-500 uppercase">
                            アカウント一覧
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {accounts.length}個のアカウントを管理中
                          </div>
                        </div>
                        {accounts.map((acc) => {
                          const isActive = account?.accountId === acc.accountId;
                          return (
                            <button
                              key={acc.accountId}
                              onClick={() => handleAccountSwitch(acc.accountId)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-all flex items-center justify-between group ${
                                isActive ? 'bg-purple-50 border-l-4 border-purple-600' : 'border-l-4 border-transparent'
                              }`}
                            >
                              <div className="flex-1">
                                <div className={`font-medium ${isActive ? 'text-purple-900' : 'text-gray-900'}`}>
                                  {acc.accountName}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ID: {acc.accountId}
                                </div>
                                {isActive && (
                                  <div className="text-xs text-purple-600 font-medium mt-1">
                                    現在のアカウント
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isActive ? (
                                  <span className="text-purple-600 text-xl">✓</span>
                                ) : (
                                  <span className="text-gray-400 group-hover:text-purple-600 transition-colors">
                                    →
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        <div className="border-t mt-2 pt-2">
                          <button
                            onClick={handleAddAccount}
                            className="w-full text-left px-4 py-3 text-purple-600 hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                          >
                            <span className="text-lg">+</span>
                            <span>新しいアカウントを追加</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
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
