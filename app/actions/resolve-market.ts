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
  const { error: marketError } = await supabase
    .from('markets')
    .update({
      isLive: false, // Update the frontend flag
      status: 'resolved', // Assuming this column exists as per spec
      winner_outcome_id: winningOutcomeId
    })
    .eq('id', marketId)

  if (marketError) return { error: `Erreur mise à jour marché: ${marketError.message}` }

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
    if (bet.outcome_id === winningOutcomeId) {
      // WINNER
      const payout = bet.potential_payout // Calculated at bet time

      // A. Update User Balance
      // We fetch current balance first to be safe, or use atomic increment
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: bet.user_id,
        amount: payout
      })

      // Fallback if RPC doesn't exist (though highly recommended to create it)
      if (balanceError) {
        // Try manual update (less safe for concurrency)
        const { data: userProfile } = await supabase.from('profiles').select('balance').eq('id', bet.user_id).single()
        if (userProfile) {
          await supabase.from('profiles').update({
            balance: userProfile.balance + payout
          }).eq('id', bet.user_id)
        }
      }

      // B. Update Bet Status
      await supabase.from('bets').update({ status: 'won' }).eq('id', bet.id)
      
      payoutsCount++
      totalPaid += payout

    } else {
      // LOSER
      await supabase.from('bets').update({ status: 'lost' }).eq('id', bet.id)
    }
  }

  revalidatePath(`/market/${marketId}`)
  revalidatePath('/admin')

  return { success: true, payoutsCount, totalPaid }
}

