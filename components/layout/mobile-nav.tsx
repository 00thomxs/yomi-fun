"use client"

import { Home, User, ShoppingBag, Trophy } from "lucide-react"
import { NavButton } from "@/components/layout/nav-button"

type MobileNavProps = {
  activeTab: string
  showLeaderboard: boolean
  onNavigate: (tab: string) => void
  onShowLeaderboard: () => void
}

export function MobileNav({ activeTab, showLeaderboard, onNavigate, onShowLeaderboard }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/90 border-t border-border">
      <div className="flex justify-around items-center py-3">
        <NavButton
          icon={<Home className="w-5 h-5" />}
          label="Home"
          active={activeTab === "home" && !showLeaderboard}
          onClick={() => onNavigate("home")}
        />
        <NavButton
          icon={<Trophy className="w-5 h-5" />}
          label="Classement"
          active={showLeaderboard}
          onClick={onShowLeaderboard}
        />
        <NavButton
          icon={<User className="w-5 h-5" />}
          label="Profil"
          active={activeTab === "profile"}
          onClick={() => onNavigate("profile")}
        />
        <NavButton
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Shop"
          active={activeTab === "shop"}
          onClick={() => onNavigate("shop")}
        />
      </div>
    </nav>
  )
}

