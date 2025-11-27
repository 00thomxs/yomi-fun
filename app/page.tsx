"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { AppHeader } from "@/components/layout/app-header"
import { HomeView } from "@/components/views/home-view"
import { ShopView } from "@/components/views/shop-view"
import { ProfileView } from "@/components/views/profile-view"
import { LeaderboardView } from "@/components/views/leaderboard-view"
import { MarketDetailView } from "@/components/views/market-detail-view"
import type { Market, ActiveBet } from "@/lib/types"
import { MARKETS_DATA } from "@/lib/mock-data"

export default function YomiApp() {
  // State
  const [activeTab, setActiveTab] = useState("home")
  const [activeCategory, setActiveCategory] = useState("trending")
  const [userBalance, setUserBalance] = useState(54200)
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([])

  const { toast } = useToast()

  // Derived data
  const trendingMarkets = MARKETS_DATA.filter((m) =>
    ["reglement-artiste-annee", "tiktok-awards-mot", "affaire-paffman", "squeezie-gp-explorer"].includes(m.id),
  )

  // Handlers
  const resetNavigation = () => {
    setSelectedMarket(null)
    setShowLeaderboard(false)
  }

  const handleNavigate = (tab: string) => {
    setActiveTab(tab)
    resetNavigation()
  }

  const handleShowLeaderboard = () => {
    setShowLeaderboard(true)
    setActiveTab("home")
  }

  const handleBack = () => {
    if (showLeaderboard) {
      setShowLeaderboard(false)
    } else if (selectedMarket) {
      setSelectedMarket(null)
    }
  }

  const handleMarketClick = (market: Market) => {
    setSelectedMarket(market)
  }

  const handleWalletClick = () => {
    toast({
      title: "Portefeuille ouvert (Mockup)",
      duration: 2000,
      variant: "default",
    })
  }

  const handleBet = (market: string, choice: string, amount: number, odds?: number) => {
    if (userBalance >= amount) {
      setUserBalance((prev) => prev - amount)
      const newBet: ActiveBet = {
        id: `${Date.now()}`,
        market: market.slice(0, 40) + (market.length > 40 ? "..." : ""),
        choice,
        amount,
        odds: odds || 1.5,
      }
      setActiveBets((prev) => [...prev, newBet])
      toast({
        title: (
          <span>
            Pari place: {choice} pour {amount} <CurrencySymbol />
          </span>
        ),
        description: market,
        duration: 3000,
        variant: "default",
      })
    } else {
      toast({
        title: "Pas assez de Zeny!",
        duration: 2000,
        variant: "destructive",
      })
    }
  }

  // Render current view
  const renderContent = () => {
    if (showLeaderboard) {
      return <LeaderboardView onBack={handleBack} />
    }
    if (selectedMarket) {
      return (
        <MarketDetailView
          market={selectedMarket}
          onBack={handleBack}
          onBet={handleBet}
          userBalance={userBalance}
        />
      )
    }
    switch (activeTab) {
      case "profile":
        return <ProfileView />
      case "shop":
        return <ShopView />
      default:
        return (
          <HomeView
            onBet={handleBet}
            onMarketClick={handleMarketClick}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        )
    }
  }

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
          onNavigate={handleNavigate}
          onShowLeaderboard={handleShowLeaderboard}
        />

        {/* Main Content */}
        <main className="col-span-1 lg:col-span-7">
          <AppHeader
            userBalance={userBalance}
            activeBets={activeBets}
            onWalletClick={handleWalletClick}
            onShowLeaderboard={handleShowLeaderboard}
          />
          <div className="pb-24 lg:pb-6">{renderContent()}</div>
        </main>

        {/* Right Sidebar - Desktop */}
        <RightSidebar
          trendingMarkets={trendingMarkets}
          userBalance={userBalance}
          onMarketClick={handleMarketClick}
          onShowLeaderboard={handleShowLeaderboard}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        showLeaderboard={showLeaderboard}
        onNavigate={handleNavigate}
        onShowLeaderboard={handleShowLeaderboard}
      />
    </div>
  )
}
