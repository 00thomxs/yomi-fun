"use client"

import { useState, useRef, useEffect } from "react"
import { X, Download, Sparkles, RefreshCw, Loader2, ChevronDown, Check } from "lucide-react"
import { YomiTCGCard, type CardRank } from "./yomi-tcg-card"
import { YomiCardPack } from "./yomi-card-pack"
import { toPng } from "html-to-image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { selectCard, getAdminCardOptions, setAdminCard, type UserSeasonCard } from "@/app/actions/profile-cards"

interface ProfileCardGeneratorProps {
  username: string
  level: number
  pnl: number
  totalBets: number
  streak: number
  avatarUrl: string
  equippedBadges: { name: string; description: string; iconName: string }[]
  currentCard: UserSeasonCard
  cardCollection: UserSeasonCard[]
  isAdmin?: boolean
  onCardChange?: () => void
  onClose?: () => void
}

// Tier info for display
const TIER_INFO: Record<CardRank, { label: string; color: string; description: string }> = {
  iron: { label: "FER", color: "#71717a", description: "0-10K PnL" },
  bronze: { label: "BRONZE", color: "#f97316", description: "10K-25K PnL" },
  gold: { label: "OR", color: "#facc15", description: "25K+ PnL" },
  diamond: { label: "DIAMANT", color: "#22d3ee", description: "Top 10" },
  holographic: { label: "HOLO", color: "#ffffff", description: "Top 3" },
}

// Compact button for profile banner
export function ProfileCardButton({
  tier,
  onClick,
}: {
  tier: CardRank
  onClick: () => void
}) {
  const tierInfo = TIER_INFO[tier]
  
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all hover:scale-105 active:scale-95 animate-pulse hover:animate-none"
      style={{
        background: `${tierInfo.color}20`,
        border: `1px solid ${tierInfo.color}50`,
        color: tierInfo.color,
      }}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Ma Carte</span>
      <span className="sm:hidden">Carte</span>
    </button>
  )
}

