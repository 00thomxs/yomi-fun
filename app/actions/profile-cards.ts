'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { CardRank } from '@/components/yomi-tcg-card'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type UserSeasonCard = {
  id: string
  tier: CardRank
  highestTierAchieved: CardRank
  seasonId: string
  seasonName: string
  seasonNumber: number
  isSelected: boolean
  isNewTier?: boolean
}

// Tier order for comparison (beta is special, not in normal order)
const TIER_ORDER: CardRank[] = ['iron', 'bronze', 'gold', 'diamond', 'holographic']
const ALL_TIERS: CardRank[] = ['iron', 'bronze', 'gold', 'diamond', 'holographic', 'beta']

/**
 * Get the user's selected card (or current season card if none selected)
 */
export async function getUserSelectedCard(userId?: string): Promise<UserSeasonCard | null> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    targetUserId = user.id
  }
  
  // First try to get selected card
  const { data: selectedCard } = await supabase
    .from('user_season_cards')
    .select(`
      id,
      tier,
      highest_tier_achieved,
      season_id,
      is_selected,
      seasons (id, name, created_at)
    `)
    .eq('user_id', targetUserId)
    .eq('is_selected', true)
    .single()
  
  if (selectedCard) {
    const { count } = await supabase
      .from('seasons')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', (selectedCard.seasons as any)?.created_at)
    
    return {
      id: selectedCard.id,
      tier: selectedCard.highest_tier_achieved as CardRank,
      highestTierAchieved: selectedCard.highest_tier_achieved as CardRank,
      seasonId: selectedCard.season_id,
      seasonName: (selectedCard.seasons as any)?.name || 'Saison',
      seasonNumber: count || 1,
      isSelected: true,
    }
  }
  
  // Fallback to current season card
  return getUserSeasonCard(targetUserId)
}

/**
 * Get the user's card for the active season
 */
export async function getUserSeasonCard(userId?: string): Promise<UserSeasonCard | null> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    targetUserId = user.id
  }
  
  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, name, created_at')
    .eq('is_active', true)
    .single()
  
  if (!activeSeason) {
    return {
      id: '',
      tier: 'iron',
      highestTierAchieved: 'iron',
      seasonId: '',
      seasonName: 'Hors Saison',
      seasonNumber: 0,
      isSelected: false,
    }
  }
  
  // Get user's card for this season
  const { data: card } = await supabase
    .from('user_season_cards')
    .select('id, tier, highest_tier_achieved, is_selected')
    .eq('user_id', targetUserId)
    .eq('season_id', activeSeason.id)
    .single()
  
  const { count } = await supabase
    .from('seasons')
    .select('id', { count: 'exact', head: true })
    .lte('created_at', activeSeason.created_at)
  
  return {
    id: card?.id || '',
    tier: (card?.tier as CardRank) || 'iron',
    highestTierAchieved: (card?.highest_tier_achieved as CardRank) || 'iron',
    seasonId: activeSeason.id,
    seasonName: activeSeason.name || 'Saison',
    seasonNumber: count || 1,
    isSelected: card?.is_selected || false,
  }
}

/**
 * Get all user's cards (for card collection/selector)
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
      id,
      tier,
      highest_tier_achieved,
      season_id,
      is_selected,
      seasons (id, name, created_at)
    `)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false, referencedTable: 'seasons' })
  
  if (!cards) return []
  
  // Calculate season numbers
  const allSeasons = await supabase
    .from('seasons')
    .select('id, created_at')
    .order('created_at', { ascending: true })
  
  const seasonNumbers = new Map<string, number>()
  allSeasons.data?.forEach((s, i) => seasonNumbers.set(s.id, i + 1))
  
  return cards.map((card) => ({
    id: card.id,
    tier: card.highest_tier_achieved as CardRank,
    highestTierAchieved: card.highest_tier_achieved as CardRank,
    seasonId: card.season_id,
    seasonName: (card.seasons as any)?.name || 'Saison',
    seasonNumber: seasonNumbers.get(card.season_id) || 1,
    isSelected: card.is_selected || false,
  }))
}

/**
 * Select a card to display
 */
export async function selectCard(cardId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  
  // Verify the card belongs to the user
  const { data: card } = await supabase
    .from('user_season_cards')
    .select('id, user_id')
    .eq('id', cardId)
    .single()
  
  if (!card || card.user_id !== user.id) {
    return { success: false, error: 'Carte non trouvée' }
  }
  
  // Deselect all user's cards
  await supabaseAdmin
    .from('user_season_cards')
    .update({ is_selected: false })
    .eq('user_id', user.id)
  
  // Select the new card
  await supabaseAdmin
    .from('user_season_cards')
    .update({ is_selected: true })
    .eq('id', cardId)
  
  revalidatePath('/profile')
  return { success: true }
}

