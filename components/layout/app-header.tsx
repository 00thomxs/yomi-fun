"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Trophy, User, LogOut, Plus } from "lucide-react"
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border -mx-4 px-4 lg:mx-0 lg:px-0 mb-6">
        <div className="flex items-center justify-between h-16">
          <div className="lg:hidden">
            <Link href="/">
              <YomiLogo />
            </Link>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {/* Leaderboard button - mobile only */}
            <Link
              href="/leaderboard"
              aria-label="Classement"
              className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-border hover:bg-surface-hover transition-colors lg:hidden"
            >
              <Trophy className="w-[18px] h-[18px] text-muted-foreground" />
            </Link>

            {/* Wallet - only show when authenticated */}
            {isAuthenticated && (
              <Link 
                href="/shop/buy-zeny"
                className="h-10 px-3 rounded-md border border-border hover:bg-surface-hover transition-colors flex items-center gap-2"
                title="Recharger des Zeny"
              >
                <span className="flex items-center gap-1 text-sm font-semibold tracking-tight">
                  <span className="font-mono font-semibold">{userBalance.toLocaleString()}</span><CurrencySymbol className="text-primary" />
                </span>
                <Plus className="w-4 h-4 text-muted-foreground" aria-hidden />
              </Link>
            )}

            {/* Login/User button */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Menu du compte"
                  className="h-10 flex items-center gap-2 pl-1 pr-3 rounded-md border border-border hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <img
                    src={user?.avatar || "/images/default-avatar.svg"}
                    alt={user?.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium hidden sm:inline">@{user?.username}</span>
                </button>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-md bg-popover border border-border shadow-lg shadow-black/40 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      Mon Profil
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-no hover:bg-surface-hover transition-colors cursor-pointer"
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
                className="h-10 px-4 inline-flex items-center rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Active Bets Banner */}
      {activeBets.length > 0 && (
        <Link href="/profile" className="lg:hidden mb-4 block rounded-lg border border-border px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
              <span className="text-xs font-medium">
                {activeBets.length} Pari{activeBets.length > 1 ? "s" : ""} Actif{activeBets.length > 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {activeBets.reduce((sum, bet) => sum + bet.amount, 0)} <CurrencySymbol /> engagés
            </span>
          </div>
        </Link>
      )}
    </>
  )
}
