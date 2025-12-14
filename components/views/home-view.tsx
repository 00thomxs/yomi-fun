"use client"

import { Flame, Globe, Gamepad2, Music, Wifi, Tv, Trophy, Newspaper, Clock, Zap } from "lucide-react"
import { MarketCard } from "@/components/market/market-card"
import type { Market, BinaryMarket } from "@/lib/types"
import { CATEGORIES } from "@/lib/constants"

type HomeViewProps = {
  markets: Market[]
  onBet: (market: string, choice: string, amount: number, odds?: number) => void
  onMarketClick: (market: Market) => void
  activeCategory: string
  setActiveCategory: (category: string) => void
}

export function HomeView({ markets, onBet, onMarketClick, activeCategory, setActiveCategory }: HomeViewProps) {
  // Safe filtering
  const validMarkets = markets || []
  
  // Determine featured market dynamically
  // Priority: Headline (any type) -> Featured (binary) -> First Binary -> First available
  const featuredMarket = (
    validMarkets.find((m) => m.is_headline) ||  // Headline can be ANY type now
    validMarkets.find((m) => m.is_featured && m.type === 'binary') || 
    validMarkets.find((m) => m.type === 'binary') ||
    validMarkets[0]
  ) as Market | undefined

  // Category filtering with null checks
  const filteredMarkets = activeCategory === "trending"
    ? validMarkets.filter((m) => m.is_featured)
    : activeCategory === "all"
      ? validMarkets
      : validMarkets.filter((m) => {
          if (!m.category) return false
          // Normalize both to lower case for comparison
          return m.category.toLowerCase() === activeCategory.toLowerCase()
        })

  return (
    <div className="space-y-6">
      {/* Featured Market Hero */}
      {featuredMarket && (
        <div className="relative overflow-hidden rounded-xl bg-card border border-border h-[380px]">
          {featuredMarket.bgImage ? (
            <img
              src={featuredMarket.bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/60" />

          <div className="relative h-full p-6 flex flex-col justify-end space-y-4">
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono text-white">{featuredMarket.countdown || "Bientôt"}</span>
            </div>

            {featuredMarket.isLive ? (
              <div className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold tracking-tight uppercase">
                <Zap className="w-3 h-3" />
                Live Event
              </div>
            ) : featuredMarket.status === 'resolved' || featuredMarket.resolved_at ? (
              <div className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-tight uppercase">
                Terminé
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold tracking-tight uppercase">
                En attente
              </div>
            )}
            <h2 className="text-3xl font-bold tracking-tight text-balance leading-tight text-shadow-lg">
              {featuredMarket.question || "Question indisponible"}
            </h2>

            {/* Binary market: show OUI/NON bar */}
            {featuredMarket.type === 'binary' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold tracking-tight">
                  <span className="text-white font-mono">{Math.round((featuredMarket as BinaryMarket).probability || 50)}% OUI</span>
                  <span className="text-white/60 font-mono">{Math.round(100 - ((featuredMarket as BinaryMarket).probability || 50))}% NON</span>
                </div>
                <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-white rounded-full"
                    style={{ width: `${(featuredMarket as BinaryMarket).probability || 50}%` }}
                  />
                </div>
              </div>
            )}

            {/* Multi market: show top outcomes */}
            {featuredMarket.type === 'multi' && featuredMarket.outcomes && (
              <div className="space-y-2">
                {featuredMarket.outcomes.slice(0, 2).map((outcome: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-white/80 truncate max-w-[200px]">{outcome.name}</span>
                    <span className="text-white font-mono font-bold">{Math.round(outcome.probability)}%</span>
                  </div>
                ))}
                {featuredMarket.outcomes.length > 2 && (
                  <span className="text-xs text-white/50">+{featuredMarket.outcomes.length - 2} autres options</span>
                )}
              </div>
            )}

            {featuredMarket.isLive ? (
            <button
              onClick={() => onMarketClick(featuredMarket)}
              className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg tracking-tight uppercase hover:bg-primary/90 transition-all cursor-pointer"
            >
              Predire maintenant
            </button>
            ) : (
              <button
                onClick={() => onMarketClick(featuredMarket)}
                className="w-full py-4 rounded-lg bg-white/10 border border-white/20 text-white/80 font-bold text-lg tracking-tight uppercase hover:bg-white/15 transition-all cursor-pointer"
              >
                Voir les résultats
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="sticky top-0 z-40 -mx-4 px-4 py-3 backdrop-blur-xl bg-background/90 border-b border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border
                  ${
                    activeCategory === category.id
                      ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(220,38,38,0.15)]"
                      : "bg-transparent text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground hover:bg-white/5"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {category.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight uppercase flex items-center gap-2">
          {(() => {
            const cat = CATEGORIES.find((c) => c.id === activeCategory)
            if (cat) {
              const Icon = cat.icon
              return (
                <>
                  <Icon className="w-5 h-5 text-primary" />
                  {cat.label}
                </>
              )
            }
            return "Events"
          })()}
        </h3>
        <span className="text-sm text-muted-foreground font-mono">{filteredMarkets.length} Events</span>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} onMarketClick={onMarketClick} onBet={onBet} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Aucun événement trouvé.
          </div>
        )}
      </div>
    </div>
  )
}
