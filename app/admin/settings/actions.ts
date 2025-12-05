'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SeasonSettings = {
  id: string
  cash_prize: number
  season_end: string
  top1_prize: string
  top2_prize: string
  top3_prize: string
  zeny_rewards: number[]
}

export async function getSeasonSettings(): Promise<SeasonSettings | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('season_settings')
    .select('*')
    .single() // There should be only one config row

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
  
  // Parse Zeny rewards (expected as comma separated string or JSON)
  // But for simplicity in form, we might receive them individually or as a JSON string
  // Let's assume we pass a JSON string from a hidden input or process multiple inputs
  // For this MVP step, let's handle them as individual inputs 'zeny_rank_1', 'zeny_rank_2', etc.
  
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
  revalidatePath('/') // Revalidate home where leaderboard might be displayed
  
  return { success: true, message: "Paramètres mis à jour !" }
}

