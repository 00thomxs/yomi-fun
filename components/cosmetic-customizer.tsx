"use client"

import { useState, useEffect } from "react"
import { X, Check, Palette, Sparkles, Type, Lock, ChevronRight, Loader2 } from "lucide-react"
import { 
  type CosmeticItem, 
  type CosmeticType,
  getUserCosmetics,
  getUserEquippedCosmetics,
  equipCosmetic
} from "@/app/actions/cosmetics"
import { RARITY_INFO } from "@/lib/cosmetics-types"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { toast } from "sonner"
import Link from "next/link"

const TYPE_INFO: Record<CosmeticType, { label: string; icon: typeof Palette; color: string }> = {
  background: { label: 'Fond de Carte', icon: Palette, color: '#22d3ee' },
  aura: { label: 'Aura d\'Avatar', icon: Sparkles, color: '#a855f7' },
  nametag: { label: 'Effet de Pseudo', icon: Type, color: '#f59e0b' },
}

interface CosmeticCustomizerProps {
  isOpen: boolean
  onClose: () => void
  allCosmetics: CosmeticItem[]
  onEquipChange?: () => void
}

export function CosmeticCustomizer({ 
  isOpen, 
  onClose, 
  allCosmetics,
  onEquipChange 
}: CosmeticCustomizerProps) {
  const [selectedType, setSelectedType] = useState<CosmeticType>('background')
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())
  const [equipped, setEquipped] = useState<{
    background: CosmeticItem | null
    aura: CosmeticItem | null
    nametag: CosmeticItem | null
  }>({ background: null, aura: null, nametag: null })
  const [loading, setLoading] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])
  
  const loadData = async () => {
    setIsLoading(true)
    const [owned, equippedData] = await Promise.all([
      getUserCosmetics(),
      getUserEquippedCosmetics()
    ])
    setOwnedIds(new Set(owned.map(o => o.cosmetic_id)))
    setEquipped(equippedData)
    setIsLoading(false)
  }
  
  const handleEquip = async (cosmetic: CosmeticItem) => {
    if (!ownedIds.has(cosmetic.id)) return
    
    setLoading(cosmetic.id)
    
    // If already equipped, unequip
    const isEquipped = equipped[cosmetic.type]?.id === cosmetic.id
    const result = await equipCosmetic(cosmetic.type, isEquipped ? null : cosmetic.id)
    
    if (result.error) {
      toast.error('Erreur', { description: result.error })
    } else {
      setEquipped(prev => ({
        ...prev,
        [cosmetic.type]: isEquipped ? null : cosmetic
      }))
      toast.success(isEquipped ? 'Cosmétique retiré' : 'Cosmétique équipé !')
      onEquipChange?.()
    }
    
    setLoading(null)
  }
  
  const handleUnequip = async (type: CosmeticType) => {
    if (!equipped[type]) return
    
    setLoading(`unequip-${type}`)
    const result = await equipCosmetic(type, null)
    
    if (result.error) {
      toast.error('Erreur', { description: result.error })
    } else {
      setEquipped(prev => ({ ...prev, [type]: null }))
      toast.success('Cosmétique retiré')
      onEquipChange?.()
    }
    
    setLoading(null)
  }
  
  const filteredItems = allCosmetics.filter(c => c.type === selectedType)
  const currentEquipped = equipped[selectedType]
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[85vh] rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold">Personnaliser ma carte</h3>
            <p className="text-sm text-muted-foreground">Équipe tes cosmétiques</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        {/* Type Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/10 shrink-0">
          {(Object.keys(TYPE_INFO) as CosmeticType[]).map(type => {
            const info = TYPE_INFO[type]
            const Icon = info.icon
            const isEquipped = equipped[type] !== null
            
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                  selectedType === type
                    ? 'bg-white/10 border border-white/20'
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" style={{ color: info.color }} />
                  {isEquipped && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className="text-[10px] font-medium text-zinc-400">{info.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
        
        {/* Currently Equipped */}
        {currentEquipped && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-emerald-400">Équipé: {currentEquipped.name}</p>
                <p className="text-xs text-emerald-400/70">{RARITY_INFO[currentEquipped.rarity].label}</p>
              </div>
            </div>
            <button
              onClick={() => handleUnequip(selectedType)}
              disabled={loading === `unequip-${selectedType}`}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-all"
            >
              {loading === `unequip-${selectedType}` ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : 'Retirer'}
            </button>
          </div>
        )}
        
        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            (() => {
              const Icon = TYPE_INFO[selectedType].icon
              return (
                <div className="text-center py-12">
                  <Icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Aucun cosmétique de ce type disponible</p>
                </div>
              )
            })()
          ) : (
            <>
              {/* Owned Items */}
              {filteredItems.filter(c => ownedIds.has(c.id)).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    Possédés ({filteredItems.filter(c => ownedIds.has(c.id)).length})
                  </p>
                  {filteredItems.filter(c => ownedIds.has(c.id)).map(cosmetic => (
                    <CosmeticRow
                      key={cosmetic.id}
                      cosmetic={cosmetic}
                      isOwned={true}
                      isEquipped={currentEquipped?.id === cosmetic.id}
                      isLoading={loading === cosmetic.id}
                      onEquip={() => handleEquip(cosmetic)}
                    />
                  ))}
                </div>
              )}
              
              {/* Not Owned Items */}
              {filteredItems.filter(c => !ownedIds.has(c.id)).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Non possédés ({filteredItems.filter(c => !ownedIds.has(c.id)).length})
                  </p>
                  {filteredItems.filter(c => !ownedIds.has(c.id)).map(cosmetic => (
                    <CosmeticRow
                      key={cosmetic.id}
                      cosmetic={cosmetic}
                      isOwned={false}
                      isEquipped={false}
                      isLoading={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <Link
            href="/shop"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/20 border border-primary/50 text-primary font-bold text-sm hover:bg-primary/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Acheter plus de cosmétiques
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// Individual cosmetic row
function CosmeticRow({ 
  cosmetic, 
  isOwned, 
  isEquipped, 
  isLoading,
  onEquip 
}: { 
  cosmetic: CosmeticItem
  isOwned: boolean
  isEquipped: boolean
  isLoading: boolean
  onEquip?: () => void
}) {
  const rarityInfo = RARITY_INFO[cosmetic.rarity]
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl transition-all mb-2 ${
        isEquipped 
          ? 'bg-emerald-500/10 border border-emerald-500/30' 
          : isOwned
            ? 'bg-white/5 border border-transparent hover:bg-white/10 cursor-pointer'
            : 'bg-zinc-800/50 border border-transparent opacity-60'
      }`}
      onClick={isOwned && !isEquipped ? onEquip : undefined}
    >
      {/* Icon */}
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ 
          background: `${rarityInfo.color}15`, 
          border: `1px solid ${rarityInfo.color}40` 
        }}
      >
        {cosmetic.type === 'background' && <Palette className="w-5 h-5" style={{ color: rarityInfo.color }} />}
        {cosmetic.type === 'aura' && <Sparkles className="w-5 h-5" style={{ color: rarityInfo.color }} />}
        {cosmetic.type === 'nametag' && <Type className="w-5 h-5" style={{ color: rarityInfo.color }} />}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate">{cosmetic.name}</span>
          <span 
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ 
              background: `${rarityInfo.color}15`, 
              color: rarityInfo.color,
              border: `1px solid ${rarityInfo.color}30`
            }}
          >
            {rarityInfo.label}
          </span>
        </div>
        {cosmetic.description && (
          <p className="text-xs text-muted-foreground truncate">{cosmetic.description}</p>
        )}
      </div>
      
      {/* Action */}
      <div className="shrink-0">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isEquipped ? (
          <Check className="w-5 h-5 text-emerald-400" />
        ) : isOwned ? (
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-all">
            Équiper
          </button>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span className="font-mono">{cosmetic.price.toLocaleString()}</span>
            <CurrencySymbol className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  )
}

