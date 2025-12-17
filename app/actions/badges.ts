'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { Badge, UserBadge, UserBadgeWithDetails } from '@/lib/types'

// Admin client for server-side operations
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================
// GET FUNCTIONS
// =============================================

/**
 * Get all badges in the catalog
 */
export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('category')
    .order('level', { nullsFirst: false })
  
  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }
  
  return data || []
}

/**
 * Get all badges owned by a user
 */
export async function getUserBadges(userId: string): Promise<UserBadgeWithDetails[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user badges:', error)
    return []
  }
  
  return (data || []) as UserBadgeWithDetails[]
}

/**
 * Get equipped badges for a user (max 2)
 */
export async function getEquippedBadges(userId: string): Promise<UserBadgeWithDetails[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .eq('is_equipped', true)
    .limit(2)
  
  if (error) {
    console.error('Error fetching equipped badges:', error)
    return []
  }
  
  return (data || []) as UserBadgeWithDetails[]
}

/**
 * Get unseen badges for notification popup (uses auth)
 */
export async function getUnseenBadges(): Promise<UserBadgeWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', user.id)
    .eq('is_seen', false)
    .order('obtained_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching unseen badges:', error)
    return []
  }
  
  return (data || []) as UserBadgeWithDetails[]
}

// =============================================
// ACTION FUNCTIONS
// =============================================

/**
 * Mark a badge as seen (dismiss notification)
 */
export async function markBadgeAsSeen(userBadgeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }
  
  const { error } = await supabase
    .from('user_badges')
    .update({ is_seen: true })
    .eq('id', userBadgeId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error marking badge as seen:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/profile')
  return { success: true }
}

/**
 * Mark all badges as seen for a user
 */
export async function markAllBadgesAsSeen(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }
  
  const { error } = await supabase
    .from('user_badges')
    .update({ is_seen: true })
    .eq('user_id', user.id)
    .eq('is_seen', false)
  
  if (error) {
    console.error('Error marking all badges as seen:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/profile')
  return { success: true }
}

/**
 * Toggle equip/unequip a badge
 */
export async function toggleEquipBadge(userBadgeId: string): Promise<{ success: boolean; error?: string; isEquipped?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }
  
  // Get current state
  const { data: currentBadge, error: fetchError } = await supabase
    .from('user_badges')
    .select('is_equipped')
    .eq('id', userBadgeId)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError || !currentBadge) {
    return { success: false, error: 'Badge non trouvé' }
  }
  
  const newEquippedState = !currentBadge.is_equipped
  
  // If equipping, check if already 2 equipped
  if (newEquippedState) {
    const { count } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_equipped', true)
    
    if (count && count >= 2) {
      return { success: false, error: 'Maximum 2 badges équipés' }
    }
  }
  
  // Update
  const { error: updateError } = await supabase
    .from('user_badges')
    .update({ is_equipped: newEquippedState })
    .eq('id', userBadgeId)
    .eq('user_id', user.id)
  
  if (updateError) {
    console.error('Error toggling badge:', updateError)
    return { success: false, error: updateError.message }
  }
  
  revalidatePath('/profile')
  revalidatePath('/leaderboard')
  return { success: true, isEquipped: newEquippedState }
}

// =============================================
// AWARD FUNCTIONS (Admin/System)
// =============================================

/**
 * Award a badge to a user by slug
 * Used by system triggers when achievements are unlocked
 */
