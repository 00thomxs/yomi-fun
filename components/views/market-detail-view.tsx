"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ArrowLeft, Clock, HelpCircle, Lock, Eye, EyeOff, User, Maximize2, X } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine, ReferenceDot } from "recharts"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import type { Market, BinaryMarket, MultiOutcomeMarket } from "@/lib/types"
import { CATEGORIES } from "@/lib/constants"
import Image from "next/image"
import type { MarketWinner } from "@/app/actions/market-stats"
import { TopWinners } from "@/components/market/top-winners"
import { useToast } from "@/hooks/use-toast"

// Helper to generate X Axis domain and REGULAR ticks
// Chart starts from market creation date (not before)
type TickFormatType = 'time' | 'day' | 'month'

// NOW RECEIVES stableNow as parameter to prevent shifting
const getAxisParams = (timeframe: string, data: any[], marketCreatedAt?: string, stableNow?: number) => {
  const now = stableNow || Date.now()
  const createdAt = marketCreatedAt ? new Date(marketCreatedAt).getTime() : now - 24 * 3600 * 1000
  
  let duration = 24 * 3600 * 1000
  
  if (timeframe === '1H') duration = 3600 * 1000
  else if (timeframe === '6H') duration = 6 * 3600 * 1000
  else if (timeframe === '1J' || timeframe === '24H') duration = 24 * 3600 * 1000
  else if (timeframe === '1S' || timeframe === '7J') duration = 7 * 24 * 3600 * 1000
  else if (timeframe === '1M' || timeframe === '30J') duration = 30 * 24 * 3600 * 1000
  else if (timeframe === 'TOUT') duration = now - createdAt + 3600 * 1000

  // Domain starts from market creation OR (now - duration), whichever is LATER
  const theoreticalStart = now - duration
  const start = Math.max(theoreticalStart, createdAt)
  const domain = [start, now]
  const realDuration = now - start

  // Determine tick interval based on REAL duration
  let tickInterval: number
  let formatType: TickFormatType = 'time'

  if (realDuration <= 24 * 3600 * 1000) {
    // Less than 24h -> Time format
    formatType = 'time'
    if (realDuration <= 3600 * 1000) tickInterval = 15 * 60 * 1000 // 15 min
    else if (realDuration <= 6 * 3600 * 1000) tickInterval = 60 * 60 * 1000 // 1h
    else tickInterval = 4 * 60 * 60 * 1000 // 4h
  } else if (realDuration <= 30 * 24 * 3600 * 1000) {
    // Less than 1 month -> Day format
    formatType = 'day'
    if (realDuration <= 7 * 24 * 3600 * 1000) tickInterval = 24 * 60 * 60 * 1000 // 1 day
    else tickInterval = 5 * 24 * 60 * 60 * 1000 // 5 days
  } else {
    // More than 1 month -> Day or Month format
    if (realDuration <= 365 * 24 * 3600 * 1000) {
      formatType = 'day'
      tickInterval = 7 * 24 * 60 * 60 * 1000 // Weekly
    } else {
      formatType = 'month'
      tickInterval = 30 * 24 * 60 * 60 * 1000 // Monthly
    }
  }

  // Generate regular ticks at round intervals (only within domain)
  const ticks: number[] = []
  let tick = Math.ceil(start / tickInterval) * tickInterval // Start at next round interval
  
  // Always add start point if gap to first tick is large
  if (tick - start > tickInterval * 0.2) {
    ticks.push(start)
  }

  while (tick <= now) {
    if (tick >= start) { 
      ticks.push(tick)
    }
    tick += tickInterval
  }
  
  // Always add end point if gap to last tick is large
  if (now - (ticks[ticks.length - 1] || start) > tickInterval * 0.2) {
    ticks.push(now)
  }

  // Limit to ~6 ticks max for readability
  while (ticks.length > 6) {
    const newTicks: number[] = []
    // Keep first, take every 2nd, keep last
    newTicks.push(ticks[0])
    for (let i = 1; i < ticks.length - 1; i += 2) {
      newTicks.push(ticks[i])
    }
    if (ticks.length > 1) newTicks.push(ticks[ticks.length - 1])
    
    ticks.length = 0
    ticks.push(...newTicks)
  }

  return { domain, ticks, formatType }
}

