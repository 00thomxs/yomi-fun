'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PurchaseResult = {
  success?: boolean
  error?: string
  newBalance?: number
}

export async function purchaseItem(itemId: string, deliveryInfo: string): Promise<PurchaseResult> {
  const supabase = await createClient()
  
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Vous devez être connecté." }

  // 2. Get Item & User Balance
  const { data: item, error: itemError } = await supabase
    .from('shop_items')
    .select('price, name')
    .eq('id', itemId)
    .single()

  if (itemError || !item) return { error: "Article introuvable." }

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: "Profil introuvable." }

  if (profile.balance < item.price) {
    return { error: `Solde insuffisant. Il vous manque ${(item.price - profile.balance).toLocaleString()} Zeny.` }
  }

  // 3. Transaction (Update Balance + Create Order)
  // Note: In a real app, use RPC or Postgres Transaction for atomicity.
  // Here we do naive sequential updates for MVP.
  
  // Deduct Balance
  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ balance: profile.balance - item.price })
    .eq('id', user.id)

  if (balanceError) return { error: "Erreur lors du paiement." }

  // Create Order
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      item_id: itemId,
      price_paid: item.price,
      delivery_info: deliveryInfo,
      status: 'pending'
    })

  if (orderError) {
    // CRITICAL: Money was taken but order failed.
    // Log this for manual refund!
    console.error(`CRITICAL: User ${user.id} charged ${item.price} for item ${itemId} but order failed!`)
    return { error: "Erreur lors de la commande. Contactez le support." }
  }

  // 4. Send Email Notification (Simulation)
  console.log(`[EMAIL_MOCK] Sending email to admin: New Order! User ${user.email} bought ${item.name}`)
  console.log(`[EMAIL_MOCK] Delivery Info: ${deliveryInfo}`)
  
  // TODO: Integrate Resend here
  // await resend.emails.send({ ... })

  revalidatePath('/shop')
  revalidatePath('/profile')

  return { success: true, newBalance: profile.balance - item.price }
}


