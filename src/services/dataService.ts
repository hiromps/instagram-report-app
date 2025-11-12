import type { InstagramAccount, InstagramRecord } from '../types';
import { supabaseService } from './supabaseService';

const STORAGE_KEYS = {
  ACTIVE_ACCOUNT_ID: 'activeAccountId',
  API_KEY: 'openaiApiKey',
} as const;

class DataService {
  // 全アカウントの読み込み
  async loadAccounts(): Promise<InstagramAccount[]> {
    try {
      console.log('📚 Supabaseからアカウント一覧を読み込み中...');
      const accounts = await supabaseService.getAccounts();
      console.log(`✅ ${accounts.length}件のアカウントを読み込みました`);
      return accounts;
    } catch (error) {
      console.error('❌ アカウント情報の読み込みに失敗しました:', error);
      throw new Error('アカウント情報の読み込みに失敗しました');
    }
  }

  // アカウント情報の保存（追加または更新）
  async saveAccount(account: InstagramAccount): Promise<void> {
    try {
      console.log('💾 アカウント情報を保存中:', account.accountName);
      const accounts = await this.loadAccounts();
      const existingAccount = accounts.find(a => a.accountId === account.accountId);

      if (existingAccount) {
        // 既存アカウントの更新
        console.log('🔄 既存アカウントを更新中...');
        await supabaseService.updateAccount(account.accountId, account);
      } else {
        // 新規アカウントの追加
        console.log('➕ 新規アカウントを作成中...');
        await supabaseService.createAccount(account);

        // 最初のアカウントの場合は自動的にアクティブに
        if (accounts.length === 0) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, account.accountId);
          console.log('✅ 最初のアカウントとしてアクティブに設定しました');
        }
      }

