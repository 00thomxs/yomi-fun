"use client"

import Link from "next/link"
import { Home, User, ShoppingBag, Trophy, Zap } from "lucide-react"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
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
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
            label="Home"
            active={activeTab === "home" && !showLeaderboard}
          />
          <SidebarLink
            href="/shop"
            icon={<ShoppingBag className="w-5 h-5" />}
            label="Shop"
            active={activeTab === "shop"}
          />
          <SidebarLink
            href="/profile"
            icon={<User className="w-5 h-5" />}
            label="Profil"
            active={activeTab === "profile"}
          />
          <SidebarLink
            href="/leaderboard"
            icon={<Trophy className="w-5 h-5" />}
            label="Classement"
            active={showLeaderboard}
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
