"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { ActivityFeed } from "@/components/market/activity-feed"
import type { Market, BinaryMarket, ActiveBet } from "@/lib/types"

type RightSidebarProps = {
  trendingMarkets: Market[]
  userBalance: number
  userPnL?: number
  isAuthenticated?: boolean
  topPlayers: { rank: number; username: string; points: number; avatar?: string }[]
  activeBets?: ActiveBet[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</h3>
}

export function RightSidebar({
  trendingMarkets,
  userBalance,
  userPnL = 0,
  isAuthenticated = false,
  topPlayers = [],
  activeBets = []
}: RightSidebarProps) {
  // The leaderboard page already is the full ranking
  const showTopPlayers = usePathname() !== "/leaderboard"
  return (
    <aside className="hidden lg:block lg:sticky lg:top-[88px] space-y-8">

      {/* Wallet - only show when authenticated */}
      {isAuthenticated && (
        <section className="rounded-lg border border-border bg-card">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Solde</p>
              <p className="mt-1 text-xl font-semibold flex items-baseline gap-1">
                <span className="font-mono">{userBalance.toLocaleString()}</span>
                <CurrencySymbol className="text-brand text-base" />
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">PnL</p>
              <p className={`mt-1 text-xl font-semibold font-mono ${userPnL >= 0 ? 'text-yes' : 'text-no'}`}>
                {userPnL >= 0 ? '+' : ''}{userPnL.toLocaleString()}
              </p>
            </div>
          </div>
          <Link
            href="/shop/buy-zeny"
            className="block border-t border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            Recharger des Zeny
          </Link>
        </section>
      )}

      {/* Active predictions */}
      {activeBets.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Mes prédictions</SectionTitle>
          <div className="max-h-64 overflow-y-auto divide-y divide-border border-y border-border">
            {activeBets.slice(0, 5).map((bet) => (
              <Link
                key={bet.id}
                href={`/market/${bet.market_id}`}
                className="block py-2.5 text-xs hover:bg-surface-hover transition-colors"
              >
                <p className="font-medium truncate text-foreground/90">{bet.market}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className={`font-semibold ${bet.direction === 'NO' ? "text-no" : "text-yes"}`}>
                    {(() => {
                      // Clean up display for binary markets (OUI OUI -> OUI)
                      const isBinaryOutcome = bet.choice === "OUI" || bet.choice === "NON"
                      if (isBinaryOutcome && bet.direction === 'YES') return bet.choice
                      return `${bet.direction === 'NO' ? "NON " : "OUI "}${bet.choice}`
                    })()}
                  </span>
                  <span className="font-mono text-muted-foreground flex items-center gap-0.5">
                    {bet.amount}<CurrencySymbol />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ActivityFeed />

      {/* Trending Markets */}
      <section className="space-y-3">
        <SectionTitle>Tendances</SectionTitle>
        <div className="divide-y divide-border border-y border-border">
          {trendingMarkets.length > 0 ? trendingMarkets.map((market) => (
            <Link
              key={market.id}
              href={`/market/${market.id}`}
              className="flex items-start gap-3 py-3 group"
            >
              <p className="flex-1 text-sm leading-snug line-clamp-2 group-hover:text-foreground text-foreground/85 transition-colors">
                {market.question}
              </p>
              <span className="font-mono text-sm font-semibold shrink-0">
                {market.type === "binary" ? `${Math.round((market as BinaryMarket).probability)}%` : "Multi"}
              </span>
            </Link>
          )) : (
            <p className="py-3 text-xs text-muted-foreground">Aucune tendance</p>
          )}
        </div>
      </section>

      {/* Top Players */}
      {showTopPlayers && (
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <SectionTitle>Top traders</SectionTitle>
          <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Tout voir
          </Link>
        </div>
        <ol className="divide-y divide-border border-y border-border">
          {topPlayers.map((player) => (
            <li key={player.rank} className="flex items-center gap-3 py-2.5">
              <span className={`w-4 text-sm font-mono ${player.rank === 1 ? "text-brand font-semibold" : "text-muted-foreground"}`}>
                {player.rank}
              </span>
              {player.avatar && (
                <img src={player.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              )}
              <p className="flex-1 text-sm font-medium truncate">{player.username}</p>
              <p className="text-sm font-mono text-muted-foreground">
                {player.points.toLocaleString()} <CurrencySymbol />
              </p>
            </li>
          ))}
          {topPlayers.length === 0 && <li className="py-3 text-xs text-muted-foreground">Classement vide</li>}
        </ol>
      </section>
      )}
    </aside>
  )
}
