"use client"

import { useRouter } from "next/navigation"
import { useRef, useEffect, useState } from "react"
import { MarketDetailView } from "@/components/views/market-detail-view"
import { useUser } from "@/contexts/user-context"
import type { Market, BinaryMarket, MultiOutcomeMarket } from "@/lib/types"
import { PricePoint } from "@/app/actions/history"
import { MarketWinner } from "@/app/actions/market-stats"
import { SuccessPopup } from "@/components/ui/success-popup"

type MarketDetailContainerProps = {
  market: any // Raw Supabase data
  history: PricePoint[]
  userBets?: any[]
  topWinners?: MarketWinner[]
}

export function MarketDetailContainer({ market: rawMarket, history, userBets = [], topWinners = [] }: MarketDetailContainerProps) {
  const router = useRouter()
  const { placeBet, userBalance, user } = useUser()
  const lastBalanceRef = useRef<number>(userBalance)
  const [showWinPopup, setShowWinPopup] = useState(false)
  const [winAmount, setWinAmount] = useState(0)
  
  // STABLE timestamp using useRef - set once on mount, NEVER changes
  // This is crucial to prevent chart shifting on re-renders
  const nowRef = useRef<Date>(new Date())
  const now = nowRef.current

  // Check if user has won on this market and show popup (only once per market)
  useEffect(() => {
    if (!rawMarket.resolved_at || userBets.length === 0) return
    
    const storageKey = `win-popup-shown-${rawMarket.id}`
    const alreadyShown = sessionStorage.getItem(storageKey)
    
    if (alreadyShown) return
    
    // Calculate total winnings on this market
    const wonBets = userBets.filter((bet: any) => bet.status === 'won')
    if (wonBets.length === 0) return
    
    const totalWinnings = wonBets.reduce((sum: number, bet: any) => {
      return sum + (bet.potential_payout - bet.amount) // Net profit
    }, 0)
    
    if (totalWinnings > 0) {
      setWinAmount(Math.round(totalWinnings))
      setShowWinPopup(true)
      sessionStorage.setItem(storageKey, 'true')
    }
  }, [rawMarket.id, rawMarket.resolved_at, userBets])

  // Refresh page when user balance changes (indicates a bet was placed)
  // This triggers a server-side re-fetch of userBets
  useEffect(() => {
    if (lastBalanceRef.current !== userBalance) {
      lastBalanceRef.current = userBalance
      // Longer delay to ensure server has processed the bet
      const timeout = setTimeout(() => {
        // Update the timestamp for fresh data
        nowRef.current = new Date()
        router.refresh()
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [userBalance, router])

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

    // Pre-scan history to find the FIRST known value for each outcome
    // This sets the baseline to the oldest known state, instead of the current (future) state.
    const firstValues = new Map<string, number>()
    sortedPoints.forEach(p => {
        const name = indexToName.get(p.outcomeIndex)
        if (name && !firstValues.has(name)) {
            firstValues.set(name, p.probability)
        }
    })
    
    // Initialize currentValues with these FIRST known values
    outcomes.forEach(o => {
        if (firstValues.has(o.name)) {
            currentValues.set(o.name, firstValues.get(o.name)!)
        } else {
            // If an outcome never appears in history, fallback to 0
            currentValues.set(o.name, 0) 
        }
    })

    // 3. Walk through history
    sortedPoints.forEach(point => {
      const outcomeName = indexToName.get(point.outcomeIndex)
      if (outcomeName) {
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

    // If no history, create initial point ONLY if it's a brand new market (created < 1 min ago)
    // Otherwise we risk projecting current prices into the past.
    if (baseMultiHistory.length === 0 && outcomes.length > 0) {
       const isNew = new Date().getTime() - new Date(rawMarket.created_at).getTime() < 60000
       if (isNew) {
          const initialPoint: any = { 
            time: formatTimeLabel(new Date(rawMarket.created_at)), 
            fullDate: new Date(rawMarket.created_at) 
          }
          outcomes.forEach((o: any) => {
            initialPoint[o.name] = Math.round(o.probability)
          })
          baseMultiHistory.push(initialPoint)
       }
    }

    // Filter by timeframe for Multi
    const filterMultiByTimeframe = (data: typeof baseMultiHistory, hours: number | 'ALL') => {
      if (hours === 'ALL') return addMultiNowPoint(baseMultiHistory)

      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)
      const pointsInWindow = data.filter(p => p.fullDate >= cutoff)

      // Find state at cutoff (look backwards in time)
      let startPoint = null
      const previousPoint = [...data].reverse().find(p => p.fullDate < cutoff)
         
      if (previousPoint) {
        // For multi, we need to copy ALL values from the previous point
        startPoint = {
          ...previousPoint,
          time: formatTimeLabel(cutoff),
          fullDate: cutoff
        }
      }

      let result = pointsInWindow
      if (startPoint) {
        result = [startPoint, ...pointsInWindow]
      }
      // If no points in window and no previous point, we simply have NO data for this timeframe.
      // We do NOT fallback to the last known point because that would project future/current prices into the past.

      return addMultiNowPoint(result)
    }

    // Helper: Add "Now" point to extend lines to current time
    const addMultiNowPoint = (data: typeof baseMultiHistory) => {
      if (data.length === 0) {
        // No data found for this timeframe.
        // Do NOT invent data from current probabilities projected to the past.
        // Return empty to show "No data" or just a flat line if we decide to handle it differently later.
        return []
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
    <>
      <MarketDetailView
        market={market}
        onBack={handleBack}
        onBet={handleBet}
        userBalance={userBalance}
        userBets={userBets}
        userAvatar={user?.avatar}
        topWinners={topWinners}
      />
      
      {/* Bet Won Success Popup */}
      <SuccessPopup
        type="bet-won"
        isOpen={showWinPopup}
        onClose={() => setShowWinPopup(false)}
        data={{ winnings: winAmount }}
      />
    </>
  )
}
