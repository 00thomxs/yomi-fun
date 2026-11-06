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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="low-balance-title">
      <div className="absolute inset-0 modal-scrim animate-in fade-in duration-200" onClick={handleDismiss} />

      <div className="modal-panel w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <button onClick={handleDismiss} aria-label="Fermer" className="modal-close">
          <X className="w-4 h-4" />
        </button>

        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
          <Wallet className="w-3.5 h-3.5" aria-hidden />
          Solde insuffisant
        </p>
        <h2 id="low-balance-title" className="mt-2 pr-8 text-base font-semibold leading-snug">Recharge pour participer à cet event</h2>

        <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
          <div className="py-3">
            <dt className="sr-only">Event</dt>
            <dd className="font-medium line-clamp-2">{eventName}</dd>
            <dd className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-400">
              <Clock className="w-3.5 h-3.5" aria-hidden />
              Ferme dans {hoursRemaining}h{minutesRemaining.toString().padStart(2, '0')}
            </dd>
          </div>
          <div className="flex justify-between items-center py-3">
            <dt className="text-muted-foreground">Ton solde</dt>
            <dd className="font-mono font-semibold flex items-center gap-1">
              {userBalance.toLocaleString()} <CurrencySymbol />
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={handleDismiss}
            className="h-11 rounded-md border border-border text-sm font-medium hover:bg-surface-hover transition-colors"
          >
            Plus tard
          </button>
          <Link
            href="/shop#packs"
            onClick={handleDismiss}
            className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" aria-hidden />
            Recharger
          </Link>
        </div>
      </div>
    </div>
  )
}

