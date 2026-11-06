'use client'

import { useState } from 'react'
import { resolveMarket } from '@/app/actions/resolve-market'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ResolveButton({ 
  marketId, 
  outcomeId, 
  outcomeName 
}: { 
  marketId: string, 
  outcomeId: string, 
  outcomeName: string 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleResolve = async () => {
    setIsLoading(true)
    try {
      const result = await resolveMarket(marketId, outcomeId)
      if (result.error) {
        alert(result.error)
      } else {
        alert(`Marché résolu ! ${result.payoutsCount} paris payés.`)
        router.push('/admin')
      }
    } catch (e) {
      alert("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
        <span className="text-sm text-red-400 mr-2">Confirmer {outcomeName} ?</span>
        <button 
          onClick={() => setShowConfirm(false)}
          className="h-8 px-3 text-sm rounded-md border border-border hover:bg-surface-hover transition-colors"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button 
          onClick={handleResolve}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Valider
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold text-sm transition-colors flex items-center gap-2"
    >
      <CheckCircle className="h-4 w-4" />
      Déclarer Vainqueur
    </button>
  )
}

