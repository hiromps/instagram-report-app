import type { InstagramAccount, InstagramRecord } from '../types';
import { supabaseService } from './supabaseService';

const STORAGE_KEYS = {
  ACCOUNTS: 'instagramAccounts',
  ACTIVE_ACCOUNT_ID: 'activeAccountId',
  RECORDS: 'instagramRecords',
  API_KEY: 'openaiApiKey',
} as const;

class DataService {
  private useSupabase = true; // Supabaseを使用するかどうかのフラグ
  // 全アカウントの読み込み
  async loadAccounts(): Promise<InstagramAccount[]> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getAccounts();
      } catch (error) {
        console.error('アカウント情報の読み込みに失敗しました（Supabase）:', error);
        // フォールバックとしてlocalStorageから読み込み
        return this.loadAccountsFromLocalStorage();
      }
    }
    return this.loadAccountsFromLocalStorage();
  }

  private loadAccountsFromLocalStorage(): InstagramAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('アカウント情報の読み込みに失敗しました:', error);
      return [];
    }
  }

  // アカウント情報の保存（追加または更新）
  async saveAccount(account: InstagramAccount): Promise<void> {
    if (this.useSupabase) {
      try {
        const accounts = await this.loadAccounts();
        const existingAccount = accounts.find(a => a.accountId === account.accountId);

        if (existingAccount) {
          // 既存アカウントの更新
          await supabaseService.updateAccount(account.accountId, account);
        } else {
          // 新規アカウントの追加
          await supabaseService.createAccount(account);

          // 最初のアカウントの場合は自動的にアクティブに
          if (accounts.length === 0) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, account.accountId);
          }
        }

        // localStorageにも同期（フォールバック用）
        this.saveAccountToLocalStorage(account);
        return;
      } catch (error) {
        console.error('アカウント情報の保存に失敗しました（Supabase）:', error);
        // フォールバックとしてlocalStorageに保存
      }
    }
    this.saveAccountToLocalStorage(account);
  }

  private saveAccountToLocalStorage(account: InstagramAccount): void {
    try {
      const accounts = this.loadAccountsFromLocalStorage();
      const existingIndex = accounts.findIndex(a => a.accountId === account.accountId);

      if (existingIndex >= 0) {
        accounts[existingIndex] = {
          ...account,
          updatedAt: new Date().toISOString(),
        };
      } else {
        const newAccount = {
          ...account,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (accounts.length === 0) {
          newAccount.isActive = true;
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, account.accountId);
        }

        accounts.push(newAccount);
      }

      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (error) {
      console.error('アカウント情報の保存に失敗しました:', error);
      throw new Error('アカウント情報の保存に失敗しました');
    }
  }

  // アクティブなアカウントの取得（同期版）
  getActiveAccount(): InstagramAccount | null {
    try {
      const activeAccountId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      if (!activeAccountId) return null;

      const accounts = this.loadAccountsFromLocalStorage();
      return accounts.find(a => a.accountId === activeAccountId) || null;
    } catch (error) {
      console.error('アクティブアカウントの取得に失敗しました:', error);
      return null;
    }
  }

  // アクティブなアカウントを設定（同期版）
  setActiveAccount(accountId: string): void {
    try {
      const accounts = this.loadAccountsFromLocalStorage();
      const account = accounts.find(a => a.accountId === accountId);

      if (!account) {
        throw new Error('アカウントが見つかりません');
      }

      // 全アカウントのisActiveをfalseに
      accounts.forEach(a => a.isActive = false);

      // 指定されたアカウントをアクティブに
      account.isActive = true;

      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, accountId);
    } catch (error) {
      console.error('アクティブアカウントの設定に失敗しました:', error);
      throw new Error('アクティブアカウントの設定に失敗しました');
    }
  }

  // アカウントの削除（同期版）
  deleteAccount(accountId: string): void {
    try {
      const accounts = this.loadAccountsFromLocalStorage();
      const filteredAccounts = accounts.filter(a => a.accountId !== accountId);

      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filteredAccounts));

      // 削除したアカウントがアクティブだった場合
      const activeAccountId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      if (activeAccountId === accountId) {
        if (filteredAccounts.length > 0) {
          // 残っているアカウントの最初をアクティブに
          this.setActiveAccount(filteredAccounts[0].accountId);
        } else {
          // アカウントが全て削除された場合
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
        }
      }

      // アカウントに紐づく記録も削除
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const records = data ? JSON.parse(data) : [];
      const filteredRecords = records.filter((r: InstagramRecord) => r.accountId !== accountId);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filteredRecords));
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
  async saveRecord(record: InstagramRecord): Promise<void> {
    if (this.useSupabase) {
      try {
        const enrichedRecord = this.calculateRecordMetrics(record);
        await supabaseService.createRecord(enrichedRecord);

        // localStorageにも同期（フォールバック用）
        this.saveRecordToLocalStorage(enrichedRecord);
        return;
      } catch (error) {
        console.error('記録の保存に失敗しました（Supabase）:', error);
        // フォールバックとしてlocalStorageに保存
      }
    }
    this.saveRecordToLocalStorage(record);
  }

  private saveRecordToLocalStorage(record: InstagramRecord): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const records = data ? JSON.parse(data) : [];
      const enrichedRecord = this.calculateRecordMetrics(record);
      records.push(enrichedRecord);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('記録の保存に失敗しました:', error);
      throw new Error('記録の保存に失敗しました');
    }
  }

  // 記録の更新
  async updateRecord(id: string, updatedRecord: Partial<InstagramRecord>): Promise<void> {
    if (this.useSupabase) {
      try {
        await supabaseService.updateRecord(id, updatedRecord);

        // localStorageにも同期
        this.updateRecordInLocalStorage(id, updatedRecord);
        return;
      } catch (error) {
        console.error('記録の更新に失敗しました（Supabase）:', error);
      }
    }
    this.updateRecordInLocalStorage(id, updatedRecord);
  }

  private updateRecordInLocalStorage(id: string, updatedRecord: Partial<InstagramRecord>): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const records = data ? JSON.parse(data) : [];
      const index = records.findIndex((r: InstagramRecord) => r.id === id);

      if (index === -1) {
        throw new Error('記録が見つかりません');
      }

      const updated = {
        ...records[index],
        ...updatedRecord,
      };

      records[index] = this.calculateRecordMetrics(updated);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('記録の更新に失敗しました:', error);
      throw new Error('記録の更新に失敗しました');
    }
  }

  // 記録の削除
  async deleteRecord(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await supabaseService.deleteRecord(id);

        // localStorageからも削除
        this.deleteRecordFromLocalStorage(id);
        return;
      } catch (error) {
        console.error('記録の削除に失敗しました（Supabase）:', error);
      }
    }
    this.deleteRecordFromLocalStorage(id);
  }

  private deleteRecordFromLocalStorage(id: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const records = data ? JSON.parse(data) : [];
      const filtered = records.filter((r: InstagramRecord) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
    } catch (error) {
      console.error('記録の削除に失敗しました:', error);
      throw new Error('記録の削除に失敗しました');
    }
  }

  // 全記録の読み込み（アクティブアカウントのみ）
  async loadRecords(): Promise<InstagramRecord[]> {
    if (this.useSupabase) {
      try {
        const activeAccount = this.getActiveAccount();
        if (!activeAccount) return [];

        return await supabaseService.getRecords(activeAccount.accountId);
      } catch (error) {
        console.error('記録の読み込みに失敗しました（Supabase）:', error);
        // フォールバックとしてlocalStorageから読み込み
        return this.loadRecordsFromLocalStorage();
      }
    }
    return this.loadRecordsFromLocalStorage();
  }

  private loadRecordsFromLocalStorage(): InstagramRecord[] {
    try {
      const activeAccount = this.getActiveAccount();
      if (!activeAccount) return [];

      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const allRecords = data ? JSON.parse(data) : [];

      const records = allRecords.filter(
        (r: InstagramRecord) => r.accountId === activeAccount.accountId
      );

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
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
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
  async getRecordsByDateRange(startDate: string, endDate: string): Promise<InstagramRecord[]> {
    const records = await this.loadRecords();
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
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    } catch (error) {
      console.error('APIキーの保存に失敗しました:', error);
      throw new Error('APIキーの保存に失敗しました');
    }
  }

  // OpenAI APIキーの読み込み
  loadApiKey(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('APIキーの読み込みに失敗しました:', error);
      return null;
    }
  }

  // OpenAI APIキーの削除
  deleteApiKey(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('APIキーの削除に失敗しました:', error);
    }
  }

  // データの完全削除（リセット）
  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
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

      // 複数アカウント形式
      if (data.accounts && Array.isArray(data.accounts)) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data.accounts));
      }
      // 旧形式（単一アカウント）との互換性
      else if (data.account) {
        this.saveAccount(data.account);
      }

      if (data.records && Array.isArray(data.records)) {
        localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
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
