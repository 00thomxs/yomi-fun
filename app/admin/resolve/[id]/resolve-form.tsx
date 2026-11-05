"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { resolveMarketMulti } from "@/app/actions/resolve-market"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ResolveForm({ marketId, outcomes }: { marketId: string, outcomes: any[] }) {
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const toggleResult = (id: string, value: boolean) => {
    setResults(prev => ({ ...prev, [id]: value }))
  }

  const handleResolve = async () => {
    if (Object.keys(results).length !== outcomes.length) {
      toast({ 
        title: "Incomplet", 
        description: "Veuillez définir le résultat (Vrai/Faux) pour TOUTES les propositions.", 
        variant: "destructive" 
      })
      return
    }

    if (!confirm("Êtes-vous sûr de vouloir valider ces résultats ? Cette action est irréversible.")) {
      return
    }

    setIsLoading(true)
    
    const payload = Object.entries(results).map(([outcomeId, isWinner]) => ({ outcomeId, isWinner }))
    
    try {
      const res = await resolveMarketMulti(marketId, payload)
      
      if (res.success) {
          toast({ 
            title: "Marché Résolu !", 
            description: `${res.payoutsCount} paris gagnants ont été payés.`,
            variant: "default" 
          })
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
    <div className="space-y-4">
      {outcomes.map(outcome => {
        const isTrue = results[outcome.id] === true
        const isFalse = results[outcome.id] === false
        
        return (
          <div key={outcome.id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-border">
             <div>
               <span className="text-lg font-semibold block">{outcome.name}</span>
               <span className="text-xs text-muted-foreground">Probabilité : {Math.round(outcome.probability)}%</span>
             </div>
             <div className="flex gap-2">
               <button 
                 onClick={() => toggleResult(outcome.id, true)}
                 className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border ${
                   isTrue 
                     ? 'bg-yes/20 border-yes text-yes' 
                     : 'bg-white/5 border-transparent text-muted-foreground hover:bg-white/10'
                 }`}
               >
                 <Check className="w-4 h-4" /> VRAI
               </button>
               <button 
                 onClick={() => toggleResult(outcome.id, false)}
                 className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border ${
                   isFalse 
                     ? 'bg-no/20 border-no text-no' 
                     : 'bg-white/5 border-transparent text-muted-foreground hover:bg-white/10'
                 }`}
               >
                 <X className="w-4 h-4" /> FAUX
               </button>
             </div>
          </div>
        )
      })}
      
      <div className="pt-4">
        <button 
          onClick={handleResolve}
          disabled={isLoading}
          className="w-full py-4 bg-primary font-semibold text-lg rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg"
        >
          {isLoading ? "Résolution en cours..." : "Valider et Payer les Gains"}
        </button>
      </div>
    </div>
  )
}

