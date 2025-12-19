'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types
export type CosmeticType = 'background' | 'aura' | 'nametag'
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type CosmeticItem = {
  id: string
  name: string
  slug: string
  description: string | null
  type: CosmeticType
  rarity: CosmeticRarity
  price: number
  preview_data: Record<string, any>
  is_available: boolean
  is_limited: boolean
  sort_order: number
  created_at: string
}

export type UserCosmetic = {
  id: string
  user_id: string
  cosmetic_id: string
  purchased_at: string
  price_paid: number
  cosmetic?: CosmeticItem
}

export type UserEquippedCosmetics = {
  user_id: string
  background_id: string | null
  aura_id: string | null
  nametag_id: string | null
}

export type PurchaseResult = {
  success?: boolean
  error?: string
  newBalance?: number
}

// Rarity info for UI
export const RARITY_INFO = {
  common: { label: 'Commun', color: '#9ca3af', bgColor: 'bg-zinc-500/10', borderColor: 'border-zinc-500/30' },
  rare: { label: 'Rare', color: '#3b82f6', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  epic: { label: 'Épique', color: '#a855f7', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  legendary: { label: 'Légendaire', color: '#f59e0b', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
}

// ============================================
// PUBLIC ACTIONS
// ============================================

/**
 * Get all available cosmetic items
 */
export async function getCosmeticItems(type?: CosmeticType): Promise<CosmeticItem[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('cosmetic_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
  
  if (type) {
    query = query.eq('type', type)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('[getCosmeticItems] Error:', error)
    return []
  }
  
  return data as CosmeticItem[]
}

/**
 * Get all cosmetic items for admin (including unavailable)
 */
export async function getAllCosmeticItems(): Promise<CosmeticItem[]> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') return []
  
  const { data, error } = await supabaseAdmin
    .from('cosmetic_items')
    .select('*')
    .order('type')
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('[getAllCosmeticItems] Error:', error)
    return []
  }
  
  return data as CosmeticItem[]
}

/**
 * Get user's owned cosmetics
 */
export async function getUserCosmetics(userId?: string): Promise<UserCosmetic[]> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    targetUserId = user.id
  }
  
  const { data, error } = await supabaseAdmin
    .from('user_cosmetics')
    .select(`
      *,
      cosmetic:cosmetic_items(*)
    `)
    .eq('user_id', targetUserId)
  
  if (error) {
    console.error('[getUserCosmetics] Error:', error)
    return []
  }
  
  return data as UserCosmetic[]
}

/**
 * Get user's equipped cosmetics
 */
export async function getUserEquippedCosmetics(userId?: string): Promise<{
  background: CosmeticItem | null
  aura: CosmeticItem | null
  nametag: CosmeticItem | null
}> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { background: null, aura: null, nametag: null }
    targetUserId = user.id
  }
  
  const { data: equipped } = await supabaseAdmin
    .from('user_equipped_cosmetics')
    .select('background_id, aura_id, nametag_id')
    .eq('user_id', targetUserId)
    .maybeSingle()
  
  if (!equipped) {
    return { background: null, aura: null, nametag: null }
  }
  
  // Fetch the actual cosmetic items
  const ids = [equipped.background_id, equipped.aura_id, equipped.nametag_id].filter(Boolean)
  
  if (ids.length === 0) {
    return { background: null, aura: null, nametag: null }
  }
  
  const { data: items } = await supabaseAdmin
    .from('cosmetic_items')
    .select('*')
    .in('id', ids)
  
  const itemMap = new Map(items?.map(i => [i.id, i]) || [])
  
  return {
    background: equipped.background_id ? (itemMap.get(equipped.background_id) as CosmeticItem) || null : null,
    aura: equipped.aura_id ? (itemMap.get(equipped.aura_id) as CosmeticItem) || null : null,
    nametag: equipped.nametag_id ? (itemMap.get(equipped.nametag_id) as CosmeticItem) || null : null,
  }
}

/**
 * Purchase a cosmetic item
 */
export async function purchaseCosmetic(cosmeticId: string): Promise<PurchaseResult> {
  const supabase = await createClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  
  // Get item details
  const { data: item, error: itemError } = await supabase
    .from('cosmetic_items')
    .select('*')
    .eq('id', cosmeticId)
    .eq('is_available', true)
    .single()
  
  if (itemError || !item) {
    return { error: 'Cosmétique introuvable ou non disponible' }
  }
  
  // Check if already owned
  const { data: existing } = await supabaseAdmin
    .from('user_cosmetics')
    .select('id')
    .eq('user_id', user.id)
    .eq('cosmetic_id', cosmeticId)
    .maybeSingle()
  
  if (existing) {
    return { error: 'Vous possédez déjà ce cosmétique' }
  }
  
  // Get user balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    return { error: 'Profil introuvable' }
  }
  
  if (profile.balance < item.price) {
    return { error: `Solde insuffisant. Il vous manque ${(item.price - profile.balance).toLocaleString()} Zeny.` }
  }
  
  // Deduct balance
  const newBalance = profile.balance - item.price
  const { error: balanceError } = await supabaseAdmin
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', user.id)
  
  if (balanceError) {
    return { error: 'Erreur lors du paiement' }
  }
  
  // Add to user's cosmetics
  const { error: insertError } = await supabaseAdmin
    .from('user_cosmetics')
    .insert({
      user_id: user.id,
      cosmetic_id: cosmeticId,
      price_paid: item.price,
    })
  
  if (insertError) {
    // Refund on error
    await supabaseAdmin
      .from('profiles')
      .update({ balance: profile.balance })
      .eq('id', user.id)
    
    console.error('[purchaseCosmetic] Insert error:', insertError)
    return { error: 'Erreur lors de l\'achat' }
  }
  
  // Log transaction
  await supabaseAdmin.from('transactions').insert({
    user_id: user.id,
    type: 'shop_purchase',
    amount: -item.price,
    description: `Achat cosmétique: ${item.name}`,
  }).catch(() => {}) // Non-blocking
  
  console.log(`[purchaseCosmetic] User ${user.id} bought ${item.name} for ${item.price} Zeny`)
  
  revalidatePath('/shop')
  revalidatePath('/profile')
  
  return { success: true, newBalance }
}

