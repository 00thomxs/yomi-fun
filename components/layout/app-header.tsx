"use client"

import { Trophy, Zap } from "lucide-react"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import type { ActiveBet } from "@/lib/types"

type AppHeaderProps = {
  userBalance: number
  activeBets: ActiveBet[]
  onWalletClick: () => void
  onShowLeaderboard: () => void
}

export function AppHeader({ userBalance, activeBets, onWalletClick, onShowLeaderboard }: AppHeaderProps) {
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border rounded-xl mb-6">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="lg:hidden">
            <YomiLogo />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onShowLeaderboard}
              className="p-2.5 rounded-lg bg-card border border-border hover:border-white/20 transition-all lg:hidden"
            >
              <Trophy className="w-5 h-5 text-white/80" />
            </button>
            <button
              onClick={onWalletClick}
              className="px-4 py-2.5 rounded-lg bg-card border border-border hover:border-white/20 transition-all"
            >
              <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <CurrencySymbol className="text-primary" />
                <span className="font-mono font-bold">{userBalance.toLocaleString()}</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Active Bets Banner */}
      {activeBets.length > 0 && (
        <div className="lg:hidden mb-4 rounded-xl bg-primary/10 border border-primary/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase">
                {activeBets.length} Pari{activeBets.length > 1 ? "s" : ""} Actif{activeBets.length > 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {activeBets.reduce((sum, bet) => sum + bet.amount, 0)} <CurrencySymbol /> engages
            </span>
          </div>
        </div>
      )}
    </>
  )
}

