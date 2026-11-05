"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Coins, Palette, Sparkles, Type, Package, Loader2, 
  Check, Lock, ChevronRight, Zap, Crown, Star, Clock, X, PartyPopper
} from "lucide-react"
import { toast } from "sonner"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { 
  type CosmeticItem, 
  type CosmeticType,
  purchaseCosmetic,
  getUserCosmetics,
  equipCosmetic
} from "@/app/actions/cosmetics"
import { RARITY_INFO } from "@/lib/cosmetics-types"
import { CardBackground, AvatarAura, parseBackgroundEffect, parseAuraEffect } from "@/components/card-cosmetics"
import { StyledUsername, parseNametagEffect } from "@/components/ui/styled-username"
import { useUser } from "@/contexts/user-context"
import { ZENY_PACKS } from "@/lib/constants"
import { createStripeCheckoutSession } from "@/app/actions/stripe"

interface ShopViewProps {
  initialItems: CosmeticItem[]
}

type ShopCategory = 'zeny' | 'cosmetics'
type CosmeticCategory = 'all' | 'background' | 'aura' | 'nametag' | 'packs'

const COSMETIC_CATEGORIES: { id: CosmeticCategory; label: string; icon: typeof Palette }[] = [
  { id: 'all', label: 'Tous', icon: Sparkles },
  { id: 'background', label: 'Fonds', icon: Palette },
  { id: 'aura', label: 'Auras', icon: Sparkles },
  { id: 'nametag', label: 'Pseudo', icon: Type },
  { id: 'packs', label: 'Packs', icon: Package },
]

// Live preview using the same renderers as the profile card, so what you see is what you equip
function CosmeticPreview({ item, username, avatar, large = false }: { item: CosmeticItem; username: string; avatar: string; large?: boolean }) {
  const size = large ? "w-24 h-24" : "w-14 h-14"
  return (
    <div className={`relative overflow-hidden rounded-md bg-black border border-border flex items-center justify-center ${large ? "aspect-video" : "aspect-square"}`}>
      {item.type === 'background' && <CardBackground effect={parseBackgroundEffect(item.preview_data)} />}
      {item.type === 'aura' && (
        <div className={`relative ${size}`}>
          <AvatarAura effect={parseAuraEffect(item.preview_data)} />
          <img src={avatar} alt="" className={`relative ${size} rounded-full object-cover bg-muted`} />
        </div>
      )}
      {item.type === 'nametag' && (
        <span className={`font-logo font-bold ${large ? "text-2xl" : "text-base"} px-3 text-center truncate`}>
          <StyledUsername username={username} nametagEffect={parseNametagEffect(item.preview_data)} withAt />
        </span>
      )}
    </div>
  )
}