/**
 * Check and update user's card tier based on current season stats
 * 
 * DURING THE SEASON:
 * - tier: current tier (volatile - diamond/holo can be lost)
 * - highest_tier_achieved: highest permanent tier (iron/bronze/gold - cannot be lost)
 * 
 * Notifications only show for permanent tier upgrades (iron→bronze→gold)
 * Diamond/Holo are shown based on current rank but not notified until season end
 */
export async function checkAndUpdateCardTier(userId?: string): Promise<{
  card: UserSeasonCard
  isNewTier: boolean
  previousTier: CardRank | null
} | null> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    targetUserId = user.id
  }
  
  // Get active season
  const { data: activeSeason } = await supabaseAdmin
    .from('seasons')
    .select('id, name, created_at')
    .eq('is_active', true)
    .single()
  
  if (!activeSeason) return null
  
  // Get current card (if exists)
  const { data: existingCard } = await supabaseAdmin
    .from('user_season_cards')
    .select('id, tier, highest_tier_achieved, is_selected')
    .eq('user_id', targetUserId)
    .eq('season_id', activeSeason.id)
    .single()
  
  const previousHighestTier = existingCard?.highest_tier_achieved as CardRank | null
  
  // Calculate new tiers
  const tierResult = await calculateUserTier(targetUserId, activeSeason.id)
  
  // User must have completed at least 1 event to get ANY card
  if (!tierResult.hasCompletedEvent) {
    // No card yet - they need to complete an event first
    return null
  }
  
  // Determine highest permanent tier achieved (iron/bronze/gold only - NEVER decreases)
  let highestPermanentTier = tierResult.permanentTier
  if (previousHighestTier) {
    const prevIndex = TIER_ORDER.indexOf(previousHighestTier)
    const newIndex = TIER_ORDER.indexOf(tierResult.permanentTier)
    // Only consider iron/bronze/gold (indices 0, 1, 2) for permanent tier
    if (prevIndex <= 2 && prevIndex > newIndex) {
      highestPermanentTier = previousHighestTier
    }
  }
  
  // Current display tier = highest of (current volatile tier, highest permanent tier)
  // This means if you're top 3, you see holo; if you drop, you see your permanent tier
  const displayTier = tierResult.currentTier
  
  // Upsert the card
  const { data: upsertedCard } = await supabaseAdmin
    .from('user_season_cards')
    .upsert({
      user_id: targetUserId,
      season_id: activeSeason.id,
      tier: displayTier, // Current tier (volatile)
      highest_tier_achieved: highestPermanentTier, // Permanent tier (iron/bronze/gold only during season)
      is_selected: existingCard?.is_selected || false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,season_id'
    })
    .select('id')
    .single()
  
  const { count } = await supabaseAdmin
    .from('seasons')
    .select('id', { count: 'exact', head: true })
    .lte('created_at', activeSeason.created_at)
  
  // Only notify for PERMANENT tier upgrades (iron→bronze→gold), not for volatile rank changes
  const prevPermanentIndex = previousHighestTier ? TIER_ORDER.indexOf(previousHighestTier) : -1
  const newPermanentIndex = TIER_ORDER.indexOf(highestPermanentTier)
  const isNewPermanentTier = newPermanentIndex > prevPermanentIndex && newPermanentIndex <= 2 // Only iron/bronze/gold
  
  return {
    card: {
      id: upsertedCard?.id || existingCard?.id || '',
      tier: displayTier,
      highestTierAchieved: highestPermanentTier,
      seasonId: activeSeason.id,
      seasonName: activeSeason.name || 'Saison',
      seasonNumber: count || 1,
      isSelected: existingCard?.is_selected || false,
    },
    isNewTier: isNewPermanentTier,
    previousTier: previousHighestTier,
  }
}

/**
 * Calculate user's tier based on season stats
 * Returns: { currentTier, permanentTier, hasCompletedEvent }
 * 
 * TIER LOGIC:
 * - IRON: Must have completed ≥1 event in the season (permanent once achieved)
 * - BRONZE: 10K+ PnL (permanent once achieved)
 * - GOLD: 25K+ PnL (permanent once achieved)
 * - DIAMOND: Top 10 rank (VOLATILE - lost if you drop out, permanent only at season end)
 * - HOLO: Top 3 rank (VOLATILE - lost if you drop out, permanent only at season end)
 */
