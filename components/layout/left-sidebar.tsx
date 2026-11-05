"use client"

import Link from "next/link"
import { Home, User, ShoppingBag, Trophy } from "lucide-react"
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
      aria-current={active ? "page" : undefined}
      className={`relative w-full flex items-center gap-3 px-3 h-10 rounded-md transition-colors ${
        active
          ? "bg-surface-hover text-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
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
      <div className="space-y-6">
        <div className="h-16 flex items-center px-3">
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
          <div className="space-y-2">
            <h3 className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mes prédictions</h3>
            <div className="max-h-64 overflow-y-auto divide-y divide-border border-y border-border">
              {activeBets.slice(0, 5).map((bet) => (
                <Link 
                  key={bet.id}
                  href={`/market/${bet.market_id}`}
                  className="block px-3 py-2.5 text-xs hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <p className="font-medium truncate text-foreground/90">{bet.market}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`font-semibold ${bet.direction === 'NO' ? "text-no" : "text-yes"}`}>
                      {(() => {
                        // Clean up display for binary markets (OUI OUI -> OUI)
                        const isBinaryOutcome = bet.choice === "OUI" || bet.choice === "NON"
                        if (isBinaryOutcome && bet.direction === 'YES') {
                          return bet.choice
                        }
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
          </div>
        )}
      </div>
    </aside>
  )
}
