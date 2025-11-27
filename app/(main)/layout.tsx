"use client"

import { usePathname } from "next/navigation"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { AppHeader } from "@/components/layout/app-header"
import { useUser } from "@/contexts/user-context"
import { MARKETS_DATA } from "@/lib/mock-data"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { activeBets, userBalance, isAuthenticated } = useUser()

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname === "/") return "home"
    if (pathname === "/shop") return "shop"
    if (pathname === "/profile") return "profile"
    if (pathname === "/leaderboard") return "leaderboard"
    if (pathname.startsWith("/market/")) return "home"
    return "home"
  }

  const activeTab = getActiveTab()
  const showLeaderboard = pathname === "/leaderboard"

  // Trending markets for right sidebar
  const trendingMarkets = MARKETS_DATA.filter((m) =>
    ["reglement-artiste-annee", "tiktok-awards-mot", "affaire-paffman", "squeezie-gp-explorer"].includes(m.id),
  )

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden tactical-grid">
      {/* Noise Overlay */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Main Layout */}
      <div className="relative z-10 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
        {/* Left Sidebar - Desktop */}
        <LeftSidebar
          activeTab={activeTab}
          showLeaderboard={showLeaderboard}
          activeBets={activeBets}
        />

        {/* Main Content */}
        <main className="col-span-1 lg:col-span-7">
          <AppHeader />
          <div className="pb-24 lg:pb-6">{children}</div>
        </main>

        {/* Right Sidebar - Desktop */}
        <RightSidebar
          trendingMarkets={trendingMarkets}
          userBalance={userBalance}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        showLeaderboard={showLeaderboard}
      />
    </div>
  )
}