export async function awardBadge(
  userId: string, 
  badgeSlug: string
): Promise<{ success: boolean; error?: string; userBadgeId?: string }> {
  // Use RPC function for atomic operation
  const { data, error } = await supabaseAdmin
    .rpc('award_badge', {
      p_user_id: userId,
      p_badge_slug: badgeSlug
    })
  
  if (error) {
    // Ignore "already has badge" errors
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { success: true, error: 'Badge déjà obtenu' }
    }
    console.error('Error awarding badge:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, userBadgeId: data }
}

/**
 * Check and award badges based on user stats
 * Called after bets are resolved
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = []
  
  // Fetch user stats
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('balance, total_won, total_bets, wins, losses')
    .eq('id', userId)
    .single()
  
  if (profileError || !profile) {
    console.error('Error fetching profile for badge check:', profileError)
    return awardedBadges
  }
  
  // Fetch existing badge IDs
  const { data: existingBadges } = await supabaseAdmin
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)
  
  // Then get the slugs for those badges
  const badgeIds = (existingBadges || []).map(ub => ub.badge_id)
  let ownedSlugs = new Set<string>()
  
  if (badgeIds.length > 0) {
    const { data: badgesData } = await supabaseAdmin
      .from('badges')
      .select('slug')
      .in('id', badgeIds)
    
    ownedSlugs = new Set((badgesData || []).map(b => b.slug))
  }
  
  // Helper to award if not owned
  const maybeAward = async (slug: string) => {
    if (!ownedSlugs.has(slug)) {
      const result = await awardBadge(userId, slug)
      if (result.success && result.userBadgeId) {
        awardedBadges.push(slug)
      }
    }
  }
  
  const totalBets = profile.total_bets || 0
  const wins = profile.wins || 0
  const losses = profile.losses || 0
  const totalResolved = wins + losses
  const winRate = totalResolved > 0 ? wins / totalResolved : 0
  const pnl = profile.total_won || 0
  const balance = profile.balance || 0
  
  // NOOB: First bet
  if (totalBets >= 1) await maybeAward('noob')
  
  // SENSEI series (bet volume) - 10/25/50/100
  if (totalBets >= 10) await maybeAward('sensei-1')
  if (totalBets >= 25) await maybeAward('sensei-2')
  if (totalBets >= 50) await maybeAward('sensei-3')
  if (totalBets >= 100) await maybeAward('sensei-4')
  
  // TRADER series (PnL) - 10K/50K/100K/1M
  if (pnl >= 10000) await maybeAward('trader-1')
  if (pnl >= 50000) await maybeAward('trader-2')
  if (pnl >= 100000) await maybeAward('trader-3')
  if (pnl >= 1000000) await maybeAward('trader-4')
  
  // WHALE series (balance) - 25K/50K/100K/1M
  if (balance >= 25000) await maybeAward('whale-1')
  if (balance >= 50000) await maybeAward('whale-2')
  if (balance >= 100000) await maybeAward('whale-3')
  if (balance >= 1000000) await maybeAward('whale-4')
  
  // CLOWN badge (losing) - global stat
  if (totalResolved >= 10 && winRate <= 0.1) await maybeAward('clown')
  
  return awardedBadges
}

/**
 * Award win streak badges
 * Called when a bet is won
 */
export async function checkWinStreakBadge(userId: string): Promise<string[]> {
  const awardedBadges: string[] = []
  
  // Get recent bets ordered by date
  const { data: recentBets, error } = await supabaseAdmin
    .from('bets')
    .select('status, created_at')
    .eq('user_id', userId)
    .in('status', ['won', 'lost'])
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error || !recentBets) return awardedBadges
  
  // Count current win streak
  let streak = 0
  for (const bet of recentBets) {
    if (bet.status === 'won') {
      streak++
    } else {
      break
    }
  }
  
  // Award streak badges
  if (streak >= 3) {
    const result = await awardBadge(userId, 'devin-1')
    if (result.success && result.userBadgeId) awardedBadges.push('devin-1')
  }
  if (streak >= 5) {
    const result = await awardBadge(userId, 'devin-2')
    if (result.success && result.userBadgeId) awardedBadges.push('devin-2')
  }
  if (streak >= 10) {
    const result = await awardBadge(userId, 'devin-3')
    if (result.success && result.userBadgeId) awardedBadges.push('devin-3')
  }
  if (streak >= 20) {
    const result = await awardBadge(userId, 'devin-4')
    if (result.success && result.userBadgeId) awardedBadges.push('devin-4')
  }
  
  return awardedBadges
}

/**
 * Award special bet badges (DIEU, RISK TAKER, ALL IN)
 * Called after a bet is resolved
 */
export async function checkSpecialBetBadge(
  userId: string, 
  betWon: boolean, 
  probabilityAtBet: number,
  betAmount: number,
  userBalanceBeforeBet: number
): Promise<string[]> {
  const awardedBadges: string[] = []
  
  if (!betWon) return awardedBadges
  
  // ALL IN: bet was 100% of balance (user had exactly betAmount as balance)
  if (betAmount >= userBalanceBeforeBet) {
    const result = await awardBadge(userId, 'all-in')
    if (result.success && result.userBadgeId) awardedBadges.push('all-in')
  }
  
  // DIEU: won at 1% or less probability
  if (probabilityAtBet <= 0.01) {
    const result = await awardBadge(userId, 'dieu')
    if (result.success && result.userBadgeId) awardedBadges.push('dieu')
  }
  
  // RISK TAKER: won at 10% or less probability
  if (probabilityAtBet <= 0.10) {
    const result = await awardBadge(userId, 'risk-taker')
    if (result.success && result.userBadgeId) awardedBadges.push('risk-taker')
  }
  
  return awardedBadges
}

