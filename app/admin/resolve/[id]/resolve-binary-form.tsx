"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { resolveMarketMulti } from "@/app/actions/resolve-market"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ResolveBinaryForm({ marketId, outcomes }: { marketId: string, outcomes: any[] }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleResolve = async (winnerName: 'OUI' | 'NON') => {
    if (!confirm(`Confirmer que "${winnerName}" est le résultat gagnant ?`)) return

    setIsLoading(true)
    
    const yesOutcome = outcomes.find(o => o.name === 'OUI')
    const noOutcome = outcomes.find(o => o.name === 'NON')

    if (!yesOutcome || !noOutcome) {
      toast({ title: "Erreur", description: "Outcomes OUI/NON introuvables", variant: "destructive" })
      setIsLoading(false)
      return
    }

    const payload = [
      { outcomeId: yesOutcome.id, isWinner: winnerName === 'OUI' },
      { outcomeId: noOutcome.id, isWinner: winnerName === 'NON' }
    ]
    
    try {
      const res = await resolveMarketMulti(marketId, payload)
      
      if (res.success) {
          toast({ title: "Marché Résolu !", description: "Gains payés.", variant: "default" })
          router.push('/admin')
      } else {
          toast({ title: "Erreur", description: res.error, variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
      toast({ title: "Erreur critique", description: "Impossible de contacter le serveur", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <button
        onClick={() => handleResolve('OUI')}
        disabled={isLoading}
        className="py-12 rounded-lg bg-yes/10 border-2 border-yes/30 hover:bg-yes/20 hover:border-yes transition-all flex flex-col items-center gap-4 group disabled:opacity-50"
      >
        <div className="w-16 h-16 rounded-full bg-yes/20 flex items-center justify-center transition-transform">
          <Check className="w-8 h-8 text-yes" />
        </div>
        <span className="text-2xl font-semibold text-yes">OUI GAGNANT</span>
      </button>

      <button
        onClick={() => handleResolve('NON')}
        disabled={isLoading}
        className="py-12 rounded-lg bg-no/10 border-2 border-no/30 hover:bg-no/20 hover:border-no transition-all flex flex-col items-center gap-4 group disabled:opacity-50"
      >
        <div className="w-16 h-16 rounded-full bg-no/20 flex items-center justify-center transition-transform">
          <X className="w-8 h-8 text-no" />
        </div>
        <span className="text-2xl font-semibold text-no">NON GAGNANT</span>
      </button>
    </div>
  )
}

