"use client"

import { useState } from "react"
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

  const handleMarketClick = (market: Market) => {
    router.push(`/market/${market.id}`)
  }

  const handleBet = (market: string, choice: string, amount: number, odds?: number) => {
    placeBet(market, choice, amount, odds)
  }

  // Transform Supabase data to match Market type if needed
  // For now assuming they match roughly or we adapt in HomeView
  const markets = initialMarkets.map(m => ({
    ...m,
    // Add missing fields required by UI with default values
    bgImage: m.image_url || "/placeholder.svg",
    probability: 50, // TODO: Fetch real probability
    countdown: new Date(m.closes_at).toLocaleDateString(),
    yesPrice: 0.5,
    noPrice: 0.5
  }))

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

