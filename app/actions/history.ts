'use server'

import { createClient } from '@/lib/supabase/server'

export type PricePoint = {
  date: string
  probability: number
  outcomeIndex: number // 0, 1, etc.
}

export type PnlPoint = {
  date: string
  value: number
}

export async function getMarketHistory(marketId: string): Promise<PricePoint[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('market_prices_history')
    .select('created_at, probability, outcome_index')
    .eq('market_id', marketId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('Error fetching market history:', error)
    return []
  }

  return data.map(row => ({
    date: row.created_at,
    probability: row.probability * 100, // Convert back to percentage for charts
    outcomeIndex: row.outcome_index
  }))
}

export async function getUserPnLHistory(userId: string): Promise<PnlPoint[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_pnl_history')
    .select('created_at, pnl_value')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('Error fetching user PnL history:', error)
    return []
  }

  return data.map(row => ({
    date: row.created_at,
    value: row.pnl_value
  }))
}

