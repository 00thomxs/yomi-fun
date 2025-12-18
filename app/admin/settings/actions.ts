'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getAvatarUrl } from '@/lib/utils/avatar'
import { checkSeasonWinRateBadges, checkSeasonPlacementBadges, checkLegacyBadges } from '@/app/actions/badges'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SeasonSettings = {
  id: string
  title?: string
  cash_prize: number
  season_end: string
  top1_prize: string
  top2_prize: string
  top3_prize: string
  zeny_rewards: number[]
  is_active: boolean
  rewards_distributed: boolean
  created_at?: string
  updated_at?: string
}

export async function getSeasonSettings(): Promise<SeasonSettings | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('season_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching season settings:', error)
    return null
  }

  return data as SeasonSettings
}

export async function updateSeasonSettings(formData: FormData) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  const id = formData.get('id') as string
  const title = formData.get('title') as string || "Saison Régulière"
  const cash_prize = parseInt(formData.get('cash_prize') as string) || 0
  const season_end = formData.get('season_end') as string
  const top1_prize = formData.get('top1_prize') as string || 'Non défini'
  const top2_prize = formData.get('top2_prize') as string || 'Non défini'
  const top3_prize = formData.get('top3_prize') as string || 'Non défini'
  
  const zeny_rewards: number[] = []
  for (let i = 1; i <= 10; i++) {
    const val = formData.get(`zeny_rank_${i}`)
    zeny_rewards.push(val ? parseInt(val as string) : 0)
  }

  console.log('Updating season settings:', { id, cash_prize, season_end, top1_prize, top2_prize, top3_prize, zeny_rewards })

  // Use supabaseAdmin to bypass RLS
  // season_end is already in ISO format from the client (with correct timezone)
  // NOTE: Don't update 'updated_at' here - it's used to track season START time!
  const { data, error } = await supabaseAdmin
    .from('season_settings')
    .update({
      title,
      cash_prize,
      season_end: season_end, // Already ISO format from client
      top1_prize,
      top2_prize,
      top3_prize,
      zeny_rewards
      // Don't touch updated_at - it marks when the season started
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Update error:', error)
    return { error: `Erreur mise à jour: ${error.message}` }
  }

  console.log('Update result:', data)

  // SYNC: Also update the active season in seasons table (if exists)
  const { data: activeSeason } = await supabaseAdmin
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single()

  if (activeSeason?.id) {
    await supabaseAdmin
      .from('seasons')
      .update({
        name: title,
        end_date: season_end
      })
      .eq('id', activeSeason.id)
    
    console.log('[updateSeasonSettings] Synced seasons table with new title/end_date')
  }

  revalidatePath('/admin/settings')
  revalidatePath('/leaderboard')
  
  return { success: true, message: "Paramètres mis à jour !" }
}

