"use client"

import Link from "next/link"
import { Flame, Activity, Trophy } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import type { Market, BinaryMarket } from "@/lib/types"

type RightSidebarProps = {
  trendingMarkets: Market[]
  userBalance: number
  userPnL?: number
  isAuthenticated?: boolean
  topPlayers: { rank: number; username: string; points: number; avatar?: string }[]
}

export function RightSidebar({
  trendingMarkets,
  userBalance,
  userPnL = 0,
  isAuthenticated = false,
  topPlayers = []
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
          {trendingMarkets.length > 0 ? trendingMarkets.map((market) => {
            // Fix for potentially missing categoryIcon
            const CategoryIcon = market.categoryIcon || Flame 
            
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
                    <span className="text-xs text-white font-bold font-mono">{Math.round((market as BinaryMarket).probability)}%</span>
                  ) : (
                    <span className="text-xs text-white font-bold font-mono">Multi-choix</span>
                  )}
                  <span className="text-xs text-muted-foreground font-mono">• {market.volume}</span>
                </div>
              </Link>
            )
          }) : (
            <p className="text-xs text-muted-foreground">Aucune tendance</p>
          )}
        </div>
      </div>

      {/* Wallet Widget - only show when authenticated */}
      {isAuthenticated && (
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold tracking-tight uppercase">Portefeuille</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Balance</p>
              <p className="text-2xl font-bold tracking-tight flex items-center gap-1">
                <span className="font-mono">{userBalance.toLocaleString()}</span><CurrencySymbol className="text-primary" />
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-border">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">PnL</p>
              <p className="text-2xl font-bold tracking-tight">
                <span className={`font-mono ${userPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {userPnL >= 0 ? '+' : ''}{userPnL.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Players Widget */}
      <div className="rounded-xl bg-card border border-white/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold tracking-tight uppercase">Top Traders</h3>
        </div>
        <div className="space-y-2">
          {topPlayers.map((player) => (
            <div 
              key={player.rank} 
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                player.rank === 1 
                  ? "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                  : "bg-white/5 border border-transparent"
              }`}
            >
              <span className={`text-sm font-bold w-6 font-mono ${player.rank === 1 ? "text-amber-400" : "text-muted-foreground"}`}>
                #{player.rank}
              </span>
              <div className="relative">
                {player.avatar && (
                  <img 
                    src={player.avatar} 
                    alt={player.username} 
                    className={`w-8 h-8 rounded-full object-cover ${player.rank === 1 ? "ring-2 ring-amber-500/50" : ""}`} 
                  />
                )}
                {player.rank === 1 && (
                  <div className="absolute -top-2 -right-1">
                    <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className={`text-sm font-semibold tracking-tight truncate ${player.rank === 1 ? "text-amber-100" : ""}`}>
                  {player.username}
                </p>
                <p className={`text-xs font-mono ${player.rank === 1 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {player.points.toLocaleString()} <CurrencySymbol />
                </p>
              </div>
            </div>
          ))}
          {topPlayers.length === 0 && <p className="text-xs text-muted-foreground">Classement vide</p>}
        </div>
        <Link
          href="/leaderboard"
          className="block w-full py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm font-bold tracking-tight uppercase hover:bg-primary/20 transition-all text-center shadow-[0_0_10px_rgba(220,38,38,0.1)]"
        >
          Voir le Classement
        </Link>
      </div>
    </aside>
  )
}
