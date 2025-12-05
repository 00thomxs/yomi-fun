"use client"

import { useState } from "react"
import { ArrowLeft, Clock, HelpCircle, Lock } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine, ReferenceDot } from "recharts"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import type { Market, BinaryMarket, MultiOutcomeMarket } from "@/lib/types"
// Mock data no longer needed - using real history from DB
import { CATEGORIES } from "@/lib/constants"

// Helper to generate X Axis domain and REGULAR ticks
// Chart starts from market creation date (not before)
type TickFormatType = 'time' | 'day' | 'month'

const getAxisParams = (timeframe: string, data: any[], marketCreatedAt?: string) => {
  const now = new Date().getTime()
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

type MarketDetailViewProps = {
  market: Market
  onBack: () => void
  onBet: (market: string, choice: string, amount: number, odds?: number) => void
  userBalance: number
}

export function MarketDetailView({ market, onBack, onBet, userBalance }: MarketDetailViewProps) {
  const [timeframe, setTimeframe] = useState<"1H" | "6H" | "1J" | "1S" | "1M" | "TOUT">("1H")
  const [betChoice, setBetChoice] = useState<string>(market.type === "binary" ? "YES" : (market as MultiOutcomeMarket).outcomes[0].name)
  const [betAmount, setBetAmount] = useState("")
  const [betType, setBetType] = useState<"OUI" | "NON">("OUI")

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

  const chartData = market.type === "binary" ? getBinaryChartData() : getMultiChartData()
  
  // Calculate dynamic scale for Binary Charts
  const prices = chartData.length > 0 ? chartData.map((p: any) => p.price) : [0]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = Math.max(2, (maxPrice - minPrice) * 0.2) // 20% padding
  const yMin = Math.max(0, Math.floor(minPrice - padding))
  const yMax = Math.min(100, Math.ceil(maxPrice + padding))

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
                <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  Terminé
                </span>
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
          setTimeframe={setTimeframe}
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
        />
      ) : (
        <MultiMarketContent
          market={market as MultiOutcomeMarket}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
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
        />
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
}) {
  const { domain, ticks, formatType } = getAxisParams(timeframe, chartData, market.created_at)

  // Transform data to have numeric timestamp for proper X axis scaling
  const chartDataWithTs = chartData.map((d: any) => ({
    ...d,
    ts: d.fullDate instanceof Date ? d.fullDate.getTime() : new Date(d.fullDate).getTime()
  }))

  const formatTick = (ts: number) => formatTickLabel(ts, formatType)

  return (
    <>
      {/* Resolved Banner */}
      {isResolved && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-red-400 font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Marché Terminé
          </p>
          <p className="text-red-400/70 text-sm mt-1">Les paris ne sont plus acceptés</p>
        </div>
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

      {/* Timeframe Selector */}
      <div className="flex gap-2 justify-center overflow-x-auto pb-2">
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

      {/* Chart */}
      <div className="rounded-xl bg-card border border-border p-5 relative">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <span className="text-6xl font-black tracking-tighter">YOMI.fun</span>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartDataWithTs}>
            <defs>
              <linearGradient id="chartGradientMonochrome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.5 0.22 25)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.5 0.22 25)" stopOpacity={0} />
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
              stroke="#64748b"
              orientation="right"
              style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
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
}) {
  // Calculate dynamic Y max for Multi
  const allProbs = [
    ...market.outcomes.map(o => o.probability),
    ...chartData.flatMap(d => market.outcomes.map(o => Number(d[o.name]) || 0))
  ]
  const maxProb = Math.max(...allProbs, 40) // Minimum 40% scale to avoid too much zoom
  const multiYMax = Math.min(100, Math.ceil((maxProb + 5) / 10) * 10) // Round up to nearest 10

  // Get axis params for timeframe
  const { domain, ticks, formatType } = getAxisParams(timeframe, chartData, market.created_at)

  // Transform data to have numeric timestamp for proper X axis scaling
  const chartDataWithTs = chartData.map((d: any) => ({
    ...d,
    ts: d.fullDate instanceof Date ? d.fullDate.getTime() : new Date(d.fullDate).getTime()
  }))

  const formatTick = (ts: number) => formatTickLabel(ts, formatType)

  return (
    <>
      {/* Resolved Banner */}
      {isResolved && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-red-400 font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Marché Terminé
          </p>
          <p className="text-red-400/70 text-sm mt-1">Les paris ne sont plus acceptés</p>
        </div>
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
                  ? "bg-white/10 border-white/30"
                  : "bg-card border-border hover:border-white/20"
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
                    // @ts-ignore
                    outcome.is_winner === true 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-muted-foreground'
                  }`}>
                    <span className="text-sm font-bold uppercase">
                      {/* @ts-ignore */}
                      {outcome.is_winner === true ? "Résultat : OUI" : "Résultat : NON"}
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
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <span className="text-6xl font-black tracking-tighter">YOMI.fun</span>
        </div>

        <div className="flex items-center justify-between mb-4 relative z-10">
          <p className="text-sm font-bold tracking-tight uppercase">Evolution des cotes</p>
          <div className="flex gap-2 overflow-x-auto pb-2 max-w-[60%]">
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
        </div>
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
              orientation="right"
              stroke="#64748b"
              style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 border border-white/10 rounded-lg p-3 backdrop-blur-md shadow-xl">
                      <p className="text-[10px] text-slate-400 font-mono mb-2">{new Date(label).toLocaleString()}</p>
                      <div className="space-y-1">
                        {payload.map((entry: any) => (
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
            {market.outcomes.slice(0, 4).map((outcome) => (
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
              {market.outcomes.slice(0, 4).map((outcome) => (
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
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
          {market.outcomes.slice(0, 4).map((outcome) => (
            <div key={outcome.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: outcome.color }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {outcome.name} <span className="font-mono text-white">{Math.round(outcome.probability)}%</span>
              </span>
            </div>
          ))}
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
}: {
  betAmount: string
  setBetAmount: (amount: string) => void
  userBalance: number
  calculatePayout: () => number
  handlePlaceBet: () => void
}) {
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
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-border focus:border-white/30 outline-none text-lg font-bold tracking-tight font-mono transition-all"
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
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gain potentiel</p>
          <p className="text-2xl font-bold text-primary tracking-tight font-mono">
            {calculatePayout()} <CurrencySymbol />
          </p>
        </div>
      )}

      <button
        onClick={handlePlaceBet}
        disabled={!betAmount || Number.parseFloat(betAmount) > userBalance}
        className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg tracking-tight uppercase hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirmer le pari
      </button>
    </>
  )
}
