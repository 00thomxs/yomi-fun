"use client"

import { useRouter } from "next/navigation"
import { MarketDetailView } from "@/components/views/market-detail-view"
import { useUser } from "@/contexts/user-context"
import type { Market, BinaryMarket, MultiOutcomeMarket } from "@/lib/types"

type MarketDetailContainerProps = {
  market: any // Raw Supabase data
}

export function MarketDetailContainer({ market: rawMarket }: MarketDetailContainerProps) {
  const router = useRouter()
  const { placeBet, userBalance } = useUser()

  const handleBack = () => {
    router.back()
  }

  const handleBet = (marketQuestion: string, choice: string, amount: number, odds?: number) => {
    placeBet(marketQuestion, choice, amount, odds)
  }

  // Helper to generate fake chart history
  const generateHistory = (basePrice: number) => {
    const data = []
    let price = basePrice
    for (let i = 0; i < 24; i++) {
      price = price + (Math.random() - 0.5) * 10
      price = Math.max(1, Math.min(99, price))
      data.push({ time: `${i}h`, price })
    }
    return data
  }

  // Transform to UI Model
  let market: Market

  if (rawMarket.type === 'binary') {
    const yesOutcome = rawMarket.outcomes?.find((o: any) => o.name === 'OUI')
    const prob = yesOutcome?.probability || 50
    
    market = {
      ...rawMarket,
      type: 'binary',
      probability: prob,
      bgImage: rawMarket.image_url || "/placeholder.svg",
      yesPrice: prob / 100,
      noPrice: (100 - prob) / 100,
      volatility: "Moyenne", // Mock
      countdown: new Date(rawMarket.closes_at).toLocaleDateString(),
      history24h: generateHistory(prob), // Mock Chart
      history7d: [],
      historyAll: []
    } as BinaryMarket
  } else {
    market = {
      ...rawMarket,
      type: 'multi',
      bgImage: rawMarket.image_url || "/placeholder.svg",
      outcomes: rawMarket.outcomes || [],
      countdown: new Date(rawMarket.closes_at).toLocaleDateString(),
      historyData: [] // TODO: Mock multi chart
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

