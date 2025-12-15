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
          avatar_url: string | null
          balance: number
          xp: number
          level: number
          streak: number
          total_bets: number
          total_won: number
          win_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          balance?: number
          xp?: number
          level?: number
          streak?: number
          total_bets?: number
          total_won?: number
          win_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          balance?: number
          xp?: number
          level?: number
          streak?: number
          total_bets?: number
          total_won?: number
          win_rate?: number
          updated_at?: string
        }
      }
      markets: {
        Row: {
          id: string
          question: string
          description: string | null
          category: string
          image_url: string | null
          status: 'open' | 'closed' | 'resolved' | 'cancelled'
          type: 'binary' | 'multi'
          volume: number
          pool_yes: number
          pool_no: number
          is_live: boolean
          is_featured: boolean
          is_headline: boolean
          season_id: string | null
          is_visible: boolean
          initial_liquidity: number
          created_at: string
          closes_at: string
          resolved_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          question: string
          description?: string | null
          category: string
          image_url?: string | null
          status?: 'open' | 'closed' | 'resolved' | 'cancelled'
          type?: 'binary' | 'multi'
          volume?: number
          pool_yes?: number
          pool_no?: number
          is_live?: boolean
          is_featured?: boolean
          is_headline?: boolean
          season_id?: string | null
          is_visible?: boolean
          initial_liquidity?: number
          created_at?: string
          closes_at: string
          resolved_at?: string | null
          created_by?: string | null
        }
        Update: {
          question?: string
          description?: string | null
          category?: string
          image_url?: string | null
          status?: 'open' | 'closed' | 'resolved' | 'cancelled'
          type?: 'binary' | 'multi'
          volume?: number
          pool_yes?: number
          pool_no?: number
          is_live?: boolean
          is_featured?: boolean
          is_headline?: boolean
          season_id?: string | null
          is_visible?: boolean
          initial_liquidity?: number
          closes_at?: string
          resolved_at?: string | null
        }
      }
      outcomes: {
        Row: {
          id: string
          market_id: string
          name: string
          probability: number
          color: string | null
          is_winner: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          market_id: string
          name: string
          probability?: number
          color?: string | null
          is_winner?: boolean | null
          created_at?: string
        }
        Update: {
          name?: string
          probability?: number
          color?: string | null
          is_winner?: boolean | null
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          market_id: string
          outcome_id: string
          amount: number
          potential_payout: number
          odds_at_bet: number
          status: 'pending' | 'won' | 'lost' | 'cancelled'
          direction: 'YES' | 'NO'
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          outcome_id: string
          amount: number
          potential_payout: number
          odds_at_bet: number
          status?: 'pending' | 'won' | 'lost' | 'cancelled'
          direction?: 'YES' | 'NO'
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          amount?: number
          potential_payout?: number
          status?: 'pending' | 'won' | 'lost' | 'cancelled'
          direction?: 'YES' | 'NO'
          resolved_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus' | 'refund'
          amount: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus' | 'refund'
          amount: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          description?: string | null
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          xp_reward: number
          condition_type: string
          condition_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          xp_reward?: number
          condition_type: string
          condition_value: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string
          icon?: string
          xp_reward?: number
          condition_type?: string
          condition_value?: number
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {}
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

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Market = Database['public']['Tables']['markets']['Row']
export type Outcome = Database['public']['Tables']['outcomes']['Row']
export type Bet = Database['public']['Tables']['bets']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']

