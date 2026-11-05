"use client"

import { Clock, Users, Trophy } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, YAxis, ReferenceLine } from "recharts"
import type { Market, BinaryMarket } from "@/lib/types"
import { CATEGORIES } from "@/lib/constants"

type MarketCardProps = {
  market: Market
  onMarketClick: (market: Market) => void
  onBet: (market: string, choice: string, amount: number, odds?: number) => void
}

const CHART_STROKE = "oklch(0.92 0 0)"

function CardHeader({ market, categoryLabel }: { market: Market; categoryLabel: string }) {
  const resolved = market.status === 'resolved' || market.resolved_at
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{categoryLabel}</span>
      {market.season && (
        <span title={`Saison : ${market.season.name}`} className="inline-flex items-center gap-1 text-amber-400">
          <Trophy className="w-3 h-3" aria-hidden />
          <span className="sr-only">Saison {market.season.name}</span>
        </span>
      )}
      <span aria-hidden>·</span>
      {market.isLive ? (
        <span className="inline-flex items-center gap-1.5 text-primary font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
          En direct
        </span>
      ) : resolved ? (
        <span className="font-medium">Terminé</span>
      ) : (
        <span className="font-medium text-amber-400">En attente</span>
      )}
      <span className="ml-auto inline-flex items-center gap-1 font-mono">
        <Clock className="w-3 h-3" aria-hidden />
        {market.countdown || "-"}
      </span>
    </div>
  )
}

function Thumb({ src }: { src?: string }) {
  if (!src) return null
  // Background image: a dead URL degrades to a plain tile instead of a broken-image icon
  return (
    <div
      aria-hidden
      className="w-10 h-10 rounded-md shrink-0 bg-muted bg-cover bg-center"
      style={{ backgroundImage: `url("${src}")` }}
    />
  )
}

const cardClass = (market: Market) =>
  `group rounded-lg bg-card border p-4 text-left h-[300px] flex flex-col gap-3 cursor-pointer transition-colors hover:bg-surface-hover ${
    market.season ? "border-amber-500/30" : "border-border"
  }`

const yesBtn = "h-9 rounded-md bg-yes/10 text-yes text-sm font-medium hover:bg-yes/20 transition-colors disabled:opacity-50"
const noBtn = "h-9 rounded-md bg-no/10 text-no text-sm font-medium hover:bg-no/20 transition-colors disabled:opacity-50"

