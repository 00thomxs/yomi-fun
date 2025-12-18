"use client"

import { useState, useRef, useEffect } from "react"
import { X, Download, Sparkles, RefreshCw, Loader2 } from "lucide-react"
import { YomiTCGCard, type CardRank } from "./yomi-tcg-card"
import { YomiCardPack } from "./yomi-card-pack"
import { toPng } from "html-to-image"
import { toast } from "sonner"

interface ProfileCardGeneratorProps {
  username: string
  level: number
  pnl: number
  totalBets: number
  streak: number
  avatarUrl: string
  equippedBadges: { name: string; description: string; iconName: string }[]
  seasonNumber: string
  seasonTitle: string
  cardTier: CardRank
  highestTier: CardRank
  isNewTier?: boolean
  onTierSeen?: () => void
}

// Tier info for display
const TIER_INFO: Record<CardRank, { label: string; color: string; description: string }> = {
  iron: { label: "FER", color: "#71717a", description: "0-10K PnL" },
  bronze: { label: "BRONZE", color: "#f97316", description: "10K-25K PnL" },
  gold: { label: "OR", color: "#facc15", description: "25K+ PnL" },
  diamond: { label: "DIAMANT", color: "#22d3ee", description: "Top 10" },
  holographic: { label: "HOLO", color: "#ffffff", description: "Top 3" },
}

export function ProfileCardGenerator({
  username,
  level,
  pnl,
  totalBets,
  streak,
  avatarUrl,
  equippedBadges,
  seasonNumber,
  seasonTitle,
  cardTier,
  highestTier,
  isNewTier,
  onTierSeen,
}: ProfileCardGeneratorProps) {
  const [showCard, setShowCard] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [animationKey, setAnimationKey] = useState(0) // Key to force re-mount pack
  const cardRef = useRef<HTMLDivElement>(null)

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
    setAnimationKey(prev => prev + 1) // Force new animation
    setIsRevealed(false)
    setShowCard(true)
  }

  const handleReveal = () => {
    setIsRevealed(true)
    if (isNewTier && onTierSeen) {
      onTierSeen()
    }
  }

  const handleReplay = () => {
    setIsRevealed(false)
    setAnimationKey(prev => prev + 1) // Force re-mount pack
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
      link.download = `yomi-card-${username}-${seasonTitle.toLowerCase().replace(/\s+/g, '-')}.png`
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
  }

  const tierInfo = TIER_INFO[cardTier]

  return (
    <>
      {/* Generate Button */}
      <button
        onClick={handleGenerateCard}
        className="w-full rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 p-4 flex items-center justify-between hover:border-primary/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-bold">Ma Carte Profil</p>
            <p className="text-xs text-muted-foreground truncate">
              Carte <span style={{ color: tierInfo.color }} className="font-bold">{tierInfo.label}</span>
            </p>
          </div>
        </div>
        <div 
          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0"
          style={{ 
            background: `${tierInfo.color}20`,
            color: tierInfo.color,
            border: `1px solid ${tierInfo.color}40`
          }}
        >
          Générer
        </div>
      </button>

      {/* Modal */}
      {showCard && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto"
          onClick={handleClose}
        >
          {/* Safe area padding for mobile */}
          <div className="min-h-full w-full flex items-center justify-center p-4 py-16">
            <div 
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button - fixed position for mobile */}
              <button
                onClick={handleClose}
                className="fixed top-4 right-4 z-[110] p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Card Container - Scaled for mobile */}
              <div className="flex flex-col items-center gap-4 sm:gap-6 scale-[0.85] sm:scale-100 origin-center">
                {!isRevealed ? (
                  <YomiCardPack key={animationKey} onReveal={handleReveal}>
                    <YomiTCGCard
                      ref={cardRef}
                      rank={cardTier}
                      seasonNumber={seasonNumber}
                      seasonTitle={seasonTitle}
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
                      rank={cardTier}
                      seasonNumber={seasonNumber}
                      seasonTitle={seasonTitle}
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
  
  // Lock body scroll when popup is open
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
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 text-center">
          {/* Icon */}
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

          {/* Title */}
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

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <button
              onClick={() => {
                onClose()
                setTimeout(() => onGenerateCard(), 100) // Small delay for smooth transition
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