/**
 * Equip a cosmetic (or unequip by passing null)
 */
export async function equipCosmetic(
  type: CosmeticType,
  cosmeticId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  
  // If equipping (not unequipping), verify ownership
  if (cosmeticId) {
    const { data: owned } = await supabaseAdmin
      .from('user_cosmetics')
      .select('id')
      .eq('user_id', user.id)
      .eq('cosmetic_id', cosmeticId)
      .maybeSingle()
    
    if (!owned) {
      return { success: false, error: 'Vous ne possédez pas ce cosmétique' }
    }
    
    // Verify type matches
    const { data: item } = await supabaseAdmin
      .from('cosmetic_items')
      .select('type')
      .eq('id', cosmeticId)
      .single()
    
    if (item?.type !== type) {
      return { success: false, error: 'Type de cosmétique invalide' }
    }
  }
  
  // Build update object based on type
  const updateField = `${type}_id`
  
  // First, check if user has an existing record
  const { data: existingRecord } = await supabaseAdmin
    .from('user_equipped_cosmetics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  
  let error
  
  if (existingRecord) {
    // Update only the specific field
    const updateResult = await supabaseAdmin
      .from('user_equipped_cosmetics')
      .update({
        [updateField]: cosmeticId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
    error = updateResult.error
  } else {
    // Insert new record
    const insertResult = await supabaseAdmin
      .from('user_equipped_cosmetics')
      .insert({
        user_id: user.id,
        [updateField]: cosmeticId,
        background_id: type === 'background' ? cosmeticId : null,
        aura_id: type === 'aura' ? cosmeticId : null,
        nametag_id: type === 'nametag' ? cosmeticId : null,
      })
    error = insertResult.error
  }
  
  if (error) {
    console.error('[equipCosmetic] Error:', error)
    return { success: false, error: 'Erreur lors de l\'équipement' }
  }
  
  revalidatePath('/profile')
  return { success: true }
}

// ============================================
// ADMIN ACTIONS
// ============================================

/**
 * Create a new cosmetic item
 */
export async function createCosmeticItem(data: {
  name: string
  slug: string
  description?: string
  type: CosmeticType
  rarity: CosmeticRarity
  price: number
  preview_data: Record<string, any>
  is_available?: boolean
  is_limited?: boolean
  sort_order?: number
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, error: 'Non autorisé' }
  }
  
  const { data: newItem, error } = await supabaseAdmin
    .from('cosmetic_items')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      type: data.type,
      rarity: data.rarity,
      price: data.price,
      preview_data: data.preview_data,
      is_available: data.is_available ?? true,
      is_limited: data.is_limited ?? false,
      sort_order: data.sort_order ?? 0,
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('[createCosmeticItem] Error:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/shop')
  revalidatePath('/shop')
  
  return { success: true, id: newItem.id }
}

/**
 * Update a cosmetic item
 */
export async function updateCosmeticItem(
  id: string,
  data: Partial<{
    name: string
    slug: string
    description: string | null
    type: CosmeticType
    rarity: CosmeticRarity
    price: number
    preview_data: Record<string, any>
    is_available: boolean
    is_limited: boolean
    sort_order: number
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, error: 'Non autorisé' }
  }
  
  const { error } = await supabaseAdmin
    .from('cosmetic_items')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  
  if (error) {
    console.error('[updateCosmeticItem] Error:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/shop')
  revalidatePath('/shop')
  
  return { success: true }
}

/**
 * Delete a cosmetic item
 */
export async function deleteCosmeticItem(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, error: 'Non autorisé' }
  }
  
  // Check if any users own this cosmetic
  const { count } = await supabaseAdmin
    .from('user_cosmetics')
    .select('id', { count: 'exact', head: true })
    .eq('cosmetic_id', id)
  
  if (count && count > 0) {
    return { success: false, error: `Impossible de supprimer: ${count} utilisateur(s) possède(nt) ce cosmétique` }
  }
  
  const { error } = await supabaseAdmin
    .from('cosmetic_items')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('[deleteCosmeticItem] Error:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/shop')
  revalidatePath('/shop')
  
  return { success: true }
}

/**
 * Toggle cosmetic availability
 */
export async function toggleCosmeticAvailability(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, error: 'Non autorisé' }
  }
  
  // Get current state
  const { data: item } = await supabaseAdmin
    .from('cosmetic_items')
    .select('is_available')
    .eq('id', id)
    .single()
  
  if (!item) {
    return { success: false, error: 'Cosmétique introuvable' }
  }
  
  const { error } = await supabaseAdmin
    .from('cosmetic_items')
    .update({ is_available: !item.is_available })
    .eq('id', id)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/shop')
  revalidatePath('/shop')
  
  return { success: true }
}

