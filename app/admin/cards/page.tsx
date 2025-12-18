"use client"

import { useState } from "react"
import { CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { awardRetroactiveCards } from "@/app/actions/profile-cards"

export default function AdminCardsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string[]
  } | null>(null)

  const handleAwardCards = async () => {
    if (!confirm("Attribuer les cartes rétroactives à tous les joueurs ?")) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const res = await awardRetroactiveCards()
      setResult(res)
    } catch (error) {
      setResult({
        success: false,
        message: "Erreur inattendue",
        details: [String(error)]
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cartes Profil</h1>
        <p className="text-muted-foreground">Gestion des cartes profil TCG</p>
      </div>

      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold">Attribuer les cartes retroactives</h2>
            <p className="text-sm text-muted-foreground">
              Crée les cartes pour tous les joueurs ayant participé aux saisons passées
            </p>
          </div>
        </div>

        <button
          onClick={handleAwardCards}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Attribution en cours...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Attribuer les cartes
            </>
          )}
        </button>

        {result && (
          <div className={`p-4 rounded-lg border ${result.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              <p className={`font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.message}
              </p>
            </div>
            {result.details && (
              <div className="mt-3 p-3 rounded-lg bg-black/20 font-mono text-xs space-y-1 max-h-[200px] overflow-y-auto">
                {result.details.map((line, i) => (
                  <p key={i} className="text-zinc-400">{line}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h3 className="font-bold">Informations sur les tiers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Fer', color: '#71717a', desc: '0-10K PnL' },
            { name: 'Bronze', color: '#f97316', desc: '10K-25K PnL' },
            { name: 'Or', color: '#facc15', desc: '25K+ PnL' },
            { name: 'Diamant', color: '#22d3ee', desc: 'Top 10' },
            { name: 'Holo', color: '#ffffff', desc: 'Top 3' },
          ].map((tier) => (
            <div 
              key={tier.name}
              className="p-3 rounded-lg text-center"
              style={{ 
                background: `${tier.color}10`,
                border: `1px solid ${tier.color}30` 
              }}
            >
              <p className="font-bold" style={{ color: tier.color }}>{tier.name}</p>
              <p className="text-xs text-muted-foreground">{tier.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

