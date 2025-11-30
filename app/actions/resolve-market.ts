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
    .select('id, user_id, outcome_id, amount, potential_payout, status, direction')
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
  for (const bet of bets) {
    console.log(`[RESOLVE] Processing bet ${bet.id}, outcome_id: ${bet.outcome_id}, direction: ${bet.direction}, winning: ${winningOutcomeId}`)
    
    // Determine if bet is a winner
    let isWinner = false
    
    if (bet.direction === 'NO') {
      // Bet AGAINST an outcome: Wins if that outcome is NOT the winner
      isWinner = bet.outcome_id !== winningOutcomeId
    } else {
      // Bet FOR an outcome (Default 'YES'): Wins if that outcome IS the winner
      isWinner = bet.outcome_id === winningOutcomeId
    }
    
    if (isWinner) {
      // WINNER
      const payout = bet.potential_payout // Calculated at bet time
      console.log(`[RESOLVE] Bet ${bet.id} is a WINNER, payout: ${payout}`)

      // A. Update User Balance, Stats, XP and Level using secure RPC
      const XP_PER_WIN = 50
      
      const { error: rpcError } = await supabase.rpc('update_winner_stats', {
        p_user_id: bet.user_id,
        p_payout: Math.floor(payout), // Ensure integer
        p_xp_gain: XP_PER_WIN
      })

      if (rpcError) {
        console.error(`[RESOLVE_ERROR] RPC update_winner_stats failed for user ${bet.user_id}:`, rpcError)
        // Fallback: try basic increment if stats update fails
        await supabase.rpc('increment_balance', {
          user_id: bet.user_id,
          amount: payout
        })
      } else {
        console.log(`[RESOLVE] User ${bet.user_id} stats updated via RPC`)
      }

      // B. Update Bet Status
      const { error: betUpdateError } = await supabase.from('bets').update({ status: 'won' }).eq('id', bet.id)
      if (betUpdateError) {
        console.error(`[RESOLVE_ERROR] Bet status update to 'won' failed:`, betUpdateError)
      }
      
      payoutsCount++
      totalPaid += payout

    } else {
      // LOSER
      // Update stats via RPC (Reset streak, recalculate Win Rate)
      const { error: rpcError } = await supabase.rpc('update_loser_stats', {
        p_user_id: bet.user_id
      })
      
      if (rpcError) {
        console.error(`[RESOLVE_ERROR] RPC update_loser_stats failed for user ${bet.user_id}:`, rpcError)
      }

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

export async function resolveMarketMulti(
  marketId: string,
  results: { outcomeId: string; isWinner: boolean }[]
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
    return { error: "Accès refusé" }
  }

  // 2. Update Outcomes (Set is_winner)
  // Doing this in a loop or Promise.all
  // Note: is_winner column MUST exist in outcomes table
  for (const res of results) {
    await supabase
      .from('outcomes')
      .update({ is_winner: res.isWinner })
      .eq('id', res.outcomeId)
  }

  // 3. Update Market Status
  await supabase
    .from('markets')
    .update({
      is_live: false,
      status: 'resolved',
      // winner_outcome_id: null // Not used anymore in multi logic
    })
    .eq('id', marketId)

  // 4. Fetch Bets
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('id, user_id, outcome_id, amount, potential_payout, status, direction')
    .eq('market_id', marketId)
    .eq('status', 'pending')

  if (betsError || !bets) {
    return { error: "Erreur récupération paris" }
  }

  let payoutsCount = 0
  let totalPaid = 0

  // 5. Process Payouts
  // Convert results array to Map for fast lookup
  const resultMap = new Map(results.map(r => [r.outcomeId, r.isWinner]))

  for (const bet of bets) {
    const isOutcomeWinner = resultMap.get(bet.outcome_id)
    
    // Should not happen if all outcomes covered, but safe check
    if (isOutcomeWinner === undefined) continue;

    let isBetWinner = false
    
    if (bet.direction === 'NO') {
      // Bet AGAINST: Win if outcome is NOT winner
      isBetWinner = !isOutcomeWinner
    } else {
      // Bet FOR (default YES): Win if outcome IS winner
      isBetWinner = isOutcomeWinner
    }

    if (isBetWinner) {
      // WINNER
      const payout = bet.potential_payout
      
      const XP_PER_WIN = 50
      const { error: rpcError } = await supabase.rpc('update_winner_stats', {
        p_user_id: bet.user_id,
        p_payout: Math.floor(payout),
        p_xp_gain: XP_PER_WIN
      })

      if (rpcError) {
        console.error(`[RESOLVE_MULTI] RPC update_winner_stats failed for user ${bet.user_id}:`, rpcError)
        await supabase.rpc('increment_balance', {
          user_id: bet.user_id,
          amount: payout
        })
      }

      await supabase.from('bets').update({ status: 'won' }).eq('id', bet.id)
      
      payoutsCount++
      totalPaid += payout

    } else {
      // LOSER
      const { error: rpcError } = await supabase.rpc('update_loser_stats', {
        p_user_id: bet.user_id
      })
      
      if (rpcError) console.error(`[RESOLVE_MULTI] RPC update_loser_stats failed:`, rpcError)

      await supabase.from('bets').update({ status: 'lost' }).eq('id', bet.id)
    }
  }

  revalidatePath(`/market/${marketId}`)
  revalidatePath('/admin')

  return { success: true, payoutsCount, totalPaid }
}

