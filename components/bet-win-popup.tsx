"use client"

import { useState, useEffect } from "react"
import { X, Trophy, Share2, ArrowRight, Sparkles, Check } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { PnlCardModal } from "@/components/pnl-card-modal"
import { YomiLogo } from "@/components/ui/yomi-logo"

interface BetWinPopupProps {
  isOpen: boolean
  onClose: () => void
  data: {
    pnlPercentage: number
    pnlAmount: number
    event: string
    sens: string
    mise: number
    winnings: number
    date: string
  }
}

export function BetWinPopup({ isOpen, onClose, data }: BetWinPopupProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPnlModal, setShowPnlModal] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      setAnimationPhase(0)
      
      // Stagger animations
      const timer1 = setTimeout(() => setAnimationPhase(1), 200)
      const timer2 = setTimeout(() => setAnimationPhase(2), 400)
      const timer3 = setTimeout(() => setAnimationPhase(3), 600)
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(confettiTimer)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const isPositive = data.pnlPercentage >= 0
  const pnlDisplay = `${isPositive ? "+" : ""}${data.pnlPercentage.toLocaleString("fr-FR")}%`

  const handleShare = () => {
    setShowPnlModal(true)
  }

  const handleClosePnlModal = () => {
    setShowPnlModal(false)
  }

  // Truncate event name
  const truncatedEvent = data.event.length > 40 
    ? data.event.substring(0, 40) + "..." 
    : data.event

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with glow effect */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onClose}
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
        <div className="relative bg-zinc-950 border border-amber-500/30 rounded-2xl max-w-md w-full shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 overflow-hidden">
          
          {/* Top Glow Bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 space-y-5">
            
            {/* Victory Header */}
            <div 
              className={`text-center transition-all duration-500 ${
                animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 mb-3">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                TU AS GAGNÉ !
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Félicitations pour ta prédiction 🎯
              </p>
            </div>

            {/* Mini PNL Card Preview */}
            <div 
              className={`transition-all duration-500 delay-100 ${
                animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
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
                      +{data.winnings.toLocaleString('fr-FR')} <CurrencySymbol className="w-4 h-4" />
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
                      <span className={data.sens.toUpperCase().includes('OUI') ? 'text-emerald-400' : 'text-red-400'}>
                        {data.sens}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">MISE</span>
                      <span className="text-white flex items-center gap-1">
                        {data.mise.toLocaleString('fr-FR')} <CurrencySymbol className="w-3 h-3" />
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

            {/* Action Buttons */}
            <div 
              className={`flex gap-3 transition-all duration-500 delay-200 ${
                animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                Continuer
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
          pnlPercentage: data.pnlPercentage,
          pnlAmount: data.pnlAmount,
          event: data.event,
          sens: data.sens,
          mise: data.mise,
          date: data.date,
        }}
      />
    </>
  )
}

