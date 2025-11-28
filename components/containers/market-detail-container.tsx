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

  const handleBet = (marketId: string, choice: string, amount: number, odds?: number) => {
    placeBet(marketId, choice, amount, odds)
  }

  // Helper to generate fake chart history that ends at current price
  const generateHistory = (currentPrice: number, points: number, labelSuffix: string) => {
    const data = []
    let price = currentPrice
    
    // Generate backwards from current price
    for (let i = points - 1; i >= 0; i--) {
      data.unshift({ time: `${i}${labelSuffix}`, price: Math.round(price * 10) / 10 })
      // Add volatility
      const change = (Math.random() - 0.5) * 5
      price = price - change // Go back in time
      price = Math.max(5, Math.min(95, price)) // Clamp between 5 and 95
    }
    
    // Ensure the last point is exactly the current price
    if (data.length > 0) {
        data[data.length - 1].price = currentPrice
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
      history24h: generateHistory(prob, 24, 'h'), // Mock Chart
      history7d: generateHistory(prob, 7, 'j'), // Mock Chart
      historyAll: generateHistory(prob, 30, 'j') // Mock Chart
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