export function ProfileCardGenerator({
  username,
  level,
  pnl,
  totalBets,
  streak,
  avatarUrl,
  equippedBadges,
  currentCard,
  cardCollection,
  isAdmin = false,
  onCardChange,
  onClose,
}: ProfileCardGeneratorProps) {
  const [showCard, setShowCard] = useState(true) // Start open since rendered conditionally
  const [isRevealed, setIsRevealed] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [showSelector, setShowSelector] = useState(false)
  const [selectedCard, setSelectedCard] = useState<UserSeasonCard>(currentCard)
  const [adminOptions, setAdminOptions] = useState<{
    seasons: { id: string; name: string; number: number }[]
    tiers: CardRank[]
  } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Load admin options if admin
  useEffect(() => {
    if (isAdmin) {
      getAdminCardOptions().then(setAdminOptions)
    }
  }, [isAdmin])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCard) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showCard])

  const handleGenerateCard = () => {
    setAnimationKey(prev => prev + 1)
    setIsRevealed(false)
    setShowCard(true)
  }

  const handleReveal = () => {
    setIsRevealed(true)
  }

  const handleReplay = () => {
    setIsRevealed(false)
    setAnimationKey(prev => prev + 1)
  }

  const handleDownload = async () => {
    if (!cardRef.current) return
    
    setIsDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: 'transparent',
      })
      
      const link = document.createElement('a')
      link.download = `yomi-card-${username}-s${selectedCard.seasonNumber}.png`
      link.href = dataUrl
      link.click()
      
      toast.success('Carte téléchargée !')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClose = () => {
    setShowCard(false)
    setIsRevealed(false)
    setShowSelector(false)
    onClose?.()
  }

  const handleSelectCard = async (card: UserSeasonCard) => {
    setSelectedCard(card)
    if (card.id) {
      await selectCard(card.id)
      onCardChange?.()
    }
    setShowSelector(false)
  }

  const handleAdminSelectCard = async (seasonId: string, tier: CardRank) => {
    const season = adminOptions?.seasons.find(s => s.id === seasonId)
    if (!season) return
    
    await setAdminCard(seasonId, tier)
    setSelectedCard({
      id: '',
      tier,
      highestTierAchieved: tier,
      seasonId,
      seasonName: season.name,
      seasonNumber: season.number,
      isSelected: true,
    })
    onCardChange?.()
    setShowSelector(false)
  }

  const tierInfo = TIER_INFO[selectedCard.tier]
  const hasMultipleCards = cardCollection.length > 1 || isAdmin

  return (
    <>
      {/* Modal */}
      {showCard && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto"
          onClick={handleClose}
        >
          <div className="min-h-full w-full flex items-center justify-center p-4 py-16">
            <div 
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="fixed top-4 right-4 z-[110] p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Card selector button */}
              {hasMultipleCards && isRevealed && (
                <button
                  onClick={() => setShowSelector(true)}
                  className="fixed top-4 left-4 z-[110] flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 hover:bg-black/70 text-white text-sm font-bold transition-all border border-white/10"
                >
                  <span style={{ color: tierInfo.color }}>{tierInfo.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}

              {/* Card Container */}
              <div className="flex flex-col items-center gap-4 sm:gap-6 scale-[0.85] sm:scale-100 origin-center">
                {!isRevealed ? (
                  <YomiCardPack key={animationKey} onReveal={handleReveal}>
                    <YomiTCGCard
                      ref={cardRef}
                      rank={selectedCard.tier}
                      seasonNumber={selectedCard.seasonNumber.toString()}
                      seasonTitle={selectedCard.seasonName}
                      username={username}
                      level={level}
                      pnl={pnl}
                      totalBets={totalBets}
                      streak={streak}
                      equippedBadges={equippedBadges}
                      avatarUrl={avatarUrl}
                    />
                  </YomiCardPack>
                ) : (
                  <>
                    <YomiTCGCard
                      ref={cardRef}
                      rank={selectedCard.tier}
                      seasonNumber={selectedCard.seasonNumber.toString()}
                      seasonTitle={selectedCard.seasonName}
                      username={username}
                      level={level}
                      pnl={pnl}
                      totalBets={totalBets}
                      streak={streak}
                      equippedBadges={equippedBadges}
                      avatarUrl={avatarUrl}
                    />
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={handleReplay}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Rejouer</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Télécharger
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Selector Modal */}
      {showSelector && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowSelector(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-bold">Choisir une carte</h3>
              <p className="text-sm text-muted-foreground">Sélectionne la carte à afficher</p>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {/* User's cards */}
              {cardCollection.map((card) => {
                const info = TIER_INFO[card.tier]
                const isSelected = card.id === selectedCard.id
                
                return (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                      isSelected 
                        ? "bg-white/10 border border-white/20" 
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: `${info.color}20`, border: `1px solid ${info.color}40` }}
                      >
                        <Sparkles className="w-5 h-5" style={{ color: info.color }} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold" style={{ color: info.color }}>{info.label}</p>
                        <p className="text-xs text-muted-foreground">Saison {card.seasonNumber} : {card.seasonName}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                )
              })}
              
              {/* Admin section */}
              {isAdmin && adminOptions && (
                <>
                  <div className="pt-4 pb-2 border-t border-white/10 mt-4">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Admin - Toutes les cartes</p>
                  </div>
                  
                  {adminOptions.seasons.map((season) => (
                    <div key={season.id} className="space-y-1">
                      <p className="text-xs text-muted-foreground px-1">Saison {season.number}: {season.name}</p>
                      <div className="grid grid-cols-5 gap-1">
                        {adminOptions.tiers.map((tier) => {
                          const info = TIER_INFO[tier]
                          return (
                            <button
                              key={`${season.id}-${tier}`}
                              onClick={() => handleAdminSelectCard(season.id, tier)}
                              className="p-2 rounded-lg transition-all hover:scale-105"
                              style={{ background: `${info.color}20`, border: `1px solid ${info.color}30` }}
                              title={info.label}
                            >
                              <Sparkles className="w-4 h-4 mx-auto" style={{ color: info.color }} />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// New Tier Unlocked Popup
interface NewTierPopupProps {
  tier: CardRank
  isOpen: boolean
  onClose: () => void
  onGenerateCard: () => void
}

export function NewTierUnlockedPopup({ tier, isOpen, onClose, onGenerateCard }: NewTierPopupProps) {
  const tierInfo = TIER_INFO[tier]
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in zoom-in-95 duration-500"
        style={{
          background: `linear-gradient(145deg, ${tierInfo.color}15 0%, rgba(0,0,0,0.9) 50%, ${tierInfo.color}10 100%)`,
          border: `2px solid ${tierInfo.color}50`,
          boxShadow: `0 0 60px ${tierInfo.color}30, 0 0 120px ${tierInfo.color}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 text-center">
          <div 
            className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${tierInfo.color}30 0%, transparent 70%)`,
              border: `2px solid ${tierInfo.color}60`,
              boxShadow: `0 0 30px ${tierInfo.color}40`,
            }}
          >
            <Sparkles className="w-8 sm:w-10 h-8 sm:h-10" style={{ color: tierInfo.color }} />
          </div>

          <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Nouvelle Carte Débloquée
          </p>
          <h2 
            className="text-2xl sm:text-3xl font-black mb-2"
            style={{ 
              color: tierInfo.color,
              textShadow: `0 0 30px ${tierInfo.color}80`,
            }}
          >
            {tierInfo.label}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6">
            {tierInfo.description}
          </p>

          <div className="flex flex-col gap-2 sm:gap-3">
            <button
              onClick={() => {
                onClose()
                setTimeout(() => onGenerateCard(), 100)
              }}
              className="w-full py-2.5 sm:py-3 px-4 rounded-lg font-bold text-sm transition-all active:scale-95"
              style={{
                background: tierInfo.color,
                color: tier === 'holographic' || tier === 'gold' ? '#000' : '#fff',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Voir ma carte
              </span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 sm:py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all active:scale-95"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
