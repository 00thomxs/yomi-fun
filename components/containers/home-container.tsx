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
    if (initialMarkets.length > 0) {
       const m = initialMarkets[0]
       console.log(`Market[0] DB State: id=${m.id}, status=${m.status}, is_live=${m.is_live}`)
       console.log(`Market[0] UI State: isLive=${m.is_live && m.status !== 'resolved'}`)
    }
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
      // Fix: market is only live if DB says is_live AND status is not resolved/cancelled
      isLive: m.is_live && m.status !== 'resolved', 
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
