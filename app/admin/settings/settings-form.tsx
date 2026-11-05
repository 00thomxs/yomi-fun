'use client'

import { updateSeasonSettings, startSeason, endSeason, type SeasonSettings } from "./actions"
import { useState, useEffect } from "react"
import { Save, Calendar, Trophy, Coins, Loader2, Play, StopCircle, CheckCircle, XCircle, AlertTriangle, Link2, Unlink, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

type MarketForSeason = {
  id: string
  question: string
  closes_at: string
  season_id: string | null
  status: string
}

export function SettingsForm({ settings }: { settings: SeasonSettings }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  
  // Date/Time state for better UX - using datetime-local format
  const initialDate = new Date(settings.season_end)
  const formatDateTimeLocal = (date: Date) => {
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0') + 'T' +
      String(date.getHours()).padStart(2, '0') + ':' +
      String(date.getMinutes()).padStart(2, '0')
  }
  const [seasonEndDateTime, setSeasonEndDateTime] = useState(formatDateTimeLocal(initialDate))
  
  // Markets linked to this season
  const [seasonMarkets, setSeasonMarkets] = useState<MarketForSeason[]>([])
  const [availableMarkets, setAvailableMarkets] = useState<MarketForSeason[]>([])
  const [loadingMarkets, setLoadingMarkets] = useState(false)
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null)
  
  // Fetch markets and active season
  useEffect(() => {
    const fetchData = async () => {
      setLoadingMarkets(true)
      const supabase = createClient()
      
      // Get active season from seasons table
      const { data: activeSeason } = await supabase
        .from('seasons')
        .select('id')
        .eq('is_active', true)
        .single()
      
      if (activeSeason) {
        setActiveSeasonId(activeSeason.id)
        
        // Fetch markets linked to this season
        const { data: linkedMarkets } = await supabase
          .from('markets')
          .select('id, question, closes_at, season_id, status')
          .eq('season_id', activeSeason.id)
          .order('closes_at', { ascending: true })
        
        if (linkedMarkets) setSeasonMarkets(linkedMarkets)
        
        // Fetch markets NOT linked to any season (available to add)
        const { data: unlinkedMarkets } = await supabase
          .from('markets')
          .select('id, question, closes_at, season_id, status')
          .is('season_id', null)
          .eq('status', 'open')
          .order('closes_at', { ascending: true })
        
        if (unlinkedMarkets) setAvailableMarkets(unlinkedMarkets)
      }
      
      setLoadingMarkets(false)
    }
    
    if (settings.is_active) {
      fetchData()
    }
  }, [settings.is_active])
  
  // Link/Unlink market to season
  const handleLinkMarket = async (marketId: string) => {
    if (!activeSeasonId) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('markets')
      .update({ season_id: activeSeasonId })
      .eq('id', marketId)
    
    if (!error) {
      const market = availableMarkets.find(m => m.id === marketId)
      if (market) {
        setSeasonMarkets([...seasonMarkets, { ...market, season_id: activeSeasonId }])
        setAvailableMarkets(availableMarkets.filter(m => m.id !== marketId))
      }
      toast.success("Event ajouté à la saison")
    } else {
      toast.error("Erreur:" + error.message)
    }
  }
  
  const handleUnlinkMarket = async (marketId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('markets')
      .update({ season_id: null })
      .eq('id', marketId)
    
    if (!error) {
      const market = seasonMarkets.find(m => m.id === marketId)
      if (market) {
        // Only add to availableMarkets if the event is still 'open'
        if (market.status === 'open') {
          setAvailableMarkets([...availableMarkets, { ...market, season_id: null }])
        }
        setSeasonMarkets(seasonMarkets.filter(m => m.id !== marketId))
      }
      toast.success("Event retiré de la saison")
    } else {
      toast.error("Erreur:" + error.message)
    }
  }
  
  // Date presets helper
  const setDatePreset = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(23, 59, 0, 0)
    setSeasonEndDateTime(formatDateTimeLocal(date))
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      // Convert datetime-local to ISO with timezone info
      const localDate = new Date(seasonEndDateTime)
      const isoDateTime = localDate.toISOString()
      formData.set('season_end', isoDateTime)
      
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
      toast.error("Erreur lors du démarrage:" + String(error))
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

  // Season is active - show editable form with End Season option
  const isSeasonActive = settings.is_active

  // Show configuration form (works for both active and inactive seasons)
    return (
    <div className="space-y-8">
      {/* Season Status Banner */}
      {isSeasonActive ? (
        <div className="rounded-lg p-4 bg-yes/10 border border-yes/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-yes" />
            <div>
              <p className="font-semibold text-yes">Saison active</p>
              <p className="text-xs text-muted-foreground">
                Se termine le {seasonEnd.toLocaleDateString('fr-FR')} à {seasonEnd.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {daysLeft > 0 && ` (dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''})`}
              </p>
            </div>
          </div>

          {/* End Season Button */}
            {!showEndConfirm ? (
              <button
                type="button"
                onClick={() => setShowEndConfirm(true)}
                className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-semibold transition-all flex items-center gap-2"
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
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs flex items-center gap-1"
                >
                  {isEnding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}
                  DISTRIBUER
                </button>
              </div>
            )}
          </div>
      ) : (
      <div className="rounded-lg p-4 bg-white/5 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-muted-foreground" />
          <div>
            <p className="font-semibold">⏸️ Aucune Saison Active</p>
            <p className="text-xs text-muted-foreground">
              {settings.rewards_distributed 
                ? 'Dernière saison terminée, récompenses distribuées'
                : 'Configure les paramètres puis démarre la saison'
              }
            </p>
          </div>
        </div>
      </div>
      )}

      <form action={handleSubmit} className="space-y-8">
        <input type="hidden" name="id" value={settings.id} />

        {/* Season Title */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Titre de la Saison
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              name="title"
              defaultValue={settings.title || "Saison Régulière"}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-border focus:border-primary outline-none text-xl font-semibold"
              placeholder="Ex: Saison Hiver 2025"
              required
            />
            <p className="text-xs text-muted-foreground">
              Ce titre sera affiché sur la page Classement (ex: "Saison Hiver 2025").
            </p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Date & Time Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Date de Fin de Saison
          </h3>
            <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="datetime-local"
                value={seasonEndDateTime}
                onChange={(e) => setSeasonEndDateTime(e.target.value)}
                className="w-full bg-black/20 border border-border rounded-lg pl-11 pr-4 py-3 outline-none focus:border-primary/50 transition-all appearance-none text-white scheme-dark font-mono text-lg"
                required
              />
            </div>
            {/* Date Presets */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-2">Raccourcis :</span>
              <button
                type="button"
                onClick={() => setDatePreset(7)}
                className="px-3 py-1.5 rounded bg-white/5 border border-border text-xs hover:bg-white/10 transition-all"
              >
                +7j
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(14)}
                className="px-3 py-1.5 rounded bg-white/5 border border-border text-xs hover:bg-white/10 transition-all"
              >
                +14j
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(30)}
                className="px-3 py-1.5 rounded bg-white/5 border border-border text-xs hover:bg-white/10 transition-all"
              >
                +1 mois
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(90)}
                className="px-3 py-1.5 rounded bg-white/5 border border-border text-xs hover:bg-white/10 transition-all"
              >
                +3 mois
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Cash Prize */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" /> Cash Prize (1ère Place)
          </h3>
          <div className="space-y-2">
            <input
              type="number"
              name="cash_prize"
              defaultValue={settings.cash_prize}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-border focus:border-primary outline-none font-mono text-xl"
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
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Prix Physiques (Top 3)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Ces prix sont à distribuer manuellement par l'admin.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-amber-400 uppercase tracking-wide">#1 - 1ère Place</label>
              <input
                type="text"
                name="top1_prize"
                defaultValue={settings.top1_prize}
                placeholder="Ex: PS5"
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-border focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">#2 - 2ème Place</label>
              <input
                type="text"
                name="top2_prize"
                defaultValue={settings.top2_prize}
                placeholder="Ex: AirPods"
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-border focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-orange-400 uppercase tracking-wide">#3 - 3ème Place</label>
              <input
                type="text"
                name="top3_prize"
                defaultValue={settings.top3_prize}
                placeholder="Ex: Bon d'achat"
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-border focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Zeny Rewards */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> Bonus Zeny (Top 10)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Distribués automatiquement à la fin de la saison. Le 1er reçoit Cash Prize + Bonus Rang #1.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <label className={`text-[11px] font-medium uppercase ${
                  i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  #{i + 1}
                </label>
                <input
                  type="number"
                  name={`zeny_rank_${i + 1}`}
                  defaultValue={settings.zeny_rewards?.[i] || 0}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/20 border border-border focus:border-primary outline-none font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Season Events Management - Only shown when season is active */}
        {isSeasonActive && (
          <>
            <div className="h-px bg-border" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" /> Events de la Saison
              </h3>
              <p className="text-xs text-muted-foreground">
                Les events liés à cette saison comptent pour le classement saisonnier. 
                Tu peux aussi lier un event lors de sa création.
              </p>
              
              {loadingMarkets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Events currently in season */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yes flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Events liés ({seasonMarkets.length})
                    </p>
                    {seasonMarkets.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {seasonMarkets.map(market => (
                          <div 
                            key={market.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-yes/5 border border-yes/20"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{market.question}</p>
                              <p className="text-xs text-muted-foreground">
                                Fin: {new Date(market.closes_at).toLocaleDateString('fr-FR')}
                                {market.status !== 'open' && (
                                  <span className="ml-2 text-amber-400">({market.status})</span>
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnlinkMarket(market.id)}
                              className="ml-2 p-2 rounded-lg text-no hover:bg-no/10 transition-all"
                              title="Retirer de la saison"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-2">
                        Aucun event lié. Ajoute des events ci-dessous ou lors de la création.
                      </p>
                    )}
                  </div>
                  
                  {/* Available events to add */}
                  {availableMarkets.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        Events disponibles ({availableMarkets.length})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableMarkets.map(market => {
                          // Check if market end date is within season end date
                          const marketEnd = new Date(market.closes_at)
                          const seasonEndDate = new Date(seasonEndDateTime)
                          const isCompatible = marketEnd <= seasonEndDate
                          
                          return (
                            <div 
                              key={market.id} 
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isCompatible 
                                  ? 'bg-white/5 border-border hover:border-white/15' 
                                  : 'bg-amber-500/5 border-amber-500/20 opacity-60'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{market.question}</p>
                                <p className="text-xs text-muted-foreground">
                                  Fin: {new Date(market.closes_at).toLocaleDateString('fr-FR')}
                                  {!isCompatible && (
                                    <span className="ml-2 text-amber-400">Après la saison</span>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleLinkMarket(market.id)}
                                disabled={!isCompatible}
                                className={`ml-2 p-2 rounded-lg transition-all ${
                                  isCompatible 
                                    ? 'text-yes hover:bg-yes/10' 
                                    : 'text-muted-foreground cursor-not-allowed'
                                }`}
                                title={isCompatible ? "Ajouter à la saison" : "Date incompatible"}
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Link to create new event */}
                  <Link
                    href="/admin/create"
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-primary/50 transition-all"
                  >
                    <span className="text-sm">+ Créer un nouvel event</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

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

          {!isSeasonActive && (
          <button
            type="button"
            onClick={handleStartSeason}
            disabled={isStarting}
            className="px-6 py-3 rounded-lg bg-yes text-white font-semibold hover:bg-emerald-600 transition-all flex items-center gap-2"
          >
            {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            Démarrer la saison
          </button>
          )}
        </div>
      </form>
    </div>
  )
}
