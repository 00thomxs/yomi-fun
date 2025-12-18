'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { CardRank } from '@/components/yomi-tcg-card'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type UserSeasonCard = {
  tier: CardRank
  highestTierAchieved: CardRank
  seasonName: string
  seasonNumber: number
  isNewTier?: boolean
}

// Tier order for comparison
const TIER_ORDER: CardRank[] = ['iron', 'bronze', 'gold', 'diamond', 'holographic']

/**
 * Get the user's card for the active season
 */
export async function getUserSeasonCard(userId?: string): Promise<UserSeasonCard | null> {
  const supabase = await createClient()
  
  // Get current user if not provided
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    targetUserId = user.id
  }
  
  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .single()
  
  if (!activeSeason) {
    // Return iron card if no active season
    return {
      tier: 'iron',
      highestTierAchieved: 'iron',
      seasonName: 'Hors Saison',
      seasonNumber: 0,
    }
  }
  
  // Get user's card for this season
  const { data: card } = await supabase
    .from('user_season_cards')
    .select('tier, highest_tier_achieved')
    .eq('user_id', targetUserId)
    .eq('season_id', activeSeason.id)
    .single()
  
  // Count season number
  const { count } = await supabase
    .from('seasons')
    .select('id', { count: 'exact', head: true })
    .lte('created_at', new Date().toISOString())
  
  return {
    tier: (card?.tier as CardRank) || 'iron',
    highestTierAchieved: (card?.highest_tier_achieved as CardRank) || 'iron',
    seasonName: activeSeason.name || 'Saison',
    seasonNumber: count || 1,
  }
}

/**
 * Check and update user's card tier based on current season stats
 * Returns the new card info and whether a new tier was unlocked
 */
export async function checkAndUpdateCardTier(userId?: string): Promise<{
  card: UserSeasonCard
  isNewTier: boolean
  previousTier: CardRank | null
} | null> {
  const supabase = await createClient()
  
  // Get current user if not provided
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    targetUserId = user.id
  }
  
  // Get active season
  const { data: activeSeason } = await supabaseAdmin
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .single()
  
  if (!activeSeason) return null
  
  // Get current card (if exists)
  const { data: existingCard } = await supabaseAdmin
    .from('user_season_cards')
    .select('tier, highest_tier_achieved')
    .eq('user_id', targetUserId)
    .eq('season_id', activeSeason.id)
    .single()
  
  const previousTier = existingCard?.highest_tier_achieved as CardRank | null
  
  // Calculate new tier based on season stats
  const newTier = await calculateUserTier(targetUserId, activeSeason.id)
  
  // Determine highest tier achieved
  let highestTier = newTier
  if (previousTier) {
    const prevIndex = TIER_ORDER.indexOf(previousTier)
    const newIndex = TIER_ORDER.indexOf(newTier)
    
    // For diamond and holographic, tier is based on current rank (can go down)
    // For others, keep the highest achieved
    if (newIndex >= 3) { // diamond or holographic
      highestTier = newTier
    } else {
      highestTier = newIndex > prevIndex ? newTier : previousTier
    }
  }
  
  // Upsert the card
  await supabaseAdmin
    .from('user_season_cards')
    .upsert({
      user_id: targetUserId,
      season_id: activeSeason.id,
      tier: newTier,
      highest_tier_achieved: highestTier,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,season_id'
    })
  
  // Count season number
  const { count } = await supabaseAdmin
    .from('seasons')
    .select('id', { count: 'exact', head: true })
  
  const isNewTier = !previousTier || TIER_ORDER.indexOf(highestTier) > TIER_ORDER.indexOf(previousTier)
  
  return {
    card: {
      tier: newTier,
      highestTierAchieved: highestTier,
      seasonName: activeSeason.name || 'Saison',
      seasonNumber: count || 1,
    },
    isNewTier,
    previousTier,
  }
}

/**
 * Calculate user's tier based on season leaderboard
 */
async function calculateUserTier(userId: string, seasonId: string): Promise<CardRank> {
  // Get user's season stats and rank
  const { data: leaderboard } = await supabaseAdmin
    .from('season_leaderboards')
    .select('user_id, points')
    .eq('season_id', seasonId)
    .order('points', { ascending: false })
  
  if (!leaderboard || leaderboard.length === 0) {
    return 'iron'
  }
  
  // Find user's rank
  const userIndex = leaderboard.findIndex(entry => entry.user_id === userId)
  
  if (userIndex === -1) {
    return 'iron' // User not in season
  }
  
  const userRank = userIndex + 1
  const userPnL = leaderboard[userIndex].points
  
  // Determine tier based on rank first (for elite tiers)
  if (userRank <= 3) {
    return 'holographic'
  }
  if (userRank <= 10) {
    return 'diamond'
  }
  
  // Then based on PnL thresholds
  if (userPnL >= 25000) {
    return 'gold'
  }
  if (userPnL >= 10000) {
    return 'bronze'
  }
  
  return 'iron'
}

/**
 * Get all user's cards (for card collection display)
 */
export async function getUserCardCollection(userId?: string): Promise<UserSeasonCard[]> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    targetUserId = user.id
  }
  
  const { data: cards } = await supabase
    .from('user_season_cards')
    .select(`
      tier,
      highest_tier_achieved,
      seasons (
        id,
        name,
        created_at
      )
    `)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false, referencedTable: 'seasons' })
  
  if (!cards) return []
  
  return cards.map((card, index) => ({
    tier: card.highest_tier_achieved as CardRank, // Use highest achieved for collection
    highestTierAchieved: card.highest_tier_achieved as CardRank,
    seasonName: (card.seasons as any)?.name || 'Saison',
    seasonNumber: cards.length - index,
  }))
}