async function calculateUserTier(userId: string, seasonId: string): Promise<{
  currentTier: CardRank
  permanentTier: CardRank
  hasCompletedEvent: boolean
  rank: number | null
  pnl: number
}> {
  // Check if user has completed at least 1 event in this season
  const { data: completedBets } = await supabaseAdmin
    .from('bets')
    .select('id, markets!inner(season_id, resolved)')
    .eq('user_id', userId)
    .eq('markets.season_id', seasonId)
    .eq('markets.resolved', true)
    .limit(1)
  
  const hasCompletedEvent: boolean = Boolean(completedBets && completedBets.length > 0)
  
  // Get leaderboard for ranking
  const { data: leaderboard } = await supabaseAdmin
    .from('season_leaderboards')
    .select('user_id, points')
    .eq('season_id', seasonId)
    .order('points', { ascending: false })
  
  if (!leaderboard || leaderboard.length === 0) {
    return { 
      currentTier: 'iron', 
      permanentTier: hasCompletedEvent ? 'iron' : 'iron',
      hasCompletedEvent,
      rank: null,
      pnl: 0
    }
  }
  
  const userIndex = leaderboard.findIndex(entry => entry.user_id === userId)
  
  if (userIndex === -1) {
    return { 
      currentTier: 'iron', 
      permanentTier: hasCompletedEvent ? 'iron' : 'iron',
      hasCompletedEvent,
      rank: null,
      pnl: 0
    }
  }
  
  const userRank = userIndex + 1
  const userPnL = leaderboard[userIndex].points
  
  // Calculate PERMANENT tier (iron/bronze/gold only - based on completed events and PnL)
  let permanentTier: CardRank = 'iron'
  if (!hasCompletedEvent) {
    // No completed events = no card at all (but we still show iron as fallback)
    permanentTier = 'iron'
  } else if (userPnL >= 25000) {
    permanentTier = 'gold'
  } else if (userPnL >= 10000) {
    permanentTier = 'bronze'
  } else {
    permanentTier = 'iron'
  }
  
  // Calculate CURRENT tier (includes volatile diamond/holo based on rank)
  let currentTier: CardRank = permanentTier
  if (userRank <= 3) {
    currentTier = 'holographic'
  } else if (userRank <= 10) {
    currentTier = 'diamond'
  }
  
  return { currentTier, permanentTier, hasCompletedEvent, rank: userRank, pnl: userPnL }
}

/**
 * ADMIN: Award retroactive cards to all users for past seasons
 * DEPRECATED: Use awardRetroactiveSeasonCards instead (which calls awardSeasonCards)
 */
export async function awardRetroactiveCards(): Promise<{
  success: boolean
  message: string
  details?: string[]
}> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Non authentifié' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, message: 'Accès refusé' }
  }
  
  const details: string[] = []
  
  try {
    // Get all seasons (including ended ones, except Beta Testeur)
    const { data: seasons } = await supabaseAdmin
      .from('seasons')
      .select('id, name, is_active')
      .neq('name', 'Beta Testeur')
      .order('created_at', { ascending: true })
    
    if (!seasons || seasons.length === 0) {
      return { success: false, message: 'Aucune saison trouvée' }
    }
    
    details.push(`${seasons.length} saison(s) trouvée(s)`)
    
    let totalCardsAwarded = 0
    
    for (const season of seasons) {
      // Skip active seasons
      if (season.is_active) {
        details.push(`${season.name}: Saison active (ignorée)`)
        continue
      }
      
      // Get all users in this season's leaderboard
      const { data: leaderboard } = await supabaseAdmin
        .from('season_leaderboards')
        .select('user_id, points')
        .eq('season_id', season.id)
        .order('points', { ascending: false })
      
      if (!leaderboard || leaderboard.length === 0) {
        details.push(`${season.name}: Aucun joueur`)
        continue
      }
      
      let seasonCardsAwarded = 0
      
      for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i]
        const rank = i + 1
        
        // Check if user completed at least 1 event in this season
        const { data: completedBets } = await supabaseAdmin
          .from('bets')
          .select('id, markets!inner(season_id, resolved)')
          .eq('user_id', entry.user_id)
          .eq('markets.season_id', season.id)
          .eq('markets.resolved', true)
          .limit(1)
        
        const hasCompletedEvent = (completedBets && completedBets.length > 0)
        
        if (!hasCompletedEvent) {
          // No completed events = no card
          continue
        }
        
        // Calculate tier
        let tier: CardRank = 'iron'
        if (rank <= 3) tier = 'holographic'
        else if (rank <= 10) tier = 'diamond'
        else if (entry.points >= 25000) tier = 'gold'
        else if (entry.points >= 10000) tier = 'bronze'
        
        // Check if card already exists
        const { data: existingCard } = await supabaseAdmin
          .from('user_season_cards')
          .select('id')
          .eq('user_id', entry.user_id)
          .eq('season_id', season.id)
          .single()
        
        if (!existingCard) {
          // Create new card
          await supabaseAdmin
            .from('user_season_cards')
            .insert({
              user_id: entry.user_id,
              season_id: season.id,
              tier: tier,
              highest_tier_achieved: tier,
              is_selected: false,
            })
          seasonCardsAwarded++
          totalCardsAwarded++
        }
      }
      
      details.push(`${season.name}: ${seasonCardsAwarded} cartes créées (${leaderboard.length} joueurs)`)
    }
    
    details.push(`---`)
    details.push(`Total: ${totalCardsAwarded} cartes créées`)
    
    return {
      success: true,
      message: 'Cartes rétroactives attribuées !',
      details
    }
    
  } catch (error) {
    return {
      success: false,
      message: 'Erreur',
      details: [String(error)]
    }
  }
}

