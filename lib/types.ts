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
  is_featured?: boolean // Added for trending markets
  is_headline?: boolean // Added for hero market
  yesPrice: number
  noPrice: number
  countdown: string
  created_at?: string // Market creation date
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
  is_featured?: boolean // Added for trending markets
  is_headline?: boolean // Added for hero market
  countdown: string
  created_at?: string // Market creation date
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
