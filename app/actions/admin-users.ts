'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types
export type PlatformStats = {
  totalUsers: number
  activeToday: number
  newToday: number
  newWeek: number
  newMonth: number
  bannedUsers: number
  volumeToday: number
  totalVolume: number
  totalDistributed: number
}

export type TopPlayer = {
  id: string
  username: string
  avatar_url: string | null
  total_won: number
  balance: number
  win_rate: number
  total_bets: number
  is_banned: boolean
}

export type AdminUser = {
  id: string
  username: string
  avatar_url: string | null
  email?: string
  balance: number
  total_won: number
  total_bets: number
  win_rate: number
  wins: number
  losses: number
  xp: number
  level: number
  streak: number
  role: string | null
  is_banned: boolean
  banned_at: string | null
  ban_reason: string | null
  created_at: string
}

export type UserSearchFilters = {
  query?: string
  minPnl?: number
  maxPnl?: number
  minBalance?: number
  maxBalance?: number
  isBanned?: boolean
  sortBy?: 'total_won' | 'balance' | 'created_at' | 'username' | 'total_bets'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Helper to verify admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { isAdmin: false }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return { 
    isAdmin: profile?.role === 'admin',
    userId: user.id
  }
}

// ============================================
// STATS FUNCTIONS
// ============================================

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(): Promise<PlatformStats | null> {
  const { isAdmin } = await verifyAdmin()
  if (!isAdmin) return null
  
  const { data, error } = await supabaseAdmin.rpc('get_admin_platform_stats')
  
  if (error) {
    console.error('[getPlatformStats] Error:', error)
    return null
  }
  
  return data as PlatformStats
}

/**
 * Get top players by PNL
 */
export async function getTopPlayersByPnl(
  timeframe: 'day' | 'week' | 'month' | 'all' = 'all',
  limit: number = 10
): Promise<TopPlayer[]> {
  const { isAdmin } = await verifyAdmin()
  if (!isAdmin) return []
  
  const { data, error } = await supabaseAdmin.rpc('get_top_players_by_pnl', {
    p_timeframe: timeframe,
    p_limit: limit
  })
  
  if (error) {
    console.error('[getTopPlayersByPnl] Error:', error)
    return []
  }
  
  return data as TopPlayer[]
}

// ============================================
// SEARCH & LIST FUNCTIONS
// ============================================

/**
 * Search users with filters
 */
export async function searchUsers(filters: UserSearchFilters = {}): Promise<{
  users: AdminUser[]
  total: number
}> {
  const { isAdmin } = await verifyAdmin()
  if (!isAdmin) return { users: [], total: 0 }
  
  const {
    query,
    minPnl,
    maxPnl,
    minBalance,
    maxBalance,
    isBanned,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 20,
    offset = 0
  } = filters
  
  let queryBuilder = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })
  
  // Text search (username or email-like patterns in username)
  if (query && query.trim()) {
    queryBuilder = queryBuilder.ilike('username', `%${query.trim()}%`)
  }
  
  // PNL filters
  if (minPnl !== undefined) {
    queryBuilder = queryBuilder.gte('total_won', minPnl)
  }
  if (maxPnl !== undefined) {
    queryBuilder = queryBuilder.lte('total_won', maxPnl)
  }
  
  // Balance filters
  if (minBalance !== undefined) {
    queryBuilder = queryBuilder.gte('balance', minBalance)
  }
  if (maxBalance !== undefined) {
    queryBuilder = queryBuilder.lte('balance', maxBalance)
  }
  
  // Ban filter
  if (isBanned !== undefined) {
    queryBuilder = queryBuilder.eq('is_banned', isBanned)
  }
  
  // Exclude admins from results
  queryBuilder = queryBuilder.or('role.is.null,role.neq.admin')
  
  // Sorting
  queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' })
  
  // Pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1)
  
  const { data, error, count } = await queryBuilder
  
  if (error) {
    console.error('[searchUsers] Error:', error)
    return { users: [], total: 0 }
  }
  
  return {
    users: (data || []).map(u => ({
      ...u,
      is_banned: u.is_banned || false,
    })) as AdminUser[],
    total: count || 0
  }
}

