"use client"

import Link from "next/link"
import { Home, User, ShoppingBag, Trophy, Zap, Clock } from "lucide-react"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { DailyRewardWidget } from "@/components/daily-reward-widget"
import type { ActiveBet } from "@/lib/types"

type LeftSidebarProps = {
  activeTab: string
  showLeaderboard: boolean
  activeBets: ActiveBet[]
}

function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active 
          ? "bg-primary/10 text-primary border-l-2 border-primary shadow-[0_0_15px_rgba(220,38,38,0.15)]" 
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="text-sm font-semibold tracking-tight">{label}</span>
    </Link>
  )
}

export function LeftSidebar({
  activeTab,
  showLeaderboard,
  activeBets,
}: LeftSidebarProps) {
  return (
    <aside className="hidden lg:block lg:col-span-2 lg:sticky lg:top-4 lg:h-fit">
      <div className="space-y-4">
        <div className="p-4">
          <Link href="/">
            <YomiLogo />
          </Link>
        </div>

        <nav className="space-y-1">
          <SidebarLink
            href="/"
            icon={<Home className="w-5 h-5" />}
            label="Accueil"
            active={activeTab === "home" && !showLeaderboard}
          />
          <SidebarLink
            href="/leaderboard"
            icon={<Trophy className="w-5 h-5" />}
            label="Classement"
            active={showLeaderboard || activeTab === "leaderboard"}
          />
          <SidebarLink
            href="/profile"
            icon={<User className="w-5 h-5" />}
            label="Profil"
            active={activeTab === "profile"}
          />
          <SidebarLink
            href="/shop"
            icon={<ShoppingBag className="w-5 h-5" />}
            label="Shop"
            active={activeTab === "shop"}
          />
        </nav>

        {/* Daily Reward Widget */}
        <DailyRewardWidget />

        {/* Active Predictions Widget */}
        {activeBets.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold tracking-tight uppercase">Mes Prédictions</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeBets.slice(0, 5).map((bet) => (
                <Link 
                  key={bet.id}
                  href={`/market/${bet.market_id}`}
                  className="block p-2 rounded-lg border text-xs bg-white/5 border-border hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <p className="font-medium truncate">{bet.market}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`font-bold ${bet.direction === 'NO' ? "text-rose-400" : "text-emerald-400"}`}>
                      {(() => {
                        // Clean up display for binary markets (OUI OUI -> OUI)
                        const isBinaryOutcome = bet.choice === "OUI" || bet.choice === "NON"
                        if (isBinaryOutcome && bet.direction === 'YES') {
                          return bet.choice
                        }
                        return `${bet.direction === 'NO' ? "NON " : "OUI "}${bet.choice}`
                      })()}
                    </span>
                    <span className="font-mono font-bold text-muted-foreground flex items-center gap-0.5">
                      {bet.amount}<CurrencySymbol />
                    </span>
                  </div>
                  {/* Status Badge */}
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                      <Clock className="w-3 h-3" />
                      En cours
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
