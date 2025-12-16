'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type CreateMarketState = {
  message?: string
  error?: string
  success?: boolean
}

export type AdminMarketTopBet = {
  id: string
  created_at: string
  amount: number
  status: string
  direction: 'YES' | 'NO'
  odds_at_bet: number
  potential_payout: number
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
  outcome: {
    id: string
    name: string
  }
}

export async function getAdminMarketTopBets(marketId: string): Promise<{ error?: string; topBets?: AdminMarketTopBet[]; totalBets?: number }> {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // Total count (exact)
  const { count: totalBets, error: countError } = await supabaseAdmin
    .from('bets')
    .select('id', { count: 'exact', head: true })
    .eq('market_id', marketId)

  if (countError) {
    return { error: `Erreur count: ${countError.message}` }
  }

  // Top 10 biggest bets (per bet)
  const { data, error } = await supabaseAdmin
    .from('bets')
    .select(`
      id,
      created_at,
      amount,
      status,
      direction,
      odds_at_bet,
      potential_payout,
      profiles:profiles!bets_user_id_fkey (
        id,
        username,
        avatar_url
      ),
      outcomes:outcomes!bets_outcome_id_fkey (
        id,
        name
      )
    `)
    .eq('market_id', marketId)
    .order('amount', { ascending: false })
    .limit(10)

  if (error) {
    return { error: `Erreur fetch bets: ${error.message}` }
  }

  const topBets: AdminMarketTopBet[] = (data || []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    amount: row.amount,
    status: row.status,
    direction: (row.direction || 'YES') as 'YES' | 'NO',
    odds_at_bet: Number(row.odds_at_bet),
    potential_payout: row.potential_payout,
    user: {
      id: row.profiles?.id,
      username: row.profiles?.username,
      avatar_url: row.profiles?.avatar_url ?? null,
    },
    outcome: {
      id: row.outcomes?.id,
      name: row.outcomes?.name,
    }
  }))

  return { topBets, totalBets: totalBets || 0 }
}

export type MonetaryMetrics = {
  total_supply: number
  total_burned: number
  total_burned_fees: number
  total_burned_shop: number
  weekly_inflation_rate_pct: number | null
  supply_7d_ago: number | null
  last_snapshot_at: string | null
}

export type MonetarySnapshotRow = {
  captured_at: string
  total_supply: number
  total_burned: number
}

export async function getAdminMonetarySnapshots(days: number = 30): Promise<{ error?: string; snapshots?: MonetarySnapshotRow[] }> {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  const sinceIso = new Date(Date.now() - Math.max(1, days) * 24 * 3600 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('monetary_snapshots')
    .select('captured_at, total_supply, total_burned')
    .gte('captured_at', sinceIso)
    .order('captured_at', { ascending: true })

  if (error) return { error: `Erreur snapshots: ${error.message}` }

  return {
    snapshots: (data || []).map((r: any) => ({
      captured_at: r.captured_at,
      total_supply: Number(r.total_supply || 0),
      total_burned: Number(r.total_burned || 0),
    }))
  }
}

export async function getAdminMonetaryMetrics(): Promise<{ error?: string; metrics?: MonetaryMetrics }> {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // Fast aggregate totals via RPC (scales better than fetching all rows)
  // Note: Supabase generated types don't know about this custom RPC yet, so we type it explicitly.
  type MonetaryTotalsRow = {
    total_supply: number
    total_burned_fees: number
    total_burned_shop: number
    total_burned: number
  }

  // IMPORTANT: call RPC with the authenticated client so auth.uid() is available inside the function.
  const { data: totalsData, error: totalsError } = await supabase.rpc('get_monetary_totals')
  if (totalsError) return { error: `Erreur RPC get_monetary_totals: ${totalsError.message}` }

  // RPC returns an array for set-returning functions; we expect exactly 1 row (or 0 if access denied)
  const totals = (Array.isArray(totalsData) ? totalsData[0] : totalsData) as MonetaryTotalsRow | null | undefined
  if (!totals) return { error: "Accès refusé (RPC)" }

  const totalSupply = Number(totals.total_supply || 0)
  const totalFeesBurned = Number(totals.total_burned_fees || 0)
  const totalShopBurned = Number(totals.total_burned_shop || 0)
  const totalBurned = Number(totals.total_burned || 0)

  // 4) Snapshot logic (to compute weekly inflation rate)
  const { data: lastSnap } = await supabaseAdmin
    .from('monetary_snapshots')
    .select('captured_at, total_supply, total_burned')
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastSnapshotAt = lastSnap?.captured_at as string | undefined
  const shouldInsertSnapshot = !lastSnapshotAt || (Date.now() - new Date(lastSnapshotAt).getTime()) > 24 * 3600 * 1000

  if (shouldInsertSnapshot) {
    // Insert a daily snapshot (admin-only via service role)
    await supabaseAdmin
      .from('monetary_snapshots')
      .insert({
        total_supply: totalSupply,
        total_burned: totalBurned,
      })
  }

  // Get supply 7 days ago (closest snapshot <= now-7d)
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: snap7d } = await supabaseAdmin
    .from('monetary_snapshots')
    .select('total_supply, captured_at')
    .lte('captured_at', sevenDaysAgoIso)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const supply7dAgo = (snap7d?.total_supply ?? null) as number | null
  const weeklyInflationRatePct =
    supply7dAgo && supply7dAgo > 0
      ? ((totalSupply - supply7dAgo) / supply7dAgo) * 100
      : null

  return {
    metrics: {
      total_supply: totalSupply,
      total_burned: totalBurned,
      total_burned_fees: totalFeesBurned,
      total_burned_shop: totalShopBurned,
      weekly_inflation_rate_pct: weeklyInflationRatePct,
      supply_7d_ago: supply7dAgo,
      last_snapshot_at: lastSnapshotAt || null,
    }
  }
}

