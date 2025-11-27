"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HomeView } from "@/components/views/home-view"
import { useUser } from "@/contexts/user-context"
import type { Market } from "@/lib/types"

export default function HomePage() {
  const router = useRouter()
  const { placeBet } = useUser()
  const [activeCategory, setActiveCategory] = useState("trending")

  const handleMarketClick = (market: Market) => {
    router.push(`/market/${market.id}`)
  }

  const handleBet = (market: string, choice: string, amount: number, odds?: number) => {
    placeBet(market, choice, amount, odds)
  }

  return (
    <HomeView
      onBet={handleBet}
      onMarketClick={handleMarketClick}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    />
  )
}
