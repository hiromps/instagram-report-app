export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      instagram_accounts: {
        Row: {
          id: string
          account_name: string
          account_id: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          account_name: string
          account_id: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          account_name?: string
          account_id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      instagram_records: {
        Row: {
          id: string
          date: string
          posts_before: number
          followers_before: number
          following_before: number
          posts_after: number
          followers_after: number
          following_after: number
          start_time: string
          likes: number
          main_loop: number
          operation_time: number
          other_memo: string
          account_name: string
          account_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          posts_before: number
          followers_before: number
          following_before: number
          posts_after: number
          followers_after: number
          following_after: number
          start_time: string
          likes: number
          main_loop: number
          operation_time: number
          other_memo?: string
          account_name: string
          account_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          posts_before?: number
          followers_before?: number
          following_before?: number
          posts_after?: number
          followers_after?: number
          following_after?: number
          start_time?: string
          likes?: number
          main_loop?: number
          operation_time?: number
          other_memo?: string
          account_name?: string
          account_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
