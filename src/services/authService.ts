import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLoginAt: string;
}

class AuthService {
  private currentUser: User | null = null;

  // 初期化: セッションを確認
  async initialize(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.currentUser = session?.user || null;
      return this.currentUser;
    } catch (error) {
      console.error('セッションの初期化に失敗しました:', error);
      return null;
    }
  }

  // 現在ログイン中のユーザーを取得
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // ユーザーIDを取得
  getUserId(): string | null {
    return this.currentUser?.id || null;
  }

  // 新規登録
  async signUp(email: string, password: string, displayName?: string): Promise<AppUser> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      if (!this.isValidPassword(password)) {
        throw new Error('パスワードは6文字以上で入力してください');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      this.currentUser = data.user;

      console.log('新規登録成功:', data.user.email);

      return {
        id: data.user.id,
        email: data.user.email!,
        displayName: displayName || email.split('@')[0],
        createdAt: data.user.created_at,
        lastLoginAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('新規登録に失敗しました:', error);
      throw new Error(error.message || '新規登録に失敗しました');
    }
  }

  // ログイン
  async login(email: string, password: string): Promise<AppUser> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('ログインに失敗しました');
      }

      this.currentUser = data.user;

      console.log('ログイン成功:', data.user.email);

      return {
        id: data.user.id,
        email: data.user.email!,
        displayName: data.user.user_metadata?.display_name || email.split('@')[0],
        createdAt: data.user.created_at,
        lastLoginAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('ログインに失敗しました:', error);

      // エラーメッセージを日本語化
      if (error.message === 'Invalid login credentials') {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      throw new Error(error.message || 'ログインに失敗しました');
    }
  }

  // ログアウト
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      this.currentUser = null;
      console.log('ログアウトしました');
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      throw error;
    }
  }

  // ログイン状態確認
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  // 認証状態の変更を監視
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        this.currentUser = session?.user || null;
        callback(this.currentUser);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }

  // パスワードリセット要求
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      console.log('パスワードリセットメールを送信しました');
    } catch (error: any) {
      console.error('パスワードリセット要求に失敗しました:', error);
      throw new Error(error.message || 'パスワードリセット要求に失敗しました');
    }
  }

  // パスワード更新
  async updatePassword(newPassword: string): Promise<void> {
    try {
      if (!this.isValidPassword(newPassword)) {
        throw new Error('パスワードは6文字以上で入力してください');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      console.log('パスワードを更新しました');
    } catch (error: any) {
      console.error('パスワード更新に失敗しました:', error);
      throw new Error(error.message || 'パスワード更新に失敗しました');
    }
  }

  // メールアドレスのバリデーション
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // パスワードのバリデーション
  private isValidPassword(password: string): boolean {
    return password.length >= 6;
  }
}

export const authService = new AuthService();
