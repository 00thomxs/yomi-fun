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
  if (amount < 100) return { error: "Mise minimum: 100 Zeny" }
  if (amount > 100000000) return { error: "Mise maximum: 100,000,000 Zeny" }

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
    .select('pool_yes, pool_no, volume, status, is_live, type, initial_liquidity')
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

  // 2.5 Check if already bet - REMOVED for Multi-Bet support
  // Users can now place multiple bets on the same market.

  // --- 3. CORE LOGIC ---
  const poolYes = Number(market.pool_yes) || 100
  const poolNo = Number(market.pool_no) || 100
  let newPoolYes = poolYes
  let newPoolNo = poolNo

  let odds = 0
  let potentialPayout = 0
  const feeRate = 0.05 // Fee increased to 5%
  const fee = Math.round(amount * feeRate)
  const investment = amount - fee

  // --- 3.0 ANTI-FAILLE: Dynamic max bet vs liquidity/seed ---
  // Prevent a single bet from moving the market too much.
  // Rule of thumb: max investment ~= 10% of reference liquidity.
  // Slightly more permissive for "fun" while still preventing single-bet nukes.
  // - Binary markets: 15% of pool total
  // - Multi markets: 20% of seed/reference liquidity
  const MAX_INVEST_FRACTION = market.type === 'binary' ? 0.15 : 0.20
  const poolTotal = poolYes + poolNo
  const seed = Number((market as any).initial_liquidity) || 10000
  const referenceLiquidity = market.type === 'binary' ? poolTotal : Math.max(seed, poolTotal)
  const maxInvestmentAllowed = Math.floor(referenceLiquidity * MAX_INVEST_FRACTION)
  const maxAmountAllowed = Math.max(
    100,
    Math.floor(maxInvestmentAllowed / Math.max(0.0001, (1 - feeRate)))
  )

  if (amount > maxAmountAllowed) {
    return {
      error: `Mise trop élevée pour la liquidité actuelle. Max pour cet event: ${maxAmountAllowed.toLocaleString('fr-FR')} Zeny.`
    }
  }

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
     // Multi Market Dynamic Odds Logic (A+)
     // - Volatility is now driven by the market seed (initial_liquidity) instead of a hardcoded constant
     // - We renormalize ALL outcomes so total always stays at 100%
     //
     // Why: previously we only changed the selected outcome probability without adjusting others,
     // which makes the system drift and can feel buggy over time.

     const marketSeed = Number((market as any).initial_liquidity) || 10000
     // Keep same "feel" as old LIQUIDITY_FACTOR=50000 when seed=10000
     // Lower multiplier => more volatility for the same bet size.
     // (Was 5, now 2.5 for "fun" early-stage markets)
     const MULTI_LIQUIDITY_MULTIPLIER = 2.5
     const liquidityFactor = Math.max(1000, marketSeed * MULTI_LIQUIDITY_MULTIPLIER)

     // Use investment (amount - fee) for economics consistency
     const probChange = (investment / liquidityFactor) * 100 // percentage points

     const otherOutcomes = marketOutcomes.filter(o => o.id !== selectedOutcome.id)
     const minOther = 1
     const maxSelected = Math.max(1, 100 - otherOutcomes.length * minOther)

     let newSelectedProb = selectedOutcome.probability + (direction === 'YES' ? probChange : -probChange)
     newSelectedProb = Math.round(Math.max(1, Math.min(maxSelected, newSelectedProb)))

     const remaining = 100 - newSelectedProb
     const remainingAfterMin = remaining - otherOutcomes.length * minOther
     // remainingAfterMin should be >= 0 due to maxSelected clamp

     const sumOthersCurrent = otherOutcomes.reduce((sum, o) => sum + (Number(o.probability) || 0), 0)
     const weights = otherOutcomes.map(o =>
       sumOthersCurrent > 0 ? (Number(o.probability) || 0) / sumOthersCurrent : 1 / Math.max(1, otherOutcomes.length)
     )

     const rawExtras = weights.map(w => w * Math.max(0, remainingAfterMin))
     const floorExtras = rawExtras.map(v => Math.floor(v))
     let distributed = floorExtras.reduce((sum, v) => sum + v, 0)
     let leftover = Math.max(0, remainingAfterMin - distributed)

     const fracOrder = rawExtras
       .map((v, i) => ({ i, frac: v - floorExtras[i] }))
       .sort((a, b) => b.frac - a.frac)

     const extras = [...floorExtras]
     for (let k = 0; k < leftover; k++) {
       // If all fracs are equal, just round-robin
       extras[fracOrder[k % Math.max(1, fracOrder.length)].i] += 1
     }

     const newProbsById: Record<string, number> = {
       [selectedOutcome.id]: newSelectedProb,
     }
     otherOutcomes.forEach((o, idx) => {
       newProbsById[o.id] = minOther + (extras[idx] || 0)
     })

     // Safety: ensure we really sum to 100
     const sumCheck =
       newProbsById[selectedOutcome.id] +
       otherOutcomes.reduce((sum, o) => sum + (newProbsById[o.id] || 0), 0)
     if (sumCheck !== 100) {
       // Adjust last outcome to fix any off-by-one due to rounding
       const last = otherOutcomes[otherOutcomes.length - 1]
       if (last) {
         newProbsById[last.id] = Math.max(minOther, (newProbsById[last.id] || minOther) + (100 - sumCheck))
       }
     }

     // Update ALL outcomes probabilities
     await Promise.all(
       Object.entries(newProbsById).map(([outcomeId, prob]) =>
         supabase.from('outcomes').update({ probability: prob }).eq('id', outcomeId)
       )
     )

     // HISTORY: Insert price history for Multi (for ALL outcomes, like binary)
     // Keep indexing consistent (sorted by name)
     const sortedOutcomes = [...marketOutcomes].sort((a, b) => a.name.localeCompare(b.name))
     const historyRows = sortedOutcomes.map((o, index) => ({
       market_id: marketId,
       outcome_index: index,
       probability: (newProbsById[o.id] ?? o.probability) / 100, // Stored as decimal 0-1
     }))
     await supabaseAdmin.from('market_prices_history').insert(historyRows)

     // Track direction liquidity for admin monitoring (does NOT affect multi pricing logic)
     // This makes pool_yes / pool_no evolve over time so admins can spot "OUI vs NON" directional imbalance.
     if (direction === 'YES') {
       newPoolYes = poolYes + investment
     } else {
       newPoolNo = poolNo + investment
     }
     updateData = { ...updateData, pool_yes: newPoolYes, pool_no: newPoolNo }
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
  // Store probability and balance for special badges (DIEU, RISK TAKER, ALL IN)
  const probabilityAtBet = direction === 'YES' ? safeProb : (1 - safeProb)
  
  const { error: betError } = await supabase
    .from('bets')
    .insert({
      user_id: user.id,
      market_id: marketId,
      outcome_id: selectedOutcome.id,
      amount: amount,
      fee_paid: fee,
      fee_rate: feeRate,
      potential_payout: potentialPayout,
      odds_at_bet: currentOdds,
      status: 'pending',
      direction: direction, // 'YES' or 'NO'
      probability_at_bet: probabilityAtBet, // For DIEU, RISK TAKER badges
      user_balance_before: profile.balance // For ALL IN badge
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
  
  if (!user) return []

  // Use admin client to bypass RLS issues
  const { data: bets } = await supabaseAdmin
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

  return bets || []
}

