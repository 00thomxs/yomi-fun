'use client'

import { useState, useEffect } from 'react'
import { X, Palette, Sparkles, Type, Check, Loader2, Lock, ChevronRight } from 'lucide-react'
import { 
  type CosmeticItem, 
  type CosmeticType,
  RARITY_INFO,
  getUserCosmetics,
  getUserEquippedCosmetics,
  equipCosmetic,
  getCosmeticItems
} from '@/app/actions/cosmetics'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

// Category labels
const CATEGORIES = [
  { key: 'all', label: 'Tous', icon: Sparkles },
  { key: 'background', label: 'Fonds', icon: Palette },
  { key: 'aura', label: 'Auras', icon: Sparkles },
  { key: 'nametag', label: 'Pseudo', icon: Type },
]

const TYPE_INFO: Record<CosmeticType, { label: string; icon: typeof Palette; color: string }> = {
  background: { label: 'Fond de Carte', icon: Palette, color: '#22d3ee' },
  aura: { label: 'Aura d\'Avatar', icon: Sparkles, color: '#a855f7' },
  nametag: { label: 'Effet de Pseudo', icon: Type, color: '#f59e0b' },
}

type CosmeticsModalProps = {
  isOpen: boolean
  onClose: () => void
  onEquipChange?: () => void
}