// Explicit tick formatter - clean output without weird locale issues
const formatTickLabel = (ts: number, formatType: TickFormatType): string => {
  const date = new Date(ts)
  
  if (formatType === 'time') {
    // HH:mm format
    const hours = date.getHours().toString().padStart(2, '0')
    const mins = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${mins}`
  } else if (formatType === 'day') {
    // "5 déc." format - day + short month, NO time
    const day = date.getDate()
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    return `${day} ${months[date.getMonth()]}`
  } else {
    // "déc. 2024" for very long events
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }
}

// Helper to generate clean Y-axis ticks (multiples of 5 or 10)
const getCleanYTicks = (min: number, max: number) => {
  const range = max - min
  let step = 10
  if (range <= 20) step = 5
  else if (range <= 50) step = 10
  else step = 25

  const ticks = []
  // Start at nearest multiple of step
  let current = Math.ceil(min / step) * step
  
  // Ensure we cover the full range including near-boundaries
  if (current > min) ticks.push(min) // Optional: include exact min? No, prefer clean numbers
  
  // Reset start to first clean number >= min
  current = Math.ceil(min / step) * step
  
  while (current <= max) {
    ticks.push(current)
    current += step
  }
  
  return ticks
}

type MarketDetailViewProps = {
  market: Market
  onBack: () => void
  onBet: (market: string, choice: string, amount: number, odds?: number) => void
  userBalance: number
  userBets?: any[]
  userAvatar?: string
  topWinners?: MarketWinner[]
}

export function MarketDetailView({ market, onBack, onBet, userBalance, userBets = [], userAvatar, topWinners = [] }: MarketDetailViewProps) {
  const { toast } = useToast()
  const [timeframe, setTimeframe] = useState<"1H" | "6H" | "1J" | "1S" | "1M" | "TOUT">("1H")
  const [betChoice, setBetChoice] = useState<string>(market.type === "binary" ? "YES" : (market as MultiOutcomeMarket).outcomes[0].name)
  const [betAmount, setBetAmount] = useState("")
  const [betType, setBetType] = useState<"OUI" | "NON">("OUI")
  
  // Current time state - updates periodically to extend chart
  const [currentNow, setCurrentNow] = useState<number>(Date.now())
  
  // Update currentNow every 10 seconds to extend chart in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNow(Date.now())
    }, 10000) // 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Also update when timeframe changes (immediate refresh)
  const handleTimeframeChange = (tf: "1H" | "6H" | "1J" | "1S" | "1M" | "TOUT") => {
    setCurrentNow(Date.now())
    setTimeframe(tf)
  }

  // Check if market is resolved (betting disabled)
  const isResolved = !market.isLive

  // Find correct icon from constants
  const categoryDef = CATEGORIES.find(c => c.id === market.category) || CATEGORIES.find(c => c.label === market.category)
  const CategoryIcon = categoryDef?.icon || HelpCircle

  const getBinaryChartData = () => {
    if (market.type !== "binary") return []
    const binaryMarket = market as BinaryMarket
    if (timeframe === "1H") return binaryMarket.history1h || binaryMarket.history24h
    if (timeframe === "6H") return binaryMarket.history6h || binaryMarket.history24h
    if (timeframe === "1J") return binaryMarket.history24h
    if (timeframe === "1S") return binaryMarket.history7d
    if (timeframe === "1M") return binaryMarket.history30d || binaryMarket.historyAll
    return binaryMarket.historyAll
  }

  const getMultiChartData = () => {
    if (market.type !== "multi") return []
    const multiMarket = market as MultiOutcomeMarket
    // Use timeframe-filtered history data
    if (timeframe === "1H") return multiMarket.history1h || multiMarket.history24h || []
    if (timeframe === "6H") return multiMarket.history6h || multiMarket.history24h || []
    if (timeframe === "1J") return multiMarket.history24h || multiMarket.historyData || []
    if (timeframe === "1S") return multiMarket.history7d || multiMarket.historyData || []
    if (timeframe === "1M") return multiMarket.history30d || multiMarket.historyData || []
    return multiMarket.historyAll || multiMarket.historyData || []
  }

  const rawChartData = market.type === "binary" ? getBinaryChartData() : getMultiChartData()
  
  // Extend chart data to current time (so curve always reaches "now")
  const chartData = useMemo(() => {
    if (rawChartData.length === 0) return rawChartData
    
    const lastPoint = rawChartData[rawChartData.length - 1] as any
    const lastTs = lastPoint.fullDate instanceof Date 
      ? lastPoint.fullDate.getTime() 
      : new Date(lastPoint.fullDate).getTime()
    
    // If the last point is more than 5 seconds behind currentNow, add a new "now" point
    if (currentNow - lastTs > 5000) {
      const nowPoint = {
        ...lastPoint,
        time: 'Maintenant',
        fullDate: new Date(currentNow)
      }
      return [...rawChartData.slice(0, -1), nowPoint] // Replace last "Maintenant" with updated one
    }
    
    return rawChartData
  }, [rawChartData, currentNow])
  
  // Calculate SMART dynamic scale for Binary Charts
  // Goals: 1) Show context (not too zoomed), 2) Highlight volatility, 3) Always make sense
  const prices = chartData.length > 0 ? chartData.map((p: any) => p.price) : [50]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  
  // Ensure minimum visible range of 20% for context
  const minVisibleRange = 20
  const effectiveRange = Math.max(priceRange, minVisibleRange)
  
  // Add 15% padding on each side
  const padding = Math.max(5, effectiveRange * 0.15)
  
  // Helper to round to nearest multiple of 5
  const roundDownTo5 = (n: number) => Math.floor(n / 5) * 5
  const roundUpTo5 = (n: number) => Math.ceil(n / 5) * 5
  
  // Calculate bounds, centered on data if range is small
  let yMin: number, yMax: number
  if (priceRange < minVisibleRange) {
    // Small volatility: center the view on the data
    const center = (minPrice + maxPrice) / 2
    yMin = Math.max(0, roundDownTo5(center - effectiveRange / 2 - padding))
    yMax = Math.min(100, roundUpTo5(center + effectiveRange / 2 + padding))
  } else {
    // Normal volatility: use actual data bounds with padding
    yMin = Math.max(0, roundDownTo5(minPrice - padding))
    yMax = Math.min(100, roundUpTo5(maxPrice + padding))
  }
  
  // Ensure we don't have a weird tiny range (min 20% spread)
  if (yMax - yMin < 20) {
    const mid = (yMin + yMax) / 2
    yMin = Math.max(0, roundDownTo5(mid - 12))
    yMax = Math.min(100, roundUpTo5(mid + 12))
  }

  const trend =
    market.type === "binary"
      ? chartData.length > 0 && (chartData[chartData.length - 1] as any).price > (chartData[0] as any).price
        ? "up"
        : "down"
      : "up"

  const calculatePayout = () => {
    const amount = Number.parseFloat(betAmount) || 0
    if (market.type === "binary") {
      const binaryMarket = market as BinaryMarket
      const odds = betChoice === "YES" ? binaryMarket.yesPrice : binaryMarket.noPrice
      return Math.round(amount / odds) // Integer only
    } else {
      const multiMarket = market as MultiOutcomeMarket
      const outcome = multiMarket.outcomes.find((o) => o.name === betChoice)
      if (outcome) {
        const prob = betType === "OUI" ? outcome.probability : 100 - outcome.probability
        return Math.round(amount / (prob / 100)) // Integer only
      }
      return Math.round(amount)
    }
  }

  const handlePlaceBet = () => {
    const amount = Number.parseFloat(betAmount) || 0
    const payout = calculatePayout()

    if (amount > 0) {
      if (market.type === "binary") {
        const displayChoice = betChoice === "YES" ? "OUI" : "NON"
        onBet(market.id, displayChoice, amount)
      } else {
        onBet(market.id, `${betType} ${betChoice}`, amount)
      }
      setBetAmount("")
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-lg bg-card border border-border hover:border-white/20 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{categoryDef?.label || market.category}</p>
            {market.isLive ? (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-primary font-medium uppercase tracking-wider">Live</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">•</span>
                {market.status === 'resolved' || market.resolved_at ? (
                  <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                    Terminé
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                    En attente
                  </span>
                )}
              </>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {market.countdown}
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-balance leading-tight">{market.question}</h2>
        </div>
      </div>

      {market.type === "binary" ? (
        <BinaryMarketContent
          market={market as BinaryMarket}
          timeframe={timeframe}
          setTimeframe={handleTimeframeChange}
          betChoice={betChoice}
          setBetChoice={setBetChoice}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          chartData={chartData}
          trend={trend}
          calculatePayout={calculatePayout}
          handlePlaceBet={handlePlaceBet}
          userBalance={userBalance}
          isResolved={isResolved}
          yMin={yMin}
          yMax={yMax}
          userBets={userBets}
          userAvatar={userAvatar}
          stableNow={currentNow}
        />
      ) : (
        <MultiMarketContent
          market={market as MultiOutcomeMarket}
          timeframe={timeframe}
          setTimeframe={handleTimeframeChange}
          betChoice={betChoice}
          setBetChoice={setBetChoice}
          betType={betType}
          setBetType={setBetType}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          chartData={chartData}
          calculatePayout={calculatePayout}
          handlePlaceBet={handlePlaceBet}
          userBalance={userBalance}
          isResolved={isResolved}
          userBets={userBets}
          userAvatar={userAvatar}
          stableNow={currentNow}
        />
      )}

      {/* Top Winners - Only shown when there are winners */}
      {topWinners && topWinners.length > 0 && (
        <TopWinners winners={topWinners} />
      )}
    </div>
  )
}

// Binary Market Content Component
function BinaryMarketContent({
  market,
  timeframe,
  setTimeframe,
  betChoice,
  setBetChoice,
  betAmount,
  setBetAmount,
  chartData,
  trend,
  calculatePayout,
  handlePlaceBet,
  userBalance,
  isResolved,
  yMin,
  yMax,
  userBets = [],
  userAvatar,
  stableNow
}: {
  market: BinaryMarket
  timeframe: string
  setTimeframe: (tf: "1H" | "6H" | "1J" | "1S" | "1M" | "TOUT") => void
  betChoice: string
  setBetChoice: (choice: string) => void
  betAmount: string
  setBetAmount: (amount: string) => void
  chartData: any[]
  trend: string
  calculatePayout: () => number
  handlePlaceBet: () => void
  userBalance: number
  isResolved: boolean
  yMin: number
  yMax: number
  userBets?: any[]
  userAvatar?: string
  stableNow: number
}) {
  const { domain, ticks, formatType } = getAxisParams(timeframe, chartData, market.created_at, stableNow)
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Transform data to have numeric timestamp for proper X axis scaling
  const chartDataWithTs = chartData.map((d: any) => ({
    ...d,
    ts: d.fullDate instanceof Date ? d.fullDate.getTime() : new Date(d.fullDate).getTime()
  }))

  const formatTick = (ts: number) => formatTickLabel(ts, formatType)
  
  // Generate clean Y ticks
  const yTicks = getCleanYTicks(yMin, yMax)

  // Process user bets to get chart markers
  const userBetMarkers = useMemo(() => {
    if (!userBets || userBets.length === 0) return []
    
    return userBets.map(bet => {
      const betTs = new Date(bet.created_at).getTime()
      // Find the closest chart point to this bet timestamp
      let closestPoint = chartDataWithTs[0]
      let minDiff = Infinity
      
      for (const point of chartDataWithTs) {
        const diff = Math.abs(point.ts - betTs)
        if (diff < minDiff) {
          minDiff = diff
          closestPoint = point
        }
      }
      
      return {
        ts: betTs,
        price: closestPoint?.price || 50,
        amount: bet.amount,
        outcomeName: bet.outcomes?.name || 'N/A'
      }
    })
    // Show all user bets (no domain filtering - we want to see all bets on this market)
  }, [userBets, chartDataWithTs])

  return (
    <>
      {/* Resolved Banner */}
      {isResolved && (
        market.status === 'resolved' || market.resolved_at ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-red-400 font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Marché Terminé
            </p>
            <p className="text-red-400/70 text-sm mt-1">Le résultat est connu et les gains distribués</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center animate-pulse">
            <p className="text-amber-400 font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" /> En attente du résultat
            </p>
            <p className="text-amber-400/70 text-sm mt-1">Le marché est clos, le résultat sera bientôt annoncé</p>
          </div>
        )
      )}

      {/* Probability Display */}
      <div className="text-center space-y-2">
        <p className="text-7xl font-bold tracking-tighter text-white font-mono">{Math.round(market.probability)}%</p>
        <p className="text-sm font-medium text-muted-foreground tracking-tight uppercase">
          {market.probability >= 85
            ? "Quasi Certain"
            : market.probability >= 65
              ? "Tres Probable"
              : market.probability >= 35
                ? "Incertain"
                : "Peu Probable"}
        </p>
      </div>

      {/* Timeframe Selector + Chart Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["1H", "6H", "1J", "1S", "1M", "TOUT"] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs tracking-tight transition-all font-mono whitespace-nowrap ${
              timeframe === tf
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-white/20"
            }`}
          >
            {tf}
          </button>
        ))}
        </div>
        <button
          onClick={() => setIsFullscreen(true)}
          className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
          title="Plein écran"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h3 className="font-bold text-lg">{market.question}</h3>
              <p className="text-sm text-muted-foreground">{Math.round(market.probability)}% • {timeframe}</p>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="w-full max-w-6xl bg-card rounded-xl border border-border p-6 relative">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
                <span className="text-8xl font-black tracking-tighter">YOMI.fun</span>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <AreaChart data={chartDataWithTs}>
                  <defs>
                    <linearGradient id="chartGradientFullscreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    scale="time"
                    domain={domain}
                    ticks={ticks.length > 0 ? ticks : [domain[0], domain[1]]}
                    tickFormatter={formatTick}
                    stroke="#64748b"
                    style={{ fontSize: "12px", fontFamily: "ui-monospace, monospace" }}
                    tick={{ fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    ticks={yTicks}
                    stroke="#64748b"
                    orientation="right"
                    style={{ fontSize: "12px", fontFamily: "ui-monospace, monospace" }}
                    tick={{ fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${Math.round(value)}%`, "Probabilité"]}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <ReferenceLine y={50} stroke="#334155" strokeDasharray="3 3" />
                  <Area
                    type="linear"
                    dataKey="price"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="url(#chartGradientFullscreen)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {new Date(domain[0]).toLocaleDateString('fr-FR')} - {new Date(domain[1]).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-lg font-bold font-mono">{Math.round(market.probability)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl bg-card border border-border p-5 relative">
        {/* Watermark center (always visible but very subtle) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <span className="text-6xl font-black tracking-tighter">YOMI.fun</span>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartDataWithTs}>
            <defs>
              <linearGradient id="chartGradientMonochrome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={domain}
              ticks={ticks.length > 0 ? ticks : [domain[0], domain[1]]}
              tickFormatter={formatTick}
              stroke="#64748b"
              style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={[yMin, yMax]}
              ticks={yTicks}
              stroke="#64748b"
              orientation="right"
              style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
              }}
              labelStyle={{ color: "#94a3b8", fontSize: "11px", fontFamily: "ui-monospace, monospace" }}
              itemStyle={{
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "bold",
                fontFamily: "ui-monospace, monospace",
              }}
              formatter={(value: number) => [`${Math.round(value)}%`, "Probabilité"]}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <ReferenceLine y={50} stroke="#334155" strokeDasharray="3 3" />
            {chartDataWithTs.length > 0 && (
              <ReferenceDot
                x={chartDataWithTs[chartDataWithTs.length - 1].ts}
                y={chartDataWithTs[chartDataWithTs.length - 1].price}
                r={4}
                shape={(props: any) => (
                  <g>
                    <circle cx={props.cx} cy={props.cy} r={8} fill="#ffffff" className="animate-pulse opacity-30" />
                    <circle cx={props.cx} cy={props.cy} r={4} fill="#ffffff" />
                  </g>
                )}
              />
            )}
            {/* User bet markers - smart positioning relative to point */}
            {userBetMarkers.map((marker, idx) => (
              <ReferenceDot
                key={`user-bet-${idx}`}
                x={marker.ts}
                y={marker.price}
                r={0}
                shape={(props: any) => {
                  // Smart positioning: relative to the point
                  // If price > 50%, put avatar BELOW the point (add to Y)
                  // If price <= 50%, put avatar ABOVE the point (subtract from Y)
                  const isHighPrice = marker.price > 50
                  const offset = 35 // Distance from point - closer as requested
                  const avatarY = isHighPrice ? props.cy + offset : props.cy - offset
                  
                  // Theme Red color (Red-500 for neon/dark red look)
                  const themeRed = "#ef4444"
                  const themeBg = "#1a1a1a"
                  
                  return (
                    <g className="user-bet-marker">
                      {/* Vertical line connecting avatar to chart point - dashed & subtle */}
                      <line 
                        x1={props.cx} 
                        y1={props.cy} 
                        x2={props.cx} 
                        y2={avatarY}
                        stroke={themeRed} 
                        strokeWidth={1} 
                        strokeDasharray="2 2"
                        opacity={0.4}
                      />
                      
                      {/* The point on the curve */}
                      <circle cx={props.cx} cy={props.cy} r={3.5} fill={themeBg} stroke={themeRed} strokeWidth={2} />
                      
                      {/* Avatar Container - NO hover scaling to prevent jitter */}
                      <g>
                        {/* Glow */}
                        <circle cx={props.cx} cy={avatarY} r={15} fill={themeRed} opacity={0.2} />
                        
                        {/* Avatar Border */}
                        <circle cx={props.cx} cy={avatarY} r={12} fill={themeBg} stroke={themeRed} strokeWidth={1.5} />
                        
                        {/* Avatar Image */}
                        {userAvatar ? (
                          <>
                            <defs>
                              <clipPath id={`avatar-clip-${idx}`}>
                                <circle cx={props.cx} cy={avatarY} r={10} />
                              </clipPath>
                            </defs>
                            <image
                              href={userAvatar}
                              x={props.cx - 10}
                              y={avatarY - 10}
                              width={20}
                              height={20}
                              clipPath={`url(#avatar-clip-${idx})`}
                              preserveAspectRatio="xMidYMid slice"
                            />
                          </>
                        ) : (
                          <text x={props.cx} y={avatarY + 3.5} textAnchor="middle" fontSize="10">💰</text>
                        )}

                        {/* Bet Amount Label (pill shape) */}
                        <g transform={`translate(${props.cx + 16}, ${avatarY - 8})`}>
                          <rect
                            width={46}
                            height={16}
                            rx={4}
                            fill={themeBg}
                            stroke={themeRed}
                            strokeWidth={1}
                            opacity={0.9}
            />
                          <text
                            x={23}
                            y={11}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="ui-monospace, monospace"
                            fill={themeRed}
                          >
                            {marker.amount} Z
                          </text>
                        </g>
                      </g>
                    </g>
                  )
                }}
              />
            ))}
            <Area
              type="linear"
              dataKey="price"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#chartGradientMonochrome)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#ffffff" }}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex justify-end items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${trend === "up" ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
          <p className="text-sm font-bold text-white font-mono tracking-tight">
            {Math.round(chartData[chartData.length - 1]?.price || 0)}%
          </p>
        </div>
      </div>

      {/* Betting Panel */}
      {!isResolved && (
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setBetChoice("YES")}
            className={`py-3 px-4 rounded-lg font-bold tracking-tight transition-all ${
              betChoice === "YES"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "bg-white/5 border border-border text-muted-foreground hover:border-white/20"
            }`}
          >
            OUI • <span className="font-mono">{Math.round(market.probability)}%</span>
          </button>
          <button
            onClick={() => setBetChoice("NO")}
            className={`py-3 px-4 rounded-lg font-bold tracking-tight transition-all ${
              betChoice === "NO"
                  ? "bg-rose-500/30 text-rose-400 border border-rose-500"
                : "bg-white/5 border border-border text-muted-foreground hover:border-white/20"
            }`}
          >
              NON • <span className="font-mono">{Math.round(100 - market.probability)}%</span>
          </button>
        </div>

        <BetAmountInput
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          userBalance={userBalance}
          calculatePayout={calculatePayout}
          handlePlaceBet={handlePlaceBet}
          hasBet={userBets && userBets.length > 0}
        />
      </div>
      )}
    </>
  )
}