export function MarketCard({ market, onMarketClick, onBet }: MarketCardProps) {
  // Find correct icon from constants
  const categoryDef = CATEGORIES.find(c => c.id === market.category) || CATEGORIES.find(c => c.label === market.category)
  const categoryLabel = categoryDef?.label || market.category || "Divers"

  // Use real history data for chart (passed from container)
  const chartData = market.type === "binary"
    ? (market as BinaryMarket).history24h || []
    : []

  const open = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarketClick(market)
  }

  if (market.type === "multi") {
    const sortedOutcomes = [...market.outcomes].sort((a, b) => b.probability - a.probability)
    const topTwo = sortedOutcomes.slice(0, 2)
    const remainingCount = Math.max(0, market.outcomes.length - 2)
    const resolved = market.status === 'resolved' || market.resolved_at

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onMarketClick(market)}
        onKeyDown={(e) => e.key === "Enter" && onMarketClick(market)}
        className={cardClass(market)}
      >
        <CardHeader market={market} categoryLabel={categoryLabel} />

        <div className="flex items-start gap-3">
          <Thumb src={market.bgImage} />
          <p className="font-medium text-[15px] leading-snug line-clamp-2">{market.question}</p>
        </div>

        {/* Top 2 candidates */}
        <div className="flex-1 divide-y divide-border">
          {topTwo.map((outcome) => {
            const nonProb = 100 - outcome.probability
            return (
              <div key={outcome.name} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-sm truncate" title={outcome.name}>{outcome.name}</span>
                <span className="font-mono font-semibold text-sm w-10 text-right">{Math.round(outcome.probability)}%</span>
                {market.isLive ? (
                  <div className="flex gap-1.5">
                    <button onClick={open} className={`${yesBtn} h-8 px-2.5 text-xs`} aria-label={`OUI ${outcome.name}`}>OUI</button>
                    <button onClick={open} className={`${noBtn} h-8 px-2.5 text-xs`} aria-label={`NON ${outcome.name}, ${Math.round(nonProb)}%`}>NON</button>
                  </div>
                ) : resolved ? (
                  // @ts-ignore
                  <span className={`text-xs font-medium w-[88px] text-right ${outcome.is_winner === true ? 'text-yes' : 'text-no'}`}>
                    {/* @ts-ignore */}
                    {outcome.is_winner === true ? "Gagnant" : "Perdant"}
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 w-[88px] text-right">En attente</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden />
            <span className="font-mono">{market.volume || 0}</span>
          </span>
          {remainingCount > 0 && (
            <span className="group-hover:text-foreground transition-colors">+{remainingCount} options</span>
          )}
        </div>
      </div>
    )
  }

  // Binary market card
  const binaryMarket = market as BinaryMarket
  const prob = Math.round(binaryMarket.probability || 50)

  // Determiner winner based on winner_outcome_id (Critical fix for Binary)
  // @ts-ignore
  const outcomes = market.outcomes || []
  const yesOutcome = outcomes.find((o: any) => o.name === 'OUI')
  // @ts-ignore
  const winnerId = market.winner_outcome_id

  const isResolved = !market.isLive && (market.status === 'resolved' || market.resolved_at)

  // If resolved, check who really won
  let yesWon = false
  let noWon = false

  if (isResolved) {
    if (winnerId && yesOutcome) {
      // Robust check using ID
      yesWon = winnerId === yesOutcome.id
      noWon = winnerId !== yesOutcome.id
    } else {
      // Fallback (should not happen if resolved correctly)
      yesWon = prob >= 50
      noWon = prob < 50
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onMarketClick(market)}
      onKeyDown={(e) => e.key === "Enter" && onMarketClick(market)}
      className={cardClass(market)}
    >
      <CardHeader market={market} categoryLabel={categoryLabel} />

      <div className="flex items-start gap-3">
        <Thumb src={market.bgImage} />
        <p className="flex-1 font-medium text-[15px] leading-snug line-clamp-2">{market.question}</p>
        <div className="text-right shrink-0">
          <p className="font-mono text-xl font-semibold leading-none">{prob}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">OUI</p>
        </div>
      </div>

      {/* Real history chart */}
      <div className="flex-1 min-h-[72px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`gradient-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STROKE} stopOpacity={0.12} />
                <stop offset="100%" stopColor={CHART_STROKE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[0, 100]} hide />
            <ReferenceLine y={50} stroke={CHART_STROKE} strokeOpacity={0.12} strokeDasharray="3 3" />
            <Area
              type="linear"
              dataKey="price"
              stroke={CHART_STROKE}
              strokeWidth={1.5}
              fill={`url(#gradient-${market.id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3" aria-hidden />
          <span className="font-mono">{market.volume || 0}</span>
        </span>
        <span aria-hidden>·</span>
        <span>Volatilité {(binaryMarket.volatility || "Moyenne").toLowerCase()}</span>
      </div>

      {/* OUI/NON buttons OR Resolved State */}
      {isResolved ? (
        <div className={`h-9 rounded-md flex items-center justify-center text-sm font-medium ${yesWon ? 'bg-yes/10 text-yes' : 'bg-no/10 text-no'}`}>
          Résultat : {yesWon ? "OUI" : "NON"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={open} disabled={!market.isLive} className={yesBtn}>
            OUI <span className="font-mono">{prob}%</span>
          </button>
          <button onClick={open} disabled={!market.isLive} className={noBtn}>
            NON <span className="font-mono">{100 - prob}%</span>
          </button>
        </div>
      )}
    </div>
  )
}