export async function createMarket(formData: FormData): Promise<CreateMarketState> {
  const type = formData.get('type') as 'binary' | 'multi'
  const question = formData.get('question') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string
  const closesAt = formData.get('closesAt') as string
  const isFeatured = formData.get('isFeatured') === 'on'
  const isHeadline = formData.get('isHeadline') === 'on'
  const outcomes = JSON.parse(formData.get('outcomes') as string)

  // New fields: Season and Initial Liquidity
  const seasonId = formData.get('seasonId') as string || null
  const initialLiquidityStr = formData.get('initialLiquidity') as string
  const INITIAL_LIQUIDITY = initialLiquidityStr ? parseInt(initialLiquidityStr) : 10000

  const supabase = await createClient()
  
  // Calculate initial pools based on probability (for binary markets)
  let poolYes = INITIAL_LIQUIDITY / 2
  let poolNo = INITIAL_LIQUIDITY / 2
  
  if (type === 'binary' && outcomes.length >= 2) {
    // Find OUI outcome probability
    const ouiOutcome = outcomes.find((o: any) => o.name === 'OUI')
    if (ouiOutcome) {
      const probYes = parseFloat(ouiOutcome.probability) / 100
      // Set pools proportional to probability
      // prob = poolYes / (poolYes + poolNo)
      // With total = 1000: poolYes = prob * 1000, poolNo = (1-prob) * 1000
      poolYes = Math.round(probYes * INITIAL_LIQUIDITY)
      poolNo = Math.round((1 - probYes) * INITIAL_LIQUIDITY)
      // Ensure minimum pool values
      if (poolYes < 10) poolYes = 10
      if (poolNo < 10) poolNo = 10
    }
  }

  // 0. If this is a headline, remove headline from all other markets (only ONE headline allowed)
  if (isHeadline) {
    await supabase
      .from('markets')
      .update({ is_headline: false })
      .eq('is_headline', true)
  }

  // 1. Insert Market
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .insert({
      question,
      category,
      description: description || null,
      image_url: imageUrl || null,
      closes_at: closesAt,
      status: 'open',
      type,
      is_live: true,
      is_featured: isFeatured,
      is_headline: isHeadline,
      volume: 0,
      pool_yes: poolYes,
      pool_no: poolNo,
      initial_liquidity: INITIAL_LIQUIDITY,
      season_id: seasonId || null
    })
    .select()
    .single()

  if (marketError) {
    console.error('Market creation error:', marketError)
    return { error: `Erreur création event: ${marketError.message}` }
  }

  // 2. Insert Outcomes (ensure integer probabilities)
  const outcomesData = outcomes.map((o: any) => ({
    market_id: market.id,
    name: o.name,
    color: o.color,
    probability: Math.round(parseFloat(o.probability)),
    is_winner: null
  }))

  const { error: outcomesError } = await supabase
    .from('outcomes')
    .insert(outcomesData)

  if (outcomesError) {
    console.error('Outcomes creation error:', outcomesError)
    // Cleanup: delete market if outcomes fail
    await supabase.from('markets').delete().eq('id', market.id)
    return { error: `Erreur création réponses: ${outcomesError.message}` }
  }

  // 3. Insert Initial Price History
  if (type === 'binary') {
    const oui = outcomesData.find((o: any) => o.name === 'OUI')
    const non = outcomesData.find((o: any) => o.name === 'NON')
    if (oui && non) {
      await supabaseAdmin.from('market_prices_history').insert([
        { market_id: market.id, outcome_index: 1, probability: oui.probability / 100 },
        { market_id: market.id, outcome_index: 0, probability: non.probability / 100 }
      ])
    }
  } else {
    // Multi: Sort by name to match betting.ts logic for consistent indexing
    const sortedOutcomes = [...outcomesData].sort((a: any, b: any) => a.name.localeCompare(b.name))
    
    const historyData = sortedOutcomes.map((o: any, index: number) => ({
      market_id: market.id,
      outcome_index: index,
      probability: o.probability / 100
    }))
    
    await supabaseAdmin.from('market_prices_history').insert(historyData)
  }

  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: 'Event créé avec succès !' }
}

