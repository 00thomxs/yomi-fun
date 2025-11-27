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
