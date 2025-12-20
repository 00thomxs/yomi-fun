'use server'

import { createClient } from '@/lib/supabase/server'

export interface UnseenBetWin {
  id: string
  amount: number
  potential_payout: number
  status: string
  created_at: string
  resolved_at: string | null
  direction: string
  market: {
    id: string
    title: string
    resolved_at: string | null
  }
  outcome: {
    id: string
    label: string
    is_winner: boolean
  }
}

/**
 * Get unseen bet wins for the current user
 */
export async function getUnseenBetWins(): Promise<UnseenBetWin[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('bets')
    .select(`
      id,
      amount,
      potential_payout,
      status,
      created_at,
      resolved_at,
      direction,
      market:markets!inner(
        id,
        title,
        resolved_at
      ),
      outcome:outcomes!inner(
        id,
        label,
        is_winner
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'won')
    .is('win_seen_at', null)
    .order('resolved_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error fetching unseen wins:', error)
    return []
  }
  
  return (data || []) as unknown as UnseenBetWin[]
}

/**
 * Mark a bet win as seen
 */
export async function markBetWinAsSeen(betId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }
  
  const { error } = await supabase
    .from('bets')
    .update({ win_seen_at: new Date().toISOString() })
    .eq('id', betId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error marking bet win as seen:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Mark all bet wins as seen for the current user
 */
export async function markAllBetWinsAsSeen(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }
  
  const { error } = await supabase
    .from('bets')
    .update({ win_seen_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'won')
    .is('win_seen_at', null)
  
  if (error) {
    console.error('Error marking all bet wins as seen:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

