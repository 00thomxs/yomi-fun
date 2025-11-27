'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateMarketState = {
  message?: string
  error?: string
  success?: boolean
}

export async function createMarket(formData: FormData): Promise<CreateMarketState> {
  const question = formData.get('question') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string
  const closesAt = formData.get('closesAt') as string
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
      type: outcomes.length > 2 ? 'multi' : 'binary',
      is_live: true, // Default to live for now
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
    probability: 100 / outcomes.length, // Start equal
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
