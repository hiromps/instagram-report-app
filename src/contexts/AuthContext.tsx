import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回セッション取得
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        console.log('🔐 認証状態を確認:', currentSession ? '✅ ログイン済み' : '❌ 未ログイン');
      } catch (error) {
        console.error('❌ セッション取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('🔄 認証状態が変更されました:', _event);
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('📝 新規ユーザー登録中...', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error('❌ サインアップエラー:', error);
        return { error };
      }

      console.log('✅ サインアップ成功:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('❌ サインアップ中に予期しないエラー:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 ログイン中...', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ ログインエラー:', error);
        return { error };
      }

      console.log('✅ ログイン成功:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('❌ ログイン中に予期しないエラー:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 ログアウト中...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ ログアウトエラー:', error);
        throw error;
      }

      console.log('✅ ログアウト成功');
    } catch (error) {
      console.error('❌ ログアウト中に予期しないエラー:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
