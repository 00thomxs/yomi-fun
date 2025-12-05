'use client'

import { useState } from 'react'
import { resetPlatform } from '../actions'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function ResetButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = async () => {
    setIsLoading(true)
    try {
      const result = await resetPlatform()
      if (result.success) {
        toast.success("Plateforme réinitialisée avec succès !")
        setShowConfirm(false)
      } else {
        toast.error(result.error || "Une erreur est survenue")
      }
    } catch (error) {
      toast.error("Erreur critique lors de la réinitialisation")
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
        <span className="text-sm font-bold text-rose-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Sûr ? C'est irréversible !
        </span>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          CONFIRMER
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-sm font-bold transition-colors flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      Réinitialiser
    </button>
  )
}

