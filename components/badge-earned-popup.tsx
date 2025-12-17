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
    border: 'border-zinc-600', 
    glow: '', 
    text: 'text-zinc-400',
    bg: 'from-zinc-800/50 via-zinc-900/80 to-black'
  },
  rare: { 
    border: 'border-blue-500/50', 
    glow: 'shadow-[0_0_80px_rgba(59,130,246,0.3)]', 
    text: 'text-blue-400',
    bg: 'from-blue-950/50 via-zinc-900/80 to-black'
  },
  epic: { 
    border: 'border-purple-500/50', 
    glow: 'shadow-[0_0_80px_rgba(168,85,247,0.4)]', 
    text: 'text-purple-400',
    bg: 'from-purple-950/50 via-zinc-900/80 to-black'
  },
  legendary: { 
    border: 'border-amber-500/60', 
    glow: 'shadow-[0_0_100px_rgba(245,158,11,0.5)]', 
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

  const handleClose = async () => {
    setIsVisible(false)
    await markBadgeAsSeen(currentBadge.id)
    
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Popup */}
      <div 
        className={cn(
          'relative max-w-[340px] w-full rounded-2xl border-2 overflow-hidden transition-all duration-500',
          accent.border,
          accent.glow,
          isVisible 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4"
        )}
      >
        {/* Background gradient */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-b',
          accent.bg
        )} />
        
        {/* Tactical grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Sparkle effects for legendary/epic */}
        {(rarity === 'legendary' || rarity === 'epic') && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={cn(
              "absolute top-6 left-6 w-1 h-1 rounded-full animate-ping",
              rarity === 'legendary' ? "bg-amber-400" : "bg-purple-400"
            )} />
            <div className={cn(
              "absolute top-12 right-10 w-1.5 h-1.5 rounded-full animate-ping delay-300",
              rarity === 'legendary' ? "bg-amber-300" : "bg-purple-300"
            )} />
            <div className={cn(
              "absolute bottom-20 left-10 w-1 h-1 rounded-full animate-ping delay-700",
              rarity === 'legendary' ? "bg-amber-400" : "bg-purple-400"
            )} />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative p-6 text-center">
          {/* Trophy icon */}
          <div className={cn(
            "w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center",
            rarity === 'legendary' ? "bg-amber-500/20" : 
            rarity === 'epic' ? "bg-purple-500/20" :
            rarity === 'rare' ? "bg-blue-500/20" : "bg-zinc-800"
          )}>
            <Trophy className={cn("w-6 h-6", accent.text)} />
          </div>

          {/* Header */}
          <div className="space-y-1 mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">
              Badge Débloqué
            </p>
            <p className={cn("text-xl font-black tracking-tight", accent.text)}>
              {badge.name}
            </p>
          </div>

          {/* Badge Display - Centered */}
          <div className="flex justify-center mb-6">
            <BadgeDisplay badge={badge} size="lg" />
          </div>

          {/* Badge Info */}
          <div className="space-y-1 mb-6">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {categoryLabel}
            </p>
            <p className="text-sm text-zinc-400">
              {badge.description}
            </p>
          </div>

          {/* Counter if multiple */}
          {unseenBadges.length > 1 && (
            <div className="flex justify-center gap-1 mb-4">
              {unseenBadges.map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentIndex ? accent.text.replace('text-', 'bg-') : "bg-zinc-700"
                  )}
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
            >
              Fermer
            </button>
            <button
              onClick={handleEquip}
              disabled={isEquipping}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all',
                'bg-primary hover:bg-primary/90 text-white',
                'flex items-center justify-center gap-2',
                'shadow-lg shadow-primary/20',
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
