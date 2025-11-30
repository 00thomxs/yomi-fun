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
  outcomeName: string,
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
    .select('pool_yes, pool_no, volume, status, is_live, type')
    .eq('id', marketId)
    .single()

  if (marketError || !market) return { error: "Marché introuvable." }
  
  // 2.1 Check if market is still open
  if (market.status !== 'open' || !market.is_live) {
    return { error: "Ce marché est fermé aux paris." }
  }

  // 2.2 Fetch outcomes
  const { data: marketOutcomes } = await supabase
    .from('outcomes')
    .select('id, name, probability')
    .eq('market_id', marketId)

  if (!marketOutcomes || marketOutcomes.length === 0) {
    return { error: "Outcomes introuvables." }
  }

  // Handle outcome selection (Binary vs Multi)
  let selectedOutcome;
  if (market.type === 'binary') {
    // Binary logic: input is 'YES' or 'NO' mapping to 'OUI' or 'NON' outcome
    const targetName = outcomeName === 'YES' ? 'OUI' : 'NON'
    selectedOutcome = marketOutcomes.find(o => o.name === targetName)
  } else {
    // Multi logic: input is the outcome name directly
    // Note: The frontend might send "OUI [Name]" or just "[Name]". 
    // Let's assume exact name match for now, or cleanup.
    // Actually frontend sends "OUI [Name]" for multi logic in MarketDetailView.
    // Let's fix frontend to send just the outcome name or handle it here.
    // For now, let's look for exact match
    selectedOutcome = marketOutcomes.find(o => o.name === outcomeName)
    
    // Fallback: try to partial match if frontend sends "OUI Name"
    if (!selectedOutcome) {
        const cleanName = outcomeName.replace('OUI ', '').replace('NON ', '')
        selectedOutcome = marketOutcomes.find(o => o.name === cleanName)
    }
  }
  
  if (!selectedOutcome) {
    return { error: `Choix invalide: ${outcomeName}` }
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

  // --- 3. CORE LOGIC ---
  let odds = 0
  let potentialPayout = 0
  const fee = amount * 0.02
  const investment = amount - fee

  // Simplified Odds for all types: 1 / Probability
  // Use current probability from DB
  const probability = selectedOutcome.probability / 100
  const safeProb = Math.max(0.01, Math.min(0.99, probability)) // Clamp 1%-99%
  
  odds = 1 / safeProb
  if (odds > 100) odds = 100
  if (odds < 1.01) odds = 1.01
  
  potentialPayout = investment * odds
  const currentOdds = odds

  console.log(`[BET_CALC] Choice: ${selectedOutcome.name}, Prob: ${selectedOutcome.probability}%, Odds: ${odds}, Payout: ${potentialPayout}`)

  // 4. TRANSACTION
  
  // A. Debit User & Update Stats (XP, Total Bets, PnL)
  const XP_PER_BET = 10
  const newXp = (profile.xp || 0) + XP_PER_BET
  const newLevel = Math.floor(newXp / 1000) + 1
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

  // B. Update Market Volume
  // Note: For Multi markets, we don't update pools/probs dynamically yet (MVP limitation)
  // For Binary, we could keep the pool logic, but let's unify for simplicity first.
  // Or keep binary pool logic if it works well? Yes, let's keep binary specific logic if possible.
  
  let updateData: any = { volume: (market.volume || 0) + amount }
  
  if (market.type === 'binary') {
     // ... (Keep existing pool logic for binary if needed, but simplified here to avoid regression)
     // Actually, the pool logic was calculating new probs.
     // If we remove it, probs won't move.
     // Let's re-add simplified pool logic ONLY for binary
     const poolYes = Number(market.pool_yes) || 100
     const poolNo = Number(market.pool_no) || 100
     let newPoolYes = poolYes
     let newPoolNo = poolNo
     
     if (selectedOutcome.name === 'OUI') newPoolYes += investment
     else newPoolNo += investment
     
     updateData = { ...updateData, pool_yes: newPoolYes, pool_no: newPoolNo }
     
     // Update Probs
     const total = newPoolYes + newPoolNo
     const probYes = (newPoolYes / total) * 100
     const probNo = (newPoolNo / total) * 100
     
     await supabase.from('outcomes').update({ probability: probYes }).eq('name', 'OUI').eq('market_id', marketId)
     await supabase.from('outcomes').update({ probability: probNo }).eq('name', 'NON').eq('market_id', marketId)
  }

  const { error: updateError } = await supabase
    .from('markets')
    .update(updateData)
    .eq('id', marketId)

  if (updateError) {
    // Rollback
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
    // Rollback hard
    await supabase.from('profiles').update({ balance: profile.balance }).eq('id', user.id)
    return { error: `Erreur création pari: ${betError.message}` }
  }

  revalidatePath(`/market/${marketId}`)
  revalidatePath('/')
  
  return { success: true, newBalance: profile.balance - amount }
}

