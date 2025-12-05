'use server'

import { createClient } from '@/lib/supabase/server'

export type MarketWinner = {
  userId: string
  username: string
  avatar: string
  netProfit: number
  rank: number
}

export async function getMarketTopWinners(marketId: string): Promise<MarketWinner[]> {
  const supabase = await createClient()

  // 1. Fetch market to check resolution
  const { data: market } = await supabase
    .from('markets')
    .select('resolved')
    .eq('id', marketId)
    .single()

  if (!market?.resolved) return []

  // 2. Fetch all bets for this market with user profiles
  const { data: bets } = await supabase
    .from('bets')
    .select(`
      amount,
      potential_payout,
      status,
      user_id,
      profiles:profiles!user_id (
        username,
        avatar_url
      )
    `)
    .eq('market_id', marketId)

  if (!bets) return []

  // 3. Calculate PNL per user
  const userProfits = new Map<string, { 
    username: string, 
    avatar: string, 
    profit: number 
  }>()

  bets.forEach(bet => {
    if (!userProfits.has(bet.user_id)) {
      // @ts-ignore
      const profile = bet.profiles
      userProfits.set(bet.user_id, {
        username: profile?.username || 'Anonyme',
        avatar: profile?.avatar_url || '/images/avatar.jpg',
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

  // 4. Transform, filter positive profits, sort, and take top 3
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

  return winners
}

