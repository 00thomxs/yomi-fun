'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Check, Loader2, Trophy } from 'lucide-react'
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

// Rarity accent colors
const RARITY_ACCENT: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  common: { 
    border: 'border-border', 
    glow: '', 
    text: 'text-muted-foreground',
    bg: 'from-zinc-800/50 via-zinc-900/80 to-black'
  },
  rare: { 
    border: 'border-blue-500/50', 
    glow: '', 
    text: 'text-blue-400',
    bg: 'from-blue-950/50 via-zinc-900/80 to-black'
  },
  epic: { 
    border: 'border-purple-500/50', 
    glow: '', 
    text: 'text-purple-400',
    bg: 'from-purple-950/50 via-zinc-900/80 to-black'
  },
  legendary: { 
    border: 'border-amber-500/60', 
    glow: '', 
    text: 'text-amber-400',
    bg: 'from-amber-950/40 via-zinc-900/80 to-black'
  },
}

export function BadgeEarnedPopup() {
  const [unseenBadges, setUnseenBadges] = useState<UserBadgeWithDetails[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isEquipping, setIsEquipping] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Fetch unseen badges on mount
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const badges = await getUnseenBadges()
        if (badges.length > 0) {
          setUnseenBadges(badges)
          setTimeout(() => setIsVisible(true), 100)
        }
      } catch {
        // Silently fail
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const currentBadge = unseenBadges[currentIndex]
  
  if (!currentBadge || isClosing) return null

  const badge = currentBadge.badge
  const rarity = badge.rarity
  const categoryLabel = CATEGORY_LABELS[badge.category] || badge.category
  const accent = RARITY_ACCENT[rarity] || RARITY_ACCENT.common

  const handleClose = () => {
    setIsVisible(false)
    // Fire and forget: the popup must not stay on screen while the server answers
    markBadgeAsSeen(currentBadge.id).catch(() => {})

    setTimeout(() => {
      if (currentIndex < unseenBadges.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setTimeout(() => setIsVisible(true), 100)
      } else {
        setIsClosing(true)
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

  const reveal = isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-2"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="badge-title">
      <div
        className={cn("absolute inset-0 modal-scrim transition-opacity duration-300", isVisible ? "opacity-100" : "opacity-0")}
        onClick={handleClose}
      />

      {/* Only the frame carries the rarity colour */}
      <div className={cn("modal-panel w-full max-w-sm p-6 transition-all duration-300", accent.border, reveal)}>
        <button onClick={handleClose} aria-label="Fermer" className="modal-close">
          <X className="w-4 h-4" />
        </button>

        <p className={cn("inline-flex items-center gap-1.5 text-xs font-medium", accent.text)}>
          <Trophy className="w-3.5 h-3.5" aria-hidden />
          Badge débloqué
          {unseenBadges.length > 1 && (
            <span className="text-muted-foreground font-mono">· {currentIndex + 1}/{unseenBadges.length}</span>
          )}
        </p>

        <div className="mt-6 flex justify-center">
          <BadgeDisplay badge={badge} size="lg" />
        </div>

        <div className="mt-6 text-center">
          <h2 id="badge-title" className={cn("font-display text-xl font-bold tracking-tight", accent.text)}>{badge.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{categoryLabel}</p>
          {badge.description && <p className="mt-3 text-sm text-foreground/80">{badge.description}</p>}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={handleClose}
            className="h-11 rounded-md border border-border text-sm font-medium hover:bg-surface-hover transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleEquip}
            disabled={isEquipping}
            autoFocus
            className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:bg-white/5 disabled:text-muted-foreground"
          >
            {isEquipping ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Check className="w-4 h-4" aria-hidden />}
            Équiper
          </button>
        </div>
      </div>
    </div>
  )
}
