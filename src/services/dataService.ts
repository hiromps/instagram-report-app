import { supabase } from '../lib/supabaseClient';
import type { InstagramAccount, InstagramRecord } from '../types';
import { authService } from './authService';

interface DbInstagramAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbInstagramRecord {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  posts_before: number;
  followers_before: number;
  following_before: number;
  posts_after: number;
  followers_after: number;
  following_after: number;
  start_time: string;
  likes: number;
  main_loop: number;
  operation_time: number;
  other_memo: string;
  follower_growth: number;
  following_growth: number;
  post_growth: number;
  follow_back_rate: number;
  created_at: string;
  updated_at: string;
}

class DataService {
  // ==========================================
  // アカウント管理
  // ==========================================

  // 全アカウントの読み込み
  async loadAccounts(): Promise<InstagramAccount[]> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(this.mapDbAccountToApp);
    } catch (error) {
      console.error('アカウント情報の読み込みに失敗しました:', error);
      return [];
    }
  }

  // アカウント情報の保存（追加または更新）
  async saveAccount(account: InstagramAccount): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      // 既存アカウントを確認
      const { data: existing } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', account.accountId)
        .single();

      if (existing) {
        // 既存アカウントの更新
        const { error } = await supabase
          .from('instagram_accounts')
          .update({
            account_name: account.accountName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          throw error;
        }
      } else {
        // 新規アカウントの追加
        // 最初のアカウントの場合は自動的にアクティブに
        const accounts = await this.loadAccounts();
        const isFirst = accounts.length === 0;

        const { error } = await supabase.from('instagram_accounts').insert({
          user_id: userId,
          account_name: account.accountName,
          account_id: account.accountId,
          is_active: isFirst,
        });

        if (error) {
          throw error;
        }
      }

      console.log('アカウント情報を保存しました');
    } catch (error) {
      console.error('アカウント情報の保存に失敗しました:', error);
      throw new Error('アカウント情報の保存に失敗しました');
    }
  }

  // アクティブなアカウントの取得
  async getActiveAccount(): Promise<InstagramAccount | null> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        return null;
      }

      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合
          return null;
        }
        throw error;
      }

      return data ? this.mapDbAccountToApp(data) : null;
    } catch (error) {
      console.error('アクティブアカウントの取得に失敗しました:', error);
      return null;
    }
  }

  // アクティブなアカウントを設定
  async setActiveAccount(accountId: string): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      // 全アカウントのis_activeをfalseに
      const { error: deactivateError } = await supabase
        .from('instagram_accounts')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) {
        throw deactivateError;
      }

      // 指定されたアカウントをアクティブに
      const { error: activateError } = await supabase
        .from('instagram_accounts')
        .update({ is_active: true })
        .eq('user_id', userId)
        .eq('account_id', accountId);

      if (activateError) {
        throw activateError;
      }

      console.log('アクティブアカウントを設定しました:', accountId);
    } catch (error) {
      console.error('アクティブアカウントの設定に失敗しました:', error);
      throw new Error('アクティブアカウントの設定に失敗しました');
    }
  }

  // アカウントの削除
  async deleteAccount(accountId: string): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      // アカウントを削除（CASCADE設定により関連レコードも自動削除）
      const { error } = await supabase
        .from('instagram_accounts')
        .delete()
        .eq('user_id', userId)
        .eq('account_id', accountId);

      if (error) {
        throw error;
      }

      // 削除したアカウントがアクティブだった場合、別のアカウントをアクティブに
      const accounts = await this.loadAccounts();
      if (accounts.length > 0 && !accounts.some((a) => a.isActive)) {
        await this.setActiveAccount(accounts[0].accountId);
      }

      console.log('アカウントを削除しました:', accountId);
    } catch (error) {
      console.error('アカウントの削除に失敗しました:', error);
      throw new Error('アカウントの削除に失敗しました');
    }
  }

  // 後方互換性のため
  loadAccount(): Promise<InstagramAccount | null> {
    return this.getActiveAccount();
  }

  // ==========================================
  // 記録管理
  // ==========================================

  // 記録の保存
  async saveRecord(record: InstagramRecord): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      const { error } = await supabase.from('instagram_records').insert({
        user_id: userId,
        account_id: record.accountId,
        date: record.date,
        posts_before: record.postsBefore,
        followers_before: record.followersBefore,
        following_before: record.followingBefore,
        posts_after: record.postsAfter,
        followers_after: record.followersAfter,
        following_after: record.followingAfter,
        start_time: record.startTime,
        likes: record.likes,
        main_loop: record.mainLoop,
        operation_time: record.operationTime,
        other_memo: record.otherMemo,
      });

      if (error) {
        throw error;
      }

      console.log('記録を保存しました');
    } catch (error) {
      console.error('記録の保存に失敗しました:', error);
      throw new Error('記録の保存に失敗しました');
    }
  }

  // 記録の更新
  async updateRecord(id: string, updatedRecord: Partial<InstagramRecord>): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      const updateData: any = {};

      if (updatedRecord.date !== undefined) updateData.date = updatedRecord.date;
      if (updatedRecord.postsBefore !== undefined)
        updateData.posts_before = updatedRecord.postsBefore;
      if (updatedRecord.followersBefore !== undefined)
        updateData.followers_before = updatedRecord.followersBefore;
      if (updatedRecord.followingBefore !== undefined)
        updateData.following_before = updatedRecord.followingBefore;
      if (updatedRecord.postsAfter !== undefined)
        updateData.posts_after = updatedRecord.postsAfter;
      if (updatedRecord.followersAfter !== undefined)
        updateData.followers_after = updatedRecord.followersAfter;
      if (updatedRecord.followingAfter !== undefined)
        updateData.following_after = updatedRecord.followingAfter;
      if (updatedRecord.startTime !== undefined)
        updateData.start_time = updatedRecord.startTime;
      if (updatedRecord.likes !== undefined) updateData.likes = updatedRecord.likes;
      if (updatedRecord.mainLoop !== undefined)
        updateData.main_loop = updatedRecord.mainLoop;
      if (updatedRecord.operationTime !== undefined)
        updateData.operation_time = updatedRecord.operationTime;
      if (updatedRecord.otherMemo !== undefined)
        updateData.other_memo = updatedRecord.otherMemo;

      const { error } = await supabase
        .from('instagram_records')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      console.log('記録を更新しました');
    } catch (error) {
      console.error('記録の更新に失敗しました:', error);
      throw new Error('記録の更新に失敗しました');
    }
  }

  // 記録の削除
  async deleteRecord(id: string): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      const { error } = await supabase
        .from('instagram_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      console.log('記録を削除しました');
    } catch (error) {
      console.error('記録の削除に失敗しました:', error);
      throw new Error('記録の削除に失敗しました');
    }
  }

  // 全記録の読み込み（アクティブアカウントのみ）
  async loadRecords(): Promise<InstagramRecord[]> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        return [];
      }

      const activeAccount = await this.getActiveAccount();
      if (!activeAccount) {
        return [];
      }

      const { data, error } = await supabase
        .from('instagram_records')
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', activeAccount.accountId)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(this.mapDbRecordToApp);
    } catch (error) {
      console.error('記録の読み込みに失敗しました:', error);
      return [];
    }
  }

  // 全アカウントの全記録を読み込み
  async loadAllRecords(): Promise<InstagramRecord[]> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('instagram_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(this.mapDbRecordToApp);
    } catch (error) {
      console.error('記録の読み込みに失敗しました:', error);
      return [];
    }
  }

  // 特定期間の記録を取得
  async getRecordsByDateRange(startDate: string, endDate: string): Promise<InstagramRecord[]> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        return [];
      }

      const activeAccount = await this.getActiveAccount();
      if (!activeAccount) {
        return [];
      }

      const { data, error } = await supabase
        .from('instagram_records')
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', activeAccount.accountId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(this.mapDbRecordToApp);
    } catch (error) {
      console.error('期間指定での記録読み込みに失敗しました:', error);
      return [];
    }
  }

  // ==========================================
  // ユーザー設定
  // ==========================================

  // OpenAI APIキーの保存
  async saveApiKey(apiKey: string): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      // 既存の設定を確認
      const { data: existing } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // 更新
        const { error } = await supabase
          .from('user_settings')
          .update({ openai_api_key: apiKey })
          .eq('user_id', userId);

        if (error) {
          throw error;
        }
      } else {
        // 新規作成
        const { error } = await supabase
          .from('user_settings')
          .insert({ user_id: userId, openai_api_key: apiKey });

        if (error) {
          throw error;
        }
      }

      console.log('APIキーを保存しました');
    } catch (error) {
      console.error('APIキーの保存に失敗しました:', error);
      throw new Error('APIキーの保存に失敗しました');
    }
  }

  // OpenAI APIキーの読み込み
  async loadApiKey(): Promise<string | null> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('openai_api_key')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合
          return null;
        }
        throw error;
      }

      return data?.openai_api_key || null;
    } catch (error) {
      console.error('APIキーの読み込みに失敗しました:', error);
      return null;
    }
  }

  // OpenAI APIキーの削除
  async deleteApiKey(): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      const { error } = await supabase
        .from('user_settings')
        .update({ openai_api_key: null })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      console.log('APIキーを削除しました');
    } catch (error) {
      console.error('APIキーの削除に失敗しました:', error);
    }
  }

  // ==========================================
  // データ管理
  // ==========================================

  // データの完全削除（リセット）
  async clearAllData(): Promise<void> {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('ログインしていません');
      }

      // 全記録を削除
      await supabase.from('instagram_records').delete().eq('user_id', userId);

      // 全アカウントを削除
      await supabase.from('instagram_accounts').delete().eq('user_id', userId);

      // ユーザー設定を削除
      await supabase.from('user_settings').delete().eq('user_id', userId);

      console.log('全データを削除しました');
    } catch (error) {
      console.error('データの削除に失敗しました:', error);
      throw new Error('データの削除に失敗しました');
    }
  }

  // データのエクスポート（全アカウント）
  async exportAllData(): Promise<string> {
    const accounts = await this.loadAccounts();
    const records = await this.loadAllRecords();

    return JSON.stringify(
      {
        accounts,
        records,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  // データのインポート
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      // アカウントのインポート
      if (data.accounts && Array.isArray(data.accounts)) {
        for (const account of data.accounts) {
          await this.saveAccount(account);
        }
      }

      // 記録のインポート
      if (data.records && Array.isArray(data.records)) {
        for (const record of data.records) {
          await this.saveRecord(record);
        }
      }

      console.log('データのインポートが完了しました');
    } catch (error) {
      console.error('データのインポートに失敗しました:', error);
      throw new Error('データのインポートに失敗しました');
    }
  }

  // ==========================================
  // マッピングヘルパー
  // ==========================================

  private mapDbAccountToApp(dbAccount: DbInstagramAccount): InstagramAccount {
    return {
      accountName: dbAccount.account_name,
      accountId: dbAccount.account_id,
      createdAt: dbAccount.created_at,
      updatedAt: dbAccount.updated_at,
      isActive: dbAccount.is_active,
    };
  }

  private mapDbRecordToApp(dbRecord: DbInstagramRecord): InstagramRecord {
    return {
      id: dbRecord.id,
      date: dbRecord.date,
      postsBefore: dbRecord.posts_before,
      followersBefore: dbRecord.followers_before,
      followingBefore: dbRecord.following_before,
      postsAfter: dbRecord.posts_after,
      followersAfter: dbRecord.followers_after,
      followingAfter: dbRecord.following_after,
      startTime: dbRecord.start_time,
      likes: dbRecord.likes,
      mainLoop: dbRecord.main_loop,
      operationTime: dbRecord.operation_time,
      otherMemo: dbRecord.other_memo,
      accountName: '', // 必要に応じてアカウント名を取得
      accountId: dbRecord.account_id,
      followerGrowth: dbRecord.follower_growth,
      followingGrowth: dbRecord.following_growth,
      postGrowth: dbRecord.post_growth,
      followBackRate: parseFloat(dbRecord.follow_back_rate.toString()),
    };
  }
}

export const dataService = new DataService();
