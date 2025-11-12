import { supabase } from '../lib/supabase';
import type { InstagramRecord, InstagramAccount } from '../types';

class SupabaseService {
  // Supabase接続テスト
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔌 Supabase接続テスト開始...');

      // テーブルの存在確認
      const { error: accountsError } = await supabase
        .from('instagram_accounts')
        .select('count')
        .limit(1);

      if (accountsError) {
        console.error('❌ instagram_accountsテーブルへのアクセスに失敗:', accountsError);
        return {
          success: false,
          message: 'instagram_accountsテーブルにアクセスできません',
          details: accountsError,
        };
      }

      const { error: recordsError } = await supabase
        .from('instagram_records')
        .select('count')
        .limit(1);

      if (recordsError) {
        console.error('❌ instagram_recordsテーブルへのアクセスに失敗:', recordsError);
        return {
          success: false,
          message: 'instagram_recordsテーブルにアクセスできません',
          details: recordsError,
        };
      }

      console.log('✅ Supabase接続テスト成功');
      return {
        success: true,
        message: 'Supabaseに正常に接続されています',
        details: {
          accountsTable: '正常',
          recordsTable: '正常',
        },
      };
    } catch (error) {
      console.error('❌ Supabase接続テスト中にエラーが発生:', error);
      return {
        success: false,
        message: '接続テスト中にエラーが発生しました',
        details: error,
      };
    }
  }

  // Instagram記録の取得
  async getRecords(accountId?: string): Promise<InstagramRecord[]> {
    try {
      let query = supabase
        .from('instagram_records')
        .select('*')
        .order('date', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('記録の取得に失敗しました:', error);
        throw error;
      }

      return this.convertToInstagramRecords(data || []);
    } catch (error) {
      console.error('記録の取得中にエラーが発生しました:', error);
      return [];
    }
  }

  // 単一の記録を取得
  async getRecordById(id: string): Promise<InstagramRecord | null> {
    try {
      const { data, error } = await supabase
        .from('instagram_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('記録の取得に失敗しました:', error);
        throw error;
      }

      return data ? this.convertToInstagramRecord(data) : null;
    } catch (error) {
      console.error('記録の取得中にエラーが発生しました:', error);
      return null;
    }
  }

  // 記録の作成
  async createRecord(record: Omit<InstagramRecord, 'id'>): Promise<InstagramRecord | null> {
    try {
      const dbRecord: any = {
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
        other_memo: record.otherMemo || '',
        account_name: record.accountName,
        account_id: record.accountId,
      };

      console.log('📤 Supabaseにデータを送信中...', {
        date: dbRecord.date,
        account_id: dbRecord.account_id,
      });

      const { data, error } = await supabase
        .from('instagram_records')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        console.error('❌ 記録の作成に失敗しました:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      if (data) {
        console.log('✅ 記録の作成に成功しました:', data.id);
      }

      return data ? this.convertToInstagramRecord(data) : null;
    } catch (error) {
      console.error('❌ 記録の作成中にエラーが発生しました:', error);
      return null;
    }
  }

  // 記録の更新
  async updateRecord(id: string, record: Partial<InstagramRecord>): Promise<InstagramRecord | null> {
    try {
      const dbRecord: any = {};

      if (record.date !== undefined) dbRecord.date = record.date;
      if (record.postsBefore !== undefined) dbRecord.posts_before = record.postsBefore;
      if (record.followersBefore !== undefined) dbRecord.followers_before = record.followersBefore;
      if (record.followingBefore !== undefined) dbRecord.following_before = record.followingBefore;
      if (record.postsAfter !== undefined) dbRecord.posts_after = record.postsAfter;
      if (record.followersAfter !== undefined) dbRecord.followers_after = record.followersAfter;
      if (record.followingAfter !== undefined) dbRecord.following_after = record.followingAfter;
      if (record.startTime !== undefined) dbRecord.start_time = record.startTime;
      if (record.likes !== undefined) dbRecord.likes = record.likes;
      if (record.mainLoop !== undefined) dbRecord.main_loop = record.mainLoop;
      if (record.operationTime !== undefined) dbRecord.operation_time = record.operationTime;
      if (record.otherMemo !== undefined) dbRecord.other_memo = record.otherMemo;
      if (record.accountName !== undefined) dbRecord.account_name = record.accountName;
      if (record.accountId !== undefined) dbRecord.account_id = record.accountId;

      dbRecord.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('instagram_records')
        .update(dbRecord)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('記録の更新に失敗しました:', error);
        throw error;
      }

      return data ? this.convertToInstagramRecord(data) : null;
    } catch (error) {
      console.error('記録の更新中にエラーが発生しました:', error);
      return null;
    }
  }

  // 記録の削除
  async deleteRecord(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('instagram_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('記録の削除に失敗しました:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('記録の削除中にエラーが発生しました:', error);
      return false;
    }
  }

  // アカウントの取得
  async getAccounts(): Promise<InstagramAccount[]> {
    try {
      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('アカウントの取得に失敗しました:', error);
        throw error;
      }

      return this.convertToInstagramAccounts(data || []);
    } catch (error) {
      console.error('アカウントの取得中にエラーが発生しました:', error);
      return [];
    }
  }

  // アカウントの作成
  async createAccount(account: Omit<InstagramAccount, 'createdAt' | 'updatedAt'>): Promise<InstagramAccount | null> {
    try {
      const dbAccount: any = {
        account_name: account.accountName,
        account_id: account.accountId,
        is_active: account.isActive ?? true,
      };

      const { data, error } = await supabase
        .from('instagram_accounts')
        .insert(dbAccount)
        .select()
        .single();

      if (error) {
        console.error('アカウントの作成に失敗しました:', error);
        throw error;
      }

      return data ? this.convertToInstagramAccount(data) : null;
    } catch (error) {
      console.error('アカウントの作成中にエラーが発生しました:', error);
      return null;
    }
  }

  // アカウントの更新
  async updateAccount(accountId: string, updates: Partial<InstagramAccount>): Promise<InstagramAccount | null> {
    try {
      const dbUpdates: any = {};

      if (updates.accountName !== undefined) dbUpdates.account_name = updates.accountName;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('instagram_accounts')
        .update(dbUpdates)
        .eq('account_id', accountId)
        .select()
        .single();

      if (error) {
        console.error('アカウントの更新に失敗しました:', error);
        throw error;
      }

      return data ? this.convertToInstagramAccount(data) : null;
    } catch (error) {
      console.error('アカウントの更新中にエラーが発生しました:', error);
      return null;
    }
  }

  // アカウントの削除
  async deleteAccount(accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('instagram_accounts')
        .delete()
        .eq('account_id', accountId);

      if (error) {
        console.error('アカウントの削除に失敗しました:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('アカウントの削除中にエラーが発生しました:', error);
      return false;
    }
  }

  // データベースのレコードをアプリの型に変換
  private convertToInstagramRecord(dbRecord: any): InstagramRecord {
    const followerGrowth = dbRecord.followers_after - dbRecord.followers_before;
    const followingGrowth = dbRecord.following_after - dbRecord.following_before;
    const postGrowth = dbRecord.posts_after - dbRecord.posts_before;
    const followBackRate = followingGrowth > 0
      ? (followerGrowth / followingGrowth) * 100
      : 0;

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
      accountName: dbRecord.account_name,
      accountId: dbRecord.account_id,
      followerGrowth,
      followingGrowth,
      postGrowth,
      followBackRate,
    };
  }

  private convertToInstagramRecords(dbRecords: any[]): InstagramRecord[] {
    return dbRecords.map(record => this.convertToInstagramRecord(record));
  }

  private convertToInstagramAccount(dbAccount: any): InstagramAccount {
    return {
      accountName: dbAccount.account_name,
      accountId: dbAccount.account_id,
      createdAt: dbAccount.created_at,
      updatedAt: dbAccount.updated_at,
      isActive: dbAccount.is_active,
    };
  }

  private convertToInstagramAccounts(dbAccounts: any[]): InstagramAccount[] {
    return dbAccounts.map(account => this.convertToInstagramAccount(account));
  }
}

export const supabaseService = new SupabaseService();