export async function deleteMarket(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const marketId = formData.get('marketId') as string
  const supabase = await createClient()

  const { error } = await supabase
    .from('markets')
    .delete()
    .eq('id', marketId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true }
}

export async function resetPlatform(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // Call the RPC function
  const { error } = await supabase.rpc('reset_platform')

  if (error) {
    console.error("Reset platform error:", error)
    return { error: `Erreur lors de la réinitialisation: ${error.message}` }
  }

  // Clear History Tables & Orders
  // Using neq constraint to match all rows is a Supabase trick for "delete all"
  await supabaseAdmin.from('market_prices_history').delete().neq('market_id', '00000000-0000-0000-0000-000000000000') 
  await supabaseAdmin.from('user_pnl_history').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')
  
  // Reset Orders (purchases) but KEEP Shop Items
  await supabaseAdmin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  revalidatePath('/', 'layout') // Clear full cache
  return { success: true }
}

// =============================================
// CLOSE/BLOCK MARKET MANUALLY
// =============================================
export async function closeMarketManually(marketId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // Check market exists and is currently live
  const { data: market } = await supabase
    .from('markets')
    .select('id, is_live, status')
    .eq('id', marketId)
    .single()

  if (!market) return { error: "Event introuvable" }
  if (!market.is_live) return { error: "Cet event est déjà bloqué" }
  if (market.status !== 'open') return { error: "Cet event n'est pas ouvert" }

  // Close the market (set is_live = false and status = 'closed')
  const { error } = await supabase
    .from('markets')
    .update({ 
      is_live: false, 
      status: 'closed' 
    })
    .eq('id', marketId)

  if (error) {
    console.error("Close market error:", error)
    return { error: `Erreur: ${error.message}` }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

// =============================================
// UPDATE MARKET
// =============================================
export async function updateMarket(formData: FormData): Promise<CreateMarketState> {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  const id = formData.get('id') as string
  const question = formData.get('question') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const imageUrl = formData.get('imageUrl') as string
  const closesAt = formData.get('closesAt') as string | null
  const isFeatured = formData.get('isFeatured') === 'true'
  const isHeadline = formData.get('isHeadline') === 'true'

  // Build update object
  const updateData: Record<string, any> = {
    question,
    description: description || null,
    category,
    image_url: imageUrl || null,
    is_featured: isFeatured,
    is_headline: isHeadline
  }

  // Only update closes_at if provided (not locked by season)
  if (closesAt) {
    updateData.closes_at = closesAt
  }

  // If setting as headline, remove headline from others first
  if (isHeadline) {
    await supabase
      .from('markets')
      .update({ is_headline: false })
      .eq('is_headline', true)
      .neq('id', id)
  }

  const { error } = await supabase
    .from('markets')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Update market error:', error)
    return { error: `Erreur mise à jour: ${error.message}` }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath(`/market/${id}`)
  
  return { success: true, message: 'Event mis à jour avec succès !' }
}

// =============================================
// TOGGLE MARKET VISIBILITY
// =============================================
export async function toggleMarketVisibility(marketId: string): Promise<{ success?: boolean; error?: string; isVisible?: boolean }> {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') return { error: "Accès refusé" }

  // Get current visibility state
  const { data: market } = await supabase
    .from('markets')
    .select('is_visible')
    .eq('id', marketId)
    .single()

  if (!market) return { error: "Event introuvable" }

  const newVisibility = !market.is_visible

  // Update visibility
  const { error } = await supabase
    .from('markets')
    .update({ is_visible: newVisibility })
    .eq('id', marketId)

  if (error) {
    console.error("Toggle visibility error:", error)
    return { error: `Erreur: ${error.message}` }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true, isVisible: newVisibility }
}
