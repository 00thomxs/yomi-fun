"use client"

import { useEffect, useState } from "react"
import { X, Trophy, ShoppingBag, User } from "lucide-react"
import { CurrencySymbol } from "./currency-symbol"

type PopupType = "purchase" | "bet-won" | "profile"

interface SuccessPopupProps {
  type: PopupType
  isOpen: boolean
  onClose: () => void
  data?: {
    itemName?: string
    amount?: number
    winnings?: number
  }
}

const config = {
  "purchase": { icon: ShoppingBag, title: "Achat confirmé", subtitle: "Ta commande a bien été enregistrée." },
  "bet-won": { icon: Trophy, title: "Pari gagné", subtitle: "Félicitations pour ta prédiction." },
  "profile": { icon: User, title: "Profil mis à jour", subtitle: "Tes modifications sont enregistrées." },
}

export function SuccessPopup({ type, isOpen, onClose, data }: SuccessPopupProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const cfg = config[type]
  const Icon = cfg.icon

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <div className="absolute inset-0 modal-scrim animate-in fade-in duration-200" onClick={onClose} />

      {/* Short confetti burst for wins only */}
      {showConfetti && type === "bet-won" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className={`absolute top-0 animate-confetti rounded-[1px] ${i % 3 === 0 ? "w-1.5 h-3 bg-yes" : i % 3 === 1 ? "w-1.5 h-1.5 bg-amber-400" : "w-1 h-3 bg-brand"}`}
              style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 5) * 0.1}s`, animationDuration: `${1.8 + (i % 3) * 0.3}s` }}
            />
          ))}
        </div>
      )}

      <div className="modal-panel w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} aria-label="Fermer" className="modal-close">
          <X className="w-4 h-4" />
        </button>

        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-yes">
          <Icon className="w-3.5 h-3.5" aria-hidden />
          {cfg.title}
        </p>
        <h2 id="success-title" className="mt-2 pr-8 text-base font-semibold">{cfg.subtitle}</h2>

        {type === "purchase" && data?.itemName && (
          <div className="mt-5 border-y border-border py-3 text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Article</span>
            <span className="font-medium text-right truncate">{data.itemName}</span>
          </div>
        )}

        {type === "bet-won" && data?.winnings && (
          <p className="mt-5 font-display text-4xl font-bold text-yes tabular flex items-baseline gap-1">
            +{data.winnings.toLocaleString()} <CurrencySymbol className="text-2xl" />
          </p>
        )}

        <button
          onClick={onClose}
          autoFocus
          className="mt-6 w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  )
}
