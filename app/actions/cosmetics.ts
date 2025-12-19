'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { 
  CosmeticType, 
  CosmeticRarity, 
  CosmeticItem, 
  UserCosmetic, 
  UserEquippedCosmetics, 
  PurchaseResult 
} from '@/lib/cosmetics-types'

// Re-export types for convenience (types are allowed in use server)
export type { CosmeticType, CosmeticRarity, CosmeticItem, UserCosmetic, UserEquippedCosmetics, PurchaseResult }

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
 * Uses atomic RPC function to ensure transaction safety
 */
export async function purchaseCosmetic(cosmeticId: string): Promise<PurchaseResult> {
  const supabase = await createClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  
  // Call atomic purchase function
  const { data, error } = await supabaseAdmin
    .rpc('purchase_cosmetic', {
      p_user_id: user.id,
      p_cosmetic_id: cosmeticId
    })
  
  if (error) {
    console.error('[purchaseCosmetic] RPC error:', error)
    return { error: 'Erreur lors de l\'achat' }
  }
  
  // Parse RPC result
  const result = data as { success: boolean; error?: string; newBalance?: number; itemName?: string }
  
  if (!result.success) {
    return { error: result.error || 'Erreur inconnue' }
  }
  
  console.log(`[purchaseCosmetic] User ${user.id} bought ${result.itemName} - New balance: ${result.newBalance}`)
  
  revalidatePath('/shop')
  revalidatePath('/profile')
  
  return { success: true, newBalance: result.newBalance }
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
 * Note: This will remove the cosmetic from all users who own it (no refund)
 * The database uses CASCADE on user_cosmetics and SET NULL on user_equipped_cosmetics
 */
export async function deleteCosmeticItem(id: string): Promise<{ success: boolean; error?: string; ownersCount?: number }> {
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
  
  // Get count of users who own this cosmetic (for info)
  const { count: ownersCount } = await supabaseAdmin
    .from('user_cosmetics')
    .select('id', { count: 'exact', head: true })
    .eq('cosmetic_id', id)
  
  // Delete the cosmetic (CASCADE will remove from user_cosmetics, SET NULL on equipped)
  const { error } = await supabaseAdmin
    .from('cosmetic_items')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('[deleteCosmeticItem] Error:', error)
    return { success: false, error: error.message }
  }
  
  console.log(`[deleteCosmeticItem] Admin ${user.id} deleted cosmetic ${id}. ${ownersCount || 0} users affected (no refund).`)
  
  revalidatePath('/admin/shop')
  revalidatePath('/shop')
  revalidatePath('/profile')
  
  return { success: true, ownersCount: ownersCount || 0 }
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