/**
 * Check and award VERIFIED badge
 * Called when a user updates their profile
 */
export async function checkVerifiedBadge(userId: string): Promise<string[]> {
  const awardedBadges: string[] = []
  
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single()
    
    if (!profile) return awardedBadges
    
    // Check if profile is complete (has custom username and avatar)
    const hasUsername = profile.username && !profile.username.startsWith('user_')
    const hasAvatar = profile.avatar_url && profile.avatar_url.length > 0
    
    if (hasUsername && hasAvatar) {
      const result = await awardBadge(userId, 'verified')
      if (result.success && result.userBadgeId) awardedBadges.push('verified')
    }
  } catch (error) {
    console.error('Error checking verified badge:', error)
  }
  
  return awardedBadges
}

/**
 * Check and award legacy badges (G.O.A.T, MVP)
 * Called periodically or when leaderboard changes significantly
 */
export async function checkLegacyBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = []
  
  try {
    // Get user's global rank
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('total_won')
      .eq('id', userId)
      .single()
    
    if (!profile) return awardedBadges
    
    // Count how many non-admin users have more PnL
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin')
      .gt('total_won', profile.total_won || 0)
    
    const rank = (count || 0) + 1
    
    // G.O.A.T: Top 1 Global
    if (rank === 1) {
      const result = await awardBadge(userId, 'goat')
      if (result.success && result.userBadgeId) awardedBadges.push('goat')
    }
    
    // MVP: Top 3 Global
    if (rank <= 3) {
      const result = await awardBadge(userId, 'mvp')
      if (result.success && result.userBadgeId) awardedBadges.push('mvp')
    }
  } catch (error) {
    console.error('Error checking legacy badges:', error)
  }
  
  return awardedBadges
}

/**
 * Check and award CHAMPION and PODIUM badges
 * Called when a season ends, for each user in the top 3
 */
export async function checkSeasonPlacementBadges(
  userId: string,
  seasonRank: number // 1, 2, or 3
): Promise<string[]> {
  const awardedBadges: string[] = []
  
  if (seasonRank < 1 || seasonRank > 3) return awardedBadges
  
  try {
    // Get current badge counts for this user
    const { data: existingBadges } = await supabaseAdmin
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
    
    const badgeIds = (existingBadges || []).map(ub => ub.badge_id)
    
    // Get slugs for champion and podium badges
    const { data: championPodiumBadges } = await supabaseAdmin
      .from('badges')
      .select('id, slug')
      .in('slug', ['champion-1', 'champion-2', 'champion-3', 'champion-4', 'podium-1', 'podium-2', 'podium-3', 'podium-4'])
    
    if (!championPodiumBadges) return awardedBadges
    
    const ownedSlugs = new Set<string>()
    for (const cb of championPodiumBadges) {
      if (badgeIds.includes(cb.id)) {
        ownedSlugs.add(cb.slug)
      }
    }
    
    // Count current champion wins (how many champion badges user already has)
    let championWins = 0
    if (ownedSlugs.has('champion-1')) championWins = 1
    if (ownedSlugs.has('champion-2')) championWins = 2
    if (ownedSlugs.has('champion-3')) championWins = 3
    if (ownedSlugs.has('champion-4')) championWins = 4
    
    // Count current podiums
    let podiumCount = 0
    if (ownedSlugs.has('podium-1')) podiumCount = 1
    if (ownedSlugs.has('podium-2')) podiumCount = 2
    if (ownedSlugs.has('podium-3')) podiumCount = 3
    if (ownedSlugs.has('podium-4')) podiumCount = 4
    
    // Award CHAMPION badges (only for rank 1)
    if (seasonRank === 1) {
      const newChampionWins = championWins + 1
      if (newChampionWins >= 1 && !ownedSlugs.has('champion-1')) {
        const result = await awardBadge(userId, 'champion-1')
        if (result.success && result.userBadgeId) awardedBadges.push('champion-1')
      }
      if (newChampionWins >= 2 && !ownedSlugs.has('champion-2')) {
        const result = await awardBadge(userId, 'champion-2')
        if (result.success && result.userBadgeId) awardedBadges.push('champion-2')
      }
      if (newChampionWins >= 3 && !ownedSlugs.has('champion-3')) {
        const result = await awardBadge(userId, 'champion-3')
        if (result.success && result.userBadgeId) awardedBadges.push('champion-3')
      }
      if (newChampionWins >= 4 && !ownedSlugs.has('champion-4')) {
        const result = await awardBadge(userId, 'champion-4')
        if (result.success && result.userBadgeId) awardedBadges.push('champion-4')
      }
    }
    
    // Award PODIUM badges (for rank 1, 2, or 3)
    const newPodiumCount = podiumCount + 1
    if (newPodiumCount >= 1 && !ownedSlugs.has('podium-1')) {
      const result = await awardBadge(userId, 'podium-1')
      if (result.success && result.userBadgeId) awardedBadges.push('podium-1')
    }
    if (newPodiumCount >= 2 && !ownedSlugs.has('podium-2')) {
      const result = await awardBadge(userId, 'podium-2')
      if (result.success && result.userBadgeId) awardedBadges.push('podium-2')
    }
    if (newPodiumCount >= 3 && !ownedSlugs.has('podium-3')) {
      const result = await awardBadge(userId, 'podium-3')
      if (result.success && result.userBadgeId) awardedBadges.push('podium-3')
    }
    if (newPodiumCount >= 4 && !ownedSlugs.has('podium-4')) {
      const result = await awardBadge(userId, 'podium-4')
      if (result.success && result.userBadgeId) awardedBadges.push('podium-4')
    }
    
  } catch (error) {
    console.error('Error checking season placement badges:', error)
  }
  
  return awardedBadges
}

