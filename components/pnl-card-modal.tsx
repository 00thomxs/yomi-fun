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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-white">Génère ta PNL Card</h2>
          <p className="text-sm text-zinc-500">Personnalise le fond et télécharge ton image</p>
        </div>

        {/* PNL Card */}
        <div className="flex justify-center">
          <PnlReceiptCard data={data} />
        </div>
      </div>
    </div>
  )
}

