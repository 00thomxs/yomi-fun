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
