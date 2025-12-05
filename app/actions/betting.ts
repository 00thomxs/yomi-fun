'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Init Admin Client for Price History insertion (bypassing RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // Handle outcome selection and direction (YES/NO)
  let direction: 'YES' | 'NO' = 'YES';
  let selectedOutcome;

  if (market.type === 'binary') {
    // Binary logic: Always bet FOR (YES) the chosen outcome
    direction = 'YES';
    
    if (outcomeName === 'NO' || outcomeName === 'NON') {
      selectedOutcome = marketOutcomes.find(o => o.name === 'NON');
    } else {
      selectedOutcome = marketOutcomes.find(o => o.name === 'OUI');
    }
  } else {
    // Multi logic
    // Input format expected: "OUI [Name]" or "NON [Name]"
    // If just "[Name]", assume YES.
    
    let cleanName = outcomeName;
    
    if (outcomeName.startsWith('NON ')) {
      direction = 'NO';
      cleanName = outcomeName.substring(4); // Remove "NON "
    } else if (outcomeName.startsWith('OUI ')) {
      direction = 'YES';
      cleanName = outcomeName.substring(4); // Remove "OUI "
    }
    
    selectedOutcome = marketOutcomes.find(o => o.name === cleanName);
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
  const poolYes = Number(market.pool_yes) || 100
  const poolNo = Number(market.pool_no) || 100
  let newPoolYes = poolYes
  let newPoolNo = poolNo

  let odds = 0
  let potentialPayout = 0
  const fee = amount * 0.02
  const investment = amount - fee

  // Simplified Odds for all types: 1 / Probability
  // Use current probability from DB
  const probability = selectedOutcome.probability / 100
  const safeProb = Math.max(0.01, Math.min(0.99, probability)) // Clamp 1%-99%
  
  if (direction === 'YES') {
    odds = 1 / safeProb
    
    // Update pools for binary markets only
    if (market.type === 'binary') {
      if (selectedOutcome.name === 'NON') {
        newPoolNo = poolNo + investment
      } else {
        newPoolYes = poolYes + investment
      }
    }
  } else {
    // Betting NO -> Odds = 1 / (1 - Prob)
    const probNo = 1 - safeProb
    odds = 1 / Math.max(0.01, probNo)
  }

  if (odds > 100) odds = 100
  if (odds < 1.01) odds = 1.01
  
  potentialPayout = Math.round(investment * odds) // Ensure integer
  const currentOdds = Math.round(odds * 100) / 100 // Keep 2 decimals for odds display only

  console.log(`[BET_CALC] Choice: ${selectedOutcome.name} (${direction}), Prob: ${selectedOutcome.probability}%, Odds: ${currentOdds}, Payout: ${potentialPayout}`)

  // 4. TRANSACTION
  
  // A. Debit User & Update Stats (XP, Total Bets)
  const XP_PER_BET = 10
  const newXp = (profile.xp || 0) + XP_PER_BET
  const newLevel = Math.floor(newXp / 1000) + 1
  
  // Note: PnL (total_won) is NOT updated here anymore. It's updated at resolution.

  const { error: debitError } = await supabase
    .from('profiles')
    .update({ 
      balance: profile.balance - amount, 
      total_bets: (profile.total_bets || 0) + 1,
      xp: newXp,
      level: newLevel
    })
    .eq('id', user.id)

  if (debitError) return { error: "Erreur lors du débit." }

  // B. Update Market Volume & Pools
  let updateData: any = { volume: (market.volume || 0) + amount }
  
  if (market.type === 'binary') {
     // Update pools using values calculated in CORE LOGIC
     updateData = { ...updateData, pool_yes: newPoolYes, pool_no: newPoolNo }
     
     // Update Probs (ensure integers)
     const total = newPoolYes + newPoolNo
     const probYes = Math.round((newPoolYes / total) * 100)
     const probNo = Math.round((newPoolNo / total) * 100)
     
     await supabase.from('outcomes').update({ probability: probYes }).eq('name', 'OUI').eq('market_id', marketId)
     await supabase.from('outcomes').update({ probability: probNo }).eq('name', 'NON').eq('market_id', marketId)

     // HISTORY: Insert price history for Binary
     // 0 = NON, 1 = OUI
     await supabaseAdmin.from('market_prices_history').insert([
       { market_id: marketId, outcome_index: 1, probability: probYes / 100 }, // OUI (stored as decimal 0-1)
       { market_id: marketId, outcome_index: 0, probability: probNo / 100 }   // NON (stored as decimal 0-1)
     ])

  } else {
     // Multi Market Dynamic Odds Logic (Simplified)
     // Increase probability of the chosen outcome based on bet amount relative to "virtual liquidity"
     const LIQUIDITY_FACTOR = 50000; // Adjust to control volatility
     const probChange = (amount / LIQUIDITY_FACTOR) * 100; // Convert to percentage points
     
     let newProb = selectedOutcome.probability;
     
     if (direction === 'YES') {
        newProb += probChange;
     } else {
        newProb -= probChange;
     }
     
     // Cap between 1% and 99% (ensure integer)
     newProb = Math.round(Math.max(1, Math.min(99, newProb)));
     
     await supabase.from('outcomes').update({ probability: newProb }).eq('id', selectedOutcome.id)

     // HISTORY: Insert price history for Multi
     // Find index based on sorted list to keep consistency
     const sortedOutcomes = [...marketOutcomes].sort((a, b) => a.name.localeCompare(b.name))
     const outcomeIndex = sortedOutcomes.findIndex(o => o.id === selectedOutcome.id)
     
     if (outcomeIndex !== -1) {
        await supabaseAdmin.from('market_prices_history').insert({
          market_id: marketId,
          outcome_index: outcomeIndex,
          probability: newProb / 100 // Stored as decimal 0-1
        })
     }
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
      status: 'pending',
      direction: direction // 'YES' or 'NO'
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

export async function getUserMarketBets(marketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  // Use admin client to bypass RLS issues
  const { data: bets, error } = await supabaseAdmin
    .from('bets')
    .select(`
      id,
      created_at,
      amount,
      potential_payout,
      outcome_id,
      outcomes (name)
    `)
    .eq('user_id', user.id)
    .eq('market_id', marketId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getUserMarketBets] Error:', error.message)
  }

  return bets || []
}