// Start a new season (reset rewards_distributed, set is_active = true)
export async function startSeason() {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // First check if settings row exists
  const { data: existing } = await supabaseAdmin
    .from('season_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  const now = new Date()
  let seasonEnd: Date
  let seasonTitle: string

  if (!existing) {
    seasonEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    seasonTitle = 'Saison 1'
  } else {
    seasonEnd = new Date(existing.season_end)
    seasonTitle = existing.title || 'Saison'
  }

  // STEP 1: First, create season in seasons table (before marking settings as active)
  // Deactivate any previously active season
  await supabaseAdmin
    .from('seasons')
    .update({ is_active: false })
    .eq('is_active', true)

  // Create new season entry
  const { data: newSeason, error: seasonError } = await supabaseAdmin
    .from('seasons')
    .insert({
      name: seasonTitle,
      start_date: now.toISOString(),
      end_date: seasonEnd.toISOString(),
      is_active: true
    })
    .select('id')
    .single()

  if (seasonError) {
    console.error('Season creation error:', seasonError)
    // If we can't create the season entry, we still continue but log the error
    // The system will fallback to global stats if needed
  } else {
    console.log('[startSeason] Created season entry:', newSeason?.id)
  }

  // STEP 2: Now update season_settings (after seasons table is set up)
  if (!existing) {
    // Create the row if it doesn't exist
    const { error: insertError } = await supabaseAdmin
      .from('season_settings')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        title: seasonTitle,
        cash_prize: 10000,
        season_end: seasonEnd.toISOString(),
        top1_prize: 'Non défini',
        top2_prize: 'Non défini',
        top3_prize: 'Non défini',
        zeny_rewards: [10000, 7500, 5000, 3000, 2000, 1500, 1000, 750, 500, 250],
        is_active: true,
        rewards_distributed: false
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      // Rollback: deactivate the season we just created
      if (newSeason?.id) {
        await supabaseAdmin.from('seasons').update({ is_active: false }).eq('id', newSeason.id)
      }
      return { error: `Erreur création settings: ${insertError.message}` }
    }
  } else {
    // Update existing row
    const { error: updateError } = await supabaseAdmin
      .from('season_settings')
      .update({
        is_active: true,
        rewards_distributed: false,
        updated_at: now.toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (updateError) {
      console.error('Update error:', updateError)
      // Rollback: deactivate the season we just created
      if (newSeason?.id) {
        await supabaseAdmin.from('seasons').update({ is_active: false }).eq('id', newSeason.id)
      }
      return { error: `Erreur démarrage saison: ${updateError.message}` }
    }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/leaderboard')
  
  return { success: true, message: "🎉 Saison démarrée !" }
}

// End season: distribute rewards and set is_active = false
export async function endSeason() {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // Fetch current settings
  const { data: settings, error: settingsError } = await supabase
    .from('season_settings')
    .select('*')
    .single()

  if (settingsError || !settings) {
    return { error: "Impossible de charger les paramètres de saison" }
  }

  if (!settings.is_active) {
    return { error: "Aucune saison active à terminer" }
  }

  if (settings.rewards_distributed) {
    return { error: "Les récompenses ont déjà été distribuées" }
  }

  // Get active season ID from seasons table
  const { data: activeSeason } = await supabaseAdmin
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single()

  let top10Data: any[] = []

  // Try to get top 10 from season_leaderboards first (if season exists and has data)
  if (activeSeason?.id) {
    const { data: seasonTop10 } = await supabaseAdmin
      .from('season_leaderboards')
      .select(`
        user_id,
        points,
        profiles!inner (
          id,
          username,
          balance,
          avatar_url,
          role
        )
      `)
      .eq('season_id', activeSeason.id)
      .neq('profiles.role', 'admin')
      .order('points', { ascending: false })
      .limit(10)

    if (seasonTop10 && seasonTop10.length > 0) {
      // Use season leaderboard data
      top10Data = seasonTop10.map((entry: any) => ({
        id: entry.profiles.id,
        username: entry.profiles.username,
        balance: entry.profiles.balance,
        avatar_url: entry.profiles.avatar_url,
        points: entry.points
      }))
      console.log('[endSeason] Using season_leaderboards for ranking')
    }
  }

  // Fallback to global stats if no season data
  if (top10Data.length === 0) {
    const { data: globalTop10, error: top10Error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, balance, avatar_url, role')
      .neq('role', 'admin')
    .order('total_won', { ascending: false })
    .limit(10)

    if (top10Error || !globalTop10) {
    return { error: `Erreur récupération classement: ${top10Error?.message}` }
    }
    top10Data = globalTop10
    console.log('[endSeason] Fallback to profiles.total_won for ranking')
  }

  const distributionResults: { rank: number; username: string; reward: number }[] = []

  // Distribute rewards to each ranked player
  for (let i = 0; i < top10Data.length; i++) {
    const player = top10Data[i]
    const rank = i + 1
    
    // Rank 1 gets cash_prize (as Zeny) + zeny_rewards[0]
    // Ranks 2-10 get their respective zeny_rewards
    let reward = 0
    if (rank === 1) {
      reward = settings.cash_prize + (settings.zeny_rewards?.[0] || 0)
    } else {
      reward = settings.zeny_rewards?.[rank - 1] || 0
    }

    if (reward > 0) {
      const newBalance = player.balance + reward

      // Update player balance
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', player.id)

      if (!updateError) {
        distributionResults.push({
          rank,
          username: player.username || `User #${rank}`,
          reward
        })

        // Log transaction (using 'bonus' type as 'season_reward' is not in CHECK constraint)
        await supabaseAdmin.from('transactions').insert({
          user_id: player.id,
          type: 'bonus',
          amount: reward,
          description: `🏆 Récompense Saison - Rang #${rank}`
        })
      }
    }
  }

  // Archive Season - Save all top 10
  const allWinners = top10Data.map((p, i) => ({
    rank: i + 1,
    username: p.username,
    avatar: getAvatarUrl(p.avatar_url),
    reward: i === 0 ? (settings.cash_prize + (settings.zeny_rewards?.[0] || 0)) : (settings.zeny_rewards?.[i] || 0)
  }))

  await supabaseAdmin.from('past_seasons').insert({
    title: settings.title || "Saison",
    start_date: settings.updated_at,
    end_date: new Date().toISOString(),
    winners: allWinners
  })

  // Mark season as ended in season_settings
  const { error: endError } = await supabase
    .from('season_settings')
    .update({
      is_active: false,
      rewards_distributed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')

  if (endError) {
    return { error: `Erreur fin de saison: ${endError.message}` }
  }

  // Also mark season as ended in seasons table
  if (activeSeason?.id) {
    await supabaseAdmin
      .from('seasons')
      .update({ is_active: false })
      .eq('id', activeSeason.id)
  }

  revalidatePath('/admin/settings')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')

  const totalDistributed = distributionResults.reduce((sum, r) => sum + r.reward, 0)
  
  return { 
    success: true, 
    message: `🏆 Saison terminée ! ${totalDistributed.toLocaleString()} Zeny distribués à ${distributionResults.length} joueurs.`,
    distributionResults
  }
}

// Check if season has ended and auto-distribute (called on leaderboard load)
export async function checkAndDistributeRewards(): Promise<{ distributed: boolean; message?: string }> {
  const supabase = await createClient()

  const { data: settings, error } = await supabase
    .from('season_settings')
    .select('*')
    .single()

  if (error || !settings) {
    console.log('[AutoEnd] No settings found or error:', error)
    return { distributed: false }
  }

  console.log('[AutoEnd] Checking season:', {
    is_active: settings.is_active,
    rewards_distributed: settings.rewards_distributed,
    season_end: settings.season_end,
    now: new Date().toISOString()
  })

  // If season is active and end date has passed, auto-end it
  if (settings.is_active && !settings.rewards_distributed) {
    const now = new Date()
    const seasonEnd = new Date(settings.season_end)

    console.log('[AutoEnd] Time comparison:', {
      now: now.getTime(),
      seasonEnd: seasonEnd.getTime(),
      hasEnded: now.getTime() >= seasonEnd.getTime()
    })

    if (now.getTime() >= seasonEnd.getTime()) {
      console.log('[AutoEnd] Season has ended! Distributing rewards...')
      // Season has ended naturally, distribute rewards
      const result = await endSeasonInternal(settings)
      return { distributed: true, message: result.message }
    }
  }

  return { distributed: false }
}

// Internal function for auto-distribution (bypasses admin check)
async function endSeasonInternal(settings: any) {
  // Get active season ID from seasons table
  const { data: activeSeason } = await supabaseAdmin
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single()

  let top10Data: any[] = []

  // Try to get top 10 from season_leaderboards first
  if (activeSeason?.id) {
    const { data: seasonTop10 } = await supabaseAdmin
      .from('season_leaderboards')
      .select(`
        user_id,
        points,
        profiles!inner (
          id,
          username,
          balance,
          avatar_url,
          role
        )
      `)
      .eq('season_id', activeSeason.id)
      .neq('profiles.role', 'admin')
      .order('points', { ascending: false })
      .limit(10)

    if (seasonTop10 && seasonTop10.length > 0) {
      top10Data = seasonTop10.map((entry: any) => ({
        id: entry.profiles.id,
        username: entry.profiles.username,
        balance: entry.profiles.balance,
        avatar_url: entry.profiles.avatar_url,
        points: entry.points
      }))
      console.log('[endSeasonInternal] Using season_leaderboards for ranking')
    }
  }

  // Fallback to global stats if no season data
  if (top10Data.length === 0) {
    const { data: globalTop10 } = await supabaseAdmin
    .from('profiles')
    .select('id, username, balance, avatar_url, role')
      .neq('role', 'admin')
    .order('total_won', { ascending: false })
    .limit(10)

    if (!globalTop10) {
    return { success: false, message: "Erreur récupération classement" }
    }
    top10Data = globalTop10
    console.log('[endSeasonInternal] Fallback to profiles.total_won for ranking')
  }

  let totalDistributed = 0
  let playersRewarded = 0

  for (let i = 0; i < top10Data.length; i++) {
    const player = top10Data[i]
    const rank = i + 1
    
    let reward = 0
    if (rank === 1) {
      reward = settings.cash_prize + (settings.zeny_rewards?.[0] || 0)
    } else {
      reward = settings.zeny_rewards?.[rank - 1] || 0
    }

    if (reward > 0) {
      const newBalance = player.balance + reward

      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', player.id)

      // Log transaction (using 'bonus' type as 'season_reward' is not in CHECK constraint)
      await supabaseAdmin.from('transactions').insert({
        user_id: player.id,
        type: 'bonus',
        amount: reward,
        description: `🏆 Récompense Saison - Rang #${rank}`
      })

      totalDistributed += reward
      playersRewarded++
    }
  }

  // Check and award badges for all participants
  if (activeSeason?.id) {
    try {
      // Award CHAMPION and PODIUM badges to top 3
      for (let i = 0; i < Math.min(top10Data.length, 3); i++) {
        const player = top10Data[i]
        const rank = i + 1
        await checkSeasonPlacementBadges(player.id, rank)
        console.log(`[endSeasonInternal] Awarded placement badges for rank #${rank}: ${player.username}`)
      }
      
      // Check legacy badges for top 3 (G.O.A.T, MVP)
      for (let i = 0; i < Math.min(top10Data.length, 3); i++) {
        await checkLegacyBadges(top10Data[i].id)
      }
      
      // Get all unique participants in this season
      const { data: allParticipants } = await supabaseAdmin
        .from('season_leaderboards')
        .select('user_id')
        .eq('season_id', activeSeason.id)
      
      if (allParticipants) {
        console.log(`[endSeasonInternal] Checking season win rate badges for ${allParticipants.length} participants`)
        for (const participant of allParticipants) {
          await checkSeasonWinRateBadges(participant.user_id, activeSeason.id)
        }
      }
    } catch (badgeError) {
      console.error('[endSeasonInternal] Badge check failed (non-blocking):', badgeError)
    }
  }

  // Archive Season - Save all top 10
  const allWinners = top10Data.map((p: any, i: number) => ({
    rank: i + 1,
    username: p.username,
    avatar: getAvatarUrl(p.avatar_url),
    reward: i === 0 ? (settings.cash_prize + (settings.zeny_rewards?.[0] || 0)) : (settings.zeny_rewards?.[i] || 0)
  }))

  await supabaseAdmin.from('past_seasons').insert({
    title: settings.title || "Saison",
    start_date: settings.updated_at,
    end_date: new Date().toISOString(),
    winners: allWinners
  })

  // Mark season as ended in season_settings
  await supabaseAdmin
    .from('season_settings')
    .update({
      is_active: false,
      rewards_distributed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')

  // Also mark season as ended in seasons table
  if (activeSeason?.id) {
    await supabaseAdmin
      .from('seasons')
      .update({ is_active: false })
      .eq('id', activeSeason.id)
  }

  return { 
    success: true, 
    message: `Saison terminée automatiquement ! ${totalDistributed.toLocaleString()} Zeny distribués.`
  }
}

export async function getLastSeason() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('past_seasons')
    .select('*')
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

export async function getPastSeason(id: string) {
  // Use admin client to bypass potential RLS issues on new table
  const { data, error } = await supabaseAdmin
    .from('past_seasons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching past season:', error)
    return null
  }
  return data
}

export async function getAllPastSeasons() {
  // Get all inactive seasons from the 'seasons' table (unified source)
  const { data, error } = await supabaseAdmin
    .from('seasons')
    .select('id, name, start_date, end_date')
    .eq('is_active', false)
    .order('end_date', { ascending: false })

  if (error) {
    console.error('Error fetching past seasons:', error)
    return []
  }
  
  // Map to expected format (title instead of name for backward compatibility)
  return (data || []).map(s => ({
    id: s.id,
    title: s.name,
    start_date: s.start_date,
    end_date: s.end_date
  }))
}

export async function deletePastSeason(id: string) {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // Check if this is the active season
  const { data: seasonToDelete } = await supabaseAdmin
    .from('seasons')
    .select('is_active')
    .eq('id', id)
    .single()
  
  if (seasonToDelete?.is_active) {
    return { error: "Impossible de supprimer la saison active" }
  }

  // Use admin client to bypass RLS - delete from seasons table
  const { error } = await supabaseAdmin
    .from('seasons')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/settings')
  return { success: true }
}
