'use client'

import { useState, useEffect } from 'react'
import { X, Trophy, Check, Loader2, Lock } from 'lucide-react'
import { BadgeDisplay } from '@/components/ui/badge-display'
import { getUserBadges, toggleEquipBadge, getAllBadges } from '@/app/actions/badges'
import type { Badge, UserBadgeWithDetails } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Category labels and order
const CATEGORIES = [
  { key: 'all', label: 'Tous' },
  { key: 'streak', label: 'Séries' },
  { key: 'pnl', label: 'Performance' },
  { key: 'volume', label: 'Volume' },
  { key: 'season', label: 'Saison' },
  { key: 'skill', label: 'Skill' },
  { key: 'legacy', label: 'Légende' },
  { key: 'fun', label: 'Fun' },
]

// Rarity colors
const RARITY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-zinc-900/50', border: 'border-zinc-700/50', text: 'text-zinc-400' },
  rare: { bg: 'bg-blue-950/30', border: 'border-blue-500/30', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-950/30', border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { bg: 'bg-amber-950/30', border: 'border-amber-500/30', text: 'text-amber-400' },
}

type BadgesModalProps = {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function BadgesModal({ isOpen, onClose, userId }: BadgesModalProps) {
  const [userBadges, setUserBadges] = useState<UserBadgeWithDetails[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchBadges()
      setTimeout(() => setIsVisible(true), 50)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, userId])

  const fetchBadges = async () => {
    setIsLoading(true)
    const [userBadgesData, allBadgesData] = await Promise.all([
      getUserBadges(userId),
      getAllBadges()
    ])
    setUserBadges(userBadgesData)
    setAllBadges(allBadgesData)
    setIsLoading(false)
  }

  const handleToggleEquip = async (userBadgeId: string) => {
    setTogglingId(userBadgeId)
    const result = await toggleEquipBadge(userBadgeId)
    
    if (result.success) {
      const updated = await getUserBadges(userId)
      setUserBadges(updated)
      toast.success(result.isEquipped ? 'Badge équipé !' : 'Badge retiré')
    } else {
      toast.error(result.error || 'Erreur')
    }
    
    setTogglingId(null)
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  if (!isOpen) return null

  const equippedCount = userBadges.filter(ub => ub.is_equipped).length
  const ownedBadgeIds = new Set(userBadges.map(ub => ub.badge?.id || ub.badge_id))

  // Filter badges by category
  const getDisplayBadges = () => {
    if (selectedCategory === 'all') {
      return allBadges
    }
    return allBadges.filter(b => b.category === selectedCategory)
  }

  const displayBadges = getDisplayBadges()
  const ownedBadges = displayBadges.filter(b => ownedBadgeIds.has(b.id))
  const lockedBadges = displayBadges.filter(b => !ownedBadgeIds.has(b.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-xl max-h-[80vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition-all duration-300",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Mes Badges</h2>
              <p className="text-[11px] text-zinc-500">
                {userBadges.length} obtenu{userBadges.length > 1 ? 's' : ''} · {equippedCount}/2 équipés
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 p-3 border-b border-zinc-800/50 overflow-x-auto scrollbar-hide bg-zinc-900/30">
          {CATEGORIES.map(cat => {
            const count = cat.key === 'all' 
              ? allBadges.length 
              : allBadges.filter(b => b.category === cat.key).length
            
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
                  selectedCategory === cat.key
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                )}
              >
                {cat.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  selectedCategory === cat.key 
                    ? "bg-white/20" 
                    : "bg-zinc-700/50"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
            </div>
          ) : (
            <>
              {/* Owned Badges */}
              {ownedBadges.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Débloqués
                    </h3>
                    <span className="text-xs text-zinc-600">({ownedBadges.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {ownedBadges.map(badge => {
                      const userBadge = userBadges.find(ub => (ub.badge?.id || ub.badge_id) === badge.id)
                      const isEquipped = userBadge?.is_equipped || false
                      const isToggling = togglingId === userBadge?.id
                      const canEquip = equippedCount < 2 || isEquipped
                      const style = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common

                      return (
                        <button
                          key={badge.id}
                          onClick={() => userBadge && canEquip && handleToggleEquip(userBadge.id)}
                          disabled={isToggling || !canEquip}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                            isEquipped
                              ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                              : cn(style.bg, style.border, 'hover:border-white/20'),
                            !canEquip && !isEquipped && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <BadgeDisplay badge={badge} size="sm" showName={false} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{badge.name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{badge.description}</p>
                          </div>
                          <div className="shrink-0">
                            {isToggling ? (
                              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                            ) : isEquipped ? (
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            ) : canEquip ? (
                              <div className="w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-zinc-500 transition-colors" />
                            ) : (
                              <div className="text-[9px] text-zinc-600 font-medium">2/2</div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Locked Badges */}
              {lockedBadges.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-zinc-600" />
                    <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                      À débloquer
                    </h3>
                    <span className="text-xs text-zinc-700">({lockedBadges.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lockedBadges.map(badge => {
                      const style = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common
                      
                      return (
                        <div
                          key={badge.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            "bg-zinc-900/30 border-zinc-800/50 opacity-40"
                          )}
                        >
                          <div className="grayscale opacity-60">
                            <BadgeDisplay badge={badge} size="sm" showName={false} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-zinc-500">{badge.name}</p>
                            <p className="text-[11px] text-zinc-600 truncate">{badge.description}</p>
                          </div>
                          <Lock className="w-4 h-4 text-zinc-700 shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {displayBadges.length === 0 && (
                <div className="text-center py-12 text-zinc-600">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Aucun badge dans cette catégorie</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
