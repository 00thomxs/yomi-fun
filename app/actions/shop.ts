'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ShopItem, ShopOrder } from '@/lib/types'

export type PurchaseResult = {
  success?: boolean
  error?: string
  newBalance?: number
}

export type ShopActionResult = {
  success?: boolean
  error?: string
}

// --- PUBLIC ACTIONS ---

export async function getShopItems(): Promise<ShopItem[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching shop items:', error)
    return []
  }

  return data as ShopItem[]
}

export async function purchaseItem(itemId: string, deliveryInfo: string): Promise<PurchaseResult> {
  const supabase = await createClient()
  
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Vous devez être connecté." }

  // 2. Get Item & User Balance
  const { data: item, error: itemError } = await supabase
    .from('shop_items')
    .select('price, name, stock')
    .eq('id', itemId)
    .single()

  if (itemError || !item) return { error: "Article introuvable." }

  if (item.stock === 0) return { error: "Désolé, cet article est en rupture de stock." }

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: "Profil introuvable." }

  if (profile.balance < item.price) {
    return { error: `Solde insuffisant. Il vous manque ${(item.price - profile.balance).toLocaleString()} Zeny.` }
  }

  // 3. Transaction (Update Balance + Create Order + Decrement Stock)
  
  // Decrement Stock if not infinite (-1)
  if (item.stock > 0) {
    const { error: stockError } = await supabase
      .from('shop_items')
      .update({ stock: item.stock - 1 })
      .eq('id', itemId)
      .eq('stock', item.stock) // Optimistic lock check

    if (stockError) return { error: "Erreur de stock. Réessayez." }
  }
  
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
    console.error(`CRITICAL: User ${user.id} charged ${item.price} for item ${itemId} but order failed!`)
    return { error: "Erreur lors de la commande. Contactez le support." }
  }

  // 4. Send Email Notification (MOCK for MVP)
  // In a real app, we would call Resend or SendGrid here.
  // For MVP: We log it and return a success message that tells the user what to expect.
  console.log(`[EMAIL_MOCK] TO: ${user.email}`)
  console.log(`[EMAIL_MOCK] SUBJECT: Confirmation de votre commande YOMI : ${item.name}`)
  console.log(`[EMAIL_MOCK] BODY: Merci pour votre achat ! Votre code/cadeau sera envoyé à cette adresse sous 24h.`)
  
  revalidatePath('/shop')
  revalidatePath('/profile')

  return { success: true, newBalance: profile.balance - item.price }
}

// --- ADMIN ACTIONS ---

export async function createShopItem(formData: FormData): Promise<ShopActionResult> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseInt(formData.get('price') as string)
  const category = formData.get('category') as string
  const image_url = formData.get('image_url') as string
  const stock = parseInt(formData.get('stock') as string) || -1

  const { error } = await supabase
    .from('shop_items')
    .insert({
      name,
      description,
      price,
      category,
      image_url,
      stock
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/shop')
  return { success: true }
}

export async function updateShopItem(id: string, formData: FormData): Promise<ShopActionResult> {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseInt(formData.get('price') as string)
  const category = formData.get('category') as string
  const image_url = formData.get('image_url') as string
  const stock = parseInt(formData.get('stock') as string)

  const { error } = await supabase
    .from('shop_items')
    .update({
      name,
      description,
      price,
      category,
      image_url,
      stock
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/shop')
  return { success: true }
}

export async function deleteShopItem(id: string): Promise<ShopActionResult> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('shop_items')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/shop')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<ShopActionResult> {
  const supabase = await createClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath('/admin/orders')
  return { success: true }
}

export async function getOrders(): Promise<ShopOrder[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      shop_items ( name, image_url ),
      profiles ( username, email )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return data as unknown as ShopOrder[]
}
