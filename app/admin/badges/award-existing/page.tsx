'use client'

import { useState } from 'react'
import { Loader2, Trophy, CheckCircle2, AlertCircle } from 'lucide-react'
import { awardBadgesToExistingUsers } from './actions'

type Result = { success: boolean; message: string; details?: string[] }

export default function AwardExistingBadgesPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const handleAwardStats = async () => {
    setIsProcessing(true)
    setResult(null)
    
    try {
      const res = await awardBadgesToExistingUsers()
      setResult(res)
    } catch (error) {
      setResult({ success: false, message: 'Erreur inattendue', details: [String(error)] })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold">Attribution des Badges</h1>
          <p className="text-sm text-muted-foreground">
            Attribuer les badges mérités aux joueurs existants
          </p>
        </div>
      </div>

      {/* Stats-based badges */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Badges basés sur les stats</h2>
        <p className="text-sm text-muted-foreground">
          Analyse les stats de tous les joueurs et attribue les badges mérités
          (NOOB, SENSEI, TRADER, WHALE, DEVIN, VERIFIED, G.O.A.T, MVP)
        </p>
        
        <button
          onClick={handleAwardStats}
          disabled={isProcessing}
          className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5" />
              Attribuer les badges
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-xl p-6 border ${
          result.success 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-rose-500/10 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span className={`font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.message}
            </span>
          </div>
          
          {result.details && result.details.length > 0 && (
            <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
              {result.details.map((detail, i) => (
                <p key={i} className="text-xs text-muted-foreground font-mono">
                  {detail}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
