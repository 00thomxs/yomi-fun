"use client"

import Link from "next/link"
import { Flame, Activity, Trophy } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import type { Market, BinaryMarket } from "@/lib/types"

type RightSidebarProps = {
  trendingMarkets: Market[]
  userBalance: number
}

export function RightSidebar({
  trendingMarkets,
  userBalance,
}: RightSidebarProps) {
  return (
    <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-4 lg:h-fit space-y-4">
      {/* Trending Markets */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold tracking-tight uppercase">Tendances</h3>
        </div>
        <div className="space-y-2">
          {trendingMarkets.map((market) => {
            const CategoryIcon = market.categoryIcon
            return (
              <Link
                key={market.id}
                href={`/market/${market.id}`}
                className="block w-full text-left p-3 rounded-lg bg-white/5 border border-border hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {market.category}
                  </span>
                  {market.isLive && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-[10px] text-primary font-medium uppercase tracking-wider">Live</span>
                    </>
                  )}
                </div>
                <p className="text-sm font-medium tracking-tight line-clamp-2">{market.question}</p>
                <div className="flex items-center gap-2 mt-2">
                  {market.type === "binary" ? (
                    <span className="text-xs text-white font-bold font-mono">{(market as BinaryMarket).probability}%</span>
                  ) : (
                    <span className="text-xs text-white font-bold font-mono">Multi-choix</span>
                  )}
                  <span className="text-xs text-muted-foreground font-mono">• {market.volume}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Wallet Widget */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold tracking-tight uppercase">Portefeuille</h3>
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Balance</p>
            <p className="text-2xl font-bold tracking-tight">
              <CurrencySymbol className="text-primary" /> <span className="font-mono">{userBalance.toLocaleString()}</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-border">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Benefice Net</p>
            <p className="text-2xl font-bold tracking-tight text-white">
              <span className="text-emerald-400 font-mono">+8,450</span>
              <span className="text-emerald-400 text-sm font-mono ml-2">+12%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Top Players Widget */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold tracking-tight uppercase">Top Players</h3>
        </div>
        <div className="space-y-2">
          {[
            { rank: 1, name: "@00thomxs", points: 54200 },
            { rank: 2, name: "@K1rkgambl3r", points: 112000 },
            { rank: 3, name: "@Icantbr3athh", points: 108000 },
          ].map((player) => (
            <div key={player.rank} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
              <span className="text-sm font-bold text-muted-foreground w-6 font-mono">{player.rank}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold tracking-tight">{player.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {player.points.toLocaleString()} <CurrencySymbol />
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/leaderboard"
          className="block w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold tracking-tight uppercase hover:bg-primary/90 transition-all text-center"
        >
          Voir le Classement
        </Link>
      </div>
    </aside>
  )
}
