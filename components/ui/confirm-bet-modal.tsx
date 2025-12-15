"use client"

import { X, AlertCircle } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"

type ConfirmBetModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  betAmount: number
  betChoice: string
  potentialGain: number
  isLoading?: boolean
}

export function ConfirmBetModal({
  isOpen,
  onClose,
  onConfirm,
  betAmount,
  betChoice,
  potentialGain,
  isLoading = false
}: ConfirmBetModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-primary/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Glow effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 blur-3xl rounded-full opacity-50" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative space-y-5">
          {/* Icon + Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border border-primary/30">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">
                Confirmer le pari ?
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Vérifie les détails avant de valider
              </p>
            </div>
          </div>
          
          {/* Bet Summary */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tu mises</span>
              <span className="text-xl font-bold font-mono text-white flex items-center gap-1">
                {betAmount.toLocaleString()} <CurrencySymbol className="w-4 h-4" />
              </span>
            </div>
            
            <div className="h-px bg-border" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sur</span>
              <span className="text-lg font-bold text-white">
                {betChoice}
              </span>
            </div>
          </div>

          {/* Potential Gain */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <p className="text-sm text-primary/70">Gain potentiel estimé</p>
            <p className="text-3xl font-black text-primary font-mono flex items-center gap-1">
              {potentialGain.toLocaleString()} <CurrencySymbol className="w-6 h-6" />
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl bg-white/5 border border-border text-white font-bold tracking-tight hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-tight transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  En cours...
                </>
              ) : (
                "Confirmer"
              )}
            </button>
          </div>
          
          {/* Warning */}
          <p className="text-xs text-muted-foreground text-center">
            Une fois confirmé, le pari ne pourra pas être annulé.
          </p>
        </div>
      </div>
    </div>
  )
}

