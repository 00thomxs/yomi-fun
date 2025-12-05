'use client'

import { updateSeasonSettings, startSeason, endSeason, type SeasonSettings } from "./actions"
import { useState } from "react"
import { Save, Calendar, Trophy, Coins, Loader2, Play, StopCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function SettingsForm({ settings }: { settings: SeasonSettings }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await updateSeasonSettings(formData)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSeason = async () => {
    setIsStarting(true)
    try {
      const result = await startSeason()
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Erreur lors du démarrage")
    } finally {
      setIsStarting(false)
    }
  }

  const handleEndSeason = async () => {
    setIsEnding(true)
    try {
      const result = await endSeason()
      if (result.success) {
        toast.success(result.message)
        setShowEndConfirm(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Erreur lors de la fin de saison")
    } finally {
      setIsEnding(false)
    }
  }

  const seasonEnd = new Date(settings.season_end)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((seasonEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="space-y-8">
      {/* Season Status Banner */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${
        settings.is_active 
          ? 'bg-emerald-500/10 border border-emerald-500/30' 
          : 'bg-white/5 border border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          {settings.is_active ? (
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          ) : (
            <XCircle className="w-6 h-6 text-muted-foreground" />
          )}
          <div>
            <p className="font-bold">
              {settings.is_active ? '🎯 Saison Active' : '⏸️ Aucune Saison Active'}
            </p>
            <p className="text-xs text-muted-foreground">
              {settings.is_active 
                ? `Se termine dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''} (${seasonEnd.toLocaleDateString('fr-FR')})`
                : settings.rewards_distributed 
                  ? 'Récompenses distribuées ✓'
                  : 'Configure la saison puis clique sur "Démarrer"'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!settings.is_active && (
            <button
              type="button"
              onClick={handleStartSeason}
              disabled={isStarting}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Démarrer la Saison
            </button>
          )}
          
          {settings.is_active && !showEndConfirm && (
            <button
              type="button"
              onClick={() => setShowEndConfirm(true)}
              className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold transition-all flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Terminer la Saison
            </button>
          )}

          {showEndConfirm && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Distribuer les Zeny ?
              </span>
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs"
                disabled={isEnding}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleEndSeason}
                disabled={isEnding}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs flex items-center gap-1"
              >
                {isEnding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}
                CONFIRMER
              </button>
            </div>
          )}
        </div>
      </div>

      <form action={handleSubmit} className="space-y-8">
        <input type="hidden" name="id" value={settings.id} />

        {/* General Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="w-4 h-4" /> Cash Prize (en Zeny)
            </label>
            <input
              type="number"
              name="cash_prize"
              defaultValue={settings.cash_prize}
              className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none font-mono"
              required
            />
            <p className="text-[10px] text-muted-foreground">Zeny bonus pour le 1er (s'ajoute au Zeny Rang #1)</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Fin de la Saison
            </label>
            <input
              type="datetime-local"
              name="season_end"
              defaultValue={new Date(settings.season_end).toISOString().slice(0, 16)}
              className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none font-mono"
              required
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Physical Prizes */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Prix Physiques (Top 3)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Ces prix sont à distribuer manuellement par l'admin.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">🥇 1ère Place</label>
              <input
                type="text"
                name="top1_prize"
                defaultValue={settings.top1_prize}
                placeholder="Ex: PS5"
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">🥈 2ème Place</label>
              <input
                type="text"
                name="top2_prize"
                defaultValue={settings.top2_prize}
                placeholder="Ex: AirPods"
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-orange-500 uppercase tracking-wider">🥉 3ème Place</label>
              <input
                type="text"
                name="top3_prize"
                defaultValue={settings.top3_prize}
                placeholder="Ex: Bon d'achat"
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Zeny Rewards */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> Récompenses Zeny (Top 10)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Distribués automatiquement à la fin de la saison. Le #1 reçoit Cash Prize + Rang #1.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <label className={`text-[10px] font-medium uppercase ${
                  i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : ''} Rang #{i + 1}
                </label>
                <input
                  type="number"
                  name={`zeny_rank_${i + 1}`}
                  defaultValue={settings.zeny_rewards?.[i] || 0}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  )
}
