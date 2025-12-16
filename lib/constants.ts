import { 
  Flame, 
  Globe, 
  Gamepad2, 
  Music, 
  Wifi, 
  Tv, 
  Trophy, 
  MoreHorizontal
} from "lucide-react"

export const CATEGORIES = [
  { id: "trending", label: "Tendances", icon: Flame, adminOnly: false }, // Special category
  { id: "all", label: "Tous", icon: Globe, adminOnly: false }, // Special category
  { id: "reseaux", label: "Réseaux", icon: Wifi, adminOnly: false },
  { id: "stream", label: "Stream", icon: Tv, adminOnly: false },
  { id: "musique", label: "Musique", icon: Music, adminOnly: false },
  { id: "esport", label: "Esport", icon: Gamepad2, adminOnly: false },
  { id: "sport", label: "Sport", icon: Trophy, adminOnly: false },
  { id: "autre", label: "Autre", icon: MoreHorizontal, adminOnly: false },
] as const

export const MARKET_CATEGORIES = CATEGORIES.filter(c => c.id !== 'trending' && c.id !== 'all')

// ============================================
// ECONOMY: Daily Rewards & Welcome Bonus
// ============================================

// Welcome bonus for first-time users (enough for 2 minimum bets)
export const WELCOME_BONUS = 200

// Gacha Streak Daily Rewards
// Days 1-6: Fixed amounts, Day 7: Jackpot with weighted random
export const DAILY_REWARDS_CONFIG = {
  // Fixed rewards for days 1-6 (total: 380 Zeny)
  base: [30, 40, 50, 65, 85, 110] as const,
  
  // Day 7 Jackpot: Weighted random rewards
  // Expected value: ~386 Zeny
  jackpot_weights: [
    { amount: 200, weight: 55, rarity: 'common', label: 'Commun', color: '#9ca3af' },
    { amount: 400, weight: 30, rarity: 'rare', label: 'Rare', color: '#3b82f6' },
    { amount: 800, weight: 12, rarity: 'epic', label: 'Épique', color: '#a855f7' },
    { amount: 2000, weight: 3, rarity: 'legendary', label: 'Légendaire', color: '#f59e0b' }
  ] as const
}

// Helper to get Day 7 jackpot result
export function rollJackpot(): { amount: number; rarity: string; label: string; color: string } {
  const { jackpot_weights } = DAILY_REWARDS_CONFIG
  const totalWeight = jackpot_weights.reduce((sum, j) => sum + j.weight, 0)
  const roll = Math.random() * totalWeight
  
  let cumulative = 0
  for (const jackpot of jackpot_weights) {
    cumulative += jackpot.weight
    if (roll < cumulative) {
      return jackpot
    }
  }
  
  // Fallback (should never happen)
  return jackpot_weights[0]
}

export const ZENY_PACKS = [
  {
    id: 'pack_little_player',
    name: 'Petit Joueur',
    price: 1.99,
    amount: 2000,
    bonus: 0,
    popular: false,
  },
  {
    id: 'pack_degen',
    name: 'Degen Pack',
    price: 4.99,
    amount: 5500,
    bonus: 500,
    popular: true,
  },
  {
    id: 'pack_trader',
    name: 'Trader Pack',
    price: 9.99,
    amount: 12000,
    bonus: 2000,
    popular: false,
  },
  {
    id: 'pack_whale',
    name: 'Giga Whale',
    price: 24.99,
    amount: 32500,
    bonus: 7500,
    popular: false,
  },
] as const
