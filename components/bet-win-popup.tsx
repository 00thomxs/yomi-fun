"use client"

import { useState, useEffect } from "react"
import { X, Trophy, Share2 } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { PnlCardModal } from "@/components/pnl-card-modal"
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

  const eventName = (currentWin.market as any)?.title || 'Événement'

  const handleClose = () => {
    setIsVisible(false)
    // Fire and forget: if it fails, the win simply shows again next visit; the UI must not wait on it
    markBetWinAsSeen(currentWin.id).catch(() => {})

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
  // Multi-outcome markets: say which outcome ("NON Lamine Yamal"), binary ones already are OUI/NON
  const outcomeLabel = currentWin.outcome?.label
  const choice = outcomeLabel && outcomeLabel !== 'OUI' && outcomeLabel !== 'NON' ? `${sens} ${outcomeLabel}` : sens

  const hasNext = unseenWins.length > 1 && currentIndex < unseenWins.length - 1
  const reveal = (phase: number) =>
    cn("transition-all duration-500", animationPhase >= phase ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")

  return (
    <>
      {/* Hidden while the share card is open so the card is never stacked under the popup */}
      {!showPnlModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="win-title">
        <div
          className={cn(
            "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClose}
        />

        {/* Confetti: short burst, tied to the popup's own visibility */}
        {showConfetti && isVisible && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {[...Array(18)].map((_, i) => (
              <span
                key={i}
                className={cn(
                  "absolute top-0 animate-confetti rounded-[1px]",
                  i % 3 === 0 ? "w-1.5 h-3 bg-yes" : i % 3 === 1 ? "w-1.5 h-1.5 bg-amber-400" : "w-1 h-3 bg-brand"
                )}
                style={{
                  left: `${(i * 37) % 100}%`,
                  animationDelay: `${(i % 6) * 0.12}s`,
                  animationDuration: `${2.2 + (i % 4) * 0.35}s`,
                }}
              />
            ))}
          </div>
        )}

        <div
          className={cn(
            "relative w-full max-w-sm rounded-lg border border-border bg-card shadow-2xl shadow-black/60 transition-all duration-300",
            isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-2"
          )}
        >
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 space-y-6">
            {/* Header */}
            <div className={reveal(1)}>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-yes">
                <Trophy className="w-3.5 h-3.5" aria-hidden />
                Pari gagné
                {unseenWins.length > 1 && (
                  <span className="text-muted-foreground font-mono">· {currentIndex + 1}/{unseenWins.length}</span>
                )}
              </p>
              <h2 id="win-title" className="mt-2 pr-8 text-base font-semibold leading-snug line-clamp-2">
                {eventName}
              </h2>
            </div>

            {/* Gain */}
            <div className={cn(reveal(2), "delay-75")}>
              <p className="font-display text-5xl font-bold tracking-tight text-yes tabular flex items-baseline gap-1.5">
                +{pnlAmount.toLocaleString("fr-FR")}
                <CurrencySymbol className="text-3xl" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bénéfice · <span className="font-mono text-yes">{pnlDisplay}</span> sur ta mise
              </p>
            </div>

            {/* Details */}
            <dl className={cn(reveal(2), "delay-100 divide-y divide-border border-y border-border text-sm")}>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Ton choix</dt>
                <dd className={cn("font-semibold text-right truncate ml-4", sens === "OUI" ? "text-yes" : "text-no")}>{choice}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Mise</dt>
                <dd className="font-mono flex items-center gap-1">
                  {mise.toLocaleString("fr-FR")} <CurrencySymbol />
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Récupéré</dt>
                <dd className="font-mono flex items-center gap-1">
                  {winnings.toLocaleString("fr-FR")} <CurrencySymbol />
                </dd>
              </div>
            </dl>

            {/* Actions */}
            <div className={cn(reveal(3), "delay-150 grid grid-cols-2 gap-2")}>
              <button
                onClick={handleShare}
                className="h-11 inline-flex items-center justify-center gap-2 rounded-md border border-border text-sm font-medium hover:bg-surface-hover transition-colors active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4" aria-hidden />
                Partager
              </button>
              <button
                onClick={handleClose}
                autoFocus
                className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-[0.98]"
              >
                {hasNext ? "Suivant" : "Continuer"}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

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