      console.log('✅ アカウント情報の保存に成功しました');
    } catch (error) {
      console.error('❌ アカウント情報の保存に失敗しました:', error);
      throw new Error('アカウント情報の保存に失敗しました');
    }
  }

  // アクティブなアカウントの取得
  async getActiveAccount(): Promise<InstagramAccount | null> {
    try {
      const activeAccountId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      if (!activeAccountId) {
        console.log('ℹ️ アクティブなアカウントが設定されていません');
        return null;
      }

      const accounts = await this.loadAccounts();
      const activeAccount = accounts.find(a => a.accountId === activeAccountId);

      if (!activeAccount) {
        console.warn('⚠️ アクティブなアカウントIDに対応するアカウントが見つかりません');
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
        return null;
      }

      return activeAccount;
    } catch (error) {
      console.error('❌ アクティブアカウントの取得に失敗しました:', error);
      return null;
    }
  }

  // アクティブなアカウントを設定
  async setActiveAccount(accountId: string): Promise<void> {
    try {
      console.log('🔄 アクティブアカウントを切り替え中:', accountId);
      const accounts = await this.loadAccounts();
      const account = accounts.find(a => a.accountId === accountId);

      if (!account) {
        throw new Error('アカウントが見つかりません');
      }

      // 全アカウントのisActiveをfalseに、指定されたアカウントをtrueに更新
      for (const acc of accounts) {
        const isActive = acc.accountId === accountId;
        if (acc.isActive !== isActive) {
          await supabaseService.updateAccount(acc.accountId, { isActive });
        }
      }

      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, accountId);
      console.log('✅ アクティブアカウントを切り替えました:', account.accountName);
    } catch (error) {
      console.error('❌ アクティブアカウントの設定に失敗しました:', error);
      throw new Error('アクティブアカウントの設定に失敗しました');
    }
  }

  // アカウントの削除
  async deleteAccount(accountId: string): Promise<void> {
    try {
      console.log('🗑️ アカウントを削除中:', accountId);

      // Supabaseから削除（CASCADE設定により関連する記録も自動削除）
      const accounts = await this.loadAccounts();
      const accountToDelete = accounts.find(a => a.accountId === accountId);

      if (!accountToDelete) {
        throw new Error('削除対象のアカウントが見つかりません');
      }

      // アカウントの削除（記録も連鎖削除される）
      await supabaseService.deleteAccount(accountId);

      // 削除したアカウントがアクティブだった場合
      const activeAccountId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      if (activeAccountId === accountId) {
        const remainingAccounts = accounts.filter(a => a.accountId !== accountId);
        if (remainingAccounts.length > 0) {
          // 残っているアカウントの最初をアクティブに
          await this.setActiveAccount(remainingAccounts[0].accountId);
        } else {
          // アカウントが全て削除された場合
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
        }
      }

      console.log('✅ アカウントと関連する記録を削除しました');
    } catch (error) {
      console.error('❌ アカウントの削除に失敗しました:', error);
      throw new Error('アカウントの削除に失敗しました');
    }
  }

  // 後方互換性のため（既存コードで使用されている場合）
  loadAccount(): Promise<InstagramAccount | null> {
    return this.getActiveAccount();
  }

  // 記録の保存
  async saveRecord(record: InstagramRecord): Promise<void> {
    try {
      const enrichedRecord = this.calculateRecordMetrics(record);

      console.log('🔄 Supabaseに記録を保存中...', {
        date: enrichedRecord.date,
        accountId: enrichedRecord.accountId,
      });

      const result = await supabaseService.createRecord(enrichedRecord);

      if (result) {
        console.log('✅ Supabaseへの保存に成功しました:', result.id);
      } else {
        throw new Error('保存結果がnullです');
      }
    } catch (error) {
      console.error('❌ 記録の保存に失敗しました:', error);
      throw new Error('記録の保存に失敗しました');
    }
  }

  // 記録の更新
  async updateRecord(id: string, updatedRecord: Partial<InstagramRecord>): Promise<void> {
    try {
      console.log('🔄 記録を更新中:', id);
      await supabaseService.updateRecord(id, updatedRecord);
      console.log('✅ 記録の更新に成功しました');
    } catch (error) {
      console.error('❌ 記録の更新に失敗しました:', error);
      throw new Error('記録の更新に失敗しました');
    }
  }

  // 記録の削除
  async deleteRecord(id: string): Promise<void> {
    try {
      console.log('🗑️ 記録を削除中:', id);
      await supabaseService.deleteRecord(id);
      console.log('✅ 記録の削除に成功しました');
    } catch (error) {
      console.error('❌ 記録の削除に失敗しました:', error);
      throw new Error('記録の削除に失敗しました');
    }
  }

  // 全記録の読み込み（アクティブアカウントのみ）
  async loadRecords(): Promise<InstagramRecord[]> {
    try {
      const activeAccountId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      if (!activeAccountId) {
        console.log('ℹ️ アクティブなアカウントが設定されていません');
        return [];
      }

      console.log('📚 Supabaseから記録を読み込み中...');
      const records = await supabaseService.getRecords(activeAccountId);
      console.log(`✅ ${records.length}件の記録を読み込みました`);
      return records;
    } catch (error) {
      console.error('❌ 記録の読み込みに失敗しました:', error);
      return [];
    }
  }

  // 全アカウントの全記録を読み込み
  async loadAllRecords(): Promise<InstagramRecord[]> {
    try {
      console.log('📚 Supabaseから全記録を読み込み中...');
      const records = await supabaseService.getRecords(); // accountIdなし = 全記録
      console.log(`✅ ${records.length}件の記録を読み込みました`);
      return records;
    } catch (error) {
      console.error('❌ 全記録の読み込みに失敗しました:', error);
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

  // OpenAI APIキーの保存（localStorageのまま）
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
  async clearAllData(): Promise<void> {
    try {
      console.log('🗑️ 全データを削除中...');

      // 全アカウントを削除（記録も連鎖削除される）
      const accounts = await this.loadAccounts();
      for (const account of accounts) {
        await supabaseService.deleteAccount(account.accountId);
      }

      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      console.log('✅ 全データの削除が完了しました');
    } catch (error) {
      console.error('❌ データの削除に失敗しました:', error);
      throw new Error('データの削除に失敗しました');
    }
  }

  // データのエクスポート（全アカウント）
  async exportAllData(): Promise<string> {
    try {
      console.log('📤 データをエクスポート中...');
      const accounts = await this.loadAccounts();
      const records = await this.loadAllRecords();

      const exportData = {
        accounts,
        records,
        exportedAt: new Date().toISOString(),
      };

      console.log('✅ データのエクスポートが完了しました');
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ データのエクスポートに失敗しました:', error);
      throw new Error('データのエクスポートに失敗しました');
    }
  }

  // データのインポート
  async importData(jsonData: string): Promise<void> {
    try {
      console.log('📥 データをインポート中...');
      const data = JSON.parse(jsonData);

      // アカウントのインポート
      if (data.accounts && Array.isArray(data.accounts)) {
        for (const account of data.accounts) {
          await this.saveAccount(account);
        }
      } else if (data.account) {
        // 旧形式（単一アカウント）との互換性
        await this.saveAccount(data.account);
      }

      // 記録のインポート
      if (data.records && Array.isArray(data.records)) {
        for (const record of data.records) {
          await supabaseService.createRecord(record);
        }
      }

      console.log('✅ データのインポートが完了しました');
    } catch (error) {
      console.error('❌ データのインポートに失敗しました:', error);
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
