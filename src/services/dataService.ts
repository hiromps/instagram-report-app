import type { InstagramAccount, InstagramRecord } from '../types';

const STORAGE_KEYS = {
  ACCOUNT: 'instagramAccount',
  RECORDS: 'instagramRecords',
  API_KEY: 'openaiApiKey',
} as const;

class DataService {
  // アカウント情報の保存
  saveAccount(account: InstagramAccount): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
    } catch (error) {
      console.error('アカウント情報の保存に失敗しました:', error);
      throw new Error('アカウント情報の保存に失敗しました');
    }
  }

  // アカウント情報の読み込み
  loadAccount(): InstagramAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('アカウント情報の読み込みに失敗しました:', error);
      return null;
    }
  }

  // 記録の保存
  saveRecord(record: InstagramRecord): void {
    try {
      const records = this.loadRecords();

      // 自動計算フィールドを追加
      const enrichedRecord = this.calculateRecordMetrics(record);

      records.push(enrichedRecord);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('記録の保存に失敗しました:', error);
      throw new Error('記録の保存に失敗しました');
    }
  }

  // 記録の更新
  updateRecord(id: string, updatedRecord: Partial<InstagramRecord>): void {
    try {
      const records = this.loadRecords();
      const index = records.findIndex(r => r.id === id);

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
  deleteRecord(id: string): void {
    try {
      const records = this.loadRecords();
      const filtered = records.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
    } catch (error) {
      console.error('記録の削除に失敗しました:', error);
      throw new Error('記録の削除に失敗しました');
    }
  }

  // 全記録の読み込み
  loadRecords(): InstagramRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const records = data ? JSON.parse(data) : [];

      // 日付でソート（新しい順）
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
      localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
    } catch (error) {
      console.error('データの削除に失敗しました:', error);
      throw new Error('データの削除に失敗しました');
    }
  }

  // データのエクスポート
  exportAllData(): string {
    const account = this.loadAccount();
    const records = this.loadRecords();

    return JSON.stringify({
      account,
      records,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  // データのインポート
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (data.account) {
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
