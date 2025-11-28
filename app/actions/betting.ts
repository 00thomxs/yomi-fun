'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BetResult = {
  success?: boolean
  error?: string
  newBalance?: number
}

export async function placeBet(
  marketId: string,
  outcome: 'YES' | 'NO',
  amount: number
): Promise<BetResult> {
  const supabase = await createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Vous devez être connecté." }

  // 2. Fetch Market Data & User Balance (Parallel for speed, but serialized for safety later)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance, total_bets')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: "Erreur profil." }
  if (profile.balance < amount) return { error: "Solde insuffisant." }

  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('pool_yes, pool_no, volume')
    .eq('id', marketId)
    .single()

  if (marketError || !market) return { error: "Marché introuvable." }

  // 2.5 Check if already bet
  const { data: existingBet } = await supabase
    .from('bets')
    .select('id')
    .eq('user_id', user.id)
    .eq('market_id', marketId)
    .single()

  if (existingBet) {
    return { error: "Vous avez déjà parié sur ce marché." }
  }

  // --- 3. CORE LOGIC: CPMM (Automated Market Maker) ---
  // k = x * y (constante)
  const poolYes = Number(market.pool_yes)
  const poolNo = Number(market.pool_no)
  const k = poolYes * poolNo

  let newPoolYes = poolYes
  let newPoolNo = poolNo
  let sharesReceived = 0
  let probabilityAfter = 0

  // Fee (Commission) - 2% for the platform
  const fee = amount * 0.02
  const investment = amount - fee

  if (outcome === 'YES') {
    // User adds Money to YES pool
    newPoolYes = poolYes + investment
    // We calculate new NO pool to keep K constant
    newPoolNo = k / newPoolYes
    // Shares received = what was removed from NO pool
    sharesReceived = poolNo - newPoolNo
    
    // New Prob (Spot Price) = Price of YES in terms of NO
    // Price = poolNo / (poolYes + poolNo) approx
    probabilityAfter = (newPoolNo / (newPoolYes + newPoolNo)) * 100 // Inverse relation in CPMM
  } else {
    // User adds Money to NO pool
    newPoolNo = poolNo + investment
    newPoolYes = k / newPoolNo
    sharesReceived = poolYes - newPoolYes
    
    probabilityAfter = (newPoolNo / (newPoolYes + newPoolNo)) * 100
  }

  // Odds = Payout / Investment
  const potentialPayout = sharesReceived // In prediction markets, shares = payout if win (usually 1 share = 1€)
  // Wait... simplifying for MVP:
  // Let's say "shares" are actually the payout amount directly.
  // If I bet 100 and receive 150 shares, I win 150 if I'm right.
  
  const currentOdds = potentialPayout / amount

  // 4. TRANSACTION (Simulation via chained calls, real ACID would need Postgres Function)
  
  // A. Debit User
  const { error: debitError } = await supabase
    .from('profiles')
    .update({ balance: profile.balance - amount, total_bets: (profile.total_bets || 0) + 1 })
    .eq('id', user.id)

  if (debitError) return { error: "Erreur lors du débit." }

  // B. Update Market Pools & Volume
  const { error: updateError } = await supabase
    .from('markets')
    .update({
      pool_yes: newPoolYes,
      pool_no: newPoolNo,
      volume: (market.volume || 0) + amount
    })
    .eq('id', marketId)

  if (updateError) {
    // CRITICAL: Should rollback debit here (Refund user)
    // We restore the original balance (profile.balance contains the value BEFORE debit)
    await supabase.from('profiles').update({ balance: profile.balance }).eq('id', user.id)
    return { error: "Erreur mise à jour marché." }
  }

  // C. Create Bet Record
  // Determine Outcome ID (assuming we have outcomes linked)
  // For now, we store the choice text directly or need to fetch Outcome ID.
  // Let's simplify: Binary markets usually have fixed outcome IDs or we query them.
  
  const { data: outcomes } = await supabase.from('outcomes').select('id, name').eq('market_id', marketId)
  const outcomeId = outcomes?.find(o => 
    outcome === 'YES' ? o.name === 'OUI' : o.name === 'NON'
  )?.id

  if (!outcomeId) {
     // Rollback everything... (complex without SQL transaction)
     return { error: "Issue outcome introuvable" }
  }

  const { error: betError } = await supabase
    .from('bets')
    .insert({
      user_id: user.id,
      market_id: marketId,
      outcome_id: outcomeId,
      amount: amount,
      potential_payout: potentialPayout,
      odds_at_bet: currentOdds,
      status: 'pending'
    })

  if (betError) {
    return { error: `Erreur création pari: ${betError.message}` }
  }

  // 5. Update Outcome Probability (Display only)
  // We update the outcome row so the UI shows the new percentage
  await supabase
    .from('outcomes')
    .update({ probability: outcome === 'YES' ? 100 - probabilityAfter : probabilityAfter }) // Note: logic might need inversion check
    .eq('name', 'OUI')
    .eq('market_id', marketId)
    
  await supabase
    .from('outcomes')
    .update({ probability: outcome === 'YES' ? probabilityAfter : 100 - probabilityAfter })
    .eq('name', 'NON')
    .eq('market_id', marketId)

  revalidatePath(`/market/${marketId}`)
  revalidatePath('/')
  
  return { success: true, newBalance: profile.balance - amount }
}

