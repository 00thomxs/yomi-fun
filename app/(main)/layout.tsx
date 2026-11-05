"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { AppHeader } from "@/components/layout/app-header"
import { BadgeEarnedPopup } from "@/components/badge-earned-popup"
import { BetWinPopup } from "@/components/bet-win-popup"
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
  const showRail = pathname === "/" || showLeaderboard

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <AppHeader />

      {/* Home and leaderboard get a side rail; market pages use the full width for chart + bet ticket */}
      <div
        className={`max-w-[1320px] mx-auto w-full px-4 lg:px-6 pt-6 pb-24 lg:pb-10 ${
          showRail ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start" : ""
        }`}
      >
        <main className="min-w-0">{children}</main>

        {showRail && (
          <RightSidebar
            trendingMarkets={trendingMarkets}
            userBalance={userBalance}
            userPnL={profile?.total_won}
            isAuthenticated={isAuthenticated}
            topPlayers={topPlayers}
            activeBets={activeBets}
          />
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        showLeaderboard={showLeaderboard}
      />

      {/* Badge Earned Popup - Global */}
      {isAuthenticated && <BadgeEarnedPopup />}

      {/* Bet Win Popup - Global */}
      {isAuthenticated && <BetWinPopup />}
    </div>
  )
}
