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
  is_featured?: boolean // Added for trending markets
  is_headline?: boolean // Added for hero market
  yesPrice: number
  noPrice: number
  countdown: string
  history24h: { time: string; price: number }[]
  history7d: { time: string; price: number }[]
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
  is_featured?: boolean // Added for trending markets
  is_headline?: boolean // Added for hero market
  countdown: string
  historyData: { time: string; [key: string]: number | string }[]
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
