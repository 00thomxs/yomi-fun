'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ResolutionResult = {
  success?: boolean
  error?: string
  payoutsCount?: number
  totalPaid?: number
}

export async function resolveMarket(
  marketId: string,
  winningOutcomeId: string
): Promise<ResolutionResult> {
  const supabase = await createClient()

  // 1. Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: "Accès refusé (Admin uniquement)" }
  }

  // 2. Update Market Status
  // We mark it resolved and set the winner
  // Note: Column is 'is_live' in DB (snake_case), not 'isLive'
  console.log(`[RESOLVE] Attempting to update market ${marketId} to resolved`)
  
  const { data: updatedMarket, error: marketError } = await supabase
    .from('markets')
    .update({
      is_live: false, // Column name in DB is snake_case
      status: 'resolved',
      winner_outcome_id: winningOutcomeId
    })
    .eq('id', marketId)
    .select()
    .single()

  if (marketError) {
    console.error(`[RESOLVE_ERROR] Market update failed:`, marketError)
    return { error: `Erreur mise à jour marché: ${marketError.message}` }
  }
  
  console.log(`[RESOLVE] Market updated successfully:`, updatedMarket)

  // 3. Fetch all pending bets for this market
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('id, user_id, outcome_id, amount, potential_payout, status')
    .eq('market_id', marketId)
    .eq('status', 'pending')

  if (betsError) return { error: `Erreur récupération paris: ${betsError.message}` }

  if (!bets || bets.length === 0) {
    return { success: true, payoutsCount: 0, totalPaid: 0 }
  }

  let payoutsCount = 0
  let totalPaid = 0
  const errors = []

  // 4. Process Payouts
  // Note: In production, this should be a single SQL Transaction or Postgres Function
  // to ensure atomicity. Doing it in a loop is risky if the server crashes halfway.
  // But for MVP/Next.js Action context, we'll do it sequentially or batched.

  for (const bet of bets) {
    console.log(`[RESOLVE] Processing bet ${bet.id}, outcome_id: ${bet.outcome_id}, winning: ${winningOutcomeId}`)
    
    if (bet.outcome_id === winningOutcomeId) {
      // WINNER
      const payout = bet.potential_payout // Calculated at bet time
      console.log(`[RESOLVE] Bet ${bet.id} is a WINNER, payout: ${payout}`)

      // A. Update User Balance, Stats, XP and Level
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('balance, total_won, bets_won, total_bets, xp, level')
        .eq('id', bet.user_id)
        .single()
      
      if (userProfile) {
        // total_won = Total Amount Won (Zeny)
        // bets_won = Total Number of Wins
        const newTotalWonAmount = (userProfile.total_won || 0) + payout
        const newBetsWonCount = (userProfile.bets_won || 0) + 1
        
        // XP & Level Calculation
        // +50 XP for winning a bet
        const XP_PER_WIN = 50
        const newXp = (userProfile.xp || 0) + XP_PER_WIN
        // Simple level formula: 1 level every 1000 XP
        const newLevel = Math.floor(newXp / 1000) + 1
        
        // Win Rate = (Wins / Total Bets) * 100
        // Note: total_bets was already incremented when placing the bet
        const currentTotalBets = Math.max(userProfile.total_bets, 1)
        const newWinRate = Math.round((newBetsWonCount / currentTotalBets) * 100)
        
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            balance: userProfile.balance + payout,
            total_won: newTotalWonAmount,
            bets_won: newBetsWonCount,
            win_rate: Math.min(newWinRate, 100),
            xp: newXp,
            level: newLevel
          })
          .eq('id', bet.user_id)
        
        if (profileUpdateError) {
          console.error(`[RESOLVE_ERROR] Profile update failed for user ${bet.user_id}:`, profileUpdateError)
          // Fallback: try to credit balance only if stats update fails
          await supabase.rpc('increment_balance', {
            user_id: bet.user_id,
            amount: payout
          })
        } else {
          console.log(`[RESOLVE] User ${bet.user_id} credited +${payout}, XP +${XP_PER_WIN}, new balance: ${userProfile.balance + payout}`)
        }
      }

      // B. Update Bet Status
      const { error: betUpdateError } = await supabase.from('bets').update({ status: 'won' }).eq('id', bet.id)
      if (betUpdateError) {
        console.error(`[RESOLVE_ERROR] Bet status update to 'won' failed:`, betUpdateError)
      } else {
        console.log(`[RESOLVE] Bet ${bet.id} status updated to 'won'`)
      }
      
      payoutsCount++
      totalPaid += payout

    } else {
      // LOSER
      const { error: betUpdateError } = await supabase.from('bets').update({ status: 'lost' }).eq('id', bet.id)
      if (betUpdateError) {
        console.error(`[RESOLVE_ERROR] Bet status update to 'lost' failed:`, betUpdateError)
      } else {
        console.log(`[RESOLVE] Bet ${bet.id} status updated to 'lost'`)
      }
    }
  }

  revalidatePath(`/market/${marketId}`)
  revalidatePath('/admin')

  return { success: true, payoutsCount, totalPaid }
}

