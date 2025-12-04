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

    // Map to Chart Data (ensure integers)
    return filtered.map(p => ({
      time: new Date(p.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      fullDate: new Date(p.date), 
      price: Math.round(p.probability)
    }))
  }

  // Process real history for Multi Markets (Forward Fill strategy)
  const processMultiHistory = (points: PricePoint[], outcomes: any[]) => {
    if (!points || points.length === 0) return []

    // 1. Sort by date
    const sortedPoints = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 2. Map outcomeIndex to outcome Name
    const indexToName = new Map<number, string>()
    outcomes.forEach((o, idx) => indexToName.set(idx, o.name))

    const chartData: any[] = []
    const currentValues = new Map<string, number>()

    // Initialize currentValues with initial probabilities from outcomes (as fallback)
    outcomes.forEach(o => currentValues.set(o.name, o.probability))

    // 3. Walk through history
    sortedPoints.forEach(point => {
      const outcomeName = indexToName.get(point.outcomeIndex)
      if (outcomeName) {
        // Update the value for this outcome (convert back to percentage if needed, but history is already 0-100 based on my previous code?)
        // Wait, in history action I did: probability: row.probability * 100
        // So point.probability is 0-100.
        currentValues.set(outcomeName, point.probability)
        
        // Create a snapshot
        const snapshot: any = {
          time: new Date(point.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          fullDate: new Date(point.date),
        }
        
        // Add all current values to snapshot (ensure integers)
        currentValues.forEach((val, key) => {
          snapshot[key] = Math.round(val)
        })
        
        chartData.push(snapshot)
      }
    })

    return chartData
  }

  // Transform to UI Model
  let market: Market

  if (rawMarket.type === 'binary') {
    const yesOutcome = rawMarket.outcomes?.find((o: any) => o.name === 'OUI')
    const prob = yesOutcome?.probability || 50
    
    // Use real history or fallback to current price point
    const realHistory = processHistory(history, 1) // 1 = OUI
    let chartData = realHistory.length > 0 
      ? realHistory 
      : [{ time: 'Création', fullDate: new Date(rawMarket.created_at), price: prob }]

    // ALWAYS add "Now" point to draw a line (a chart needs at least 2 points!)
    if (chartData.length > 0) {
      const lastPoint = chartData[chartData.length - 1]
      chartData = [
        ...chartData, 
        { time: 'Maintenant', fullDate: new Date(), price: Math.round(lastPoint.price) }
      ]
    }

    // Filter by timeframe
    const now = new Date()
    const filterByTimeframe = (data: typeof chartData, hours: number) => {
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)
      const filtered = data.filter(p => p.fullDate >= cutoff)
      // Always include at least the last point + now if filtering removes everything
      if (filtered.length < 2 && data.length >= 2) {
        return [data[data.length - 2], data[data.length - 1]]
      }
      return filtered
    }

    market = {
      ...rawMarket,
      type: 'binary',
      probability: Math.round(prob),
      bgImage: rawMarket.image_url || "/placeholder.svg",
      yesPrice: prob / 100,
      noPrice: (100 - prob) / 100,
      volatility: "Moyenne",
      countdown: new Date(rawMarket.closes_at).toLocaleDateString(),
      isLive: rawMarket.is_live && rawMarket.status !== 'resolved', 
      history24h: filterByTimeframe(chartData, 24),
      history7d: filterByTimeframe(chartData, 24 * 7),
      historyAll: chartData
    } as BinaryMarket
  } else {
    // Multi Logic
    const outcomes = rawMarket.outcomes || []
    // Sort outcomes by name to match the indexing logic in createMarket/placeBet
    const sortedOutcomes = [...outcomes].sort((a: any, b: any) => a.name.localeCompare(b.name))
    
    const multiHistory = processMultiHistory(history, sortedOutcomes)

    // ALWAYS add "Now" point for Multi (chart needs at least 2 points!)
    if (multiHistory.length > 0) {
      const lastSnapshot = multiHistory[multiHistory.length - 1]
      multiHistory.push({
        ...lastSnapshot,
        time: 'Maintenant',
        fullDate: new Date()
      })
    } else if (outcomes.length > 0) {
      // No history yet, create initial + now points from current outcome data
      const initialPoint: any = { time: 'Création', fullDate: new Date(rawMarket.created_at) }
      const nowPoint: any = { time: 'Maintenant', fullDate: new Date() }
      
      outcomes.forEach((o: any) => {
        initialPoint[o.name] = Math.round(o.probability)
        nowPoint[o.name] = Math.round(o.probability)
      })
      
      multiHistory.push(initialPoint, nowPoint)
    }

    market = {
      ...rawMarket,
      type: 'multi',
      bgImage: rawMarket.image_url || "/placeholder.svg",
      outcomes: outcomes,
      isLive: rawMarket.is_live && rawMarket.status !== 'resolved', 
      countdown: new Date(rawMarket.closes_at).toLocaleDateString(),
      historyData: multiHistory.length > 0 ? multiHistory : []
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
