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
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Mes Badges</h2>
            <span className="text-xs text-zinc-500">
              {userBadges.length} obtenu{userBadges.length > 1 ? 's' : ''} · {equippedCount}/2 équipés
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs - Fixed scrollable */}
        <div className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-1 p-2 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0',
                  selectedCategory === cat.key
                    ? 'bg-primary text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                )}
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
              <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              {/* Owned Badges */}
              {ownedBadges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
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
                            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                            isEquipped
                              ? 'bg-primary/10 border-primary/30 hover:bg-primary/15'
                              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 hover:scale-[1.02] active:scale-[0.98]',
                            !canEquip && !isEquipped && 'opacity-50 cursor-not-allowed hover:scale-100'
                          )}
                        >
                          <BadgeDisplay badge={badge} size="sm" showName={false} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{badge.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{badge.description}</p>
                          </div>
                          <div className="shrink-0">
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                            ) : isEquipped ? (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : canEquip ? (
                              <div className="w-5 h-5 rounded-full border border-zinc-600" />
                            ) : (
                              <span className="text-[10px] text-zinc-600">2/2</span>
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
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    À débloquer ({lockedBadges.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lockedBadges.map(badge => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 opacity-50"
                      >
                        <div className="opacity-40">
                          <BadgeDisplay badge={badge} size="sm" showName={false} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-zinc-500">{badge.name}</p>
                          <p className="text-[10px] text-zinc-600 truncate">{badge.description}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-[10px] text-zinc-600">?</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayBadges.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
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
