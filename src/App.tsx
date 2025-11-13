import { useState, useEffect } from 'react';
import type { InstagramAccount, InstagramRecord, User } from './types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';
import { Dashboard } from './components/Dashboard';
import { DataInput } from './components/DataInput';
import { AIReportViewer } from './components/AIReportViewer';
import { ExportPanel } from './components/ExportPanel';
import { AccountSettings } from './components/AccountSettings';
import { Login } from './components/Login';

type TabType = 'dashboard' | 'input' | 'ai' | 'export' | 'settings';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期タブをlocalStorageの状態に基づいて設定
  const getInitialTab = (): TabType => {
    const activeAccount = dataService.getActiveAccount();
    return activeAccount ? 'dashboard' : 'settings';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [records, setRecords] = useState<InstagramRecord[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 認証セッションを初期化
        const currentUser = await authService.initialize();
        setUser(currentUser);

        if (currentUser) {
          await loadData();
        }
      } catch (error) {
        console.error('認証の初期化に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadData();
      } else {
        setAccount(null);
        setAccounts([]);
        setRecords([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      const loadedAccount = await dataService.getActiveAccount();
      const loadedAccounts = await dataService.loadAccounts();
      const loadedRecords = await dataService.loadRecords();

      console.log('loadData called:', {
        loadedAccount,
        loadedAccounts: loadedAccounts.length,
        loadedRecords: loadedRecords.length,
      });

      setAccount(loadedAccount);
      setAccounts(loadedAccounts);
      setRecords(loadedRecords);

      // アカウントが未設定の場合は設定タブを表示
      if (!loadedAccount) {
        setActiveTab('settings');
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  };

  const handleAccountSave = async (newAccount: InstagramAccount | null) => {
    setAccount(newAccount);
    await loadData(); // アカウント一覧も更新
    if (activeTab === 'settings' && newAccount) {
      setActiveTab('dashboard');
    }
  };

  const handleAccountSwitch = async (accountId: string) => {
    try {
      await dataService.setActiveAccount(accountId);
      await loadData();
      setShowAccountMenu(false);
    } catch (error) {
      alert('アカウントの切り替えに失敗しました');
      console.error(error);
    }
  };

  const handleAddAccount = () => {
    setActiveTab('settings');
    setShowAccountMenu(false);
  };

  const handleRecordSave = async () => {
    await loadData();
    setActiveTab('dashboard');
  };

  const handleLogin = async () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    await loadData();
  };

  const handleLogout = async () => {
    if (window.confirm('ログアウトしますか？\n別のアカウントでログインする際に使用できます。')) {
      try {
        await authService.logout();
        setUser(null);
        setAccount(null);
        setAccounts([]);
        setRecords([]);
        setActiveTab('dashboard');
      } catch (error) {
        console.error('ログアウトに失敗しました:', error);
        alert('ログアウトに失敗しました');
      }
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'ダッシュボード', icon: '📊', requiresAccount: true },
    { id: 'input' as TabType, label: 'データ入力', icon: '✏️', requiresAccount: true },
    { id: 'ai' as TabType, label: 'AI分析', icon: '🤖', requiresAccount: true },
    { id: 'export' as TabType, label: 'エクスポート', icon: '📥', requiresAccount: true },
    { id: 'settings' as TabType, label: '設定', icon: '⚙️', requiresAccount: false },
  ];

  const handleTabClick = (tabId: TabType) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.requiresAccount && !account) {
      alert('アカウントを設定してください');
      setActiveTab('settings');
      return;
    }
    setActiveTab(tabId);
  };

  // ログイン画面を表示
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

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

            {/* ログアウトボタン */}
            <button
              onClick={handleLogout}
              className="mr-2 sm:mr-4 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2 text-sm"
              title="ログアウト"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">ログアウト</span>
            </button>

            {/* アカウント切り替えドロップダウン */}
            {accounts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <span className="text-sm sm:text-base">👤</span>
                  <span className="hidden sm:inline text-sm font-medium">
                    {accounts.length}アカウント
                  </span>
                  <span className="text-xs">▼</span>
                </button>

                {/* ドロップダウンメニュー */}
                {showAccountMenu && (
                  <>
                    {/* 背景オーバーレイ */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAccountMenu(false)}
                    />

                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                          アカウント一覧
                        </div>
                        {accounts.map((acc) => (
                          <button
                            key={acc.accountId}
                            onClick={() => handleAccountSwitch(acc.accountId)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              account?.accountId === acc.accountId ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{acc.accountName}</div>
                              <div className="text-xs text-gray-500">ID: {acc.accountId}</div>
                            </div>
                            {account?.accountId === acc.accountId && (
                              <span className="text-purple-600 text-lg">✓</span>
                            )}
                          </button>
                        ))}
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
            {tabs.map((tab) => {
              const isDisabled = tab.requiresAccount && !account;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={isDisabled}
                  className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium whitespace-nowrap transition-all flex items-center gap-1 sm:gap-2 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base sm:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
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