/**
 * Check and award season-based win rate badges
 * Called when a season ends or when a user participates in enough events
 * Requirements: 
 * - User must have participated in at least 50% of season events
 * - Win rate is calculated only for that season
 */
export async function checkSeasonWinRateBadges(
  userId: string,
  seasonId: string
): Promise<string[]> {
  const awardedBadges: string[] = []
  
  try {
    // 1. Count total events in the season
    const { count: totalSeasonEvents } = await supabaseAdmin
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', seasonId)
      .eq('status', 'resolved')
    
    if (!totalSeasonEvents || totalSeasonEvents === 0) return awardedBadges
    
    // 2. Get user's season stats
    const { data: seasonStats } = await supabaseAdmin
      .from('season_leaderboards')
      .select('wins, losses')
      .eq('user_id', userId)
      .eq('season_id', seasonId)
      .single()
    
    if (!seasonStats) return awardedBadges
    
    const seasonWins = seasonStats.wins || 0
    const seasonLosses = seasonStats.losses || 0
    const totalUserBets = seasonWins + seasonLosses
    
    // 3. Check if user participated in at least 50% of season events
    // Each "bet resolved" counts as participation - we need unique markets
    const { data: userBets } = await supabaseAdmin
      .from('bets')
      .select('market_id')
      .eq('user_id', userId)
      .in('status', ['won', 'lost'])
    
    if (!userBets) return awardedBadges
    
    // Get unique markets the user bet on in this season
    const uniqueMarketIds = [...new Set(userBets.map(b => b.market_id))]
    
    // Check how many of those are in this season
    const { count: userSeasonEventCount } = await supabaseAdmin
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', seasonId)
      .in('id', uniqueMarketIds)
    
    const participationRate = (userSeasonEventCount || 0) / totalSeasonEvents
    
    // Require at least 50% participation
    if (participationRate < 0.5) return awardedBadges
    
    // 4. Calculate season win rate
    const seasonWinRate = totalUserBets > 0 ? seasonWins / totalUserBets : 0
    
    // 5. Award badges based on win rate
    if (seasonWinRate > 0.6) {
      const result = await awardBadge(userId, 'smart-money')
      if (result.success && result.userBadgeId) awardedBadges.push('smart-money')
    }
    
    if (seasonWinRate > 0.8) {
      const result = await awardBadge(userId, 'aim-bot')
      if (result.success && result.userBadgeId) awardedBadges.push('aim-bot')
    }
    
    if (seasonWinRate >= 1.0 && totalUserBets >= 3) {
      // 100% win rate with at least 3 bets
      const result = await awardBadge(userId, 'cheat-code')
      if (result.success && result.userBadgeId) awardedBadges.push('cheat-code')
    }
    
  } catch (error) {
    console.error('Error checking season win rate badges:', error)
  }
  
  return awardedBadges
}

