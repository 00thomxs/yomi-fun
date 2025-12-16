'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wallet, Zap, X, Clock } from 'lucide-react'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/contexts/user-context'

type UpcomingEvent = {
  id: string
  question: string
  closes_at: string
}

export function LowBalanceBanner() {
  const { userBalance, user } = useUser()
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const MIN_BET = 100 // Minimum bet amount
  const isLowBalance = userBalance < MIN_BET

  useEffect(() => {
    const fetchUpcomingEvent = async () => {
      if (!isLowBalance || !user) {
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const now = new Date().toISOString()
      const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      // Find an event closing in the next 24 hours
      const { data, error } = await supabase
        .from('markets')
        .select('id, question, closes_at')
        .eq('status', 'open')
        .eq('is_visible', true)
        .gte('closes_at', now)
        .lte('closes_at', in24h)
        .order('closes_at', { ascending: true })
        .limit(1)

      // data is an array, take first item if exists
      if (!error && data && data.length > 0) {
        setUpcomingEvent(data[0])
      }
      setIsLoading(false)
    }

    fetchUpcomingEvent()
  }, [isLowBalance, user])

  // Don't show if:
  // - Loading
  // - User dismissed it
  // - User has enough balance
  // - No upcoming events
  // - User not logged in
  if (isLoading || dismissed || !isLowBalance || !upcomingEvent || !user) {
    return null
  }

  // Calculate time remaining
  const closesAt = new Date(upcomingEvent.closes_at)
  const hoursRemaining = Math.max(0, Math.floor((closesAt.getTime() - Date.now()) / (1000 * 60 * 60)))
  const minutesRemaining = Math.max(0, Math.floor((closesAt.getTime() - Date.now()) / (1000 * 60)) % 60)

  return (
    <div className="relative overflow-hidden rounded-xl bg-card border border-border p-3 animate-in slide-in-from-top-2 duration-300">
      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-white transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative flex items-center gap-3 pr-6">
        {/* Icon */}
        <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Wallet className="w-5 h-5 text-amber-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            Solde faible ({userBalance}<CurrencySymbol className="w-3 h-3 inline" />)
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="truncate">{upcomingEvent.question}</span>
            <span className="text-amber-400 font-medium whitespace-nowrap">
              - {hoursRemaining}h{minutesRemaining.toString().padStart(2, '0')}
            </span>
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/shop#packs"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          Recharger
        </Link>
      </div>
    </div>
  )
}

