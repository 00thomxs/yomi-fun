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

  // Define NOW once at the top for consistent time reference
  const now = new Date()

  const handleBack = () => {
    router.back()
  }

  const handleBet = (marketId: string, choice: string, amount: number, odds?: number) => {
    placeBet(marketId, choice, amount, odds)
  }

  // Helper: Format time label (include date if not today)
  const formatTimeLabel = (date: Date) => {
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    // Include day/month for older points
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // Process real history
  const processHistory = (points: PricePoint[], outcomeIndexToCheck: number = 1) => {
    // Filter for the specific outcome (e.g. YES = 1 for binary)
    const filtered = points.filter(p => p.outcomeIndex === outcomeIndexToCheck)
    
    if (filtered.length === 0) return []

    // Map to Chart Data (ensure integers)
    return filtered.map(p => {
      const pointDate = new Date(p.date)
      return {
        time: formatTimeLabel(pointDate),
        fullDate: pointDate, 
        price: Math.round(p.probability)
      }
    })
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
        const pointDate = new Date(point.date)
        const snapshot: any = {
          time: formatTimeLabel(pointDate),
          fullDate: pointDate,
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
    const baseHistory = realHistory.length > 0 
      ? realHistory 
      : [{ time: formatTimeLabel(new Date(rawMarket.created_at)), fullDate: new Date(rawMarket.created_at), price: Math.round(prob) }]

    // Helper: Format time label
    const formatTimeLabel = (date: Date) => {
      const isToday = date.toDateString() === now.toDateString()
      if (isToday) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    // STRICT Timeframe Filter
    // This ensures the chart starts exactly at the timeframe cutoff (1H, 1D, etc.)
    // even if the last bet was days ago.
    const filterByTimeframe = (data: typeof baseHistory, hours: number | 'ALL') => {
      if (hours === 'ALL') return addNowPoint(baseHistory)

      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)
      
      // 1. Get points that happened AFTER cutoff
      const pointsInWindow = data.filter(p => p.fullDate >= cutoff)
      
      // 2. Find the state of the market AT the cutoff moment
      // (It's the value of the last point BEFORE cutoff)
      let startPoint = null
      if (pointsInWindow.length < data.length) {
        // Find last point before cutoff
        const previousPoint = [...data].reverse().find(p => p.fullDate < cutoff)
        if (previousPoint) {
          // Create a synthetic point exactly at cutoff time with the previous price
          startPoint = {
            time: formatTimeLabel(cutoff),
            fullDate: cutoff,
            price: previousPoint.price
          }
        }
      }

      // 3. Combine: [Synthetic Start] + [Real Points in Window] + [Now]
      let result = pointsInWindow
      if (startPoint) {
        result = [startPoint, ...pointsInWindow]
      } else if (result.length === 0 && data.length > 0) {
         // Should catch cases where we have history but nothing recent/before
         // Fallback to just showing the last known state
         const last = data[data.length - 1]
         result = [{
            time: formatTimeLabel(cutoff),
            fullDate: cutoff,
            price: last.price
         }]
      }
      
      return addNowPoint(result)
    }

    // Helper: Add "Now" point to extend the line to current time
    const addNowPoint = (data: typeof baseHistory) => {
      if (data.length === 0) {
        return [
          { time: formatTimeLabel(new Date(rawMarket.created_at)), fullDate: new Date(rawMarket.created_at), price: Math.round(prob) },
          { time: 'Maintenant', fullDate: now, price: Math.round(prob) }
        ]
      }
      const lastPoint = data[data.length - 1]
      // Avoid duplicate point if last point is very recent
      if (now.getTime() - lastPoint.fullDate.getTime() < 1000) return data
      
      return [
        ...data, 
        { time: 'Maintenant', fullDate: now, price: Math.round(lastPoint.price) }
      ]
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
      history1h: filterByTimeframe(baseHistory, 1),
      history6h: filterByTimeframe(baseHistory, 6),
      history24h: filterByTimeframe(baseHistory, 24),
      history7d: filterByTimeframe(baseHistory, 24 * 7),
      history30d: filterByTimeframe(baseHistory, 24 * 30),
      historyAll: filterByTimeframe(baseHistory, 'ALL')
    } as BinaryMarket
  } else {
    // Multi Logic
    const outcomes = rawMarket.outcomes || []
    // Sort outcomes by name to match the indexing logic in createMarket/placeBet
    const sortedOutcomes = [...outcomes].sort((a: any, b: any) => a.name.localeCompare(b.name))
    
    // Get base history (without "Now" point)
    let baseMultiHistory = processMultiHistory(history, sortedOutcomes)

    // If no history, create initial point from current outcome data
    if (baseMultiHistory.length === 0 && outcomes.length > 0) {
      const initialPoint: any = { 
        time: formatTimeLabel(new Date(rawMarket.created_at)), 
        fullDate: new Date(rawMarket.created_at) 
      }
      outcomes.forEach((o: any) => {
        initialPoint[o.name] = Math.round(o.probability)
      })
      baseMultiHistory.push(initialPoint)
    }

    // Filter by timeframe for Multi (same logic)
    const filterMultiByTimeframe = (data: typeof baseMultiHistory, hours: number | 'ALL') => {
      if (hours === 'ALL') return addMultiNowPoint(baseMultiHistory)

      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)
      const pointsInWindow = data.filter(p => p.fullDate >= cutoff)

      // Find state at cutoff
      let startPoint = null
      if (pointsInWindow.length < data.length) {
         const previousPoint = [...data].reverse().find(p => p.fullDate < cutoff)
         if (previousPoint) {
            // For multi, we need to copy ALL values from the previous point
            startPoint = {
              ...previousPoint,
              time: formatTimeLabel(cutoff),
              fullDate: cutoff
            }
         }
      }

      let result = pointsInWindow
      if (startPoint) {
        result = [startPoint, ...pointsInWindow]
      } else if (result.length === 0 && data.length > 0) {
         const last = data[data.length - 1]
         result = [{
            ...last,
            time: formatTimeLabel(cutoff),
            fullDate: cutoff
         }]
      }

      return addMultiNowPoint(result)
    }

    // Helper: Add "Now" point to extend lines to current time
    const addMultiNowPoint = (data: typeof baseMultiHistory) => {
      if (data.length === 0) {
        // No data - create initial + now from current probabilities
        const initialPoint: any = { 
          time: formatTimeLabel(new Date(rawMarket.created_at)), 
          fullDate: new Date(rawMarket.created_at) 
        }
        const nowPoint: any = { time: 'Maintenant', fullDate: now }
        outcomes.forEach((o: any) => {
          initialPoint[o.name] = Math.round(o.probability)
          nowPoint[o.name] = Math.round(o.probability)
        })
        return [initialPoint, nowPoint]
      }
      
      const lastSnapshot = data[data.length - 1]
      // Avoid duplicate
      if (now.getTime() - lastSnapshot.fullDate.getTime() < 1000) return data

      const nowPoint: any = { 
        ...lastSnapshot, 
        time: 'Maintenant', 
        fullDate: now 
      }
      return [...data, nowPoint]
    }

    const fullHistory = addMultiNowPoint(baseMultiHistory)

    market = {
      ...rawMarket,
      type: 'multi',
      bgImage: rawMarket.image_url || "/placeholder.svg",
      outcomes: outcomes,
      isLive: rawMarket.is_live && rawMarket.status !== 'resolved', 
      countdown: new Date(rawMarket.closes_at).toLocaleDateString(),
      historyData: fullHistory, 
      history1h: filterMultiByTimeframe(baseMultiHistory, 1),
      history6h: filterMultiByTimeframe(baseMultiHistory, 6),
      history24h: filterMultiByTimeframe(baseMultiHistory, 24),
      history7d: filterMultiByTimeframe(baseMultiHistory, 24 * 7),
      history30d: filterMultiByTimeframe(baseMultiHistory, 24 * 30),
      historyAll: fullHistory
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
