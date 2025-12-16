'use client'

import { useState, useEffect } from 'react'
import { Gift, Sparkles, Clock, Check, Trophy, Star, Zap } from 'lucide-react'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { claimDailyBonus, claimWelcomeBonus, getDailyRewardStatus, type DailyRewardStatus, type DailyRewardResult } from '@/app/actions/daily-rewards'
import { DAILY_REWARDS_CONFIG } from '@/lib/constants'

type DailyRewardProps = {
  onClaim?: (newBalance: number) => void
}

export function DailyReward({ onClaim }: DailyRewardProps) {
  const [status, setStatus] = useState<DailyRewardStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<DailyRewardResult | null>(null)
  const [showJackpotAnimation, setShowJackpotAnimation] = useState(false)
  const [countdown, setCountdown] = useState<string>('')

  // Fetch status on mount
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
        // Refresh status
        getDailyRewardStatus().then(setStatus)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [status?.nextClaimAt, status?.canClaim])

  const handleClaimWelcome = async () => {
    setIsClaiming(true)
    const result = await claimWelcomeBonus()
    
    if (result.success && result.newBalance !== undefined) {
      onClaim?.(result.newBalance)
      // Refresh status
      const newStatus = await getDailyRewardStatus()
      setStatus(newStatus)
    }
    
    setIsClaiming(false)
  }

  const handleClaimDaily = async () => {
    setIsClaiming(true)
    const result = await claimDailyBonus()
    
    if (result.success) {
      setClaimResult(result)
      
      if (result.isJackpot) {
        setShowJackpotAnimation(true)
        setTimeout(() => setShowJackpotAnimation(false), 3000)
      }
      
      if (result.newBalance !== undefined) {
        onClaim?.(result.newBalance)
      }
      
      // Refresh status after a moment
      setTimeout(async () => {
        const newStatus = await getDailyRewardStatus()
        setStatus(newStatus)
        setClaimResult(null)
      }, result.isJackpot ? 3500 : 1500)
    }
    
    setIsClaiming(false)
  }

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border animate-pulse">
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    )
  }

  if (!status) return null

  // Welcome Bonus Card
  if (status.canClaimWelcome) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 relative overflow-hidden">
        {/* Sparkle effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-4 text-amber-400/30 animate-pulse"><Sparkles className="w-4 h-4" /></div>
          <div className="absolute bottom-3 right-6 text-amber-400/30 animate-pulse delay-300"><Star className="w-3 h-3" /></div>
          <div className="absolute top-1/2 right-4 text-amber-400/30 animate-pulse delay-500"><Zap className="w-3 h-3" /></div>
        </div>

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-amber-400">Bonus de bienvenue !</h3>
              <p className="text-sm text-muted-foreground">Récupère tes premiers Zeny</p>
            </div>
          </div>
          
          <button
            onClick={handleClaimWelcome}
            disabled={isClaiming}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {isClaiming ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span className="font-mono">+200</span>
                <CurrencySymbol className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Jackpot Animation Overlay
  if (showJackpotAnimation && claimResult?.isJackpot) {
    return (
      <div className="p-6 rounded-xl border relative overflow-hidden animate-in zoom-in-95 duration-500"
        style={{ 
          backgroundColor: `${claimResult.jackpotColor}15`,
          borderColor: `${claimResult.jackpotColor}50`
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.5s'
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: claimResult.jackpotColor }} />
            </div>
          ))}
        </div>

        <div className="relative text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full animate-bounce"
            style={{ backgroundColor: `${claimResult.jackpotColor}30` }}
          >
            <Trophy className="w-10 h-10" style={{ color: claimResult.jackpotColor }} />
          </div>
          
          <div>
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: claimResult.jackpotColor }}>
              {claimResult.jackpotLabel}
            </p>
            <p className="text-4xl font-black font-mono text-white flex items-center justify-center gap-2">
              +{claimResult.amount?.toLocaleString()}
              <CurrencySymbol className="w-8 h-8" />
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">Jackpot Jour 7</p>
        </div>
      </div>
    )
  }

  // Regular claim result
  if (claimResult?.success && !claimResult.isJackpot) {
    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-emerald-400">Jour {claimResult.streakDay} récupéré !</p>
              <p className="text-sm text-muted-foreground">Reviens demain pour le Jour {(claimResult.streakDay || 0) + 1}</p>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 flex items-center gap-1">
            +{claimResult.amount}
            <CurrencySymbol className="w-5 h-5" />
          </div>
        </div>
      </div>
    )
  }

  // Main Daily Reward Card
  const streakDays = DAILY_REWARDS_CONFIG.base
  const isJackpotDay = status.currentStreak === 6

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Bonus Quotidien</h3>
        </div>
        {!status.canClaim && countdown && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{countdown}</span>
          </div>
        )}
      </div>

      {/* Streak Progress */}
      <div className="flex gap-1.5">
        {streakDays.map((amount, index) => {
          const isPast = index < status.currentStreak
          const isCurrent = index === status.currentStreak
          const isFuture = index > status.currentStreak
          
          return (
            <div
              key={index}
              className={`flex-1 p-2 rounded-lg text-center transition-all ${
                isPast 
                  ? 'bg-emerald-500/20 border border-emerald-500/30' 
                  : isCurrent
                    ? 'bg-primary/20 border border-primary/50 ring-2 ring-primary/30'
                    : 'bg-white/5 border border-border opacity-50'
              }`}
            >
              <p className={`text-[10px] font-bold uppercase ${isPast ? 'text-emerald-400' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                J{index + 1}
              </p>
              <p className={`text-sm font-bold font-mono ${isPast ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-muted-foreground'}`}>
                {isPast ? <Check className="w-4 h-4 mx-auto" /> : amount}
              </p>
            </div>
          )
        })}
        
        {/* Day 7 Jackpot */}
        <div
          className={`flex-1 p-2 rounded-lg text-center transition-all ${
            isJackpotDay
              ? 'bg-amber-500/20 border border-amber-500/50 ring-2 ring-amber-500/30 animate-pulse'
              : status.currentStreak > 6
                ? 'bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-white/5 border border-border opacity-50'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase ${isJackpotDay ? 'text-amber-400' : 'text-muted-foreground'}`}>
            J7
          </p>
          <p className={`text-sm ${isJackpotDay ? 'text-amber-400' : 'text-muted-foreground'}`}>
            <Trophy className="w-4 h-4 mx-auto" />
          </p>
        </div>
      </div>

      {/* Claim Button */}
      {status.canClaim ? (
        <button
          onClick={handleClaimDaily}
          disabled={isClaiming}
          className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
            isJackpotDay
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {isClaiming ? (
            <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <>
              {isJackpotDay ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>Ouvrir le Jackpot !</span>
                </>
              ) : (
                <>
                  <span>Récupérer</span>
                  <span className="font-mono">+{status.todayReward}</span>
                  <CurrencySymbol className="w-4 h-4" />
                </>
              )}
            </>
          )}
        </button>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-2">
          Déjà récupéré aujourd'hui • Reviens dans {countdown || '...'}
        </div>
      )}
    </div>
  )
}

