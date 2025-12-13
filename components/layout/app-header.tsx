"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Trophy, Zap, User, LogOut, Plus } from "lucide-react"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { useUser } from "@/contexts/user-context"

export function AppHeader() {
  const { user, isAuthenticated, userBalance, activeBets, signOut } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 rounded-xl mb-6">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="lg:hidden">
            <Link href="/">
              <YomiLogo />
            </Link>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {/* Leaderboard button - mobile only */}
            <Link
              href="/leaderboard"
              className="p-2.5 rounded-lg bg-card border border-border hover:border-white/20 transition-all lg:hidden"
            >
              <Trophy className="w-5 h-5 text-white/80" />
            </Link>

            {/* Wallet - only show when authenticated */}
            {isAuthenticated && (
              <Link 
                href="/shop/buy-zeny"
                className="px-3 sm:px-4 py-2.5 rounded-lg bg-card border border-border hover:bg-primary/5 hover:border-primary/30 transition-all group flex items-center gap-2"
                title="Recharger des Zeny"
              >
                <span className="flex items-center gap-1 text-sm font-semibold tracking-tight">
                  <span className="font-mono font-bold group-hover:text-primary transition-colors">{userBalance.toLocaleString()}</span><CurrencySymbol className="text-primary" />
                </span>
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus className="w-3 h-3" />
                </div>
              </Link>
            )}

            {/* Login/User button */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-white/20 transition-all cursor-pointer"
                >
                  <img
                    src={user?.avatar || "/images/default-avatar.svg"}
                    alt={user?.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-sm font-semibold hidden sm:inline">@{user?.username}</span>
                </button>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-card border border-border shadow-xl z-50">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      Mon Profil
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Active Bets Banner */}
      {activeBets.length > 0 && (
        <div className="lg:hidden mb-4 rounded-xl bg-primary/10 border border-primary/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase">
                {activeBets.length} Pari{activeBets.length > 1 ? "s" : ""} Actif{activeBets.length > 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {activeBets.reduce((sum, bet) => sum + bet.amount, 0)} <CurrencySymbol /> engagés
            </span>
          </div>
        </div>
      )}
    </>
  )
}