// Multi Market Content Component
function MultiMarketContent({
  market,
  timeframe,
  setTimeframe,
  betChoice,
  setBetChoice,
  betType,
  setBetType,
  betAmount,
  setBetAmount,
  chartData,
  calculatePayout,
  handlePlaceBet,
  userBalance,
  isResolved,
  userBets = [],
  userAvatar,
  stableNow
}: {
  market: MultiOutcomeMarket
  timeframe: string
  setTimeframe: (tf: "1H" | "6H" | "1J" | "1S" | "1M" | "TOUT") => void
  betChoice: string
  setBetChoice: (choice: string) => void
  betType: "OUI" | "NON"
  setBetType: (type: "OUI" | "NON") => void
  betAmount: string
  setBetAmount: (amount: string) => void
  chartData: any[]
  calculatePayout: () => number
  handlePlaceBet: () => void
  userBalance: number
  isResolved: boolean
  userBets?: any[]
  userAvatar?: string
  stableNow: number
}) {
  // Track which outcomes are visible (for interactive legend)
  const [visibleOutcomes, setVisibleOutcomes] = useState<Set<string>>(
    new Set(market.outcomes.slice(0, 4).map(o => o.name))
  )
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleOutcome = (name: string) => {
    setVisibleOutcomes(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        // Don't allow hiding all - keep at least 1
        if (next.size > 1) next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  // Calculate dynamic Y max for Multi (only for visible outcomes)
  const visibleOutcomeNames = Array.from(visibleOutcomes)
  const allProbs = [
    ...market.outcomes.filter(o => visibleOutcomes.has(o.name)).map(o => o.probability),
    ...chartData.flatMap(d => visibleOutcomeNames.map(name => Number(d[name]) || 0))
  ]
  const maxProb = Math.max(...allProbs, 40) // Minimum 40% scale to avoid too much zoom
  const multiYMax = Math.min(100, Math.ceil((maxProb + 5) / 10) * 10) // Round up to nearest 10
  
  // Generate clean Y ticks for multi-outcome (always 0 at bottom)
  const multiYTicks = getCleanYTicks(0, multiYMax)

  // Get axis params for timeframe (using stableNow to prevent shifting)
  const { domain, ticks, formatType } = getAxisParams(timeframe, chartData, market.created_at, stableNow)

  // Transform data to have numeric timestamp for proper X axis scaling
  const chartDataWithTs = chartData.map((d: any) => ({
    ...d,
    ts: d.fullDate instanceof Date ? d.fullDate.getTime() : new Date(d.fullDate).getTime()
  }))

  const formatTick = (ts: number) => formatTickLabel(ts, formatType)

  // Process user bets to get chart markers (for multi)
  // Only show markers for VISIBLE outcomes (from legend)
  const userBetMarkers = useMemo(() => {
    if (!userBets || userBets.length === 0) return []
    
    return userBets
      .map(bet => {
        const betTs = new Date(bet.created_at).getTime()
        // Find the closest chart point to this bet timestamp
        let closestPoint = chartDataWithTs[0]
        let minDiff = Infinity
        
        for (const point of chartDataWithTs) {
          const diff = Math.abs(point.ts - betTs)
          if (diff < minDiff) {
            minDiff = diff
            closestPoint = point
          }
        }
        
        // Get the outcome that was bet on
        const outcomeName = bet.outcomes?.name || 'N/A'
        const outcomeY = closestPoint?.[outcomeName] || 50
        // Get the color of this outcome
        const outcomeColor = market.outcomes.find(o => o.name === outcomeName)?.color || '#fbbf24'
        
        return {
          ts: betTs,
          price: outcomeY,
          amount: bet.amount,
          outcomeName,
          color: outcomeColor
        }
      })
      // FILTER: Only show markers for outcomes that are currently visible in the legend
      .filter(marker => visibleOutcomes.has(marker.outcomeName))
  }, [userBets, chartDataWithTs, visibleOutcomes, market.outcomes])

  return (
    <>
      {/* Resolved Banner */}
      {isResolved && (
        market.status === 'resolved' || market.resolved_at ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-red-400 font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Marché Terminé
            </p>
            <p className="text-red-400/70 text-sm mt-1">Le résultat est connu et les gains distribués</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center animate-pulse">
            <p className="text-amber-400 font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" /> En attente du résultat
            </p>
            <p className="text-amber-400/70 text-sm mt-1">Le marché est clos, le résultat sera bientôt annoncé</p>
          </div>
        )
      )}

      {/* Outcomes List */}
      <div className="space-y-3">
        {market.outcomes.map((outcome) => {
          const nonProb = 100 - outcome.probability
          return (
            <div
              key={outcome.name}
              className={`p-4 rounded-xl border transition-all ${
                betChoice === outcome.name
                  ? "bg-white/5 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  : "bg-white/5 border-border hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: outcome.color }} />
                  <span className="font-semibold">{outcome.name}</span>
                </div>
                <span className="text-2xl font-bold font-mono">{Math.round(outcome.probability)}%</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {isResolved ? (
                  <div className={`col-span-2 py-3 px-4 rounded-lg border text-center flex items-center justify-center gap-2 ${
                    market.status === 'resolved' || market.resolved_at
                      ? // @ts-ignore
                        outcome.is_winner === true 
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' 
                          : 'bg-rose-500/5 border-rose-500/30 text-rose-400'
                      : 'bg-amber-500/5 border-amber-500/30 text-amber-400'
                  }`}>
                    <span className="text-sm font-bold uppercase">
                      {market.status === 'resolved' || market.resolved_at ? (
                        // @ts-ignore
                        outcome.is_winner === true ? "Résultat : OUI" : "Résultat : NON"
                      ) : (
                        "En attente du résultat"
                      )}
                    </span>
                  </div>
                ) : (
                  <>
                <button
                  onClick={() => {
                    setBetChoice(outcome.name)
                    setBetType("OUI")
                  }}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm tracking-tight transition-all ${
                    betChoice === outcome.name && betType === "OUI"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                      OUI • <span className="font-mono">{Math.round(outcome.probability)}%</span>
                </button>
                <button
                  onClick={() => {
                    setBetChoice(outcome.name)
                    setBetType("NON")
                  }}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm tracking-tight transition-all ${
                    betChoice === outcome.name && betType === "NON"
                          ? "bg-rose-500/30 text-rose-400 border border-rose-500"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                      NON • <span className="font-mono">{Math.round(nonProb)}%</span>
                </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-card border border-border p-5 relative">
        {/* Watermark center (always visible but very subtle) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <span className="text-6xl font-black tracking-tighter">YOMI.fun</span>
        </div>

        <div className="flex items-center justify-between mb-4 relative z-10">
          <p className="text-sm font-bold tracking-tight uppercase">Evolution des cotes</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(["1H", "6H", "1J", "1S", "1M", "TOUT"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                  timeframe === tf
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 border border-border hover:border-white/20"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-lg bg-white/5 border border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
              title="Plein écran"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
        </div>
        </div>
        
        {/* Fullscreen Modal for Multi */}
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h3 className="font-bold text-lg">{market.question}</h3>
                <p className="text-sm text-muted-foreground">{market.outcomes.length} outcomes • {timeframe}</p>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="w-full max-w-6xl bg-card rounded-xl border border-border p-6 relative">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
                  <span className="text-8xl font-black tracking-tighter">YOMI.fun</span>
                </div>
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={chartDataWithTs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
            <XAxis
                      dataKey="ts"
                      type="number"
                      scale="time"
                      domain={domain}
                      ticks={ticks.length > 0 ? ticks : [domain[0], domain[1]]}
                      tickFormatter={formatTick}
              stroke="#64748b"
                      style={{ fontSize: "12px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
                      domain={[0, multiYMax]}
                      ticks={multiYTicks}
                      orientation="right"
              stroke="#64748b"
                      style={{ fontSize: "12px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    {market.outcomes.slice(0, 4).filter(o => visibleOutcomes.has(o.name)).map((outcome) => (
                      <Line
                        key={outcome.name}
                        type="linear"
                        dataKey={outcome.name}
                        stroke={outcome.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {market.outcomes.slice(0, 4).map((outcome) => (
                    <button
                      key={outcome.name}
                      onClick={() => toggleOutcome(outcome.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        visibleOutcomes.has(outcome.name)
                          ? 'bg-white/10 border border-white/20'
                          : 'bg-white/5 border border-transparent opacity-50'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: outcome.color }} />
                      <span className="text-sm font-medium">{outcome.name}</span>
                      <span className="font-mono text-sm">{Math.round(outcome.probability)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartDataWithTs}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={domain}
              ticks={ticks.length > 0 ? ticks : [domain[0], domain[1]]}
              tickFormatter={formatTick}
              stroke="#64748b"
              style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={[0, multiYMax]} 
              ticks={multiYTicks}
              orientation="right"
              stroke="#64748b"
              style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  // Sort payload by probability descending
                  const sortedPayload = [...payload].sort((a: any, b: any) => Number(b.value) - Number(a.value))
                  
                  return (
                    <div className="bg-slate-900/95 border border-white/10 rounded-lg p-3 backdrop-blur-md shadow-xl">
                      <p className="text-[10px] text-slate-400 font-mono mb-2">{new Date(label).toLocaleString()}</p>
                      <div className="space-y-1">
                        {sortedPayload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-xs font-medium text-slate-200">{entry.name}</span>
                            </div>
                            <span className="text-xs font-bold font-mono text-white">{Math.round(Number(entry.value))}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            {/* Pulsing dots for visible outcomes */}
            {market.outcomes.slice(0, 4).filter(o => visibleOutcomes.has(o.name)).map((outcome) => (
              <ReferenceDot
                key={`dot-${outcome.name}`}
                x={chartDataWithTs.length > 0 ? chartDataWithTs[chartDataWithTs.length - 1].ts : 0}
                y={chartDataWithTs.length > 0 ? Number(chartDataWithTs[chartDataWithTs.length - 1][outcome.name] || 0) : 0}
                r={4}
                shape={(props: any) => (
                  <g>
                    <circle cx={props.cx} cy={props.cy} r={8} fill={outcome.color} className="animate-pulse opacity-30" />
                    <circle cx={props.cx} cy={props.cy} r={4} fill={outcome.color} stroke="#fff" strokeWidth={1} />
                  </g>
                )}
              />
            ))}
            {/* User bet markers - smart positioning relative to point */}
            {userBetMarkers.map((marker, idx) => (
              <ReferenceDot
                key={`user-bet-${idx}`}
                x={marker.ts}
                y={marker.price}
                r={0}
                shape={(props: any) => {
                  // Smart positioning logic
                  const isHighPrice = marker.price > 50
                  const offset = 35 // Distance from point
                  const avatarY = isHighPrice ? props.cy + offset : props.cy - offset
                  
                  const markerColor = marker.color
                  const themeBg = "#1a1a1a"
                  
                  return (
                    <g className="user-bet-marker">
                      {/* Connection line from point to avatar */}
                      <line 
                        x1={props.cx} 
                        y1={props.cy} 
                        x2={props.cx} 
                        y2={avatarY}
                        stroke={markerColor} 
                        strokeWidth={1} 
                        strokeDasharray="2 2"
                        opacity={0.4}
                      />
                      
                      {/* Point on curve */}
                      <circle cx={props.cx} cy={props.cy} r={3} fill={themeBg} stroke={markerColor} strokeWidth={2} />
                      
                      {/* Avatar Container */}
                      <g>
                        {/* Glow */}
                        <circle cx={props.cx} cy={avatarY} r={14} fill={markerColor} opacity={0.15} />
                        
                        {/* Border */}
                        <circle cx={props.cx} cy={avatarY} r={11} fill={themeBg} stroke={markerColor} strokeWidth={1.5} />
                        
                        {/* Image */}
                        {userAvatar ? (
                          <>
                            <defs>
                              <clipPath id={`multi-avatar-clip-${idx}`}>
                                <circle cx={props.cx} cy={avatarY} r={9} />
                              </clipPath>
                            </defs>
                            <image
                              href={userAvatar}
                              x={props.cx - 9}
                              y={avatarY - 9}
                              width={18}
                              height={18}
                              clipPath={`url(#multi-avatar-clip-${idx})`}
                              preserveAspectRatio="xMidYMid slice"
                            />
                          </>
                        ) : (
                          <text x={props.cx} y={avatarY + 3} textAnchor="middle" fontSize="9" fill={markerColor}>💰</text>
                        )}
                      </g>
                    </g>
                  )
                }}
              />
            ))}
            {/* Lines for visible outcomes only */}
            {market.outcomes.slice(0, 4).filter(o => visibleOutcomes.has(o.name)).map((outcome) => (
              <Line
                key={outcome.name}
                type="linear"
                dataKey={outcome.name}
                stroke={outcome.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Interactive Legend */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
          {market.outcomes.slice(0, 4).map((outcome) => {
            const isVisible = visibleOutcomes.has(outcome.name)
            return (
              <button
                key={outcome.name}
                onClick={() => toggleOutcome(outcome.name)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${
                  isVisible 
                    ? 'bg-white/10 border border-white/20' 
                    : 'bg-white/5 border border-transparent opacity-50'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full transition-opacity" 
                  style={{ 
                    backgroundColor: outcome.color,
                    opacity: isVisible ? 1 : 0.3
                  }}
                />
                <span className={`text-xs font-medium transition-colors ${
                  isVisible ? 'text-white' : 'text-muted-foreground'
                }`}>
                  {outcome.name}
                </span>
                <span className={`text-xs font-mono ${isVisible ? 'text-white' : 'text-muted-foreground'}`}>
                  {Math.round(outcome.probability)}%
                </span>
                {isVisible ? (
                  <Eye className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Betting Panel */}
      {!isResolved && (
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="p-3 rounded-lg bg-white/5 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Selection</p>
          <p className="font-bold">
            <span className={betType === "OUI" ? "text-emerald-400" : "text-rose-400"}>{betType}</span> - {betChoice}
          </p>
        </div>

        <BetAmountInput
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          userBalance={userBalance}
          calculatePayout={calculatePayout}
          handlePlaceBet={handlePlaceBet}
          hasBet={userBets && userBets.length > 0}
        />
      </div>
      )}
    </>
  )
}

// Shared Bet Amount Input Component
function BetAmountInput({
  betAmount,
  setBetAmount,
  userBalance,
  calculatePayout,
  handlePlaceBet,
  hasBet
}: {
  betAmount: string
  setBetAmount: (amount: string) => void
  userBalance: number
  calculatePayout: () => number
  handlePlaceBet: () => void
  hasBet: boolean
}) {
  const potentialGain = calculatePayout()
  const LIMIT_GAIN = 100000000 // 100 Millions
  const isOverLimit = potentialGain > LIMIT_GAIN

  if (hasBet) {
    return (
      <div className="w-full py-4 rounded-lg bg-white/5 border border-white/10 text-muted-foreground font-bold text-lg tracking-tight uppercase text-center cursor-not-allowed flex items-center justify-center gap-2">
        <Lock className="w-5 h-5" />
        Pari déjà effectué
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          Montant (<CurrencySymbol />)
        </label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          placeholder="0"
          className={`w-full px-4 py-3 rounded-lg bg-white/5 border outline-none text-lg font-bold tracking-tight font-mono transition-all ${
            isOverLimit ? "border-rose-500 focus:border-rose-500 text-rose-400" : "border-border focus:border-white/30"
          }`}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setBetAmount("100")}
          className="px-4 py-2 rounded-lg bg-white/5 border border-border text-sm font-semibold tracking-tight font-mono hover:border-white/20 transition-all"
        >
          +100
        </button>
        <button
          onClick={() => setBetAmount("500")}
          className="px-4 py-2 rounded-lg bg-white/5 border border-border text-sm font-semibold tracking-tight font-mono hover:border-white/20 transition-all"
        >
          +500
        </button>
        <button
          onClick={() => setBetAmount("1000")}
          className="px-4 py-2 rounded-lg bg-white/5 border border-border text-sm font-semibold tracking-tight font-mono hover:border-white/20 transition-all"
        >
          +1K
        </button>
        <button
          onClick={() => setBetAmount(userBalance.toString())}
          className="px-4 py-2 rounded-lg bg-white/5 border border-border text-sm font-semibold tracking-tight uppercase text-white hover:border-white/20 transition-all"
        >
          Max
        </button>
      </div>

      {betAmount && (
        isOverLimit ? (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-rose-400 uppercase tracking-wider font-bold">Gain trop élevé</p>
                <p className="text-xs text-rose-300 mt-1">
                  Le gain potentiel ({potentialGain.toLocaleString()}) dépasse la limite de sécurité (100M).
                </p>
              </div>
              <span className="text-rose-400 font-mono font-bold text-lg">
                &gt; 100M
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Gain potentiel</p>
            <p className="text-2xl font-bold text-primary tracking-tight font-mono">
              {potentialGain} <CurrencySymbol />
            </p>
          </div>
        )
      )}

      <button
        onClick={handlePlaceBet}
        disabled={!betAmount || Number.parseFloat(betAmount) > userBalance || isOverLimit}
        className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg tracking-tight uppercase hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirmer le pari
      </button>
    </>
  )
}
