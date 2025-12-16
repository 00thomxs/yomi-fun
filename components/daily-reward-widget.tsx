'use client'

import { useState, useEffect } from 'react'
import { Gift, Trophy, Clock } from 'lucide-react'
import { getDailyRewardStatus, type DailyRewardStatus } from '@/app/actions/daily-rewards'

/**
 * Small daily reward widget for the sidebar.
 * Shows current streak progress and availability status.
 * Always visible (unlike the banner which hides after claim).
 */
export function DailyRewardWidget() {
  const [status, setStatus] = useState<DailyRewardStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [countdown, setCountdown] = useState<string>('')

  useEffect(() => {
    const fetchStatus = async () => {
      const result = await getDailyRewardStatus()
      setStatus(result)
      setIsLoading(false)
    }
    fetchStatus()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!status?.nextClaimAt || status.canClaim) {
      setCountdown('')
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const next = new Date(status.nextClaimAt!)
      const diff = next.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown('')
        getDailyRewardStatus().then(setStatus)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setCountdown(`${hours}h${minutes.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [status?.nextClaimAt, status?.canClaim])

  if (isLoading) {
    return (
      <div className="p-3 rounded-lg bg-white/5 border border-border animate-pulse">
        <div className="h-8 bg-white/5 rounded" />
      </div>
    )
  }

  if (!status) return null

  // Welcome bonus not claimed yet
  if (status.canClaimWelcome) {
    return (
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-400">Bienvenue !</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          +200 Zeny t'attendent
        </p>
      </div>
    )
  }

  const isJackpotDay = status.isJackpotDay
  const dayDisplay = status.currentStreak + 1

  return (
    <div className={`p-3 rounded-lg border ${
      status.canClaim 
        ? isJackpotDay 
          ? 'bg-amber-500/10 border-amber-500/30' 
          : 'bg-primary/10 border-primary/30'
        : 'bg-white/5 border-border'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isJackpotDay ? (
            <Trophy className="w-4 h-4 text-amber-400" />
          ) : (
            <Gift className="w-4 h-4 text-primary" />
          )}
          <span className={`text-xs font-bold ${
            status.canClaim 
              ? isJackpotDay ? 'text-amber-400' : 'text-primary'
              : 'text-muted-foreground'
          }`}>
            Jour {dayDisplay}/7
          </span>
        </div>
        
        {status.canClaim ? (
          <span className={`text-[10px] font-bold uppercase ${
            isJackpotDay ? 'text-amber-400' : 'text-primary'
          }`}>
            Dispo
          </span>
        ) : countdown && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{countdown}</span>
          </div>
        )}
      </div>
      
      {/* Mini streak progress */}
      <div className="flex gap-0.5 mt-2">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const isPast = day < status.currentStreak
          const isCurrent = day === status.currentStreak
          const isJackpot = day === 6
          
          return (
            <div
              key={day}
              className={`h-1 flex-1 rounded-full transition-all ${
                isPast 
                  ? 'bg-emerald-500' 
                  : isCurrent && status.canClaim
                    ? isJackpot ? 'bg-amber-500 animate-pulse' : 'bg-primary animate-pulse'
                    : isCurrent
                      ? 'bg-white/30'
                      : 'bg-white/10'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}

