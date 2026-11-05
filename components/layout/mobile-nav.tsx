"use client"

import Link from "next/link"
import { Home, User, ShoppingBag, Trophy } from "lucide-react"

type MobileNavProps = {
  activeTab: string
  showLeaderboard: boolean
}

function NavLink({
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
      className={`flex-1 flex flex-col items-center justify-center gap-1 h-14 transition-colors ${
        active ? "text-brand" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  )
}

export function MobileNav({ activeTab, showLeaderboard }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center">
        <NavLink
          href="/"
          icon={<Home className="w-5 h-5" />}
          label="Accueil"
          active={activeTab === "home" && !showLeaderboard}
        />
        <NavLink
          href="/leaderboard"
          icon={<Trophy className="w-5 h-5" />}
          label="Classement"
          active={showLeaderboard}
        />
        <NavLink
          href="/profile"
          icon={<User className="w-5 h-5" />}
          label="Profil"
          active={activeTab === "profile"}
        />
        <NavLink
          href="/shop"
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Shop"
          active={activeTab === "shop"}
        />
      </div>
    </nav>
  )
}
