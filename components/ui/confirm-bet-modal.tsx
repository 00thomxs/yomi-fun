"use client"

import { X } from "lucide-react"
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

  const isNo = betChoice.trim().toUpperCase().startsWith("NON")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-bet-title">
      <div className="absolute inset-0 modal-scrim animate-in fade-in duration-200" onClick={onClose} />

      <div className="modal-panel w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} aria-label="Fermer" className="modal-close">
          <X className="w-4 h-4" />
        </button>

        <h2 id="confirm-bet-title" className="text-base font-semibold pr-8">Confirmer le pari</h2>
        <p className="mt-1 text-sm text-muted-foreground">Une fois confirmé, il ne peut plus être annulé.</p>

        <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
          <div className="flex justify-between items-center py-3">
            <dt className="text-muted-foreground">Ton choix</dt>
            <dd className={`font-semibold text-right ml-4 truncate ${isNo ? "text-no" : "text-yes"}`}>{betChoice}</dd>
          </div>
          <div className="flex justify-between items-center py-3">
            <dt className="text-muted-foreground">Mise</dt>
            <dd className="font-mono font-semibold flex items-center gap-1">
              {betAmount.toLocaleString()} <CurrencySymbol />
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="text-xs text-muted-foreground">Gain potentiel estimé</p>
          <p className="mt-1 font-display text-3xl font-bold tabular flex items-baseline gap-1">
            {potentialGain.toLocaleString()} <CurrencySymbol className="text-brand text-2xl" />
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-11 rounded-md border border-border text-sm font-medium hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
            className="h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-[color,background-color,transform] active:scale-[0.98] cursor-pointer disabled:bg-white/5 disabled:text-muted-foreground flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                En cours…
              </>
            ) : (
              "Confirmer"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