/**
 * ADMIN: Get all available tiers for admin card selector
 */
export async function getAdminCardOptions(): Promise<{
  seasons: { id: string; name: string; number: number }[]
  tiers: CardRank[]
}> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { seasons: [], tiers: [] }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { seasons: [], tiers: [] }
  }
  
  // Get all seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })
  
  return {
    seasons: (seasons || []).map((s, i) => ({
      id: s.id,
      name: s.name || `Saison ${i + 1}`,
      number: i + 1,
    })),
    tiers: ALL_TIERS,
  }
}

/**
 * ADMIN: Set a specific card for the admin (for preview/testing)
 */
export async function setAdminCard(seasonId: string, tier: CardRank): Promise<{ success: boolean }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false }
  }
  
  // Deselect all admin's cards
  await supabaseAdmin
    .from('user_season_cards')
    .update({ is_selected: false })
    .eq('user_id', user.id)
  
  // Create or update the card
  await supabaseAdmin
    .from('user_season_cards')
    .upsert({
      user_id: user.id,
      season_id: seasonId,
      tier: tier,
      highest_tier_achieved: tier,
      is_selected: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,season_id'
    })
  
  revalidatePath('/profile')
  return { success: true }
}

/**
 * ADMIN: Award Beta Tester card to all existing users
 */
export async function awardBetaCards(): Promise<{ success: boolean; count: number; message: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, count: 0, message: 'Non connecté' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, count: 0, message: 'Non autorisé' }
  }
  
  // Check if beta season exists, create if not
  let { data: betaSeason } = await supabaseAdmin
    .from('seasons')
    .select('id')
    .eq('name', 'Beta Testeur')
    .single()
  
  if (!betaSeason) {
    // Create a special "Beta Testeur" season
    const { data: newSeason, error: createError } = await supabaseAdmin
      .from('seasons')
      .insert({
        name: 'Beta Testeur',
        start_date: new Date('2024-01-01').toISOString(),
        end_date: new Date('2099-12-31').toISOString(),
        is_active: false, // Not a real active season
      })
      .select('id')
      .single()
    
    if (createError) {
      return { success: false, count: 0, message: `Erreur création saison: ${createError.message}` }
    }
    betaSeason = newSeason
  }
  
  if (!betaSeason) {
    return { success: false, count: 0, message: 'Impossible de créer la saison Beta' }
  }
  
  // Get all existing users
  const { data: allUsers, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('id')
  
  if (usersError || !allUsers) {
    return { success: false, count: 0, message: `Erreur récupération utilisateurs: ${usersError?.message}` }
  }
  
  let awardedCount = 0
  
  // Award beta card to each user
  for (const u of allUsers) {
    // Check if user already has beta card
    const { data: existingCard } = await supabaseAdmin
      .from('user_season_cards')
      .select('id')
      .eq('user_id', u.id)
      .eq('season_id', betaSeason.id)
      .single()
    
    if (!existingCard) {
      await supabaseAdmin
        .from('user_season_cards')
        .insert({
          user_id: u.id,
          season_id: betaSeason.id,
          tier: 'beta',
          highest_tier_achieved: 'beta',
          is_selected: false,
        })
      awardedCount++
    }
  }
  
  revalidatePath('/admin/cards')
  return { 
    success: true, 
    count: awardedCount, 
    message: `Carte Beta attribuée à ${awardedCount} utilisateurs` 
  }
}