export function ShopView({ initialItems }: ShopViewProps) {
  const [category, setCategory] = useState<ShopCategory>('cosmetics')
  const [cosmeticCategory, setCosmeticCategory] = useState<CosmeticCategory>('all')
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [loadingZeny, setLoadingZeny] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<CosmeticItem | null>(null)
  const [purchasedItem, setPurchasedItem] = useState<CosmeticItem | null>(null)
  const [isEquipping, setIsEquipping] = useState(false)
  
  const { userBalance, setUserBalance, isAuthenticated, user } = useUser()
  const previewName = user?.username || "pseudo"
  const previewAvatar = user?.avatar || "/images/default-avatar.svg"
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check for successful Zeny payment
  useEffect(() => {
    const success = searchParams.get("success")
    if (success === "true") {
      const amount = searchParams.get("amount")
      toast.success("Paiement réussi !", {
        description: `Votre compte a été crédité de ${Number(amount).toLocaleString()} Zeny.`,
        duration: 5000,
      })
      setTimeout(() => router.replace("/shop"), 1000)
    }
  }, [searchParams, router])

  // Load owned cosmetics
  useEffect(() => {
    const loadOwned = async () => {
      if (!isAuthenticated) return
      const owned = await getUserCosmetics()
      setOwnedIds(new Set(owned.map(o => o.cosmetic_id)))
    }
    loadOwned()
  }, [isAuthenticated])

  // Sort by rarity (common first, legendary last) then by price
  const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 }
  const sortedItems = [...initialItems].sort((a, b) => {
    const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity]
    if (rarityDiff !== 0) return rarityDiff
    return a.price - b.price // Cheaper first within same rarity
  })

  const filteredItems = cosmeticCategory === 'all' || cosmeticCategory === 'packs'
    ? sortedItems
    : sortedItems.filter(i => i.type === cosmeticCategory)

  const handleBuyZeny = async (packId: string) => {
    setLoadingZeny(packId)
    try {
      const { url, error } = await createStripeCheckoutSession(packId)
      if (error) {
        toast.error("Erreur", { description: error })
        return
      }
      if (url) window.location.href = url
    } catch (error) {
      toast.error("Erreur", { description: "Une erreur est survenue." })
    } finally {
      setLoadingZeny(null)
    }
  }

  const handlePurchaseCosmetic = async (item: CosmeticItem) => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous", { description: "Vous devez être connecté pour acheter." })
      return
    }
    
    if (ownedIds.has(item.id)) {
      toast.info("Déjà possédé", { description: "Vous possédez déjà ce cosmétique." })
      return
    }
    
    if (userBalance < item.price) {
      toast.error("Solde insuffisant", { 
        description: `Il vous manque ${(item.price - userBalance).toLocaleString()} Zeny.` 
      })
      return
    }
    
    setIsPurchasing(item.id)
    try {
      const result = await purchaseCosmetic(item.id)
      if (result.error) {
        toast.error("Erreur", { description: result.error })
      } else {
        if (result.newBalance !== undefined) setUserBalance(result.newBalance)
        setOwnedIds(prev => new Set([...prev, item.id]))
        setPreviewItem(null)
        // Show success popup with equip option
        setPurchasedItem(item)
      }
    } catch (error) {
      toast.error("Erreur", { description: "Une erreur est survenue." })
    } finally {
      setIsPurchasing(null)
    }
  }

  const handleEquipPurchased = async () => {
    if (!purchasedItem) return
    setIsEquipping(true)
    try {
      const result = await equipCosmetic(purchasedItem.type, purchasedItem.id)
      if (result.error) {
        toast.error("Erreur", { description: result.error })
      } else {
        toast.success("Style appliqué !", { description: `${purchasedItem.name} est maintenant équipé sur votre carte.` })
        setPurchasedItem(null)
      }
    } catch {
      toast.error("Erreur", { description: "Impossible d'équiper le cosmétique." })
    } finally {
      setIsEquipping(false)
    }
  }

  const getZenyPackTheme = (id: string) => {
    switch (id) {
      case 'pack_little_player': return { 
        iconBg: 'bg-white/5', iconColor: 'text-muted-foreground', accent: 'text-white', popular: false 
      }
      case 'pack_degen': return { 
        iconBg: 'bg-primary/20', iconColor: 'text-primary', accent: 'text-primary', popular: true 
      }
      case 'pack_trader': return { 
        iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400', accent: 'text-purple-400', popular: false 
      }
      case 'pack_whale': return { 
        iconBg: 'bg-amber-400/10', iconColor: 'text-amber-400', accent: 'text-amber-400', popular: false 
      }
      default: return { iconBg: 'bg-white/5', iconColor: 'text-white', accent: 'text-white', popular: false }
    }
  }

  const getZenyIcon = (id: string) => {
    switch (id) {
      case 'pack_little_player': return <Star className="w-6 h-6" />
      case 'pack_degen': return <Zap className="w-6 h-6" />
      case 'pack_trader': return <Sparkles className="w-6 h-6" />
      case 'pack_whale': return <Crown className="w-6 h-6" />
      default: return <Star className="w-6 h-6" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="font-display text-2xl font-bold tracking-tight">Shop</h1>

      {/* Main Category Tabs */}
      <div role="tablist" className="flex gap-6 border-b border-border">
        <button
          onClick={() => setCategory('cosmetics')}
          role="tab"
          aria-selected={category === 'cosmetics'}
          className={`relative h-11 inline-flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${category === 'cosmetics' ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand" : "text-muted-foreground hover:text-foreground"}`}
          >
          <Palette className="w-4 h-4" />
          Cosmétiques
        </button>
        <button
          onClick={() => setCategory('zeny')}
          role="tab"
          aria-selected={category === 'zeny'}
          className={`relative h-11 inline-flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${category === 'zeny' ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand" : "text-muted-foreground hover:text-foreground"}`}
          >
          <Coins className="w-4 h-4" />
          Acheter des Zeny
        </button>
      </div>

      {/* ZENY SECTION */}
      {category === 'zeny' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Recharge tes <span className="text-brand">Zeny</span></h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Plus le pack est gros, plus le bonus est important !
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ZENY_PACKS.map((pack) => {
              const theme = getZenyPackTheme(pack.id)
              
              return (
                <div 
                  key={pack.id}
                  className={`relative rounded-xl border p-5 flex flex-col transition-all hover:scale-[1.02] ${
                    theme.popular 
                      ? 'border-primary/50 bg-card' 
                      : 'border-border bg-card'
                  }`}
                >
                  {theme.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-[11px] font-semibold uppercase tracking-wide text-white">
                      Populaire
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 rounded-full ${theme.iconBg} flex items-center justify-center mx-auto mb-3`}>
                      <div className={theme.iconColor}>{getZenyIcon(pack.id)}</div>
                    </div>
                    <h4 className="font-semibold uppercase tracking-tight">{pack.name}</h4>
                    <div className="text-2xl font-semibold mt-1">{pack.price}€</div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-black/40 text-center mb-4">
                    <div className={`text-xl font-semibold ${theme.accent} flex items-center justify-center gap-1`}>
                      {pack.amount.toLocaleString()} <CurrencySymbol />
                    </div>
                    {pack.bonus > 0 ? (
                      <div className="text-xs font-semibold text-yes mt-1">
                        +{pack.bonus.toLocaleString()} offerts
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/50 mt-1">Pas de bonus</div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleBuyZeny(pack.id)}
                    disabled={!!loadingZeny}
                    className={`w-full py-3 rounded-lg font-semibold uppercase tracking-wide text-sm transition-all ${
                      theme.popular
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-white/5 hover:bg-white/10 border border-border'
                    }`}
                  >
                    {loadingZeny === pack.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </span>
                    ) : 'Acheter'}
                  </button>
                </div>
              )
            })}
          </div>
          
          <p className="text-center text-xs text-muted-foreground">
            Paiement sécurisé par Stripe. Les Zeny sont une monnaie virtuelle utilisable uniquement sur YOMI.
          </p>
        </div>
      )}

      {/* COSMETICS SECTION */}
      {category === 'cosmetics' && (
        <div className="space-y-6">
          {/* Sub-categories */}
      <div className="seg max-w-full overflow-x-auto no-scrollbar">
            {COSMETIC_CATEGORIES.map(cat => {
          const Icon = cat.icon
              const count = cat.id === 'all' 
                ? initialItems.length 
                : cat.id === 'packs'
                  ? 0
                  : initialItems.filter(i => i.type === cat.id).length
              
          return (
            <button
              key={cat.id}
                  onClick={() => setCosmeticCategory(cat.id)}
                  aria-pressed={cosmeticCategory === cat.id}
                  className="seg-item"
            >
              <Icon className="w-3.5 h-3.5" aria-hidden />
                  {cat.label}
                  {cat.id !== 'packs' && <span className="font-mono text-muted-foreground">{count}</span>}
            </button>
          )
        })}
      </div>

          {/* Packs Coming Soon */}
          {cosmeticCategory === 'packs' && (
            <div className="rounded-lg bg-card border border-border p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-xl font-semibold mb-2">Packs & Bundles</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Des offres groupées avec des réductions exclusives arrivent bientôt !
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold">
                <Clock className="w-4 h-4" />
                Bientôt disponible
              </div>
        </div>
          )}
          
          {/* Cosmetics Grid */}
          {cosmeticCategory !== 'packs' && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map(item => {
                const rarityInfo = RARITY_INFO[item.rarity]
                const isOwned = ownedIds.has(item.id)
                const canAfford = userBalance >= item.price
                const isPurchasingThis = isPurchasing === item.id
                
                return (
          <div
            key={item.id}
                    onClick={() => setPreviewItem(item)}
                    className={`relative rounded-lg border p-3 cursor-pointer transition-colors hover:bg-surface-hover ${
                      isOwned 
                        ? 'border-yes/40'
                        : 'border-border'
                    }`}
                  >
                    {/* Rarity Badge */}
                    <div 
                      className="absolute top-5 right-5 z-10 px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-black/70"
                      style={{ 
                        background: `${rarityInfo.color}15`, 
                        border: `1px solid ${rarityInfo.color}40`,
                        color: rarityInfo.color 
                      }}
                    >
                      {rarityInfo.label}
                    </div>
                    
                    {/* Limited Badge */}
                    {item.is_limited && (
                      <div className="absolute top-5 left-5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                        <Clock className="w-2.5 h-2.5" />
                        Limité
                      </div>
                    )}
                    
                    {/* Preview Area */}
                    <div className="mb-3">
                      <CosmeticPreview item={item} username={previewName} avatar={previewAvatar} />
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                      {item.type === 'background' && <><Palette className="w-3 h-3" /> Fond</>}
                      {item.type === 'aura' && <><Sparkles className="w-3 h-3" /> Aura</>}
                      {item.type === 'nametag' && <><Type className="w-3 h-3" /> Pseudo</>}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                    )}
                    
                    {/* Price / Owned */}
                    <div className="flex items-center justify-between">
                      {isOwned ? (
                        <span className="flex items-center gap-1 text-yes text-sm font-semibold">
                          <Check className="w-4 h-4" />
                          Possédé
                        </span>
                      ) : (
                        <span className={`font-mono font-semibold text-sm flex items-center gap-1 ${canAfford ? 'text-foreground' : 'text-no'}`}>
                          {item.price.toLocaleString()} <CurrencySymbol />
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )
              })}
                  </div>
                )}
          
          {cosmeticCategory !== 'packs' && filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Aucun cosmétique disponible dans cette catégorie.
            </div>
          )}
        </div>
      )}

      {/* Preview/Purchase Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="bg-card border border-border rounded-lg w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div 
                  className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase mb-2"
                  style={{ 
                    background: `${RARITY_INFO[previewItem.rarity].color}15`, 
                    border: `1px solid ${RARITY_INFO[previewItem.rarity].color}40`,
                    color: RARITY_INFO[previewItem.rarity].color 
                  }}
                >
                  {RARITY_INFO[previewItem.rarity].label}
              </div>
                <h3 className="text-xl font-semibold">{previewItem.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{previewItem.description}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Live preview */}
            <CosmeticPreview item={previewItem} username={previewName} avatar={previewAvatar} large />

            {/* Price */}
            <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-border">
              <span className="text-sm font-medium">Prix</span>
              <span className="text-xl font-semibold text-brand flex items-center gap-1">
                {previewItem.price.toLocaleString()} <CurrencySymbol />
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewItem(null)}
                className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 font-medium transition-all"
              >
                Fermer
              </button>
              {ownedIds.has(previewItem.id) ? (
                <button
                  disabled
                  className="flex-1 py-3 rounded-lg bg-yes/20 text-yes font-semibold flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Possédé
                </button>
              ) : (
                <button
                  onClick={() => handlePurchaseCosmetic(previewItem)}
                  disabled={isPurchasing === previewItem.id || userBalance < previewItem.price}
                  className="flex-1 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:bg-white/5 disabled:text-muted-foreground flex items-center justify-center gap-2"
                >
                  {isPurchasing === previewItem.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : userBalance < previewItem.price ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Solde insuffisant
                    </>
                  ) : (
                    'Acheter'
                  )}
                </button>
              )}
              </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {purchasedItem && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPurchasedItem(null)}
        >
          <div 
            className="bg-card border rounded-lg w-full max-w-sm p-6 text-center space-y-5 animate-in zoom-in-95"
            style={{ 
              borderColor: `${RARITY_INFO[purchasedItem.rarity].color}50`,
              boxShadow: `0 0 60px ${RARITY_INFO[purchasedItem.rarity].color}20`
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Celebration Icon */}
            <div 
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{ 
                background: `${RARITY_INFO[purchasedItem.rarity].color}15`,
                border: `2px solid ${RARITY_INFO[purchasedItem.rarity].color}40`
              }}
            >
              <PartyPopper className="w-10 h-10" style={{ color: RARITY_INFO[purchasedItem.rarity].color }} />
            </div>
            
            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-yes uppercase tracking-wide mb-2">Achat réussi !</p>
              <h3 className="text-2xl font-semibold" style={{ color: RARITY_INFO[purchasedItem.rarity].color }}>
                {purchasedItem.name}
              </h3>
              <div 
                className="inline-block mt-2 px-2 py-0.5 rounded text-[11px] font-semibold uppercase"
                style={{ 
                  background: `${RARITY_INFO[purchasedItem.rarity].color}15`, 
                  color: RARITY_INFO[purchasedItem.rarity].color 
                }}
              >
                {RARITY_INFO[purchasedItem.rarity].label}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Ce cosmétique a été ajouté à votre collection. Voulez-vous l'équiper maintenant ?
            </p>
            
            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleEquipPurchased}
                disabled={isEquipping}
                className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                style={{ 
                  background: RARITY_INFO[purchasedItem.rarity].color,
                  color: purchasedItem.rarity === 'legendary' || purchasedItem.rarity === 'common' ? '#000' : '#fff'
                }}
              >
                {isEquipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Équiper maintenant
                  </>
                )}
              </button>
              <button
                onClick={() => setPurchasedItem(null)}
                className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 font-medium transition-all text-muted-foreground"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
