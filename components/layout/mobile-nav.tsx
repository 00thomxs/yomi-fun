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
      className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-all ${
        active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

export function MobileNav({ activeTab, showLeaderboard }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/90 border-t border-border">
      <div className="flex justify-around items-center py-3">
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
