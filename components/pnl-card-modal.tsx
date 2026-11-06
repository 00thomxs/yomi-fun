"use client"

import { X } from "lucide-react"
import { PnlReceiptCard } from "./pnl-receipt-card"

interface PnlCardModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    pnlPercentage: number
    pnlAmount: number
    event: string
    sens: string
    mise: number
    date: string
  }
}

export function PnlCardModal({ isOpen, onClose, data }: PnlCardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-scrim animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="modal-panel p-4 sm:p-6 max-w-lg w-full animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="modal-close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-3">
          <h2 className="text-base font-semibold">Génère ta carte PnL</h2>
          <p className="text-sm text-muted-foreground">Personnalise le fond et télécharge</p>
        </div>

        {/* PNL Card */}
        <div className="flex justify-center pb-4">
          <PnlReceiptCard data={data} />
        </div>
      </div>
    </div>
  )
}

