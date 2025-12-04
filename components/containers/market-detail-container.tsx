"use client"

import { useRouter } from "next/navigation"
import { MarketDetailView } from "@/components/views/market-detail-view"
import { useUser } from "@/contexts/user-context"
import type { Market, BinaryMarket, MultiOutcomeMarket } from "@/lib/types"
import { PricePoint } from "@/app/actions/history"

type MarketDetailContainerProps = {
  market: any // Raw Supabase data
  history: PricePoint[]
}

export function MarketDetailContainer({ market: rawMarket, history }: MarketDetailContainerProps) {
  const router = useRouter()
  const { placeBet, userBalance } = useUser()

  const handleBack = () => {
    router.back()
  }

  const handleBet = (marketId: string, choice: string, amount: number, odds?: number) => {
    placeBet(marketId, choice, amount, odds)
  }

  // Process real history
  const processHistory = (points: PricePoint[], outcomeIndexToCheck: number = 1) => {
    // Filter for the specific outcome (e.g. YES = 1 for binary)
    const filtered = points.filter(p => p.outcomeIndex === outcomeIndexToCheck)
    
    if (filtered.length === 0) return []

    // Map to Chart Data
    return filtered.map(p => ({
      time: new Date(p.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      fullDate: new Date(p.date), 
      price: p.probability
    }))
  }

  // Transform to UI Model
  let market: Market

  if (rawMarket.type === 'binary') {
    const yesOutcome = rawMarket.outcomes?.find((o: any) => o.name === 'OUI')
    const prob = yesOutcome?.probability || 50
    
    // Use real history or fallback to current price point
    const realHistory = processHistory(history, 1) // 1 = OUI
    const chartData = realHistory.length > 0 
      ? realHistory 
      : [{ time: 'Maintenant', fullDate: new Date(), price: prob }]

    market = {
      ...rawMarket,
      type: 'binary',
      probability: prob,
      bgImage: rawMarket.image_url || "/placeholder.svg",
      yesPrice: prob / 100,
      noPrice: (100 - prob) / 100,
      volatility: "Moyenne",
      countdown: new Date(rawMarket.closes_at).toLocaleDateString(),
      isLive: rawMarket.is_live && rawMarket.status !== 'resolved', 
      // Use same data for all timeframes for MVP (simplification)
      history24h: chartData,
      history7d: chartData,
      historyAll: chartData
    } as BinaryMarket
  } else {
    market = {
      ...rawMarket,
      type: 'multi',
      bgImage: rawMarket.image_url || "/placeholder.svg",
      outcomes: rawMarket.outcomes || [],
      isLive: rawMarket.is_live && rawMarket.status !== 'resolved', 
      countdown: new Date(rawMarket.closes_at).toLocaleDateString(),
      historyData: [] // TODO: Handle multi history visualization later
    } as MultiOutcomeMarket
  }

  return (
    <MarketDetailView
      market={market}
      onBack={handleBack}
      onBet={handleBet}
      userBalance={userBalance}
    />
  )
}
