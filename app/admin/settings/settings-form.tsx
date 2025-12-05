'use client'

import { updateSeasonSettings, startSeason, endSeason, type SeasonSettings } from "./actions"
import { useState } from "react"
import { Save, Calendar, Trophy, Coins, Loader2, Play, StopCircle, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"
import { toast } from "sonner"

export function SettingsForm({ settings }: { settings: SeasonSettings }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  
  // Date/Time state for better UX
  const initialDate = new Date(settings.season_end)
  const [selectedDate, setSelectedDate] = useState(initialDate.toISOString().slice(0, 10))
  const [selectedTime, setSelectedTime] = useState(initialDate.toTimeString().slice(0, 5))

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      // Combine date and time
      const combinedDateTime = `${selectedDate}T${selectedTime}`
      formData.set('season_end', combinedDateTime)
      
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
      console.log('Starting season...')
      const result = await startSeason()
      console.log('Start season result:', result)
      
      if (result.success) {
        toast.success(result.message || "Saison démarrée !")
        // Force full page reload to get fresh server data
        setTimeout(() => window.location.reload(), 500)
      } else {
        toast.error(result.error || "Erreur inconnue")
      }
    } catch (error) {
      console.error('Start season error:', error)
      toast.error("Erreur lors du démarrage: " + String(error))
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
        // Force full page reload
        window.location.reload()
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

  // If season is active, show simplified view with only End Season button
  if (settings.is_active) {
    return (
      <div className="space-y-6">
        {/* Active Season Banner */}
        <div className="rounded-xl p-6 bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400">🎯 Saison Active</p>
              <p className="text-sm text-muted-foreground">
                Se termine le {seasonEnd.toLocaleDateString('fr-FR')} à {seasonEnd.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {daysLeft > 0 && ` (dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''})`}
              </p>
            </div>
          </div>

          {/* Current Rewards Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-black/20 border border-white/10">
              <p className="text-xs text-muted-foreground uppercase mb-1">Cash Prize (1er)</p>
              <p className="text-2xl font-mono font-bold text-amber-400">{settings.cash_prize?.toLocaleString()} Z</p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-white/10">
              <p className="text-xs text-muted-foreground uppercase mb-1">Total Zeny à distribuer</p>
              <p className="text-2xl font-mono font-bold text-primary">
                {(settings.cash_prize + (settings.zeny_rewards?.reduce((a, b) => a + b, 0) || 0)).toLocaleString()} Z
              </p>
            </div>
          </div>

          {/* End Season Button */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div>
              <p className="font-bold text-amber-400">Terminer la Saison</p>
              <p className="text-xs text-muted-foreground">Les Zeny seront distribués aux top 10 joueurs</p>
            </div>
            
            {!showEndConfirm ? (
              <button
                type="button"
                onClick={() => setShowEndConfirm(true)}
                className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold transition-all flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                Terminer
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <span className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Confirmer ?
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
                  DISTRIBUER
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Season not active - show configuration form
  return (
    <div className="space-y-8">
      {/* Inactive Status */}
      <div className="rounded-xl p-4 bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-muted-foreground" />
          <div>
            <p className="font-bold">⏸️ Aucune Saison Active</p>
            <p className="text-xs text-muted-foreground">
              {settings.rewards_distributed 
                ? 'Dernière saison terminée, récompenses distribuées ✓'
                : 'Configure les paramètres puis démarre la saison'
              }
            </p>
          </div>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-8">
        <input type="hidden" name="id" value={settings.id} />

        {/* Date & Time Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Date de Fin de Saison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none font-mono text-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Heure
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none font-mono text-lg"
                required
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Cash Prize */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" /> Cash Prize (1ère Place)
          </h3>
          <div className="space-y-2">
            <input
              type="number"
              name="cash_prize"
              defaultValue={settings.cash_prize}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none font-mono text-xl"
              placeholder="10000"
              required
            />
            <p className="text-xs text-muted-foreground">
              Zeny bonus exclusif pour le 1er joueur (s'ajoute au bonus Zeny Rang #1)
            </p>
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
            <Coins className="w-5 h-5 text-primary" /> Bonus Zeny (Top 10)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Distribués automatiquement à la fin de la saison. Le 1er reçoit Cash Prize + Bonus Rang #1.
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>

          <button
            type="button"
            onClick={handleStartSeason}
            disabled={isStarting}
            className="px-6 py-3 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            🚀 Démarrer la Saison
          </button>
        </div>
      </form>
    </div>
  )
}
