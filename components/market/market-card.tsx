"use client"

import { Clock, Users, Activity, HelpCircle, Trophy } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, YAxis, ReferenceLine, ReferenceDot } from "recharts"
import type { Market, BinaryMarket } from "@/lib/types"
import { CATEGORIES } from "@/lib/constants"

type MarketCardProps = {
  market: Market
  onMarketClick: (market: Market) => void
  onBet: (market: string, choice: string, amount: number, odds?: number) => void
}

export function MarketCard({ market, onMarketClick, onBet }: MarketCardProps) {
  // Find correct icon from constants
  const categoryDef = CATEGORIES.find(c => c.id === market.category) || CATEGORIES.find(c => c.label === market.category)
  const CategoryIcon = categoryDef?.icon || HelpCircle

  // Use real history data for chart (passed from container)
  const chartData = market.type === "binary" 
    ? (market as BinaryMarket).history24h || [] 
    : []

  if (market.type === "multi") {
    const sortedOutcomes = [...market.outcomes].sort((a, b) => b.probability - a.probability)
    const topTwo = sortedOutcomes.slice(0, 2)
    const remainingCount = Math.max(0, market.outcomes.length - 2)

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onMarketClick(market)}
        onKeyDown={(e) => e.key === "Enter" && onMarketClick(market)}
        className="group relative overflow-hidden rounded-xl bg-card border border-white/10 hover:border-white/20 transition-all p-4 text-left h-[320px] flex flex-col cursor-pointer hover:shadow-lg hover:shadow-primary/5"
      >
        <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
          {market.bgImage ? (
            <img 
              src={market.bgImage} 
              alt="" 
              className="w-full h-full object-cover"
              onError={(e) => e.currentTarget.style.display = 'none'} 
            />
          ) : (
            <div className="w-full h-full bg-slate-800" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card/98 to-card/95" />

        <div className="relative flex-1 flex flex-col p-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {categoryDef?.label || market.category || "Divers"}
              </span>
              {market.isLive ? (
                <>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">Live</span>
                  </div>
                </>
              ) : (
                market.status === 'resolved' || market.resolved_at ? (
                <div className="ml-auto px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  Terminé
                </div>
                ) : (
                  <div className="ml-auto px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                    En attente
                  </div>
                )
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              {market.countdown || "-"}
            </div>
          </div>

          {/* Season Badge */}
          {market.season && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 w-fit max-w-[170px]"
              title={market.season.name}
            >
              <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider truncate">
                {market.season.name}
              </span>
            </span>
          )}

          <p className="font-semibold text-base tracking-tight text-balance leading-snug line-clamp-2">{market.question}</p>

          {/* Top 2 candidates with OUI/NON buttons */}
          <div className="flex-1 space-y-2">
            {topTwo.map((outcome) => {
              const nonProb = 100 - outcome.probability
              return (
              <div key={outcome.name} className="p-2 rounded-lg bg-white/5 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate max-w-[180px]" title={outcome.name}>{outcome.name}</span>
                    <span className="font-mono font-bold text-sm">{Math.round(outcome.probability)}%</span>
                </div>
                  {market.isLive ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarketClick(market)
                    }}
                    className="py-1 px-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all uppercase"
                  >
                        OUI {Math.round(outcome.probability)}%
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarketClick(market)
                    }}
                        className="py-1 px-2 rounded bg-rose-500/20 border border-rose-500/50 text-rose-400 text-[10px] font-bold hover:bg-rose-500/30 transition-all uppercase"
                  >
                        NON {Math.round(nonProb)}%
                  </button>
                    </div>
                  ) : (
                    <div className={`py-1 px-2 rounded border text-center flex items-center justify-center gap-2 ${
                      market.status === 'resolved' || market.resolved_at
                        ? // @ts-ignore
                      outcome.is_winner === true 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      <span className="text-[10px] font-bold uppercase">
                        {market.status === 'resolved' || market.resolved_at ? (
                          // @ts-ignore
                          outcome.is_winner === true ? "RÉSULTAT : OUI" : "RÉSULTAT : NON"
                        ) : (
                          "En attente"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Link to see more outcomes */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border mt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="font-mono">{market.volume || 0}</span>
            </span>
            {remainingCount > 0 && (
              <span className="text-primary font-medium hover:underline">+{remainingCount} options...</span>
            )}
          </div>
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
      className="group relative overflow-hidden rounded-xl bg-card border border-white/10 hover:border-white/20 transition-all p-4 text-left h-[320px] flex flex-col cursor-pointer hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
        {market.bgImage ? (
          <img 
            src={market.bgImage} 
            alt="" 
            className="w-full h-full object-cover"
            onError={(e) => e.currentTarget.style.display = 'none'} 
          />
        ) : (
          <div className="w-full h-full bg-slate-800" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-card via-card/98 to-card/95" />

      <div className="relative flex-1 flex flex-col p-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {categoryDef?.label || market.category || "Divers"}
            </span>
            {market.isLive ? (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-primary font-medium uppercase tracking-wider">Live</span>
                </div>
              </>
            ) : (
              market.status === 'resolved' || market.resolved_at ? (
              <div className="ml-auto px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                Terminé
              </div>
              ) : (
                <div className="ml-auto px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                  En attente
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Clock className="w-3 h-3" />
            {market.countdown || "-"}
          </div>
        </div>

        {/* Season Badge */}
        {market.season && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              {market.season.name}
            </span>
          </div>
        )}

        <p className="font-semibold text-base tracking-tight text-balance leading-snug line-clamp-2">{market.question}</p>

        {/* Real history chart */}
        <div className="flex-1 min-h-[100px] relative overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 35, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`gradient-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 100]} hide />
              <ReferenceLine y={50} stroke="#ffffff" strokeOpacity={0.1} strokeDasharray="3 3" />
              {chartData.length > 0 && (
                <ReferenceDot
                  x={chartData.length - 1}
                  y={chartData[chartData.length - 1].price}
                  r={3}
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth={2}
                  shape={(props: any) => (
                    <g>
                      {/* Pulsing glow */}
                      <circle cx={props.cx} cy={props.cy} r={8} fill="#ffffff" className="animate-pulse opacity-30" />
                      {/* Solid dot */}
                      <circle cx={props.cx} cy={props.cy} r={4} fill="#ffffff" />
                      {/* Percentage label next to dot */}
                      <text
                        x={props.cx + 12}
                        y={props.cy + 4}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="ui-monospace, monospace"
                        fill="#ffffff"
                      >
                        {Math.round(chartData[chartData.length - 1].price)}%
                      </text>
                    </g>
                  )}
                />
              )}
              <Area
                type="linear"
                dataKey="price"
                stroke="#ffffff"
                strokeWidth={1.5}
                fill={`url(#gradient-${market.id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono">{market.volume || 0}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            <span>{binaryMarket.volatility || "Moyenne"}</span>
          </span>
        </div>

        {/* Bigger OUI/NON buttons OR Resolved State */}
        <div className="grid grid-cols-2 gap-3">
          {isResolved ? (
            <div className={`col-span-2 py-2 px-3 rounded border text-center flex items-center justify-center gap-2 ${
              yesWon 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className="text-xs font-bold uppercase">
                {yesWon ? "RÉSULTAT : OUI" : "RÉSULTAT : NON"}
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarketClick(market)
                }}
                disabled={!market.isLive}
                className="py-2 px-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all uppercase"
              >
                OUI {prob}%
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarketClick(market)
                }}
                disabled={!market.isLive}
                className="py-2 px-3 rounded bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-bold hover:bg-rose-500/30 transition-all uppercase"
              >
                NON {100 - prob}%
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
