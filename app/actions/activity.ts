'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAvatarUrl } from '@/lib/utils/avatar'

// Players can only read their own bets (RLS), so the public feed is built server-side
// and returns display fields only: no user ids, no payouts, no balances.
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ActivityItem = {
  id: string
  username: string
  avatar: string
  amount: number
  direction: 'YES' | 'NO'
  outcome: string
  marketId: string
  question: string
  createdAt: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getRecentActivity(marketId?: string, limit = 12): Promise<ActivityItem[]> {
  if (marketId && !UUID_RE.test(marketId)) return []
  const take = Math.min(Math.max(Math.floor(limit) || 12, 1), 20)

  // Over-fetch a little: admin liquidity bets and hidden markets are dropped below
  let query = supabaseAdmin
    .from('bets')
    .select('id, amount, direction, created_at, user_id, market_id, outcome_id')
    .order('created_at', { ascending: false })
    .limit(take * 3)
  if (marketId) query = query.eq('market_id', marketId)

  const { data: bets, error } = await query
  if (error || !bets?.length) return []

  const userIds = [...new Set(bets.map(b => b.user_id))]
  const marketIds = [...new Set(bets.map(b => b.market_id))]
  const outcomeIds = [...new Set(bets.map(b => b.outcome_id))]

  const [{ data: profiles }, { data: markets }, { data: outcomes }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, username, avatar_url, role').in('id', userIds),
    supabaseAdmin.from('markets').select('id, question, is_visible').in('id', marketIds),
    supabaseAdmin.from('outcomes').select('id, name').in('id', outcomeIds),
  ])

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const marketMap = new Map(markets?.map(m => [m.id, m]) || [])
  const outcomeMap = new Map(outcomes?.map(o => [o.id, o]) || [])

  const items: ActivityItem[] = []
  for (const bet of bets) {
    const profile = profileMap.get(bet.user_id)
    const market = marketMap.get(bet.market_id)
    // Same exclusions as the leaderboard: no admin accounts, nothing from hidden markets
    if (!profile || profile.role === 'admin' || !market || market.is_visible === false) continue
    items.push({
      id: bet.id,
      username: profile.username || 'Anonyme',
      avatar: getAvatarUrl(profile.avatar_url),
      amount: bet.amount,
      direction: bet.direction === 'NO' ? 'NO' : 'YES',
      outcome: outcomeMap.get(bet.outcome_id)?.name || '',
      marketId: bet.market_id,
      question: market.question,
      createdAt: bet.created_at,
    })
    if (items.length >= take) break
  }
  return items
}
