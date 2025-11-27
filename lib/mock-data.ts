import { Music, Wifi, Tv, Newspaper, Gamepad2, Trophy } from "lucide-react"
import type { Market, ChartDataPoint, MultiOutcomeDataPoint } from "./types"

// Time Labels
export const TIME_LABELS_24H = ["00h", "02h", "04h", "06h", "08h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"]
export const TIME_LABELS_7D = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
export const TIME_LABELS_ALL = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin"]
export const TIME_LABELS_1H = ["0m", "10m", "20m", "30m", "40m", "50m"]
export const TIME_LABELS_4H = ["0h", "1h", "2h", "3h", "4h"]
export const TIME_LABELS_1J = ["0h", "4h", "8h", "12h", "16h", "20h"]

// Image URLs
export const AVATAR_MAIN = "/images/avatar.jpg"
export const AVATAR_2 = "/images/avatar-2.jpg"
export const AVATAR_3 = "/images/avatar-3.jpg"
export const GP_EXPLORER_BG = "/images/gp-explorer.webp"

export const SHOP_AIRPODS = "/images/shop-airpods.jpg"
export const SHOP_KHALAMITE = "/images/shop-khalamite.jpg"
export const SHOP_LOL = "/images/shop-lol.webp"
export const SHOP_MACBOOK = "/images/shop-macbook.webp"
export const SHOP_PSN = "/images/shop-psn.webp"
export const SHOP_BONNIE = "/images/shop-bonnie.jpg"
export const SHOP_JAPAN = "/images/shop-japan.avif"
export const SHOP_NORDVPN = "/images/shop-nordvpn.jpg"

// Chart Data Generators
export function generateSyncedChartData(
  points: number,
  targetProbability: number,
  labels: string[],
): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const target = targetProbability

  let currentPrice = Math.random() * 40 + 30

  for (let i = 0; i < points; i++) {
    const trendToTarget = currentPrice + (target - currentPrice) * 0.15
    const volatility = (Math.random() - 0.5) * 15
    currentPrice = trendToTarget + volatility
    currentPrice = Math.max(2, Math.min(98, currentPrice))

    if (i === points - 1) {
      currentPrice = target + (Math.random() - 0.5) * 3
      currentPrice = Math.max(2, Math.min(98, currentPrice))
    }

    data.push({
      time: labels[i % labels.length],
      price: Math.round(currentPrice * 10) / 10,
    })
  }

  return data
}

export function generateVolatileChartData(points: number, targetProbability: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  let currentPrice = targetProbability - 15 + Math.random() * 30

  for (let i = 0; i < points; i++) {
    const volatility = (Math.random() - 0.5) * 20
    const trendToTarget = currentPrice + (targetProbability - currentPrice) * 0.1
    currentPrice = trendToTarget + volatility
    currentPrice = Math.max(5, Math.min(95, currentPrice))

    if (i === points - 1) {
      currentPrice = targetProbability
    }

    data.push({
      time: `${i}`,
      price: Math.round(currentPrice * 10) / 10,
    })
  }

  return data
}

export function generateMultiOutcomeData(
  points: number,
  outcomes: { name: string; probability: number }[],
  labels: string[],
): MultiOutcomeDataPoint[] {
  const data: MultiOutcomeDataPoint[] = []

  for (let i = 0; i < points; i++) {
    const point: MultiOutcomeDataPoint = { time: labels[i % labels.length] }

    outcomes.forEach((outcome) => {
      const target = outcome.probability
      const volatility = (Math.random() - 0.5) * 8
      let value = target + volatility * (1 - i / points)
      value = Math.max(1, Math.min(99, value))
      if (i === points - 1) value = target
      point[outcome.name] = Math.round(value * 10) / 10
    })

    data.push(point)
  }

  return data
}

