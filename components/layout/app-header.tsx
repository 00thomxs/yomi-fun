"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Trophy, User, LogOut, Plus } from "lucide-react"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { useUser } from "@/contexts/user-context"

const NAV = [
  { href: "/", label: "Marchés", match: (p: string) => p === "/" || p.startsWith("/market/") },
  { href: "/leaderboard", label: "Classement", match: (p: string) => p === "/leaderboard" },
  { href: "/shop", label: "Shop", match: (p: string) => p.startsWith("/shop") },
]

export function AppHeader() {
  const { user, isAuthenticated, userBalance, activeBets, signOut } = useUser()
  const pathname = usePathname()
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
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-6 h-16 flex items-center gap-8">
          <Link href="/" aria-label="YOMI.fun, accueil" className="shrink-0">
            <YomiLogo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 h-full" aria-label="Navigation principale">
            {NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative h-full inline-flex items-center text-sm font-medium transition-colors ${
                    active
                      ? "text-brand after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            {/* Leaderboard - mobile only (desktop has it in the nav) */}
            <Link
              href="/leaderboard"
              aria-label="Classement"
              className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-border hover:bg-surface-hover transition-colors lg:hidden"
            >
              <Trophy className="w-[18px] h-[18px] text-muted-foreground" />
            </Link>

            {isAuthenticated && activeBets.length > 0 && (
              <Link
                href="/profile"
                className="hidden lg:inline-flex h-10 items-center gap-2 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden />
                {activeBets.length} pari{activeBets.length > 1 ? "s" : ""} en cours
              </Link>
            )}

            {/* Wallet */}
            {isAuthenticated && (
              <Link
                href="/shop/buy-zeny"
                className="h-10 pl-3 pr-1.5 rounded-md border border-border hover:bg-surface-hover transition-colors flex items-center gap-2"
                title="Recharger des Zeny"
              >
                <span className="flex items-baseline gap-1 text-sm font-semibold">
                  <span className="font-mono">{userBalance.toLocaleString()}</span>
                  <CurrencySymbol className="text-brand" />
                </span>
                <span className="h-7 w-7 inline-flex items-center justify-center rounded bg-primary text-primary-foreground" aria-hidden>
                  <Plus className="w-4 h-4" />
                </span>
              </Link>
            )}

            {/* Account */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Menu du compte"
                  aria-expanded={isMenuOpen}
                  className="h-10 flex items-center gap-2 pl-1 pr-3 rounded-md border border-border hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <img
                    src={user?.avatar || "/images/default-avatar.svg"}
                    alt=""
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="text-sm font-medium hidden sm:inline">{user?.username}</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-md bg-popover border border-border shadow-lg shadow-black/40 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      Mon profil
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
                className="h-10 px-4 inline-flex items-center rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Active Bets Banner */}
      {activeBets.length > 0 && (
        <Link href="/profile" className="lg:hidden mx-4 mt-3 block rounded-md border border-border px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden />
              <span className="text-xs font-medium">
                {activeBets.length} pari{activeBets.length > 1 ? "s" : ""} en cours
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
