"use client"

import { Clock } from "lucide-react"
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

  const isResolved = (m: Market) => m.status === 'resolved' || !!m.resolved_at
  const activeLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label || "Marchés"

  return (
    <div className="space-y-8">
      {/* Featured Market */}
      {featuredMarket && (
        <article className="grid md:grid-cols-[minmax(0,1fr)_260px] rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-5 md:p-6 flex flex-col gap-5 order-2 md:order-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {featuredMarket.isLive ? (
                <span className="inline-flex items-center gap-1.5 text-brand font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
                  En direct
                </span>
              ) : isResolved(featuredMarket) ? (
                <span className="font-medium">Terminé</span>
              ) : (
                <span className="font-medium text-amber-400">En attente</span>
              )}
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" aria-hidden />
                {featuredMarket.countdown || "Bientôt"}
              </span>
            </div>

            <h2 className="text-2xl md:text-[32px] font-bold tracking-[-0.02em] leading-[1.1] text-balance">
              {featuredMarket.question || "Question indisponible"}
            </h2>

            {/* Binary market: OUI/NON split */}
            {featuredMarket.type === 'binary' && (() => {
              const p = Math.round((featuredMarket as BinaryMarket).probability || 50)
              return (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-4xl font-semibold text-yes">{p}%<span className="ml-1.5 text-sm font-sans font-medium text-muted-foreground">OUI</span></span>
                    <span className="font-mono text-sm text-muted-foreground">{100 - p}% NON</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-no/30">
                    <div className="h-full bg-yes" style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })()}

            {/* Multi market: top outcomes */}
            {featuredMarket.type === 'multi' && featuredMarket.outcomes && (
              <div className="divide-y divide-border border-y border-border">
                {featuredMarket.outcomes.slice(0, 2).map((outcome: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 text-sm">
                    <span className="truncate max-w-[70%]">{outcome.name}</span>
                    <span className="font-mono font-semibold">{Math.round(outcome.probability)}%</span>
                  </div>
                ))}
                {featuredMarket.outcomes.length > 2 && (
                  <p className="py-2 text-xs text-muted-foreground">+{featuredMarket.outcomes.length - 2} autres options</p>
                )}
              </div>
            )}

            <button
              onClick={() => onMarketClick(featuredMarket)}
              className={`mt-auto h-11 w-full sm:w-auto sm:self-start px-6 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                featuredMarket.isLive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border hover:bg-surface-hover"
              }`}
            >
              {featuredMarket.isLive ? "Prédire maintenant" : "Voir les résultats"}
            </button>
          </div>

          <div className="relative h-40 md:h-auto bg-muted order-1 md:order-2">
            {featuredMarket.bgImage && (
              <img
                src={featuredMarket.bgImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
          </div>
        </article>
      )}

      {/* Category Filter */}
      <div className="sticky top-16 z-40 -mx-4 px-4 lg:mx-0 lg:px-0 bg-background/95 backdrop-blur border-b border-border">
        <div role="tablist" aria-label="Catégories" className="flex gap-6 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((category) => {
            const active = activeCategory === category.id
            return (
              <button
                key={category.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(category.id)}
                className={`relative shrink-0 h-11 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{activeLabel}</h3>
        <span className="text-sm text-muted-foreground font-mono">
          {filteredMarkets.length} marché{filteredMarkets.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} onMarketClick={onMarketClick} onBet={onBet} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center rounded-lg border border-dashed border-border">
            <p className="text-sm font-medium">Aucun marché dans cette catégorie</p>
            <p className="text-sm mt-1 text-muted-foreground">De nouveaux marchés arrivent régulièrement.</p>
          </div>
        )}
      </div>
    </div>
  )
}
