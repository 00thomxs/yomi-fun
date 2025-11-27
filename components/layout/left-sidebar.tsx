"use client"

import { Home, User, ShoppingBag, Trophy, Zap } from "lucide-react"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { SidebarButton } from "@/components/layout/sidebar-button"
import type { ActiveBet } from "@/lib/types"

type LeftSidebarProps = {
  activeTab: string
  showLeaderboard: boolean
  activeBets: ActiveBet[]
  onNavigate: (tab: string) => void
  onShowLeaderboard: () => void
}

export function LeftSidebar({
  activeTab,
  showLeaderboard,
  activeBets,
  onNavigate,
  onShowLeaderboard,
}: LeftSidebarProps) {
  return (
    <aside className="hidden lg:block lg:col-span-2 lg:sticky lg:top-4 lg:h-fit">
      <div className="space-y-4">
        <div className="p-4">
          <YomiLogo />
        </div>

        <nav className="space-y-1">
          <SidebarButton
            icon={<Home className="w-5 h-5" />}
            label="Home"
            active={activeTab === "home" && !showLeaderboard}
            onClick={() => onNavigate("home")}
          />
          <SidebarButton
            icon={<ShoppingBag className="w-5 h-5" />}
            label="Shop"
            active={activeTab === "shop"}
            onClick={() => onNavigate("shop")}
          />
          <SidebarButton
            icon={<User className="w-5 h-5" />}
            label="Profil"
            active={activeTab === "profile"}
            onClick={() => onNavigate("profile")}
          />
          <SidebarButton
            icon={<Trophy className="w-5 h-5" />}
            label="Classement"
            active={showLeaderboard}
            onClick={onShowLeaderboard}
          />
        </nav>

        {/* Active Bets Widget */}
        {activeBets.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold tracking-tight uppercase">Mes Paris Actifs</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeBets.slice(-3).map((bet) => (
                <div key={bet.id} className="p-2 rounded-lg bg-white/5 border border-border text-xs">
                  <p className="font-medium truncate">{bet.market}</p>
                  <div className="flex justify-between mt-1">
                    <span className={`font-bold ${bet.choice === "OUI" ? "text-emerald-400" : "text-rose-400"}`}>
                      {bet.choice}
                    </span>
                    <span className="font-mono font-bold text-muted-foreground">
                      <CurrencySymbol /> {bet.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

