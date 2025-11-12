import { useState, useEffect } from 'react';
import type { InstagramAccount, InstagramRecord } from './types';
import { dataService } from './services/dataService';
import { supabaseService } from './services/supabaseService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { DataInput } from './components/DataInput';
import { AIReportViewer } from './components/AIReportViewer';
import { ExportPanel } from './components/ExportPanel';
import { AccountSettings } from './components/AccountSettings';

type TabType = 'dashboard' | 'input' | 'ai' | 'export' | 'settings';

function MainApp() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [records, setRecords] = useState<InstagramRecord[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    // Supabase接続テストを実行
    const testSupabaseConnection = async () => {
      const result = await supabaseService.testConnection();
      if (result.success) {
        console.log('✅ Supabase接続確認:', result.message);
      } else {
        console.error('❌ Supabase接続エラー:', result.message, result.details);
      }
    };

    testSupabaseConnection();
    loadData();
  }, []);

  const loadData = async () => {
    const loadedAccount = await dataService.getActiveAccount();
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
      await dataService.setActiveAccount(accountId);
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
      <header className="instagram-gradient text-white shadow-lg relative">
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

            {/* ユーザー情報とログアウトボタン */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs opacity-80">ログイン中</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <button
                onClick={async () => {
                  if (window.confirm('ログアウトしますか？')) {
                    await signOut();
                  }
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* アカウント切り替えドロップダウン - ログアウトボタンの下 */}
        {accounts.length > 0 && (
          <div className="absolute top-20 right-4 sm:top-24 sm:right-6 z-30">
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm border border-white/30 shadow-lg"
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
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAccountMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
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
          </div>
        )}
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
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未ログイン時は認証画面を表示
  if (!user) {
    return <Auth />;
  }

  // ログイン済みの場合はメインアプリを表示
  return <MainApp />;
}

// AuthProviderでラップしてエクスポート
export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
