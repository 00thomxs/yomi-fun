"use client"

import { Clock, Users, Activity, HelpCircle } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import type { Market, BinaryMarket } from "@/lib/types"
import { generateVolatileChartData } from "@/lib/mock-data"
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

  // Generate volatile chart data for binary cards
  const volatileChartData = market.type === "binary" ? generateVolatileChartData(20, (market as BinaryMarket).probability || 50) : []

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
        className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-white/20 transition-all p-4 text-left h-[320px] flex flex-col cursor-pointer"
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
                <div className="ml-auto px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  Terminé
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              {market.countdown || "-"}
            </div>
          </div>

          <p className="font-semibold text-base tracking-tight text-balance leading-snug">{market.question}</p>

          {/* Top 2 candidates with OUI/NON buttons */}
          <div className="flex-1 space-y-3">
            {topTwo.map((outcome) => {
              const nonProb = 100 - outcome.probability
              return (
                <div key={outcome.name} className="p-3 rounded-lg bg-white/5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{outcome.name}</span>
                    <span className="font-mono font-bold text-lg">{Math.round(outcome.probability)}%</span>
                  </div>
                  {market.isLive ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onBet(market.id, `OUI ${outcome.name}`, 100, 100 / (outcome.probability || 1))
                        }}
                        className="py-1.5 px-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                      >
                        OUI {Math.round(outcome.probability)}%
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onBet(market.id, `NON ${outcome.name}`, 100, 100 / (100 - (outcome.probability || 1)))
                        }}
                        className="py-1.5 px-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all"
                      >
                        NON {Math.round(nonProb)}%
                      </button>
                    </div>
                  ) : (
                    <div className={`py-2 px-3 rounded-md border text-center flex items-center justify-center gap-2 ${
                      // @ts-ignore
                      outcome.is_winner === true 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-muted-foreground'
                    }`}>
                      <span className="text-xs font-bold uppercase">
                        {/* @ts-ignore */}
                        {outcome.is_winner === true ? "RÉSULTAT : OUI" : "RÉSULTAT : NON"}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Link to see more outcomes */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="font-mono">{market.volume || 0}</span>
            </span>
            {remainingCount > 0 && (
              <span className="text-primary text-xs font-medium hover:underline">+{remainingCount} outcomes...</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Binary market card
  const binaryMarket = market as BinaryMarket
  const prob = Math.round(binaryMarket.probability || 50)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onMarketClick(market)}
      onKeyDown={(e) => e.key === "Enter" && onMarketClick(market)}
      className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-white/20 transition-all p-4 text-left h-[320px] flex flex-col cursor-pointer"
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
              <div className="ml-auto px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                Terminé
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Clock className="w-3 h-3" />
            {market.countdown || "-"}
          </div>
        </div>

        <p className="font-semibold text-base tracking-tight text-balance leading-snug">{market.question}</p>

        {/* Larger volatile chart */}
        <div className="flex-1 min-h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volatileChartData}>
              <defs>
                <linearGradient id={`gradient-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={prob >= 50 ? "#10b981" : "#f43f5e"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={prob >= 50 ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={prob >= 50 ? "#10b981" : "#f43f5e"}
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
        {market.isLive ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBet(market.id, "OUI", 100, 1 / (binaryMarket.yesPrice || 0.5))
              }}
              className="py-3.5 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/50 font-bold tracking-tight hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all text-emerald-400 text-base"
            >
              OUI • <span className="font-mono">{prob}%</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBet(market.id, "NON", 100, 1 / (binaryMarket.noPrice || 0.5))
              }}
              className="py-3.5 px-4 rounded-lg bg-rose-500/10 border border-rose-500/50 font-bold tracking-tight hover:bg-rose-500/20 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all text-rose-400 text-base"
            >
              NON • <span className="font-mono">{100 - prob}%</span>
            </button>
          </div>
        ) : (
          <div className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Résultat Final</p>
            <p className="font-mono font-bold text-lg">
              {prob >= 50 ? (
                <span className="text-emerald-400">OUI • {prob}%</span>
              ) : (
                <span className="text-rose-400">NON • {100 - prob}%</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
