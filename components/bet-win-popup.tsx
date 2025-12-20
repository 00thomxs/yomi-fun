"use client"

import { useState, useEffect } from "react"
import { X, Trophy, Share2, Sparkles, Check, Target } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { PnlCardModal } from "@/components/pnl-card-modal"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { getUnseenBetWins, markBetWinAsSeen, type UnseenBetWin } from "@/app/actions/bet-wins"
import { cn } from "@/lib/utils"

export function BetWinPopup() {
  const [unseenWins, setUnseenWins] = useState<UnseenBetWin[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showPnlModal, setShowPnlModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  // Fetch unseen wins on mount (with delay like badges)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const wins = await getUnseenBetWins()
        if (wins.length > 0) {
          setUnseenWins(wins)
          setTimeout(() => {
            setIsVisible(true)
            setShowConfetti(true)
            // Stagger animations
            setTimeout(() => setAnimationPhase(1), 200)
            setTimeout(() => setAnimationPhase(2), 400)
            setTimeout(() => setAnimationPhase(3), 600)
            setTimeout(() => setShowConfetti(false), 3000)
          }, 100)
        }
      } catch {
        // Silently fail
      }
    }, 2000) // 2s delay after page load

    return () => clearTimeout(timer)
  }, [])

  const currentWin = unseenWins[currentIndex]

  if (!currentWin || isClosing) return null

  // Calculate PNL data
  const winnings = currentWin.potential_payout
  const mise = currentWin.amount
  const pnlAmount = winnings - mise
  const pnlPercentage = mise > 0 ? Math.round((pnlAmount / mise) * 100) : 0
  const pnlDisplay = `+${pnlPercentage}%`

  // Format date
  const date = currentWin.resolved_at 
    ? new Date(currentWin.resolved_at).toLocaleDateString('fr-FR')
    : new Date(currentWin.created_at).toLocaleDateString('fr-FR')

  // Truncate event name
  const eventName = (currentWin.market as any)?.title || 'Événement'
  const truncatedEvent = eventName.length > 35 
    ? eventName.substring(0, 35) + "..." 
    : eventName

  const handleClose = async () => {
    setIsVisible(false)
    await markBetWinAsSeen(currentWin.id)
    
    setTimeout(() => {
      if (currentIndex < unseenWins.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setAnimationPhase(0)
        setTimeout(() => {
          setIsVisible(true)
          setShowConfetti(true)
          setTimeout(() => setAnimationPhase(1), 200)
          setTimeout(() => setAnimationPhase(2), 400)
          setTimeout(() => setAnimationPhase(3), 600)
          setTimeout(() => setShowConfetti(false), 3000)
        }, 100)
      } else {
        setIsClosing(true)
        setUnseenWins([])
        setCurrentIndex(0)
      }
    }, 300)
  }

  const handleShare = () => {
    setShowPnlModal(true)
  }

  const handleClosePnlModal = () => {
    setShowPnlModal(false)
  }

  // Get sens based on direction
  const sens = currentWin.direction === 'YES' ? 'OUI' : 'NON'

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop with glow effect */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClose}
        />
        
        {/* Victory glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.8}s`,
                  animationDuration: `${2 + Math.random() * 1.5}s`,
                }}
              >
                {i % 4 === 0 ? (
                  <Sparkles className="w-5 h-5 text-amber-400" />
                ) : i % 4 === 1 ? (
                  <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                ) : i % 4 === 2 ? (
                  <div className="w-2 h-4 bg-amber-400 rotate-45" />
                ) : (
                  <Trophy className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <div 
          className={cn(
            "relative bg-zinc-950 border-2 border-amber-500/40 rounded-2xl max-w-md w-full shadow-2xl shadow-amber-500/20 overflow-hidden transition-all duration-500",
            isVisible 
              ? "opacity-100 scale-100 translate-y-0" 
              : "opacity-0 scale-95 translate-y-4"
          )}
        >
          
          {/* Top Glow Bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 space-y-5">
            
            {/* Victory Header */}
            <div 
              className={cn(
                "text-center transition-all duration-500",
                animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 mb-3">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                TU AS GAGNÉ !
              </h2>
              <p className="text-zinc-400 text-sm mt-1 flex items-center justify-center gap-1.5">
                Félicitations pour ta prédiction
                <Target className="w-4 h-4 text-amber-400" />
              </p>
            </div>

            {/* Mini PNL Card Preview */}
            <div 
              className={cn(
                "transition-all duration-500 delay-100",
                animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <div 
                className="relative rounded-xl border border-zinc-700 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                }}
              >
                {/* Grid Pattern */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="relative p-5 space-y-4">
                  {/* PNL Display */}
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Gains</p>
                    <p 
                      className="text-4xl font-black text-emerald-400 font-mono"
                      style={{
                        textShadow: "0 0 30px rgba(52, 211, 153, 0.5)",
                      }}
                    >
                      {pnlDisplay}
                    </p>
                    <p className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1 mt-1">
                      +{winnings.toLocaleString('fr-FR')} <CurrencySymbol className="w-4 h-4" />
                    </p>
                  </div>

                  {/* Event Info */}
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-zinc-500 shrink-0">EVENT</span>
                      <span className="text-white text-right truncate">{truncatedEvent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">CHOIX</span>
                      <span className={sens === 'OUI' ? 'text-emerald-400' : 'text-red-400'}>
                        {sens}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">MISE</span>
                      <span className="text-white flex items-center gap-1">
                        {mise.toLocaleString('fr-FR')} <CurrencySymbol className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* YOMI Logo */}
                  <div className="flex justify-center pt-2 opacity-50">
                    <YomiLogo className="text-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Counter if multiple wins */}
            {unseenWins.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {unseenWins.map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentIndex ? "bg-amber-400" : "bg-zinc-700"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div 
              className={cn(
                "flex gap-3 transition-all duration-500 delay-200",
                animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                {unseenWins.length > 1 && currentIndex < unseenWins.length - 1 
                  ? 'Suivant' 
                  : 'Continuer'
                }
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Full PNL Card Modal for sharing */}
      <PnlCardModal
        isOpen={showPnlModal}
        onClose={handleClosePnlModal}
        data={{
          pnlPercentage: pnlPercentage,
          pnlAmount: pnlAmount,
          event: eventName,
          sens: sens,
          mise: mise,
          date: date,
        }}
      />
    </>
  )
}
