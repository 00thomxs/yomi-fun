'use client'

import { updateSeasonSettings, type SeasonSettings } from "./actions"
import { useState } from "react"
import { Save, Calendar, Trophy, Coins, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SettingsForm({ settings }: { settings: SeasonSettings }) {
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="id" value={settings.id} />

      {/* General Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Coins className="w-4 h-4" /> Cash Prize Global (€)
          </label>
          <input
            type="number"
            name="cash_prize"
            defaultValue={settings.cash_prize}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none font-mono"
            required
          />
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
          <Trophy className="w-5 h-5 text-yellow-500" /> Prix Principaux (Top 3)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider">1er Place</label>
            <input
              type="text"
              name="top1_prize"
              defaultValue={settings.top1_prize}
              placeholder="Ex: PS5"
              className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">2ème Place</label>
            <input
              type="text"
              name="top2_prize"
              defaultValue={settings.top2_prize}
              placeholder="Ex: AirPods"
              className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-orange-700 uppercase tracking-wider">3ème Place</label>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Rang #{i + 1}</label>
              <input
                type="number"
                name={`zeny_rank_${i + 1}`}
                defaultValue={settings.zeny_rewards[i] || 0}
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
  )
}

