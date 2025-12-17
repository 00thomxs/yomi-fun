'use client'

import { useState } from 'react'
import { Loader2, Trophy, CheckCircle2, AlertCircle, Star } from 'lucide-react'
import { awardBadgesToExistingUsers, awardBetaTesterBadges } from './actions'

type Result = { success: boolean; message: string; details?: string[] }

export default function AwardExistingBadgesPage() {
  const [isProcessing, setIsProcessing] = useState<'stats' | 'beta' | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const handleAwardStats = async () => {
    setIsProcessing('stats')
    setResult(null)
    
    try {
      const res = await awardBadgesToExistingUsers()
      setResult(res)
    } catch (error) {
      setResult({ success: false, message: 'Erreur inattendue', details: [String(error)] })
    } finally {
      setIsProcessing(null)
    }
  }

  const handleAwardBeta = async () => {
    setIsProcessing('beta')
    setResult(null)
    
    try {
      const res = await awardBetaTesterBadges()
      setResult(res)
    } catch (error) {
      setResult({ success: false, message: 'Erreur inattendue', details: [String(error)] })
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold">Attribution des Badges</h1>
        </div>

        {/* Stats-based badges */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Badges basés sur les stats</h2>
          <p className="text-sm text-zinc-400">
            Analyse les stats de tous les joueurs et attribue les badges mérités
            (NOOB, SENSEI, TRADER, WHALE, DEVIN, VERIFIED, G.O.A.T, MVP)
          </p>
          
          <button
            onClick={handleAwardStats}
            disabled={isProcessing !== null}
            className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing === 'stats' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                Attribuer badges stats
              </>
            )}
          </button>
        </div>

        {/* Beta Tester badge */}
        <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-lg text-amber-400">Badge BETA TESTEUR</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Attribue le badge légendaire <span className="text-amber-400 font-bold">BETA TESTEUR</span> aux 
            <span className="text-white font-bold"> 14 premiers comptes</span> du site (par date de création).
          </p>
          
          <button
            onClick={handleAwardBeta}
            disabled={isProcessing !== null}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {isProcessing === 'beta' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Attribution...
              </>
            ) : (
              <>
                <Star className="w-5 h-5" />
                Attribuer BETA TESTEUR
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
                  <p key={i} className="text-xs text-zinc-400 font-mono">
                    {detail}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

