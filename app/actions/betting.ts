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

  // 0. Validate amount
  if (amount < 10) return { error: "Mise minimum: 10 Zeny" }
  if (amount > 100000) return { error: "Mise maximum: 100,000 Zeny" }

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Vous devez être connecté." }

  // 2. Fetch Market Data & User Balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance, total_bets, xp, level, total_won')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: "Erreur profil." }
  if (profile.balance < amount) return { error: "Solde insuffisant." }

  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('pool_yes, pool_no, volume, status, is_live')
    .eq('id', marketId)
    .single()

  if (marketError || !market) return { error: "Marché introuvable." }
  
  // 2.1 Check if market is still open
  if (market.status !== 'open' || !market.is_live) {
    return { error: "Ce marché est fermé aux paris." }
  }

  // 2.2 Fetch outcomes to get the REAL probability
  const { data: marketOutcomes } = await supabase
    .from('outcomes')
    .select('id, name, probability')
    .eq('market_id', marketId)

  if (!marketOutcomes || marketOutcomes.length === 0) {
    return { error: "Outcomes introuvables." }
  }

  const yesOutcome = marketOutcomes.find(o => o.name === 'OUI')
  const noOutcome = marketOutcomes.find(o => o.name === 'NON')
  
  // Get the outcome ID we need
  const selectedOutcome = outcome === 'YES' ? yesOutcome : noOutcome
  if (!selectedOutcome) {
    return { error: "Outcome sélectionné introuvable." }
  }

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

  // --- 3. CORE LOGIC: SIMPLIFIED DYNAMIC ODDS ---
  const poolYes = Number(market.pool_yes) || 100
  const poolNo = Number(market.pool_no) || 100
  
  const probYesBefore = yesOutcome ? yesOutcome.probability / 100 : 0.5
  const probNoBefore = noOutcome ? noOutcome.probability / 100 : 0.5
  
  let odds = 0
  let potentialPayout = 0
  let newPoolYes = poolYes
  let newPoolNo = poolNo
  
  const fee = amount * 0.02 // 2% fee
  const investment = amount - fee

  if (outcome === 'YES') {
    odds = 1 / probYesBefore
    if (odds > 100) odds = 100
    if (odds < 1.01) odds = 1.01
    potentialPayout = investment * odds
    newPoolYes = poolYes + investment
  } else {
    odds = 1 / probNoBefore
    if (odds > 100) odds = 100
    if (odds < 1.01) odds = 1.01
    potentialPayout = investment * odds
    newPoolNo = poolNo + investment
  }
  
  console.log(`[BET_CALC] Outcome: ${outcome}, Prob: ${outcome === 'YES' ? probYesBefore : probNoBefore}, Odds: ${odds}, Payout: ${potentialPayout}`)
  
  const currentOdds = odds

  // 4. TRANSACTION
  
  // A. Debit User & Update Stats (XP, Total Bets, PnL)
  const XP_PER_BET = 10
  const newXp = (profile.xp || 0) + XP_PER_BET
  // Level update
  const newLevel = Math.floor(newXp / 1000) + 1
  
  // Update PnL (total_won tracks net profit)
  // We subtract the wager amount now. If they win, we add the full payout later.
  const newPnL = (profile.total_won || 0) - amount

  const { error: debitError } = await supabase
    .from('profiles')
    .update({ 
      balance: profile.balance - amount, 
      total_bets: (profile.total_bets || 0) + 1,
      total_won: newPnL,
      xp: newXp,
      level: newLevel
    })
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
    // Rollback: restore user balance
    await supabase.from('profiles').update({ balance: profile.balance }).eq('id', user.id)
    return { error: "Erreur mise à jour marché." }
  }

  // C. Create Bet Record
  const { error: betError } = await supabase
    .from('bets')
    .insert({
      user_id: user.id,
      market_id: marketId,
      outcome_id: selectedOutcome.id,
      amount: amount,
      potential_payout: potentialPayout,
      odds_at_bet: currentOdds,
      status: 'pending'
    })

  if (betError) {
    // Rollback: restore user balance and market pools
    await supabase.from('profiles').update({ balance: profile.balance }).eq('id', user.id)
    await supabase.from('markets').update({ pool_yes: poolYes, pool_no: poolNo, volume: market.volume || 0 }).eq('id', marketId)
    return { error: `Erreur création pari: ${betError.message}` }
  }

  // 5. Update Outcome Probability (Display only)
  const totalPool = newPoolYes + newPoolNo
  const probYes = (newPoolYes / totalPool) * 100
  const probNo = (newPoolNo / totalPool) * 100

  console.log(`[BET_UPDATE] Market: ${marketId}, New Pools: YES=${newPoolYes}/NO=${newPoolNo}, Probs: ${probYes}%/${probNo}%`)
  
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

