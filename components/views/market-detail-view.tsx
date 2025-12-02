"use client"

import { useState } from "react"
import { ArrowLeft, Clock, HelpCircle, Lock } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import type { Market, BinaryMarket, MultiOutcomeMarket } from "@/lib/types"
import { generateMultiOutcomeData, TIME_LABELS_1H, TIME_LABELS_4H, TIME_LABELS_1J } from "@/lib/mock-data"
import { CATEGORIES } from "@/lib/constants"

type MarketDetailViewProps = {
  market: Market
  onBack: () => void
  onBet: (market: string, choice: string, amount: number, odds?: number) => void
  userBalance: number
}

export function MarketDetailView({ market, onBack, onBet, userBalance }: MarketDetailViewProps) {
  const [timeframe, setTimeframe] = useState<"1H" | "4H" | "1J" | "24H" | "7J" | "TOUT">(
    market.type === "multi" ? "1H" : "24H",
  )
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
    if (timeframe === "24H") return binaryMarket.history24h
    if (timeframe === "7J") return binaryMarket.history7d
    return binaryMarket.historyAll
  }

  const getMultiChartData = () => {
    if (market.type !== "multi") return []
    const multiMarket = market as MultiOutcomeMarket
    const labels = timeframe === "1H" ? TIME_LABELS_1H : timeframe === "4H" ? TIME_LABELS_4H : TIME_LABELS_1J
    return generateMultiOutcomeData(
      labels.length,
      multiMarket.outcomes.map((o) => ({ name: o.name, probability: o.probability })),
      labels,
    )
  }

  const chartData = market.type === "binary" ? getBinaryChartData() : getMultiChartData()
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
      return Math.round((amount / odds) * 100) / 100
    } else {
      const multiMarket = market as MultiOutcomeMarket
      const outcome = multiMarket.outcomes.find((o) => o.name === betChoice)
      if (outcome) {
        const prob = betType === "OUI" ? outcome.probability : 100 - outcome.probability
        return Math.round((amount / (prob / 100)) * 100) / 100
      }
      return amount
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
}: {
  market: BinaryMarket
  timeframe: string
  setTimeframe: (tf: "24H" | "7J" | "TOUT") => void
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
}) {
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
        <p className="text-7xl font-bold tracking-tighter text-white font-mono">{market.probability}%</p>
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
      <div className="flex gap-2 justify-center">
        {(["24H", "7J", "TOUT"] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-5 py-2 rounded-lg font-bold text-sm tracking-tight transition-all font-mono ${
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
      <div className="rounded-xl bg-card border border-border p-5">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="chartGradientMonochrome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.5 0.22 25)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.5 0.22 25)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#64748b"
              style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
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
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Area
              type="linear"
              dataKey="price"
              stroke="#ffffff"
              strokeWidth={1.5}
              fill="url(#chartGradientMonochrome)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex justify-end items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${trend === "up" ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
          <p className="text-sm font-bold text-white font-mono tracking-tight">
            {chartData[chartData.length - 1]?.price?.toFixed(1)}%
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
            OUI • <span className="font-mono">{market.probability}%</span>
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
  setTimeframe: (tf: "1H" | "4H" | "1J") => void
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
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold tracking-tight uppercase">Evolution des cotes</p>
          <div className="flex gap-2">
            {(["1H", "4H", "1J"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
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
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              stroke="#64748b"
              style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace" }}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 50]}
              stroke="#64748b"
              style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace" }}
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
            />
            {market.outcomes.slice(0, 4).map((outcome) => (
              <Line
                key={outcome.name}
                type="monotone"
                dataKey={outcome.name}
                stroke={outcome.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
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
