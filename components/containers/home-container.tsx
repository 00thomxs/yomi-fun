"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HomeView } from "@/components/views/home-view"
import { useUser } from "@/contexts/user-context"
import type { Market } from "@/lib/types"

type HomeContainerProps = {
  initialMarkets: any[] // TODO: Typing
}

export function HomeContainer({ initialMarkets }: HomeContainerProps) {
  const router = useRouter()
  const { placeBet } = useUser()
  const [activeCategory, setActiveCategory] = useState("trending")

  // DEBUG: Log received markets to console
  useEffect(() => {
    console.log("HomeContainer received markets:", initialMarkets)
    console.log("Mapped markets example:", markets[0])
  }, [initialMarkets])

  const handleMarketClick = (market: Market) => {
    router.push(`/market/${market.id}`)
  }

  const handleBet = (market: string, choice: string, amount: number, odds?: number) => {
    placeBet(market, choice, amount, odds)
  }

  // Transform Supabase data to match Market type if needed
  const markets = initialMarkets.map(m => {
    // Find probability for binary markets
    let probability = 50
    if (m.type === 'binary' && m.outcomes && m.outcomes.length > 0) {
      const yesOutcome = m.outcomes.find((o: any) => o.name === 'OUI')
      if (yesOutcome) probability = yesOutcome.probability
    }

    return {
      ...m,
      // Add missing fields required by UI with default values
      id: m.id,
      question: m.question,
      bgImage: m.image_url || "/placeholder.svg",
      probability: probability,
      countdown: m.closes_at ? new Date(m.closes_at).toLocaleDateString() : "Bientôt",
      yesPrice: probability / 100, // Approx price
      noPrice: (100 - probability) / 100,
      is_featured: m.is_featured, // Ensure featured flag is passed
      is_headline: m.is_headline, // Ensure headline flag is passed
      isLive: m.is_live, // Map snake_case from DB to camelCase for UI
      volume: m.volume || 0
    }
  })

  return (
    <HomeView
      markets={markets}
      onBet={handleBet}
      onMarketClick={handleMarketClick}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    />
  )
}
