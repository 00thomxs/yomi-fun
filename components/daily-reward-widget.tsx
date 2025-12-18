'use client'

import { useState, useEffect } from 'react'
import { Gift, Trophy, Clock, Check, Loader2 } from 'lucide-react'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { useUser } from '@/contexts/user-context'
import { 
  getDailyRewardStatus, 
  claimDailyBonus, 
  claimWelcomeBonus,
  type DailyRewardStatus,
  type DailyRewardResult 
} from '@/app/actions/daily-rewards'

/**
 * Small daily reward widget for the sidebar.
 * Shows current streak progress and allows claiming directly.
 */
export function DailyRewardWidget() {
  const { setUserBalance } = useUser()
  const [status, setStatus] = useState<DailyRewardStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<DailyRewardResult | null>(null)
  const [isWelcomeBonus, setIsWelcomeBonus] = useState(false)
  const [countdown, setCountdown] = useState<string>('')

  const fetchStatus = async () => {
    const result = await getDailyRewardStatus()
    setStatus(result)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    
    // Refresh periodically
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
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
        fetchStatus()
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setCountdown(`${hours}h${minutes.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [status?.nextClaimAt, status?.canClaim])

  const handleClaimWelcome = async () => {
    setIsClaiming(true)
    const result = await claimWelcomeBonus()
    
    if (result.success && result.newBalance !== undefined) {
      setUserBalance(result.newBalance)
      setIsWelcomeBonus(true)
      setClaimResult({ success: true, amount: result.amount })
      // Reset after showing success
      setTimeout(() => {
        setClaimResult(null)
        setIsWelcomeBonus(false)
        fetchStatus()
      }, 2000)
    }
    
    setIsClaiming(false)
  }

  const handleClaimDaily = async () => {
    setIsClaiming(true)
    const result = await claimDailyBonus()
    
    if (result.success) {
      setClaimResult(result)
      if (result.newBalance !== undefined) {
        setUserBalance(result.newBalance)
      }
      // Reset after showing success
      setTimeout(() => {
        setClaimResult(null)
        fetchStatus()
      }, result.isJackpot ? 3000 : 2000)
    }
    
    setIsClaiming(false)
  }

  if (isLoading) {
    return (
      <div className="p-3 rounded-lg bg-white/5 border border-border animate-pulse">
        <div className="h-8 bg-white/5 rounded" />
      </div>
    )
  }

  if (!status) return null

  // Success state
  if (claimResult?.success) {
    const isJackpot = claimResult.isJackpot
    return (
      <div className={`p-3 rounded-lg border ${
        isJackpot || isWelcomeBonus
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        <div className="flex items-center gap-2">
          <Check className={`w-4 h-4 ${isJackpot || isWelcomeBonus ? 'text-amber-400' : 'text-emerald-400'}`} />
          <span className={`text-xs font-bold ${isJackpot || isWelcomeBonus ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isWelcomeBonus ? 'Bienvenue !' : isJackpot ? `Jackpot !` : `Jour ${claimResult.streakDay}`}
          </span>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-sm font-bold font-mono ${
          isJackpot || isWelcomeBonus ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          +{claimResult.amount?.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
        </div>
      </div>
    )
  }

  // Welcome bonus not claimed yet
  if (status.canClaimWelcome) {
    return (
      <button
        onClick={handleClaimWelcome}
        disabled={isClaiming}
        className="w-full p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all text-left disabled:opacity-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClaiming ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Gift className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-bold text-amber-400">Bienvenue !</span>
          </div>
          <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-0.5">
            +200<CurrencySymbol className="w-3 h-3" />
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Clique pour récupérer
        </p>
      </button>
    )
  }

  const isJackpotDay = status.isJackpotDay
  const dayDisplay = (status.currentStreak ?? 0) + 1

  // Can claim - make it a button
  if (status.canClaim) {
    return (
      <button
        onClick={handleClaimDaily}
        disabled={isClaiming}
        className={`w-full p-3 rounded-lg border transition-all text-left disabled:opacity-50 ${
          isJackpotDay 
            ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' 
            : 'bg-primary/10 border-primary/30 hover:bg-primary/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClaiming ? (
              <Loader2 className={`w-4 h-4 animate-spin ${isJackpotDay ? 'text-amber-400' : 'text-primary'}`} />
            ) : isJackpotDay ? (
              <Trophy className="w-4 h-4 text-amber-400" />
            ) : (
              <Gift className="w-4 h-4 text-primary" />
            )}
            <span className={`text-xs font-bold ${isJackpotDay ? 'text-amber-400' : 'text-primary'}`}>
              Jour {dayDisplay}/7
            </span>
          </div>
          
          <span className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
            isJackpotDay ? 'text-amber-400' : 'text-primary'
          }`}>
            {isJackpotDay ? '🎰' : `+${status.todayReward}`}
            {!isJackpotDay && <CurrencySymbol className="w-3 h-3" />}
          </span>
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
                    : isCurrent
                      ? isJackpot ? 'bg-amber-500 animate-pulse' : 'bg-primary animate-pulse'
                      : 'bg-white/10'
                }`}
              />
            )
          })}
        </div>
      </button>
    )
  }

  // Cannot claim yet - just display info
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">
            Jour {dayDisplay}/7
          </span>
        </div>
        
        {countdown && (
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
          
          return (
            <div
              key={day}
              className={`h-1 flex-1 rounded-full transition-all ${
                isPast 
                  ? 'bg-emerald-500' 
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
