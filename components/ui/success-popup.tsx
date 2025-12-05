"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle2, Trophy, ShoppingBag, User, Sparkles } from "lucide-react"
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
  "purchase": {
    icon: ShoppingBag,
    title: "Achat Confirmé !",
    subtitle: "Ta commande a bien été enregistrée",
    color: "text-emerald-400",
    bgGlow: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
  },
  "bet-won": {
    icon: Trophy,
    title: "Tu as Gagné !",
    subtitle: "Félicitations pour ta victoire",
    color: "text-amber-400",
    bgGlow: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  "profile": {
    icon: User,
    title: "Profil Mis à Jour !",
    subtitle: "Tes modifications ont été sauvegardées",
    color: "text-blue-400",
    bgGlow: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Confetti effect for bet-won */}
      {showConfetti && type === "bet-won" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            >
              <Sparkles 
                className={`w-4 h-4 ${
                  i % 3 === 0 ? 'text-amber-400' : i % 3 === 1 ? 'text-rose-400' : 'text-emerald-400'
                }`} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <div className={`relative bg-card border ${cfg.borderColor} rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glow effect */}
        <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 ${cfg.bgGlow} blur-3xl rounded-full opacity-50`} />

        {/* Content */}
        <div className="relative text-center space-y-4">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${cfg.bgGlow} border ${cfg.borderColor} mb-2`}>
            <Icon className={`w-10 h-10 ${cfg.color}`} />
          </div>

          {/* Title */}
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${cfg.color}`}>
              {cfg.title}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {cfg.subtitle}
            </p>
          </div>

          {/* Dynamic content based on type */}
          {type === "purchase" && data?.itemName && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-muted-foreground">Article commandé</p>
              <p className="font-bold text-white">{data.itemName}</p>
            </div>
          )}

          {type === "bet-won" && data?.winnings && (
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <p className="text-sm text-amber-400/70">Gains</p>
              <p className="text-3xl font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                +{data.winnings.toLocaleString()}<CurrencySymbol className="w-6 h-6" />
              </p>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${
              type === "bet-won" 
                ? "bg-amber-500 hover:bg-amber-400 text-black" 
                : type === "purchase"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                  : "bg-blue-500 hover:bg-blue-400 text-white"
            }`}
          >
            {type === "bet-won" ? "Continuer à Gagner" : "Parfait !"}
          </button>
        </div>
      </div>
    </div>
  )
}

