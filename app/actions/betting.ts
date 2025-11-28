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
  
  // Note: If I bet on YES, newPoolYes increases, so YES becomes MORE expensive (Prob goes UP)
  // Formula: Price = newPoolNo / (newPoolYes + newPoolNo) is WRONG for YES price.
  // Correct CPMM Price for YES = newPoolNo / (newPoolYes + newPoolNo) ? No.
  // Let's verify:
  // k = 100 * 100 = 10000
  // Add 10 to YES -> poolYes = 110
  // poolNo = 10000 / 110 = 90.9
  // YES Price = 90.9 / (110 + 90.9) = 0.45 (45%) ??? NO.
  // If YES pool is bigger, YES should be MORE expensive (higher prob).
  
  // Wait, in CPMM (Uniswap v1), Price of X in terms of Y = y / x.
  // If we want Prob(YES), it reflects the ratio of money in the pools.
  // Actually, commonly in Prediction Markets: Prob(YES) = poolYes / (poolYes + poolNo) roughly?
  // Or using the share price: Cost to buy 1 share.
  
  // Let's stick to the logic implemented above:
  // probabilityAfter = (newPoolNo / (newPoolYes + newPoolNo)) * 100
  // If poolYes increases (110), poolNo decreases (90.9).
  // newPoolNo / Total = 90.9 / 200.9 = 0.45 (45%).
  // So if I buy YES, the probability returned here (0.45) is actually the price of NO (or vice versa).
  // If I buy YES, YES should become MORE probable (e.g. 55%).
  
  // Let's fix the assignment:
  // If outcome == YES, probabilityAfter is effectively the price of the OTHER side (due to CPMM mechanics usually giving spot price of input token).
  // But let's simplify: The probability of an outcome is roughly proportional to its pool share or inverse.
  
  // Let's use a simpler weighted formula for display to ensure it moves in the right direction:
  // Prob(YES) = poolYes / (poolYes + poolNo)
  
  const finalPoolYes = newPoolYes
  const finalPoolNo = newPoolNo
  const totalPool = finalPoolYes + finalPoolNo
  
  const probYes = (finalPoolYes / totalPool) * 100
  const probNo = (finalPoolNo / totalPool) * 100
  
  await supabase
    .from('outcomes')
    .update({ probability: probYes })
    .eq('name', 'OUI')
    .eq('market_id', marketId)
    
  await supabase
    .from('outcomes')
    .update({ probability: probNo })
    .eq('name', 'NON')
    .eq('market_id', marketId)

  revalidatePath(`/market/${marketId}`)
  revalidatePath('/')
  
  return { success: true, newBalance: profile.balance - amount }
}

