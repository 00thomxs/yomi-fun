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