export function CosmeticsModal({ isOpen, onClose, onEquipChange }: CosmeticsModalProps) {
  const [allCosmetics, setAllCosmetics] = useState<CosmeticItem[]>([])
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())
  const [equipped, setEquipped] = useState<{
    background: CosmeticItem | null
    aura: CosmeticItem | null
    nametag: CosmeticItem | null
  }>({ background: null, aura: null, nametag: null })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | CosmeticType>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    setIsLoading(true)
    const [cosmetics, owned, equippedData] = await Promise.all([
      getCosmeticItems(),
      getUserCosmetics(),
      getUserEquippedCosmetics()
    ])
    setAllCosmetics(cosmetics)
    setOwnedIds(new Set(owned.map(o => o.cosmetic_id)))
    setEquipped(equippedData)
    setIsLoading(false)
  }

  const handleToggleEquip = async (cosmetic: CosmeticItem) => {
    if (!ownedIds.has(cosmetic.id)) return
    
    setTogglingId(cosmetic.id)
    
    const isCurrentlyEquipped = equipped[cosmetic.type]?.id === cosmetic.id
    const result = await equipCosmetic(cosmetic.type, isCurrentlyEquipped ? null : cosmetic.id)
    
    if (result.success) {
      setEquipped(prev => ({
        ...prev,
        [cosmetic.type]: isCurrentlyEquipped ? null : cosmetic
      }))
      toast.success(isCurrentlyEquipped ? 'Cosmétique retiré' : 'Cosmétique équipé !')
      onEquipChange?.()
    } else {
      toast.error(result.error || 'Erreur')
    }
    
    setTogglingId(null)
  }

  const handleUnequipAll = async () => {
    setTogglingId('unequip-all')
    
    const promises = []
    if (equipped.background) promises.push(equipCosmetic('background', null))
    if (equipped.aura) promises.push(equipCosmetic('aura', null))
    if (equipped.nametag) promises.push(equipCosmetic('nametag', null))
    
    if (promises.length === 0) {
      toast.info('Aucun cosmétique équipé')
      setTogglingId(null)
      return
    }
    
    await Promise.all(promises)
    setEquipped({ background: null, aura: null, nametag: null })
    toast.success('Tous les cosmétiques retirés')
    onEquipChange?.()
    setTogglingId(null)
  }

  if (!isOpen) return null

  const equippedCount = [equipped.background, equipped.aura, equipped.nametag].filter(Boolean).length
  const ownedCount = ownedIds.size

  // Filter cosmetics by category
  const getDisplayCosmetics = () => {
    if (selectedCategory === 'all') return allCosmetics
    return allCosmetics.filter(c => c.type === selectedCategory)
  }

  const displayCosmetics = getDisplayCosmetics()
  const ownedCosmetics = displayCosmetics.filter(c => ownedIds.has(c.id))
  const lockedCosmetics = displayCosmetics.filter(c => !ownedIds.has(c.id))

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
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Personnalisation</h2>
            <span className="text-xs text-zinc-500">
              {ownedCount} possédé{ownedCount > 1 ? 's' : ''} • {equippedCount} équipé{equippedCount > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently Equipped Summary */}
        {equippedCount > 0 && (
          <div className="p-4 border-b border-zinc-800 bg-emerald-500/5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Équipés:</span>
                <div className="flex items-center gap-3">
                  {equipped.background && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <Palette className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-medium text-cyan-400">{equipped.background.name}</span>
                    </div>
                  )}
                  {equipped.aura && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">{equipped.aura.name}</span>
                    </div>
                  )}
                  {equipped.nametag && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Type className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400">{equipped.nametag.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleUnequipAll}
                disabled={togglingId === 'unequip-all'}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
              >
                {togglingId === 'unequip-all' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : 'Tout retirer'}
              </button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 p-4 border-b border-zinc-800 overflow-x-auto shrink-0">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const count = cat.key === 'all' 
              ? allCosmetics.length 
              : allCosmetics.filter(c => c.type === cat.key).length
            
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key as 'all' | CosmeticType)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === cat.key
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800"
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                <span className="text-xs opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
            </div>
          ) : displayCosmetics.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              Aucun cosmétique dans cette catégorie.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Owned Section */}
              {ownedCosmetics.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                    Possédés ({ownedCosmetics.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ownedCosmetics.map(cosmetic => {
                      const isEquipped = equipped[cosmetic.type]?.id === cosmetic.id
                      const isToggling = togglingId === cosmetic.id
                      const typeInfo = TYPE_INFO[cosmetic.type]
                      const rarityInfo = RARITY_INFO[cosmetic.rarity]
                      
                      return (
                        <button
                          key={cosmetic.id}
                          onClick={() => handleToggleEquip(cosmetic)}
                          disabled={isToggling}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                            isEquipped
                              ? "bg-emerald-500/10 border-2 border-emerald-500/50"
                              : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                          )}
                        >
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ 
                              background: `${typeInfo.color}15`, 
                              border: `1px solid ${typeInfo.color}40` 
                            }}
                          >
                            <typeInfo.icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm truncate">{cosmetic.name}</span>
                              <span 
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                                style={{ 
                                  background: `${rarityInfo.color}15`, 
                                  color: rarityInfo.color 
                                }}
                              >
                                {rarityInfo.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">{typeInfo.label}</p>
                          </div>
                          <div className="shrink-0">
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isEquipped ? (
                              <Check className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <span className="text-xs text-zinc-500">Équiper</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Locked Section */}
              {lockedCosmetics.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
                    Non possédés ({lockedCosmetics.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lockedCosmetics.map(cosmetic => {
                      const typeInfo = TYPE_INFO[cosmetic.type]
                      const rarityInfo = RARITY_INFO[cosmetic.rarity]
                      
                      return (
                        <div
                          key={cosmetic.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 opacity-50"
                        >
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ 
                              background: `${rarityInfo.color}10`, 
                              border: `1px solid ${rarityInfo.color}20` 
                            }}
                          >
                            <Lock className="w-4 h-4 text-zinc-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-zinc-500 truncate">{cosmetic.name}</span>
                              <span 
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                                style={{ 
                                  background: `${rarityInfo.color}10`, 
                                  color: `${rarityInfo.color}80` 
                                }}
                              >
                                {rarityInfo.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-600">{typeInfo.label}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-600 shrink-0">
                            <span className="font-mono">{cosmetic.price.toLocaleString()}</span>
                            <CurrencySymbol className="w-3 h-3" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 shrink-0">
          <Link
            href="/shop"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/20 border border-primary/50 text-primary font-bold text-sm hover:bg-primary/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Acheter des cosmétiques
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

