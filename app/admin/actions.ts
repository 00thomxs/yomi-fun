'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  const supabase = await createClient()
  
  // Calculate initial pools based on probability (for binary markets)
  // Total liquidity = 1000 (can be adjusted)
  const INITIAL_LIQUIDITY = 1000
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
      pool_no: poolNo
    })
    .select()
    .single()

  if (marketError) {
    console.error('Market creation error:', marketError)
    return { error: `Erreur création marché: ${marketError.message}` }
  }

  // 2. Insert Outcomes
  const outcomesData = outcomes.map((o: any) => ({
    market_id: market.id,
    name: o.name,
    color: o.color,
    probability: parseFloat(o.probability),
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

  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: 'Marché créé avec succès !' }
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

  revalidatePath('/', 'layout') // Clear full cache
  return { success: true }
}
