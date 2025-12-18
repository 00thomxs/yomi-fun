"use client"

import { useState, useRef, useEffect } from "react"
import { X, Download, Sparkles, RefreshCw, Loader2, ChevronDown, Check, CreditCard } from "lucide-react"
import { YomiTCGCard, type CardRank, rankStyles } from "./yomi-tcg-card"
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

// Tier info
const TIER_INFO: Record<CardRank, { label: string; color: string }> = {
  iron: { label: "Fer", color: "#71717a" },
  bronze: { label: "Bronze", color: "#f97316" },
  gold: { label: "Or", color: "#facc15" },
  diamond: { label: "Diamant", color: "#22d3ee" },
  holographic: { label: "Holo", color: "#ffffff" },
  beta: { label: "Beta", color: "#ef4444" },
}

// Red button for profile banner (next to balance)
export function ProfileCardButton({ tier, onClick }: { tier: CardRank; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all hover:scale-105 active:scale-95 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30"
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>Carte</span>
    </button>
  )
}

export function ProfileCardGenerator({
  username, level, pnl, totalBets, streak, avatarUrl, equippedBadges,
  currentCard, cardCollection, isAdmin = false, onCardChange, onClose,
}: ProfileCardGeneratorProps) {
  const [showCard, setShowCard] = useState(true)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [showSelector, setShowSelector] = useState(false)
  const [selectedCard, setSelectedCard] = useState<UserSeasonCard>(currentCard)
  const [adminOptions, setAdminOptions] = useState<{ seasons: { id: string; name: string; number: number }[]; tiers: CardRank[] } | null>(null)
  const [avatarBase64, setAvatarBase64] = useState<string>(avatarUrl)
  const [avatarReady, setAvatarReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Convert avatar to base64 for download compatibility
  useEffect(() => {
    const convertToBase64 = async () => {
      // If already base64, mark as ready
      if (!avatarUrl) {
        setAvatarReady(true)
        return
      }
      if (avatarUrl.startsWith('data:')) {
        setAvatarBase64(avatarUrl)
        setAvatarReady(true)
        return
      }
      
      try {
        // Use Image element to ensure proper loading
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL('image/png')
            setAvatarBase64(dataUrl)
          }
          setAvatarReady(true)
        }
        
        img.onerror = () => {
          console.log('Could not load avatar for base64 conversion')
          setAvatarReady(true) // Still mark ready, will use original URL
        }
        
        img.src = avatarUrl
      } catch (err) {
        console.log('Could not convert avatar to base64:', err)
        setAvatarReady(true)
      }
    }
    convertToBase64()
  }, [avatarUrl])

  useEffect(() => {
    if (isAdmin) getAdminCardOptions().then(setAdminOptions)
  }, [isAdmin])

  useEffect(() => {
    document.body.style.overflow = showCard ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showCard])

  const handleClose = () => {
    setShowCard(false)
    setIsRevealed(false)
    setShowSelector(false)
    onClose?.()
  }

  const handleReplay = () => {
    setIsRevealed(false)
    setAnimationKey(prev => prev + 1)
  }

  const [downloadImageUrl, setDownloadImageUrl] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsDownloading(true)
    
    // Set capturing mode to disable transforms and effects
    setIsCapturing(true)
    
    // Wait for React to re-render with isCapturing=true
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: undefined, // Transparent background
        skipFonts: true,
        cacheBust: true,
        filter: (node) => {
          // Exclude aura effects from the image
          if (node instanceof HTMLElement && node.classList?.contains('aura-effect')) {
            return false
          }
          return true
        }
      })
      
      // For mobile, show image in modal for long-press save
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setDownloadImageUrl(dataUrl)
        toast.success('Maintenez l\'image pour sauvegarder')
      } else {
        // Desktop: direct download
        const link = document.createElement('a')
        link.download = `yomi-card-${username}-s${selectedCard.seasonNumber}.png`
        link.href = dataUrl
        link.click()
        toast.success('Carte téléchargée !')
      }
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setIsCapturing(false)
      setIsDownloading(false)
    }
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
    setSelectedCard({ id: '', tier, highestTierAchieved: tier, seasonId, seasonName: season.name, seasonNumber: season.number, isSelected: true })
    onCardChange?.()
    setShowSelector(false)
  }

  const tierInfo = TIER_INFO[selectedCard.tier]
  const hasMultipleCards = cardCollection.length > 1 || isAdmin

  if (!showCard) return null

  return (
    <>
      {/* Minimal overlay - click to close */}
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={handleClose}/>
      
      {/* Content */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-6 scale-[0.9] sm:scale-100">
          
          {/* Top bar - more spacing from card */}
          <div className="flex items-center gap-3 mb-2">
            {/* Card selector - improved */}
            {hasMultipleCards && isRevealed && (
              <button
                onClick={() => setShowSelector(true)}
                onTouchEnd={(e) => { e.preventDefault(); setShowSelector(true) }}
                className="flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-zinc-900/95 border border-white/20 text-white text-xs sm:text-sm font-bold hover:bg-zinc-800 hover:border-white/30 active:bg-zinc-700 transition-all shadow-xl"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full ring-2 ring-white/20" style={{ background: tierInfo.color, boxShadow: `0 0 10px ${tierInfo.color}` }}/>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-xs text-zinc-400">Carte</span>
                  <span className="font-bold">{tierInfo.label} <span className="font-normal text-zinc-500">• S{selectedCard.seasonNumber}</span></span>
                </div>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400"/>
              </button>
            )}
            
            {/* Close */}
            <button 
              onClick={handleClose} 
              onTouchEnd={(e) => { e.preventDefault(); handleClose() }}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/95 border border-white/20 text-white hover:bg-zinc-800 active:bg-zinc-700 transition-all shadow-xl"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-5 h-5"/>
            </button>
          </div>

          {/* Card */}
          {!isRevealed ? (
            <YomiCardPack key={animationKey} onReveal={() => setIsRevealed(true)}>
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
                avatarUrl={avatarBase64}
                isCapturing={isCapturing}
              />
            </YomiCardPack>
          ) : (
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
              avatarUrl={avatarBase64}
              isCapturing={isCapturing}
            />
          )}

          {/* Actions */}
          {isRevealed && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleReplay} 
                onTouchEnd={(e) => { e.preventDefault(); handleReplay() }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-900/95 border border-white/20 text-white font-bold text-xs sm:text-sm hover:bg-zinc-800 hover:border-white/30 active:bg-zinc-700 transition-all shadow-xl"
                style={{ touchAction: 'manipulation' }}
              >
                <RefreshCw className="w-4 h-4"/>
                <span className="hidden sm:inline">Rejouer</span>
              </button>
              <button 
                onClick={handleDownload} 
                onTouchEnd={(e) => { e.preventDefault(); handleDownload() }}
                disabled={isDownloading} 
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary/20 border border-primary/50 text-primary font-bold text-xs sm:text-sm hover:bg-primary/30 hover:border-primary active:bg-primary/40 transition-all shadow-xl disabled:opacity-50"
                style={{ touchAction: 'manipulation' }}
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                Télécharger
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Selector Modal */}
      {showSelector && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50" 
          onClick={() => setShowSelector(false)}
          onTouchEnd={(e) => { if (e.target === e.currentTarget) setShowSelector(false) }}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden shadow-2xl" 
            onClick={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Changer de carte</h3>
                <p className="text-sm text-muted-foreground">Sélectionne la carte à afficher</p>
              </div>
              <button 
                onClick={() => setShowSelector(false)} 
                onTouchEnd={(e) => { e.preventDefault(); setShowSelector(false) }}
                className="p-2 rounded-lg hover:bg-white/5 active:bg-white/10"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {cardCollection.map((card) => {
                const info = TIER_INFO[card.tier]
                const isSelected = card.id === selectedCard.id
                return (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    onTouchEnd={(e) => { e.preventDefault(); handleSelectCard(card) }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left",
                      isSelected 
                        ? "bg-primary/20 border-2 border-primary" 
                        : "bg-white/5 border border-transparent hover:bg-white/15 hover:border-white/20 active:bg-white/20"
                    )}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${info.color}20`, border: `2px solid ${info.color}` }}>
                      <Sparkles className="w-6 h-6" style={{ color: info.color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg" style={{ color: info.color }}>{info.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary"/>}
                      </div>
                      <p className="text-sm text-zinc-400">Saison {card.seasonNumber} : {card.seasonName}</p>
                    </div>
                  </button>
                )
              })}
              
              {/* Admin section */}
              {isAdmin && adminOptions && (
                <>
                  <div className="pt-4 mt-4 border-t border-white/10">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Admin - Toutes les cartes</p>
                  </div>
                  {adminOptions.seasons.map((season) => (
                    <div key={season.id} className="space-y-2">
                      <p className="text-xs text-zinc-500 font-medium">Saison {season.number}: {season.name}</p>
                      <div className="grid grid-cols-5 gap-2">
                        {adminOptions.tiers.map((tier) => {
                          const info = TIER_INFO[tier]
                          return (
                            <button
                              key={`${season.id}-${tier}`}
                              onClick={() => handleAdminSelectCard(season.id, tier)}
                              onTouchEnd={(e) => { e.preventDefault(); handleAdminSelectCard(season.id, tier) }}
                              className="p-3 rounded-lg transition-all hover:scale-110 hover:brightness-125 active:scale-95 text-center"
                              style={{ background: `${info.color}15`, border: `1px solid ${info.color}40`, touchAction: 'manipulation' }}
                            >
                              <Sparkles className="w-5 h-5 mx-auto" style={{ color: info.color }}/>
                              <p className="text-[10px] mt-1 font-medium" style={{ color: info.color }}>{info.label}</p>
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

      {/* Mobile Download Image Modal */}
      {downloadImageUrl && (
        <div 
          className="fixed inset-0 z-[120] flex flex-col items-center justify-between p-4 py-8 bg-black/95"
          onClick={() => setDownloadImageUrl(null)}
        >
          {/* Header */}
          <div className="text-center shrink-0">
            <p className="text-white font-bold text-base">Maintenez l'image pour sauvegarder</p>
            <p className="text-zinc-400 text-xs">Puis "Enregistrer l'image"</p>
          </div>
          
          {/* Image - takes available space */}
          <div className="flex-1 flex items-center justify-center py-4 min-h-0">
            <img 
              src={downloadImageUrl} 
              alt="YOMI Card" 
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
              style={{ touchAction: 'none' }}
            />
          </div>
          
          {/* Close button - always visible at bottom */}
          <button 
            onClick={() => setDownloadImageUrl(null)}
            className="shrink-0 px-8 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 active:bg-zinc-600"
          >
            Fermer
          </button>
        </div>
      )}
    </>
  )
}

// New Tier Popup
export function NewTierUnlockedPopup({ tier, isOpen, onClose, onGenerateCard }: { tier: CardRank; isOpen: boolean; onClose: () => void; onGenerateCard: () => void }) {
  const tierInfo = TIER_INFO[tier]
  
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ background: `linear-gradient(145deg, ${tierInfo.color}15 0%, rgba(0,0,0,0.95) 50%)`, border: `2px solid ${tierInfo.color}50`, boxShadow: `0 0 60px ${tierInfo.color}30` }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500"><X className="w-4 h-4"/></button>
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `${tierInfo.color}20`, border: `2px solid ${tierInfo.color}50` }}>
            <Sparkles className="w-8 h-8" style={{ color: tierInfo.color }}/>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Nouvelle Carte</p>
          <h2 className="text-3xl font-black mb-1" style={{ color: tierInfo.color }}>{tierInfo.label}</h2>
          <p className="text-zinc-400 text-sm mb-6">Débloquée !</p>
          <button
            onClick={() => { onClose(); setTimeout(onGenerateCard, 100) }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: tierInfo.color, color: tier === 'holographic' || tier === 'gold' ? '#000' : '#fff' }}
          >
            Voir ma carte
          </button>
        </div>
      </div>
    </div>
  )
}
