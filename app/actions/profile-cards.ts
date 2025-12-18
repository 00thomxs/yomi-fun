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
    if (newIndex >= 3) {
      highestTier = newTier
    } else {
      highestTier = newIndex > prevIndex ? newTier : previousTier
    }
  }
  
  // Upsert the card
  const { data: upsertedCard } = await supabaseAdmin
    .from('user_season_cards')
    .upsert({
      user_id: targetUserId,
      season_id: activeSeason.id,
      tier: newTier,
      highest_tier_achieved: highestTier,
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
  
  const isNewTier = !previousTier || (TIER_ORDER.indexOf(highestTier) > TIER_ORDER.indexOf(previousTier) && newTier !== 'iron')
  
  return {
    card: {
      id: upsertedCard?.id || existingCard?.id || '',
      tier: newTier,
      highestTierAchieved: highestTier,
      seasonId: activeSeason.id,
      seasonName: activeSeason.name || 'Saison',
      seasonNumber: count || 1,
      isSelected: existingCard?.is_selected || false,
    },
    isNewTier,
    previousTier,
  }
}

/**
 * Calculate user's tier based on season leaderboard
 */
async function calculateUserTier(userId: string, seasonId: string): Promise<CardRank> {
  const { data: leaderboard } = await supabaseAdmin
    .from('season_leaderboards')
    .select('user_id, points')
    .eq('season_id', seasonId)
    .order('points', { ascending: false })
  
  if (!leaderboard || leaderboard.length === 0) {
    return 'iron'
  }
  
  const userIndex = leaderboard.findIndex(entry => entry.user_id === userId)
  
  if (userIndex === -1) {
    return 'iron'
  }
  
  const userRank = userIndex + 1
  const userPnL = leaderboard[userIndex].points
  
  if (userRank <= 3) return 'holographic'
  if (userRank <= 10) return 'diamond'
  if (userPnL >= 25000) return 'gold'
  if (userPnL >= 10000) return 'bronze'
  
  return 'iron'
}

/**
 * ADMIN: Award retroactive cards to all users for past seasons
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
    // Get all seasons (including ended ones)
    const { data: seasons } = await supabaseAdmin
      .from('seasons')
      .select('id, name')
      .order('created_at', { ascending: true })
    
    if (!seasons || seasons.length === 0) {
      return { success: false, message: 'Aucune saison trouvée' }
    }
    
    details.push(`${seasons.length} saison(s) trouvée(s)`)
    
    let totalCardsAwarded = 0
    
    for (const season of seasons) {
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
 * Award cards to all participants of a season based on their final ranking
 * Called at end of season
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
  
  // Get all participants with their points
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
    
    // Calculate tier based on rank and PnL
    let tier: CardRank
    if (rank <= 3) {
      tier = 'holographic'
    } else if (rank <= 10) {
      tier = 'diamond'
    } else if (pnl >= 25000) {
      tier = 'gold'
    } else if (pnl >= 10000) {
      tier = 'bronze'
    } else {
      tier = 'iron'
    }
    
    // Upsert card for this user
    const { error } = await supabaseAdmin
      .from('user_season_cards')
      .upsert({
        user_id: participant.user_id,
        season_id: seasonId,
        tier: tier,
        highest_tier_achieved: tier,
        is_selected: false,
      }, {
        onConflict: 'user_id,season_id'
      })
    
    if (!error) {
      awardedCount++
      console.log(`[awardSeasonCards] Awarded ${tier} card to user rank #${rank}`)
    }
  }
  
  console.log(`[awardSeasonCards] Awarded ${awardedCount} cards for season ${season.name}`)
  return { success: true, count: awardedCount }
}

/**
 * ADMIN: Retroactively award cards for all past seasons
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
  
  // Get all seasons (except Beta Testeur)
  const { data: seasons } = await supabaseAdmin
    .from('seasons')
    .select('id, name')
    .neq('name', 'Beta Testeur')
  
  if (!seasons || seasons.length === 0) {
    return { success: true, message: 'Aucune saison trouvée', details: [] }
  }
  
  const details: string[] = []
  let totalAwarded = 0
  
  for (const season of seasons) {
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