/**
 * Award/finalize cards for all participants of a season based on their FINAL ranking
 * Called at END of season - this is where diamond/holo become PERMANENT
 * 
 * IMPORTANT: At season end, the final ranking determines the PERMANENT tier:
 * - Top 3 get HOLOGRAPHIC permanently
 * - Top 4-10 get DIAMOND permanently
 * - Others keep their highest permanent tier (gold/bronze/iron based on PnL)
 * 
 * A player on the podium automatically gets: Holo + Diamond + Gold + Bronze + Iron
 */
export async function awardSeasonCards(seasonId: string): Promise<{ success: boolean; count: number }> {
  // Get season info
  const { data: season } = await supabaseAdmin
    .from('seasons')
    .select('id, name')
    .eq('id', seasonId)
    .single()
  
  if (!season) {
    console.error('[awardSeasonCards] Season not found:', seasonId)
    return { success: false, count: 0 }
  }
  
  // Get all participants with their points (sorted by points = final ranking)
  const { data: participants } = await supabaseAdmin
    .from('season_leaderboards')
    .select('user_id, points')
    .eq('season_id', seasonId)
    .order('points', { ascending: false })
  
  if (!participants || participants.length === 0) {
    console.log('[awardSeasonCards] No participants found')
    return { success: true, count: 0 }
  }
  
  let awardedCount = 0
  
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i]
    const rank = i + 1
    const pnl = participant.points
    
    // Check if user completed at least 1 event
    const { data: completedBets } = await supabaseAdmin
      .from('bets')
      .select('id, markets!inner(season_id, resolved)')
      .eq('user_id', participant.user_id)
      .eq('markets.season_id', seasonId)
      .eq('markets.resolved', true)
      .limit(1)
    
    const hasCompletedEvent = (completedBets && completedBets.length > 0)
    
    if (!hasCompletedEvent) {
      // No completed events = no card (even if in leaderboard from open bets)
      console.log(`[awardSeasonCards] User rank #${rank} has no completed events, skipping`)
      continue
    }
    
    // Calculate FINAL PERMANENT tier based on rank AND PnL
    // At season end, rank-based tiers (diamond/holo) become permanent!
    let finalTier: CardRank
    if (rank <= 3) {
      finalTier = 'holographic'
    } else if (rank <= 10) {
      finalTier = 'diamond'
    } else if (pnl >= 25000) {
      finalTier = 'gold'
    } else if (pnl >= 10000) {
      finalTier = 'bronze'
    } else {
      finalTier = 'iron'
    }
    
    // Get existing card to preserve selection state
    const { data: existingCard } = await supabaseAdmin
      .from('user_season_cards')
      .select('is_selected')
      .eq('user_id', participant.user_id)
      .eq('season_id', seasonId)
      .single()
    
    // Upsert card with FINAL tier as both current and highest
    const { error } = await supabaseAdmin
      .from('user_season_cards')
      .upsert({
        user_id: participant.user_id,
        season_id: seasonId,
        tier: finalTier,
        highest_tier_achieved: finalTier, // Now permanent!
        is_selected: existingCard?.is_selected || false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,season_id'
      })
    
    if (!error) {
      awardedCount++
      console.log(`[awardSeasonCards] Awarded ${finalTier} card to user rank #${rank} (PnL: ${pnl})`)
    }
  }
  
  console.log(`[awardSeasonCards] Awarded ${awardedCount} cards for season ${season.name}`)
  return { success: true, count: awardedCount }
}

/**
 * ADMIN: Retroactively award cards for all past seasons
 * Uses the same logic as end-of-season card awarding
 */
export async function awardRetroactiveSeasonCards(): Promise<{ success: boolean; message: string; details: string[] }> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Non connecté', details: [] }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, message: 'Non autorisé', details: [] }
  }
  
  // Get all seasons (except Beta Testeur and active seasons)
  const { data: seasons } = await supabaseAdmin
    .from('seasons')
    .select('id, name, is_active')
    .neq('name', 'Beta Testeur')
  
  if (!seasons || seasons.length === 0) {
    return { success: true, message: 'Aucune saison trouvée', details: [] }
  }
  
  const details: string[] = []
  let totalAwarded = 0
  
  for (const season of seasons) {
    // Only process ended seasons (not active ones)
    if (season.is_active) {
      details.push(`${season.name}: Saison active (ignorée)`)
      continue
    }
    
    const result = await awardSeasonCards(season.id)
    details.push(`${season.name}: ${result.count} cartes`)
    totalAwarded += result.count
  }
  
  revalidatePath('/admin/cards')
  return {
    success: true,
    message: `${totalAwarded} cartes attribuées au total`,
    details
  }
}
