"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { AppHeader } from "@/components/layout/app-header"
import { BadgeEarnedPopup } from "@/components/badge-earned-popup"
import { useUser } from "@/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import type { Market } from "@/lib/types"
import { CATEGORIES } from "@/lib/constants"
import { getAvatarUrl } from "@/lib/utils/avatar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { activeBets, userBalance, profile, isAuthenticated } = useUser()
  const [trendingMarkets, setTrendingMarkets] = useState<Market[]>([])
  const [topPlayers, setTopPlayers] = useState<{ rank: number; username: string; points: number; avatar?: string }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // 1. Fetch Top 3 Players (by total_won aka PnL), exclude admin
      const { data: players } = await supabase
        .from('profiles')
        .select('username, total_won, avatar_url, role')
        .neq('role', 'admin') // Exclude admins
        .order('total_won', { ascending: false })
        .limit(3)

      if (players) {
        setTopPlayers(players.map((p, i) => ({
          rank: i + 1,
          username: p.username || "User",
          points: p.total_won || 0, // Using PnL as points for leaderboard
          avatar: getAvatarUrl(p.avatar_url)
        })))
      }

      // 2. Fetch Trending Markets (is_featured = true)
      // Include resolved markets to show activity history
      const { data: markets } = await supabase
        .from('markets')
        .select(`
          *,
          outcomes:outcomes!market_id (
            id, name, probability
          )
        `)
        .eq('is_featured', true) // Filter by Trending category
        .order('created_at', { ascending: false }) // Newest first
        .limit(3)

      if (markets) {
        const formattedMarkets = markets.map((m: any) => {
          // Find probability for binary
          let probability = 50
          if (m.type === 'binary' && m.outcomes) {
             const yes = m.outcomes.find((o: any) => o.name === 'OUI')
             if (yes) probability = yes.probability
          }
          
          // Map category icon
          const catDef = CATEGORIES.find(c => c.label === m.category || c.id === m.category)
          
          return {
            ...m,
            isLive: m.is_live,
            probability: probability,
            categoryIcon: catDef?.icon,
            // Essential fields for sidebar link
          }
        })
        setTrendingMarkets(formattedMarkets as Market[])
      }
    }

    fetchData()
  }, [])

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname === "/") return "home"
    if (pathname === "/shop" || pathname === "/shop/buy-zeny") return "shop"
    if (pathname === "/orders") return "orders"
    if (pathname === "/profile") return "profile"
    if (pathname === "/leaderboard") return "leaderboard"
    if (pathname.startsWith("/market/")) return "home"
    return "home"
  }

  const activeTab = getActiveTab()
  const showLeaderboard = pathname === "/leaderboard"

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
          userPnL={profile?.total_won}
          isAuthenticated={isAuthenticated}
          topPlayers={topPlayers}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        showLeaderboard={showLeaderboard}
      />

      {/* Badge Earned Popup - Global */}
      {isAuthenticated && <BadgeEarnedPopup />}
    </div>
  )
}
