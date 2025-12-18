"use client"

import { useState } from "react"
import { CreditCard, Loader2, CheckCircle, AlertCircle, Star, Trophy } from "lucide-react"
import { awardRetroactiveCards, awardBetaCards, awardRetroactiveSeasonCards } from "@/app/actions/profile-cards"

export default function AdminCardsPage() {
  const [loading, setLoading] = useState(false)
  const [loadingBeta, setLoadingBeta] = useState(false)
  const [loadingSeasonCards, setLoadingSeasonCards] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string[]
  } | null>(null)
  const [betaResult, setBetaResult] = useState<{
    success: boolean
    count: number
    message: string
  } | null>(null)
  const [seasonCardsResult, setSeasonCardsResult] = useState<{
    success: boolean
    message: string
    details: string[]
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

  const handleAwardBetaCards = async () => {
    if (!confirm("Attribuer la carte BETA TESTEUR à tous les utilisateurs actuels ?")) return
    
    setLoadingBeta(true)
    setBetaResult(null)
    
    try {
      const res = await awardBetaCards()
      setBetaResult(res)
    } catch (error) {
      setBetaResult({
        success: false,
        count: 0,
        message: String(error)
      })
    } finally {
      setLoadingBeta(false)
    }
  }

  const handleAwardSeasonCards = async () => {
    if (!confirm("Attribuer les cartes de saison (Holo/Diamond/Gold/etc.) à tous les participants des saisons passées ?")) return
    
    setLoadingSeasonCards(true)
    setSeasonCardsResult(null)
    
    try {
      const res = await awardRetroactiveSeasonCards()
      setSeasonCardsResult(res)
    } catch (error) {
      setSeasonCardsResult({
        success: false,
        message: String(error),
        details: []
      })
    } finally {
      setLoadingSeasonCards(false)
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

      {/* Beta Cards Section */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="font-bold">Carte Beta Testeur</h2>
            <p className="text-sm text-muted-foreground">
              Attribue une carte spéciale rouge avec "Beta Testeur" en doré à tous les utilisateurs actuels
            </p>
          </div>
        </div>

        <button
          onClick={handleAwardBetaCards}
          disabled={loadingBeta}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50"
        >
          {loadingBeta ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Attribution en cours...
            </>
          ) : (
            <>
              <Star className="w-5 h-5" />
              Attribuer carte Beta Testeur
            </>
          )}
        </button>

        {betaResult && (
          <div className={`p-4 rounded-lg border ${betaResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex items-center gap-2">
              {betaResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              <p className={`font-bold ${betaResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {betaResult.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Season Cards Section - Award Holo/Diamond/etc. based on ranking */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="font-bold">Cartes de Saison (Holo/Diamond/Gold...)</h2>
            <p className="text-sm text-muted-foreground">
              Attribue les cartes aux gagnants des saisons passées selon leur classement final
            </p>
          </div>
        </div>

        <button
          onClick={handleAwardSeasonCards}
          disabled={loadingSeasonCards}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all disabled:opacity-50"
        >
          {loadingSeasonCards ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Attribution en cours...
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5" />
              Attribuer cartes de saison
            </>
          )}
        </button>

        {seasonCardsResult && (
          <div className={`p-4 rounded-lg border ${seasonCardsResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              {seasonCardsResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              <p className={`font-bold ${seasonCardsResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {seasonCardsResult.message}
              </p>
            </div>
            {seasonCardsResult.details.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-black/20 font-mono text-xs space-y-1">
                {seasonCardsResult.details.map((line, i) => (
                  <p key={i} className="text-zinc-400">{line}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h3 className="font-bold">Informations sur les tiers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { name: 'Fer', color: '#71717a', desc: '0-10K PnL' },
            { name: 'Bronze', color: '#f97316', desc: '10K-25K PnL' },
            { name: 'Or', color: '#facc15', desc: '25K+ PnL' },
            { name: 'Diamant', color: '#22d3ee', desc: 'Top 10' },
            { name: 'Holo', color: '#ffffff', desc: 'Top 3' },
            { name: 'Beta', color: '#ef4444', desc: 'Spéciale' },
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

