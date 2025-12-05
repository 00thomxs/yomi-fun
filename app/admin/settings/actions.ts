'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SeasonSettings = {
  id: string
  cash_prize: number
  season_end: string
  top1_prize: string
  top2_prize: string
  top3_prize: string
  zeny_rewards: number[]
  is_active: boolean
  rewards_distributed: boolean
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
  const cash_prize = parseInt(formData.get('cash_prize') as string)
  const season_end = formData.get('season_end') as string
  const top1_prize = formData.get('top1_prize') as string
  const top2_prize = formData.get('top2_prize') as string
  const top3_prize = formData.get('top3_prize') as string
  
  const zeny_rewards = []
  for (let i = 1; i <= 10; i++) {
    const val = formData.get(`zeny_rank_${i}`)
    zeny_rewards.push(val ? parseInt(val as string) : 0)
  }

  const { error } = await supabase
    .from('season_settings')
    .update({
      cash_prize,
      season_end,
      top1_prize,
      top2_prize,
      top3_prize,
      zeny_rewards,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    return { error: `Erreur mise à jour: ${error.message}` }
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

  const { error } = await supabase
    .from('season_settings')
    .update({
      is_active: true,
      rewards_distributed: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')

  if (error) {
    return { error: `Erreur démarrage saison: ${error.message}` }
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

  // Fetch top 10 players by total_won (PnL)
  const { data: top10, error: top10Error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, balance')
    .order('total_won', { ascending: false })
    .limit(10)

  if (top10Error || !top10) {
    return { error: `Erreur récupération classement: ${top10Error?.message}` }
  }

  const distributionResults: { rank: number; username: string; reward: number }[] = []

  // Distribute rewards to each ranked player
  for (let i = 0; i < top10.length; i++) {
    const player = top10[i]
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

        // Log transaction
        await supabaseAdmin.from('transactions').insert({
          user_id: player.id,
          type: 'season_reward',
          amount: reward,
          description: `Récompense Saison - Rang #${rank}`
        })
      }
    }
  }

  // Mark season as ended
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

  const { data: settings } = await supabase
    .from('season_settings')
    .select('*')
    .single()

  if (!settings) return { distributed: false }

  // If season is active and end date has passed, auto-end it
  if (settings.is_active && !settings.rewards_distributed) {
    const now = new Date()
    const seasonEnd = new Date(settings.season_end)

    if (now >= seasonEnd) {
      // Season has ended naturally, distribute rewards
      // We need to use admin client for this
      const result = await endSeasonInternal(settings)
      return { distributed: true, message: result.message }
    }
  }

  return { distributed: false }
}

// Internal function for auto-distribution (bypasses admin check)
async function endSeasonInternal(settings: any) {
  // Fetch top 10 players
  const { data: top10 } = await supabaseAdmin
    .from('profiles')
    .select('id, username, balance')
    .order('total_won', { ascending: false })
    .limit(10)

  if (!top10) {
    return { success: false, message: "Erreur récupération classement" }
  }

  let totalDistributed = 0
  let playersRewarded = 0

  for (let i = 0; i < top10.length; i++) {
    const player = top10[i]
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

      await supabaseAdmin.from('transactions').insert({
        user_id: player.id,
        type: 'season_reward',
        amount: reward,
        description: `Récompense Saison - Rang #${rank}`
      })

      totalDistributed += reward
      playersRewarded++
    }
  }

  // Mark season as ended
  await supabaseAdmin
    .from('season_settings')
    .update({
      is_active: false,
      rewards_distributed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')

  return { 
    success: true, 
    message: `Saison terminée automatiquement ! ${totalDistributed.toLocaleString()} Zeny distribués.`
  }
}
