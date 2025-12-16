'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wallet, Zap, X, Clock } from 'lucide-react'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { useUser } from '@/contexts/user-context'

type LowBalancePopupProps = {
  eventName: string
  closesAt: string
}

const POPUP_STORAGE_KEY = 'yomi_low_balance_popup_dismissed'

export function LowBalancePopup({ eventName, closesAt }: LowBalancePopupProps) {
  const { userBalance, user } = useUser()
  const [isVisible, setIsVisible] = useState(false)

  const MIN_BET = 100
  const isLowBalance = userBalance < MIN_BET

  useEffect(() => {
    if (!user || !isLowBalance) return
    if (typeof window === 'undefined') return

    // Check if already dismissed today
    try {
      const dismissedAt = localStorage.getItem(POPUP_STORAGE_KEY)
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt)
        const now = new Date()
        // Don't show again for 24h after dismissal
        if (now.getTime() - dismissedDate.getTime() < 24 * 60 * 60 * 1000) {
          return
        }
      }
    } catch {
      // localStorage not available
    }

    // Check if event closes in < 12h (more urgent)
    const closesDate = new Date(closesAt)
    const hoursRemaining = (closesDate.getTime() - Date.now()) / (1000 * 60 * 60)
    
    if (hoursRemaining > 0 && hoursRemaining < 12) {
      // Delay showing popup by 5 seconds - let user see the page first
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [user, isLowBalance, closesAt])

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem(POPUP_STORAGE_KEY, new Date().toISOString())
    } catch {
      // localStorage not available
    }
  }

  if (!isVisible) return null

  // Calculate time remaining
  const closesDate = new Date(closesAt)
  const hoursRemaining = Math.max(0, Math.floor((closesDate.getTime() - Date.now()) / (1000 * 60 * 60)))
  const minutesRemaining = Math.max(0, Math.floor((closesDate.getTime() - Date.now()) / (1000 * 60)) % 60)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative text-center space-y-4">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30">
            <Wallet className="w-8 h-8 text-amber-400" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Solde insuffisant
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Recharge pour participer à cet event
            </p>
          </div>

          {/* Balance display */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-border">
            <span className="text-xs text-muted-foreground">Solde:</span>
            <span className="font-bold font-mono text-white flex items-center gap-0.5">
              {userBalance}<CurrencySymbol className="w-3 h-3" />
            </span>
          </div>

          {/* Event info */}
          <div className="bg-white/5 rounded-xl p-3 border border-border text-left">
            <p className="font-medium text-white text-sm line-clamp-2">{eventName}</p>
            <div className="flex items-center gap-2 mt-2 text-amber-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">
                Ferme dans {hoursRemaining}h{minutesRemaining.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-2 pt-1">
            <Link
              href="/shop#packs"
              onClick={handleDismiss}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all"
            >
              <Zap className="w-4 h-4" />
              Recharger
            </Link>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

