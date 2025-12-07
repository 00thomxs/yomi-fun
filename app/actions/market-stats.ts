'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type MarketWinner = {
  userId: string
  username: string
  avatar: string
  netProfit: number
  rank: number
}

export async function getMarketTopWinners(marketId: string): Promise<MarketWinner[]> {
  // 1. Fetch market to check resolution (using admin to bypass RLS)
  const { data: market, error: marketError } = await supabaseAdmin
    .from('markets')
    .select('resolved_at, status, is_live')
    .eq('id', marketId)
    .single()

  console.log('[TopWinners] Market data:', marketId, market, marketError)

  // Check if market is resolved: resolved_at is set OR status is 'resolved' OR is_live is false
  const isResolved = market?.resolved_at !== null || market?.status === 'resolved' || market?.is_live === false
  
  if (!isResolved) {
    console.log('[TopWinners] Market not resolved')
    return []
  }

  // 2. Fetch all bets for this market
  const { data: bets, error: betsError } = await supabaseAdmin
    .from('bets')
    .select('amount, potential_payout, status, user_id')
    .eq('market_id', marketId)

  if (betsError || !bets || bets.length === 0) {
    console.log('[TopWinners] No bets found:', marketId, betsError)
    return []
  }

  // 3. Fetch profiles separately for the users who bet
  const userIds = [...new Set(bets.map(b => b.user_id))]
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // 4. Calculate PNL per user
  const userProfits = new Map<string, { 
    username: string, 
    avatar: string, 
    profit: number 
  }>()

  bets.forEach(bet => {
    if (!userProfits.has(bet.user_id)) {
      const profile = profileMap.get(bet.user_id)
      
      userProfits.set(bet.user_id, {
        username: profile?.username || 'Anonyme',
        avatar: profile?.avatar_url || '/images/default-avatar.svg',
        profit: 0
      })
    }

    const current = userProfits.get(bet.user_id)!
    
    // Subtract stake
    current.profit -= bet.amount
    
    // Add payout if won
    if (bet.status === 'won') {
      current.profit += bet.potential_payout
    }
  })

  console.log('[TopWinners] Calculated profits:', Array.from(userProfits.entries()))

  // 5. Transform, filter positive profits, sort, and take top 3
  const winners: MarketWinner[] = Array.from(userProfits.entries())
    .map(([userId, data]) => ({
      userId,
      username: data.username,
      avatar: data.avatar,
      netProfit: data.profit,
      rank: 0
    }))
    .filter(w => w.netProfit > 0) // Only actual winners
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 3)
    .map((w, index) => ({ ...w, rank: index + 1 }))

  console.log('[TopWinners] Final winners:', winners)
  return winners
}

