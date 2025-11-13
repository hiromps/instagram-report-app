import type { InstagramAccount, InstagramRecord } from '../types';
import { authService } from './authService';

const STORAGE_KEYS = {
  ACCOUNTS: 'instagramAccounts',
  ACTIVE_ACCOUNT_ID: 'activeAccountId',
  RECORDS: 'instagramRecords',
  API_KEY: 'openaiApiKey',
} as const;

class DataService {
  // ユーザー固有のストレージキーを取得
  private getUserKey(key: string): string {
    try {
      return authService.getUserStorageKey(key);
    } catch (error) {
      // ログインしていない場合は通常のキーを返す（後方互換性のため）
      return key;
    }
  }

  // 全アカウントの読み込み
  loadAccounts(): InstagramAccount[] {
    try {
      const key = this.getUserKey(STORAGE_KEYS.ACCOUNTS);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('アカウント情報の読み込みに失敗しました:', error);
      return [];
    }
  }

  // アカウント情報の保存（追加または更新）
  saveAccount(account: InstagramAccount): void {
    try {
      const accounts = this.loadAccounts();
      const existingIndex = accounts.findIndex(a => a.accountId === account.accountId);

      if (existingIndex >= 0) {
        // 既存アカウントの更新
        accounts[existingIndex] = {
          ...account,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // 新規アカウントの追加
        const newAccount = {
          ...account,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 最初のアカウントの場合は自動的にアクティブに
        if (accounts.length === 0) {
          newAccount.isActive = true;
          const activeKey = this.getUserKey(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
          localStorage.setItem(activeKey, account.accountId);
          console.log('Active account ID saved:', account.accountId);
        }

        accounts.push(newAccount);
      }

      const accountsKey = this.getUserKey(STORAGE_KEYS.ACCOUNTS);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      console.log('Accounts saved to localStorage:', accounts);
    } catch (error) {
      console.error('アカウント情報の保存に失敗しました:', error);
      throw new Error('アカウント情報の保存に失敗しました');
    }
  }

  // アクティブなアカウントの取得
  getActiveAccount(): InstagramAccount | null {
    try {
      const activeKey = this.getUserKey(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      const activeAccountId = localStorage.getItem(activeKey);
      if (!activeAccountId) return null;

      const accounts = this.loadAccounts();
      return accounts.find(a => a.accountId === activeAccountId) || null;
    } catch (error) {
      console.error('アクティブアカウントの取得に失敗しました:', error);
      return null;
    }
  }

  // アクティブなアカウントを設定
  setActiveAccount(accountId: string): void {
    try {
      const accounts = this.loadAccounts();
      const account = accounts.find(a => a.accountId === accountId);

      if (!account) {
        throw new Error('アカウントが見つかりません');
      }

      // 全アカウントのisActiveをfalseに
      accounts.forEach(a => a.isActive = false);

      // 指定されたアカウントをアクティブに
      account.isActive = true;

      const accountsKey = this.getUserKey(STORAGE_KEYS.ACCOUNTS);
      const activeKey = this.getUserKey(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      localStorage.setItem(activeKey, accountId);
    } catch (error) {
      console.error('アクティブアカウントの設定に失敗しました:', error);
      throw new Error('アクティブアカウントの設定に失敗しました');
    }
  }

  // アカウントの削除
  deleteAccount(accountId: string): void {
    try {
      const accounts = this.loadAccounts();
      const filteredAccounts = accounts.filter(a => a.accountId !== accountId);

      const accountsKey = this.getUserKey(STORAGE_KEYS.ACCOUNTS);
      localStorage.setItem(accountsKey, JSON.stringify(filteredAccounts));

      // 削除したアカウントがアクティブだった場合
      const activeKey = this.getUserKey(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      const activeAccountId = localStorage.getItem(activeKey);
      if (activeAccountId === accountId) {
        if (filteredAccounts.length > 0) {
          // 残っているアカウントの最初をアクティブに
          this.setActiveAccount(filteredAccounts[0].accountId);
        } else {
          // アカウントが全て削除された場合
          localStorage.removeItem(activeKey);
        }
      }

      // アカウントに紐づく記録も削除
      const records = this.loadAllRecords();
      const filteredRecords = records.filter(r => r.accountId !== accountId);
      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);
      localStorage.setItem(recordsKey, JSON.stringify(filteredRecords));
    } catch (error) {
      console.error('アカウントの削除に失敗しました:', error);
      throw new Error('アカウントの削除に失敗しました');
    }
  }

  // 後方互換性のため（既存コードで使用されている場合）
  loadAccount(): InstagramAccount | null {
    return this.getActiveAccount();
  }

  // 記録の保存
  saveRecord(record: InstagramRecord): void {
    try {
      const allRecords = this.loadAllRecords();

      // 自動計算フィールドを追加
      const enrichedRecord = this.calculateRecordMetrics(record);

      allRecords.push(enrichedRecord);
      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);
      localStorage.setItem(recordsKey, JSON.stringify(allRecords));
    } catch (error) {
      console.error('記録の保存に失敗しました:', error);
      throw new Error('記録の保存に失敗しました');
    }
  }

  // 記録の更新
  updateRecord(id: string, updatedRecord: Partial<InstagramRecord>): void {
    try {
      const records = this.loadAllRecords();
      const index = records.findIndex(r => r.id === id);

      if (index === -1) {
        throw new Error('記録が見つかりません');
      }

      const updated = {
        ...records[index],
        ...updatedRecord,
      };

      records[index] = this.calculateRecordMetrics(updated);
      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);
      localStorage.setItem(recordsKey, JSON.stringify(records));
    } catch (error) {
      console.error('記録の更新に失敗しました:', error);
      throw new Error('記録の更新に失敗しました');
    }
  }

  // 記録の削除
  deleteRecord(id: string): void {
    try {
      const records = this.loadAllRecords();
      const filtered = records.filter(r => r.id !== id);
      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);
      localStorage.setItem(recordsKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('記録の削除に失敗しました:', error);
      throw new Error('記録の削除に失敗しました');
    }
  }

  // 全記録の読み込み（アクティブアカウントのみ）
  loadRecords(): InstagramRecord[] {
    try {
      const activeAccount = this.getActiveAccount();
      if (!activeAccount) return [];

      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);
      const data = localStorage.getItem(recordsKey);
      const allRecords = data ? JSON.parse(data) : [];

      // アクティブアカウントの記録のみフィルタリング
      const records = allRecords.filter(
        (r: InstagramRecord) => r.accountId === activeAccount.accountId
      );

      // 日付でソート（新しい順）
      return records.sort((a: InstagramRecord, b: InstagramRecord) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    } catch (error) {
      console.error('記録の読み込みに失敗しました:', error);
      return [];
    }
  }

  // 全アカウントの全記録を読み込み
  loadAllRecords(): InstagramRecord[] {
    try {
      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);
      const data = localStorage.getItem(recordsKey);
      const records = data ? JSON.parse(data) : [];

      return records.sort((a: InstagramRecord, b: InstagramRecord) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    } catch (error) {
      console.error('記録の読み込みに失敗しました:', error);
      return [];
    }
  }

  // 特定期間の記録を取得
  getRecordsByDateRange(startDate: string, endDate: string): InstagramRecord[] {
    const records = this.loadRecords();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return records.filter(record => {
      const recordDate = new Date(record.date).getTime();
      return recordDate >= start && recordDate <= end;
    });
  }

  // OpenAI APIキーの保存
  saveApiKey(apiKey: string): void {
    try {
      const apiKeyKey = this.getUserKey(STORAGE_KEYS.API_KEY);
      localStorage.setItem(apiKeyKey, apiKey);
    } catch (error) {
      console.error('APIキーの保存に失敗しました:', error);
      throw new Error('APIキーの保存に失敗しました');
    }
  }

  // OpenAI APIキーの読み込み
  loadApiKey(): string | null {
    try {
      const apiKeyKey = this.getUserKey(STORAGE_KEYS.API_KEY);
      return localStorage.getItem(apiKeyKey);
    } catch (error) {
      console.error('APIキーの読み込みに失敗しました:', error);
      return null;
    }
  }

  // OpenAI APIキーの削除
  deleteApiKey(): void {
    try {
      const apiKeyKey = this.getUserKey(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(apiKeyKey);
    } catch (error) {
      console.error('APIキーの削除に失敗しました:', error);
    }
  }

  // データの完全削除（リセット）
  clearAllData(): void {
    try {
      const accountsKey = this.getUserKey(STORAGE_KEYS.ACCOUNTS);
      const activeKey = this.getUserKey(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);

      localStorage.removeItem(accountsKey);
      localStorage.removeItem(activeKey);
      localStorage.removeItem(recordsKey);
    } catch (error) {
      console.error('データの削除に失敗しました:', error);
      throw new Error('データの削除に失敗しました');
    }
  }

  // データのエクスポート（全アカウント）
  exportAllData(): string {
    const accounts = this.loadAccounts();
    const records = this.loadAllRecords();

    return JSON.stringify({
      accounts,
      records,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  // データのインポート
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      const accountsKey = this.getUserKey(STORAGE_KEYS.ACCOUNTS);
      const recordsKey = this.getUserKey(STORAGE_KEYS.RECORDS);

      // 複数アカウント形式
      if (data.accounts && Array.isArray(data.accounts)) {
        localStorage.setItem(accountsKey, JSON.stringify(data.accounts));
      }
      // 旧形式（単一アカウント）との互換性
      else if (data.account) {
        this.saveAccount(data.account);
      }

      if (data.records && Array.isArray(data.records)) {
        localStorage.setItem(recordsKey, JSON.stringify(data.records));
      }
    } catch (error) {
      console.error('データのインポートに失敗しました:', error);
      throw new Error('データのインポートに失敗しました');
    }
  }

  // 記録の自動計算フィールドを算出
  private calculateRecordMetrics(record: InstagramRecord): InstagramRecord {
    const followerGrowth = record.followersAfter - record.followersBefore;
    const followingGrowth = record.followingAfter - record.followingBefore;
    const postGrowth = record.postsAfter - record.postsBefore;

    // フォローバック率の計算
    const followBackRate = followingGrowth > 0
      ? (followerGrowth / followingGrowth) * 100
      : 0;

    return {
      ...record,
      followerGrowth,
      followingGrowth,
      postGrowth,
      followBackRate: Math.round(followBackRate * 100) / 100,
    };
  }
}

export const dataService = new DataService();
