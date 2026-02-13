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
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      game_tables: {
        Row: {
          id: string
          game_id: string
          host_id: string | null
          status: 'waiting' | 'in_game' | 'finished'
          visibility: 'public' | 'private'
          invite_code: string | null
          game_state: Json
          max_players: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          host_id?: string | null
          status?: 'waiting' | 'in_game' | 'finished'
          visibility?: 'public' | 'private'
          invite_code?: string | null
          game_state?: Json
          max_players: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          game_id?: string
          host_id?: string | null
          status?: 'waiting' | 'in_game' | 'finished'
          visibility?: 'public' | 'private'
          invite_code?: string | null
          game_state?: Json
          max_players?: number
          updated_at?: string
        }
      }
      table_players: {
        Row: {
          id: string
          table_id: string
          user_id: string
          is_host: boolean
          seat_position: number | null
          joined_at: string
        }
        Insert: {
          id?: string
          table_id: string
          user_id: string
          is_host?: boolean
          seat_position?: number | null
          joined_at?: string
        }
        Update: {
          table_id?: string
          user_id?: string
          is_host?: boolean
          seat_position?: number | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          table_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          table_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          message?: string
        }
      }
      game_moves: {
        Row: {
          id: string
          table_id: string
          user_id: string
          move_data: Json
          move_number: number
          created_at: string
        }
        Insert: {
          id?: string
          table_id: string
          user_id: string
          move_data: Json
          move_number: number
          created_at?: string
        }
        Update: {
          move_data?: Json
          move_number?: number
        }
      }
    }
    Functions: {
      join_table: {
        Args: { p_table_id: string; p_user_id: string }
        Returns: Json
      }
    }
  }
}
