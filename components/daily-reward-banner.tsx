'use client'

import { useState, useEffect } from 'react'
import { Gift, Trophy, X } from 'lucide-react'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { claimDailyBonus, claimWelcomeBonus, getDailyRewardStatus, type DailyRewardStatus, type DailyRewardResult } from '@/app/actions/daily-rewards'

type DailyRewardBannerProps = {
  onClaim?: (newBalance: number) => void
}

/**
 * Compact daily reward banner for the home page.
 * - Shows only when a reward is available (welcome or daily)
 * - Disappears after claiming
 * - Single line, non-intrusive
 */
export function DailyRewardBanner({ onClaim }: DailyRewardBannerProps) {
  const [status, setStatus] = useState<DailyRewardStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<DailyRewardResult | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      const result = await getDailyRewardStatus()
      setStatus(result)
      setIsLoading(false)
    }
    fetchStatus()
  }, [])

  const handleClaimWelcome = async () => {
    setIsClaiming(true)
    const result = await claimWelcomeBonus()
    
    if (result.success && result.newBalance !== undefined) {
      onClaim?.(result.newBalance)
      setClaimResult({ success: true, amount: result.amount })
      setTimeout(() => {
        setDismissed(true)
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
        onClaim?.(result.newBalance)
      }
      // Hide after showing success
      setTimeout(() => {
        setDismissed(true)
      }, result.isJackpot ? 3000 : 2000)
    }
    
    setIsClaiming(false)
  }

  // Don't show if loading, dismissed, or no status
  if (isLoading || dismissed || !status) return null

  // Don't show if nothing to claim
  if (!status.canClaimWelcome && !status.canClaim) return null

  // Success state (brief display before hiding)
  if (claimResult?.success) {
    const isJackpot = claimResult.isJackpot
    return (
      <div 
        className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all animate-in fade-in duration-300 ${
          isJackpot 
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30' 
            : 'bg-emerald-500/10 border border-emerald-500/30'
        }`}
      >
        {isJackpot ? (
          <Trophy className="w-5 h-5 text-amber-400" />
        ) : (
          <Gift className="w-5 h-5 text-emerald-400" />
        )}
        <span className={`font-bold ${isJackpot ? 'text-amber-400' : 'text-emerald-400'}`}>
          {isJackpot ? `Jackpot ${claimResult.jackpotLabel}` : `Jour ${claimResult.streakDay}`} récupéré !
        </span>
        <span className={`font-mono font-bold flex items-center gap-1 ${isJackpot ? 'text-amber-400' : 'text-emerald-400'}`}>
          +{claimResult.amount?.toLocaleString()}<CurrencySymbol className="w-4 h-4" />
        </span>
      </div>
    )
  }

  // Welcome Bonus Banner
  if (status.canClaimWelcome) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-amber-400">Bonus de bienvenue</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">Récupère tes premiers Zeny</span>
        </div>
        <button
          onClick={handleClaimWelcome}
          disabled={isClaiming}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isClaiming ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <span className="font-mono">+200</span>
              <CurrencySymbol className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    )
  }

  // Daily Bonus Banner
  const isJackpotDay = status.isJackpotDay

  return (
    <div 
      className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl transition-all ${
        isJackpotDay
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
          : 'bg-card border border-border'
      }`}
    >
      <div className="flex items-center gap-3">
        {isJackpotDay ? (
          <Trophy className="w-5 h-5 text-amber-400" />
        ) : (
          <Gift className="w-5 h-5 text-primary" />
        )}
        <span className={`font-bold ${isJackpotDay ? 'text-amber-400' : 'text-foreground'}`}>
          Jour {status.currentStreak + 1}/7
        </span>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {isJackpotDay ? 'Jackpot disponible !' : 'Bonus quotidien'}
        </span>
      </div>
      
      <button
        onClick={handleClaimDaily}
        disabled={isClaiming}
        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 ${
          isJackpotDay
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        }`}
      >
        {isClaiming ? (
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : isJackpotDay ? (
          <>
            <Trophy className="w-4 h-4" />
            <span>Ouvrir</span>
          </>
        ) : (
          <>
            <span className="font-mono">+{status.todayReward}</span>
            <CurrencySymbol className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  )
}

