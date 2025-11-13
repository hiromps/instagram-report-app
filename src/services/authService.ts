import type { User } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  USERS: 'users',
} as const;

class AuthService {
  // 現在ログイン中のユーザーを取得
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
      return null;
    }
  }

  // メールアドレスでログイン（新規登録も兼ねる）
  login(email: string, displayName?: string): User {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      // 既存ユーザーを確認
      const users = this.loadAllUsers();
      let user = users.find(u => u.email === email);

      if (user) {
        // 既存ユーザーの最終ログイン時刻を更新
        user.lastLoginAt = new Date().toISOString();
        if (displayName) {
          user.displayName = displayName;
        }
      } else {
        // 新規ユーザー作成
        user = {
          email,
          displayName: displayName || email.split('@')[0],
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        users.push(user);
      }

      // ユーザー一覧を保存
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // 現在のユーザーとして設定
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      console.log('ログイン成功:', user);
      return user;
    } catch (error) {
      console.error('ログインに失敗しました:', error);
      throw error;
    }
  }

  // ログアウト
  logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      console.log('ログアウトしました');
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      throw error;
    }
  }

  // ログイン状態確認
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  // メールアドレスのバリデーション
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 全ユーザーを読み込み（管理用）
  private loadAllUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('ユーザー一覧の読み込みに失敗しました:', error);
      return [];
    }
  }

  // ユーザーごとのストレージキーを生成
  getUserStorageKey(baseKey: string): string {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('ログインしていません');
    }
    // メールアドレスをキーに含めることでユーザーごとにデータを分離
    return `${user.email}:${baseKey}`;
  }
}

export const authService = new AuthService();
