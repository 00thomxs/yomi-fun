'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { 
  checkAndAwardBadges, 
  checkWinStreakBadge, 
  checkVerifiedBadge,
  checkLegacyBadges,
  awardBadge
} from '@/app/actions/badges'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function awardBadgesToExistingUsers(): Promise<{
  success: boolean
  message: string
  details?: string[]
}> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'Non authentifié' }
  }
  
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
    // 1. Get all non-admin users (only need id and username for logging)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .neq('role', 'admin')
    
    if (usersError || !users) {
      return { success: false, message: 'Erreur récupération utilisateurs', details: [usersError?.message || ''] }
    }
    
    details.push(`${users.length} utilisateurs trouvés`)
    
    let totalBadgesAwarded = 0
    
    for (const userProfile of users) {
      const userBadges: string[] = []
      
      // Check stat-based badges (NOOB, SENSEI, TRADER, WHALE, CLOWN)
      const statBadges = await checkAndAwardBadges(userProfile.id)
      userBadges.push(...statBadges)
      
      // Check verified badge
      const verifiedBadges = await checkVerifiedBadge(userProfile.id)
      userBadges.push(...verifiedBadges)
      
      // Check win streak badges
      const streakBadges = await checkWinStreakBadge(userProfile.id)
      userBadges.push(...streakBadges)
      
      // Check legacy badges (G.O.A.T, MVP)
      const legacyBadges = await checkLegacyBadges(userProfile.id)
      userBadges.push(...legacyBadges)
      
      if (userBadges.length > 0) {
        details.push(`@${userProfile.username || userProfile.id.slice(0, 8)}: +${userBadges.join(', ')}`)
        totalBadgesAwarded += userBadges.length
      }
    }
    
    details.push(`---`)
    details.push(`Total: ${totalBadgesAwarded} badges attribués`)
    
    return {
      success: true,
      message: `Attribution terminée !`,
      details
    }
    
  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors de l\'attribution',
      details: [String(error)]
    }
  }
}

/**
 * Award Beta Testeur badge to the first 14 accounts
 */
export async function awardBetaTesterBadges(): Promise<{
  success: boolean
  message: string
  details?: string[]
}> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'Non authentifié' }
  }
  
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
    // Get the first 14 accounts by creation date
    const { data: firstUsers, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, created_at')
      .order('created_at', { ascending: true })
      .limit(14)
    
    if (error || !firstUsers) {
      return { success: false, message: 'Erreur récupération utilisateurs', details: [error?.message || ''] }
    }
    
    details.push(`Les 14 premiers comptes (par date de création):`)
    details.push(`---`)
    
    let awarded = 0
    
    for (let i = 0; i < firstUsers.length; i++) {
      const u = firstUsers[i]
      const result = await awardBadge(u.id, 'beta-tester')
      
      const date = new Date(u.created_at).toLocaleDateString('fr-FR')
      
      if (result.success && result.userBadgeId) {
        details.push(`#${i + 1} @${u.username || u.id.slice(0, 8)} (${date}) ✓ BETA TESTEUR attribué`)
        awarded++
      } else if (result.error?.includes('déjà')) {
        details.push(`#${i + 1} @${u.username || u.id.slice(0, 8)} (${date}) - déjà obtenu`)
      } else {
        details.push(`#${i + 1} @${u.username || u.id.slice(0, 8)} (${date}) ✗ ${result.error}`)
      }
    }
    
    details.push(`---`)
    details.push(`${awarded} nouveaux badges BETA TESTEUR attribués`)
    
    return {
      success: true,
      message: 'Attribution terminée !',
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