/**
 * Get a single user's full details
 */
export async function getUserDetails(userId: string): Promise<AdminUser | null> {
  const { isAdmin } = await verifyAdmin()
  if (!isAdmin) return null
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('[getUserDetails] Error:', error)
    return null
  }
  
  return {
    ...data,
    is_banned: data.is_banned || false,
  } as AdminUser
}

/**
 * Get user's recent bets for admin view
 */
export async function getUserBets(userId: string, limit: number = 20): Promise<any[]> {
  const { isAdmin } = await verifyAdmin()
  if (!isAdmin) return []
  
  const { data, error } = await supabaseAdmin
    .from('bets')
    .select(`
      id,
      amount,
      status,
      potential_payout,
      odds_at_bet,
      direction,
      created_at,
      markets(question)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[getUserBets] Error:', error)
    return []
  }
  
  return data || []
}

// ============================================
// MODERATION FUNCTIONS
// ============================================

/**
 * Ban a user
 */
export async function banUser(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId: adminId } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }
  
  // Can't ban yourself
  if (userId === adminId) {
    return { success: false, error: 'Vous ne pouvez pas vous bannir vous-même' }
  }
  
  // Check if target is admin
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('role, username')
    .eq('id', userId)
    .single()
  
  if (target?.role === 'admin') {
    return { success: false, error: 'Impossible de bannir un administrateur' }
  }
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      ban_reason: reason,
      banned_by: adminId,
    })
    .eq('id', userId)
  
  if (error) {
    console.error('[banUser] Error:', error)
    return { success: false, error: error.message }
  }
  
  console.log(`[ADMIN] User ${target?.username} (${userId}) banned by admin ${adminId}. Reason: ${reason}`)
  
  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId: adminId } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }
  
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      is_banned: false,
      banned_at: null,
      ban_reason: null,
      banned_by: null,
    })
    .eq('id', userId)
  
  if (error) {
    console.error('[unbanUser] Error:', error)
    return { success: false, error: error.message }
  }
  
  console.log(`[ADMIN] User ${target?.username} (${userId}) unbanned by admin ${adminId}`)
  
  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Update user data (admin override)
 */
export async function updateUserData(
  userId: string,
  data: {
    username?: string
    balance?: number
    avatar_url?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId: adminId } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }
  
  // Validate username if provided
  if (data.username) {
    // Check if username is taken
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', data.username)
      .neq('id', userId)
      .single()
    
    if (existing) {
      return { success: false, error: 'Ce nom d\'utilisateur est déjà pris' }
    }
  }
  
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  
  if (error) {
    console.error('[updateUserData] Error:', error)
    return { success: false, error: error.message }
  }
  
  console.log(`[ADMIN] User ${target?.username} (${userId}) modified by admin ${adminId}. Changes:`, data)
  
  revalidatePath('/admin/users')
  revalidatePath('/profile')
  return { success: true }
}

/**
 * Reset user balance (for testing/support)
 */
export async function resetUserBalance(
  userId: string,
  newBalance: number
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId: adminId } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }
  
  if (newBalance < 0) {
    return { success: false, error: 'Le solde ne peut pas être négatif' }
  }
  
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('username, balance')
    .eq('id', userId)
    .single()
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId)
  
  if (error) {
    console.error('[resetUserBalance] Error:', error)
    return { success: false, error: error.message }
  }
  
  // Log the transaction
  await supabaseAdmin.from('transactions').insert({
    user_id: userId,
    type: 'admin_adjustment',
    amount: newBalance - (target?.balance || 0),
    description: `Ajustement admin par ${adminId}`,
  })
  
  console.log(`[ADMIN] User ${target?.username} balance changed from ${target?.balance} to ${newBalance} by admin ${adminId}`)
  
  revalidatePath('/admin/users')
  return { success: true }
}

