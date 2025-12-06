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

  const { data, error } = await supabaseAdmin
    .from('season_settings')
    .update({
      title,
      cash_prize,
      season_end: season_end,
      top1_prize,
      top2_prize,
      top3_prize,
      zeny_rewards
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Update error:', error)
    return { error: `Erreur mise à jour: ${error.message}` }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/leaderboard')
  
  return { success: true, message: "Paramètres mis à jour !" }
}

export async function startSeason() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  const { data: existing } = await supabaseAdmin
    .from('season_settings')
    .select('id')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from('season_settings')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        cash_prize: 10000,
        season_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        top1_prize: 'Non défini',
        top2_prize: 'Non défini',
        top3_prize: 'Non défini',
        zeny_rewards: [10000, 7500, 5000, 3000, 2000, 1500, 1000, 750, 500, 250],
        is_active: true,
        rewards_distributed: false
      })

    if (insertError) {
      return { error: `Erreur création settings: ${insertError.message}` }
    }
  } else {
    const { error: updateError } = await supabaseAdmin
      .from('season_settings')
      .update({
        is_active: true,
        rewards_distributed: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (updateError) {
      return { error: `Erreur démarrage saison: ${updateError.message}` }
    }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/leaderboard')
  
  return { success: true, message: "🎉 Saison démarrée !" }
}

export async function endSeason() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

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

  const { data: top10, error: top10Error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, balance, avatar_url')
    .order('total_won', { ascending: false })
    .limit(10)

  if (top10Error || !top10) {
    return { error: `Erreur récupération classement: ${top10Error?.message}` }
  }

  const distributionResults: { rank: number; username: string; reward: number }[] = []

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

        await supabaseAdmin.from('transactions').insert({
          user_id: player.id,
          type: 'season_reward',
          amount: reward,
          description: `Récompense Saison - Rang #${rank}`
        })
      }
    }
  }

  const top3 = top10.slice(0, 3).map((p, i) => ({
    rank: i + 1,
    username: p.username,
    avatar: p.avatar_url,
    reward: i === 0 ? (settings.cash_prize + (settings.zeny_rewards?.[0] || 0)) : (settings.zeny_rewards?.[i] || 0)
  }))

  await supabaseAdmin.from('past_seasons').insert({
    title: settings.title || "Saison",
    start_date: settings.updated_at,
    end_date: new Date().toISOString(),
    winners: top3
  })

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

export async function checkAndDistributeRewards(): Promise<{ distributed: boolean; message?: string }> {
  const supabase = await createClient()

  const { data: settings, error } = await supabase
    .from('season_settings')
    .select('*')
    .single()

  if (error || !settings) {
    return { distributed: false }
  }

  if (settings.is_active && !settings.rewards_distributed) {
    const now = new Date()
    const seasonEnd = new Date(settings.season_end)

    if (now.getTime() >= seasonEnd.getTime()) {
      const result = await endSeasonInternal(settings)
      return { distributed: true, message: result.message }
    }
  }

  return { distributed: false }
}

async function endSeasonInternal(settings: any) {
  const { data: top10 } = await supabaseAdmin
    .from('profiles')
    .select('id, username, balance, avatar_url')
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

  const top3 = top10.slice(0, 3).map((p: any, i: number) => ({
    rank: i + 1,
    username: p.username,
    avatar: p.avatar_url,
    reward: i === 0 ? (settings.cash_prize + (settings.zeny_rewards?.[0] || 0)) : (settings.zeny_rewards?.[i] || 0)
  }))

  await supabaseAdmin.from('past_seasons').insert({
    title: settings.title || "Saison",
    start_date: settings.updated_at,
    end_date: new Date().toISOString(),
    winners: top3
  })

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
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('past_seasons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getAllPastSeasons() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('past_seasons')
    .select('id, title, end_date')
    .order('end_date', { ascending: false })

  if (error) return []
  return data
}
