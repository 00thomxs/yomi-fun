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

  // --- MOCK MODE (Temporaire) ---
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  console.log('--- MOCK CREATE MARKET ---')
  console.log({ question, category, description, imageUrl, closesAt, outcomes })
  
  // En mode mock, on ne fait rien de plus pour l'instant
  // Dans la vraie vie, on insérerait dans Supabase ici :
  /*
  const supabase = await createClient()
  
  // 1. Insert Market
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .insert({
      question,
      category,
      description,
      image_url: imageUrl,
      closes_at: closesAt,
      status: 'open',
      type: outcomes.length > 2 ? 'multi' : 'binary'
    })
    .select()
    .single()

  if (marketError) return { error: marketError.message }

  // 2. Insert Outcomes
  const outcomesData = outcomes.map((o: any) => ({
    market_id: market.id,
    name: o.name,
    color: o.color,
    probability: 100 / outcomes.length // Start equal
  }))

  const { error: outcomesError } = await supabase
    .from('outcomes')
    .insert(outcomesData)

  if (outcomesError) return { error: outcomesError.message }
  */

  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: 'Marché créé avec succès (Simulation)' }
}

