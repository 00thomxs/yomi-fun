'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Check, Loader2 } from 'lucide-react'
import { BadgeDisplay } from '@/components/ui/badge-display'
import { markBadgeAsSeen, toggleEquipBadge, getUnseenBadges } from '@/app/actions/badges'
import type { UserBadgeWithDetails } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Category labels in French
const CATEGORY_LABELS: Record<string, string> = {
  streak: 'Série de Victoires',
  pnl: 'Performance',
  season: 'Saison',
  volume: 'Volume',
  skill: 'Compétence',
  legacy: 'Légende',
  fun: 'Accomplissement',
}

// Rarity colors for background effects
const RARITY_COLORS: Record<string, string> = {
  common: 'from-zinc-500/20 to-zinc-600/10',
  rare: 'from-blue-500/30 to-blue-600/10',
  epic: 'from-purple-500/40 to-purple-600/10',
  legendary: 'from-amber-500/50 to-amber-600/10',
}

const RARITY_GLOW: Record<string, string> = {
  common: '',
  rare: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]',
  epic: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]',
  legendary: 'shadow-[0_0_60px_rgba(245,158,11,0.4)]',
}

export function BadgeEarnedPopup() {
  const [unseenBadges, setUnseenBadges] = useState<UserBadgeWithDetails[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isEquipping, setIsEquipping] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Fetch unseen badges on mount
  useEffect(() => {
    // Initial fetch after small delay to not block page load
    const timer = setTimeout(async () => {
      try {
        const badges = await getUnseenBadges()
        setUnseenBadges(badges)
      } catch {
        // Silently fail - not critical
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const currentBadge = unseenBadges[currentIndex]
  
  if (!currentBadge || isClosing) return null

  const badge = currentBadge.badge
  const rarity = badge.rarity
  const categoryLabel = CATEGORY_LABELS[badge.category] || badge.category

  const handleClose = async () => {
    setIsClosing(true)
    
    // Mark as seen
    await markBadgeAsSeen(currentBadge.id)
    
    // Small delay for animation
    setTimeout(() => {
      setIsClosing(false)
      if (currentIndex < unseenBadges.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setUnseenBadges([])
        setCurrentIndex(0)
      }
    }, 300)
  }

  const handleEquip = async () => {
    setIsEquipping(true)
    
    const result = await toggleEquipBadge(currentBadge.id)
    
    if (result.success) {
      toast.success('Badge équipé !')
    } else {
      toast.error(result.error || 'Erreur')
    }
    
    setIsEquipping(false)
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Popup */}
      <div 
        className={cn(
          'relative max-w-sm w-full rounded-2xl border overflow-hidden',
          'bg-zinc-950 border-zinc-800',
          'animate-in zoom-in-95 slide-in-from-bottom-4 duration-500',
          RARITY_GLOW[rarity]
        )}
      >
        {/* Gradient background */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-b opacity-50',
          RARITY_COLORS[rarity]
        )} />

        {/* Sparkle effects for legendary */}
        {rarity === 'legendary' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Sparkles className="absolute top-4 left-4 w-4 h-4 text-amber-400 animate-pulse" />
            <Sparkles className="absolute top-8 right-8 w-3 h-3 text-amber-300 animate-pulse delay-100" />
            <Sparkles className="absolute bottom-12 left-8 w-5 h-5 text-amber-400 animate-pulse delay-200" />
            <Sparkles className="absolute bottom-8 right-4 w-4 h-4 text-amber-300 animate-pulse delay-300" />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8 text-center space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
              Nouveau Badge Débloqué
            </p>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-bounce" />
              <span className="text-lg font-bold text-primary">Félicitations !</span>
              <Sparkles className="w-5 h-5 text-primary animate-bounce delay-100" />
            </div>
          </div>

          {/* Badge Display - Large */}
          <div className="flex justify-center py-4">
            <div className="transform scale-150">
              <BadgeDisplay badge={badge} size="lg" />
            </div>
          </div>

          {/* Badge Info */}
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">
              {categoryLabel}
            </p>
            <p className="text-sm text-zinc-500">
              {badge.description}
            </p>
          </div>

          {/* Counter if multiple */}
          {unseenBadges.length > 1 && (
            <p className="text-xs text-zinc-600">
              {currentIndex + 1} / {unseenBadges.length}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              Fermer
            </button>
            <button
              onClick={handleEquip}
              disabled={isEquipping}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-bold transition-all',
                'bg-primary hover:bg-primary/90 text-primary-foreground',
                'flex items-center justify-center gap-2',
                isEquipping && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isEquipping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Équiper
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

