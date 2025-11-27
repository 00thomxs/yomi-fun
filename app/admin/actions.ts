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
      volume: 0
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