// Markets Data
export const MARKETS_DATA: Market[] = [
  {
    id: "reglement-artiste-annee",
    type: "multi",
    category: "Musique",
    categoryIcon: Music,
    question: "Le Reglement : Artiste FR de l'annee ?",
    outcomes: [
      { name: "Keeqaid", probability: 21, color: "#f43f5e" },
      { name: "Femtogo", probability: 18, color: "#8b5cf6" },
      { name: "Jeune Morty", probability: 17, color: "#3b82f6" },
      { name: "630OG", probability: 8, color: "#10b981" },
      { name: "Autres", probability: 36, color: "#6b7280" },
    ],
    volume: "67.2k",
    image: "/french-rap-music-artist-microphone-stage.jpg",
    bgImage: "/french-rap-music-artist-microphone-stage-dark.jpg",
    isLive: true,
    countdown: "45j 8h",
    historyData: generateMultiOutcomeData(
      12,
      [
        { name: "Keeqaid", probability: 21 },
        { name: "Femtogo", probability: 18 },
        { name: "Jeune Morty", probability: 17 },
        { name: "630OG", probability: 8 },
        { name: "Autres", probability: 36 },
      ],
      TIME_LABELS_24H,
    ),
  },
  {
    id: "tiktok-awards-mot",
    type: "multi",
    category: "Reseaux",
    categoryIcon: Wifi,
    question: "TikTok Awards 2025 : Le mot le plus mentionne ?",
    outcomes: [
      { name: "Pain", probability: 26, color: "#f59e0b" },
      { name: "Boulangerie", probability: 13, color: "#ec4899" },
      { name: "Gwer", probability: 11, color: "#06b6d4" },
      { name: "Goumin", probability: 6, color: "#84cc16" },
      { name: "Autre", probability: 44, color: "#6b7280" },
    ],
    volume: "34.8k",
    image: "/tiktok-social-media-phone-viral-content.jpg",
    bgImage: "/tiktok-social-media-phone-viral-content-dark.jpg",
    isLive: false,
    countdown: "12j 4h",
    historyData: generateMultiOutcomeData(
      12,
      [
        { name: "Pain", probability: 26 },
        { name: "Boulangerie", probability: 13 },
        { name: "Gwer", probability: 11 },
        { name: "Goumin", probability: 6 },
        { name: "Autre", probability: 44 },
      ],
      TIME_LABELS_24H,
    ),
  },
  {
    id: "squeezie-gp-explorer",
    type: "binary",
    category: "Stream",
    categoryIcon: Tv,
    question: "Squeezie : GP Explorer 3 depassera 3M de vues en 48h ?",
    probability: 85,
    volume: "42.7k",
    image: GP_EXPLORER_BG,
    bgImage: GP_EXPLORER_BG,
    volatility: "Haute",
    isLive: true,
    yesPrice: 0.85,
    noPrice: 0.15,
    countdown: "2j 14h",
    history24h: generateSyncedChartData(12, 85, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 85, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 85, TIME_LABELS_ALL),
  },
  {
    id: "affaire-paffman",
    type: "binary",
    category: "Reseaux",
    categoryIcon: Wifi,
    question: "Affaire Paffman : Sera-t-il condamne a de la prison ferme ?",
    probability: 67,
    volume: "89.3k",
    image: "/dark-abstract-courthouse-justice-gavel.jpg",
    bgImage: "/dark-abstract-courthouse-justice-gavel-noir.jpg",
    volatility: "Haute",
    isLive: false,
    yesPrice: 0.67,
    noPrice: 0.33,
    countdown: "120j 0h",
    history24h: generateSyncedChartData(12, 67, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 67, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 67, TIME_LABELS_ALL),
  },
  {
    id: "skema-sigem",
    type: "binary",
    category: "Faits Divers",
    categoryIcon: Newspaper,
    question: "Classement SIGEM 2026 : SKEMA dans le Top 5 ?",
    probability: 80,
    volume: "15.2k",
    image: "/business-school-campus-university-building.jpg",
    bgImage: "/business-school-campus-university-building-dark.jpg",
    volatility: "Faible",
    isLive: false,
    yesPrice: 0.8,
    noPrice: 0.2,
    countdown: "180j 12h",
    history24h: generateSyncedChartData(12, 80, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 80, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 80, TIME_LABELS_ALL),
  },
  {
    id: "kanye-polemique",
    type: "binary",
    category: "Musique",
    categoryIcon: Music,
    question: "Kanye West : Nouvelle polemique majeure avant 2026 ?",
    probability: 10,
    volume: "28.1k",
    image: "/placeholder-6kcsh.png",
    bgImage: "/kanye-west-rapper-fashion-controversy-dark-noir.jpg",
    volatility: "Faible",
    isLive: false,
    yesPrice: 0.1,
    noPrice: 0.9,
    countdown: "38j 6h",
    history24h: generateSyncedChartData(12, 10, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 10, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 10, TIME_LABELS_ALL),
  },
  {
    id: "pnl-album-2026",
    type: "binary",
    category: "Musique",
    categoryIcon: Music,
    question: "PNL : Un nouvel album sortira-t-il en 2026 ?",
    probability: 6,
    volume: "52.4k",
    image: "/pnl-french-rap-duo-mysterious-dark-aesthetic.jpg",
    bgImage: "/pnl-french-rap-duo-mysterious-dark-aesthetic-noir.jpg",
    volatility: "Faible",
    isLive: false,
    yesPrice: 0.06,
    noPrice: 0.94,
    countdown: "400j 0h",
    history24h: generateSyncedChartData(12, 6, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 6, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 6, TIME_LABELS_ALL),
  },
  {
    id: "esdeekid-ardentes",
    type: "binary",
    category: "Musique",
    categoryIcon: Music,
    question: "EsDeeKid ou Fakemink : Aux Ardentes 2026 ?",
    probability: 23,
    volume: "8.9k",
    image: "/music-festival-stage-lights-crowd-belgium.jpg",
    bgImage: "/music-festival-stage-lights-crowd-belgium-dark.jpg",
    volatility: "Moyenne",
    isLive: false,
    yesPrice: 0.23,
    noPrice: 0.77,
    countdown: "210j 18h",
    history24h: generateSyncedChartData(12, 23, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 23, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 23, TIME_LABELS_ALL),
  },
  {
    id: "ninho-album",
    type: "binary",
    category: "Musique",
    categoryIcon: Music,
    question: "Ninho : Album Platine avant l'ete ?",
    probability: 92,
    volume: "38.9k",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=400&q=80",
    bgImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80",
    volatility: "Faible",
    isLive: false,
    yesPrice: 0.92,
    noPrice: 0.08,
    countdown: "65j 12h",
    history24h: generateSyncedChartData(12, 92, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 92, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 92, TIME_LABELS_ALL),
  },
  {
    id: "karmine-vitality",
    type: "binary",
    category: "Esport",
    categoryIcon: Gamepad2,
    question: "Karmine Corp vs Vitality : KCorp gagne le BO5 ?",
    probability: 45,
    volume: "56.3k",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
    bgImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    volatility: "Tres Haute",
    isLive: true,
    yesPrice: 0.45,
    noPrice: 0.55,
    countdown: "0j 4h",
    history24h: generateSyncedChartData(12, 45, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 45, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 45, TIME_LABELS_ALL),
  },
  {
    id: "mbappe-clasico",
    type: "binary",
    category: "Sport",
    categoryIcon: Trophy,
    question: "Mbappe : Marquera-t-il au prochain Clasico ?",
    probability: 60,
    volume: "32.1k",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80",
    bgImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    volatility: "Tres Haute",
    isLive: false,
    yesPrice: 0.6,
    noPrice: 0.4,
    countdown: "5j 20h",
    history24h: generateSyncedChartData(12, 60, TIME_LABELS_24H),
    history7d: generateSyncedChartData(7, 60, TIME_LABELS_7D),
    historyAll: generateSyncedChartData(6, 60, TIME_LABELS_ALL),
  },
]
