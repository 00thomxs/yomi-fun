'use client'

import { useState, useEffect } from 'react'
import { X, Trophy, Check, Loader2 } from 'lucide-react'
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

  useEffect(() => {
    if (isOpen) {
      fetchBadges()
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
      <div className="absolute inset-0 modal-scrim animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="modal-panel w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-muted-foreground" aria-hidden />
            <h2 className="text-base font-semibold">Mes Badges</h2>
            <span className="text-xs text-muted-foreground">
              {userBadges.length} obtenu{userBadges.length > 1 ? 's' : ''} · {equippedCount}/2 équipés
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs - Fixed scrollable */}
        <div className="border-b border-border px-4 py-3">
          <div className="seg max-w-full overflow-x-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                aria-pressed={selectedCategory === cat.key}
                className="seg-item shrink-0"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Owned Badges */}
              {ownedBadges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Débloqués ({ownedBadges.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ownedBadges.map(badge => {
                      const userBadge = userBadges.find(ub => (ub.badge?.id || ub.badge_id) === badge.id)
                      const isEquipped = userBadge?.is_equipped || false
                      const isToggling = togglingId === userBadge?.id
                      const canEquip = equippedCount < 2 || isEquipped

                      return (
                        <div
                          key={badge.id}
                          onClick={() => userBadge && canEquip && handleToggleEquip(userBadge.id)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                            isEquipped
                              ? 'bg-primary/10 border-brand/40 hover:bg-primary/15'
                              : 'bg-muted/50 border-border hover:border-white/20 hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]',
                            !canEquip && !isEquipped && 'opacity-50 cursor-not-allowed hover:scale-100'
                          )}
                        >
                          <BadgeDisplay badge={badge} size="sm" showName={false} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{badge.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{badge.description}</p>
                          </div>
                          <div className="shrink-0">
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : isEquipped ? (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : canEquip ? (
                              <div className="w-5 h-5 rounded-full border border-white/20" />
                            ) : (
                              <span className="text-[11px] text-muted-foreground">2/2</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Locked Badges */}
              {lockedBadges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    À débloquer ({lockedBadges.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lockedBadges.map(badge => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border opacity-50"
                      >
                        <div className="opacity-40">
                          <BadgeDisplay badge={badge} size="sm" showName={false} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-muted-foreground">{badge.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{badge.description}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-[11px] text-muted-foreground">?</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayBadges.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun badge dans cette catégorie
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
