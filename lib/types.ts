import type React from "react"

// Market Types
export type BinaryMarket = {
  id: string
  type: "binary"
  category: string
  categoryIcon: React.ComponentType<{ className?: string }>
  question: string
  probability: number
  volume: string
  image: string
  bgImage: string
  volatility: string
  isLive: boolean
  status?: 'open' | 'closed' | 'resolved' | 'cancelled'
  resolved_at?: string | null
  closes_at?: string | null
  is_featured?: boolean // Added for trending markets
  is_headline?: boolean // Added for hero market
  yesPrice: number
  noPrice: number
  countdown: string
  created_at?: string // Market creation date
  // Season info
  season_id?: string | null
  season?: { id: string; name: string } | null
  history1h?: { time: string; price: number }[]
  history6h?: { time: string; price: number }[]
  history24h: { time: string; price: number }[]
  history7d: { time: string; price: number }[]
  history30d?: { time: string; price: number }[]
  historyAll: { time: string; price: number }[]
}

export type MultiOutcomeMarket = {
  id: string
  type: "multi"
  category: string
  categoryIcon: React.ComponentType<{ className?: string }>
  question: string
  outcomes: { name: string; probability: number; color: string }[]
  volume: string
  image: string
  bgImage: string
  isLive: boolean
  status?: 'open' | 'closed' | 'resolved' | 'cancelled'
  resolved_at?: string | null
  closes_at?: string | null
  is_featured?: boolean // Added for trending markets
  is_headline?: boolean // Added for hero market
  countdown: string
  created_at?: string // Market creation date
  // Season info
  season_id?: string | null
  season?: { id: string; name: string } | null
  historyData: { time: string; [key: string]: number | string }[]
  history1h?: { time: string; [key: string]: number | string | Date }[]
  history6h?: { time: string; [key: string]: number | string | Date }[]
  history24h?: { time: string; [key: string]: number | string | Date }[]
  history7d?: { time: string; [key: string]: number | string | Date }[]
  history30d?: { time: string; [key: string]: number | string | Date }[]
  historyAll?: { time: string; [key: string]: number | string | Date }[]
}

export type Market = BinaryMarket | MultiOutcomeMarket

// Bet Types
export type ActiveBet = {
  id: string
  market_id: string
  market: string
  choice: string
  amount: number
  odds: number
  status: 'pending' | 'won' | 'lost'
  potential_payout?: number
  direction?: 'YES' | 'NO'
}

// Chart Data Types
export type ChartDataPoint = {
  time: string
  price: number
}

export type MultiOutcomeDataPoint = {
  time: string
  [key: string]: number | string
}

// Auth Types
export type AuthResult = {
  error?: string
  success?: boolean
  url?: string
}

// Shop Types
export type ShopItem = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  stock: number
  created_at: string
}

export type ShopOrder = {
  id: string
  user_id: string
  item_id: string
  price_paid: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  delivery_info: string | null
  shop_items?: ShopItem // Joined data
  profiles?: { username: string; email: string } // Joined data
}

// Season Types
export type Season = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SeasonLeaderboardEntry = {
  id: string
  user_id: string
  season_id: string
  points: number      // PnL for this season
  wins: number
  losses: number
  total_bet_amount: number
  created_at: string
  updated_at: string
  // Joined data
  profiles?: {
    username: string
    avatar_url: string | null
  }
}

// Badge Types
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type Badge = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  level: number | null
  icon_name: string
  rarity: BadgeRarity
  created_at: string
}

export type UserBadge = {
  id: string
  user_id: string
  badge_id: string
  is_equipped: boolean
  is_seen: boolean
  obtained_at: string
  // Joined data
  badge?: Badge
}

export type UserBadgeWithDetails = UserBadge & {
  badge: Badge
}
