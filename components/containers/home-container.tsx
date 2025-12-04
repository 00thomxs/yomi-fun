"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HomeView } from "@/components/views/home-view"
import { useUser } from "@/contexts/user-context"
import type { Market } from "@/lib/types"
import { PricePoint } from "@/app/actions/history"

type HomeContainerProps = {
  initialMarkets: any[] // TODO: Typing
  marketsHistory?: Record<string, PricePoint[]>
}

export function HomeContainer({ initialMarkets, marketsHistory = {} }: HomeContainerProps) {
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

  // Helper: Transform history points to chart data format
  const processHistoryToChartData = (history: PricePoint[], probability: number, createdAt: string) => {
    if (!history || history.length === 0) {
      // No history - create 2 points with current probability
      return [
        { time: 'Création', price: probability },
        { time: 'Maintenant', price: probability }
      ]
    }
    
    // Map history to chart format
    const chartData = history.map(p => ({
      time: new Date(p.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      price: p.probability
    }))
    
    // Always add "Now" point
    const lastPrice = chartData[chartData.length - 1]?.price || probability
    chartData.push({ time: 'Maintenant', price: lastPrice })
    
    return chartData
  }

  // Transform Supabase data to match Market type if needed
  const markets = initialMarkets.map(m => {
    // Find probability for binary markets (ensure integer)
    let probability = 50
    if (m.type === 'binary' && m.outcomes && m.outcomes.length > 0) {
      const yesOutcome = m.outcomes.find((o: any) => o.name === 'OUI')
      if (yesOutcome) probability = Math.round(yesOutcome.probability)
    }

    // Get real history for this market
    const history = marketsHistory[m.id] || []
    const chartData = m.type === 'binary' 
      ? processHistoryToChartData(history, probability, m.created_at)
      : []

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
      volume: m.volume || 0,
      // Real chart data for cards
      history24h: chartData
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
