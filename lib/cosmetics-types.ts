// Cosmetics Types & Constants
// This file contains types and constants that can be imported by both server and client components

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
export const RARITY_INFO: Record<CosmeticRarity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  common: { label: 'Commun', color: '#9ca3af', bgColor: 'bg-zinc-500/10', borderColor: 'border-zinc-500/30' },
  rare: { label: 'Rare', color: '#3b82f6', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  epic: { label: 'Épique', color: '#a855f7', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  legendary: { label: 'Légendaire', color: '#f59e0b', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
}

