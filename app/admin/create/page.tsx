"use client"

import { createMarket } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Image as ImageIcon, Type, List, Plus, X, Clock, PieChart, Star, Trophy, Coins } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import { MARKET_CATEGORIES } from "@/lib/constants"
import type { Season } from "@/lib/types"

export default function CreateMarketPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // Market Type
  const [marketType, setMarketType] = useState<'binary' | 'multi'>('binary')
  
  // Season selector state
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("")
  const [closesAtValue, setClosesAtValue] = useState<string>("")
  
  // Initial liquidity (seed)
  const [initialLiquidity, setInitialLiquidity] = useState<number>(10000)
  
  // Fetch active seasons on mount
  useEffect(() => {
    const fetchSeasons = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .order('end_date', { ascending: true })
      
      if (data) {
        setSeasons(data)
      }
    }
    fetchSeasons()
  }, [])
  
  // Filter seasons: only show seasons whose end_date is AFTER the event's closes_at
  const availableSeasons = seasons.filter(season => {
    if (!closesAtValue) return true // Show all if no date selected yet
    const eventEndDate = new Date(closesAtValue)
    const seasonEndDate = new Date(season.end_date)
    return seasonEndDate >= eventEndDate
  })
  
  // Outcomes State
  const [binaryProb, setBinaryProb] = useState(50)
  const [multiOutcomes, setMultiOutcomes] = useState([
    { name: "", probability: 0, color: "#3b82f6" },
    { name: "", probability: 0, color: "#ec4899" }
  ])

  const addMultiOutcome = () => {
    setMultiOutcomes([...multiOutcomes, { name: "", probability: 0, color: "#8b5cf6" }])
  }

  const removeMultiOutcome = (index: number) => {
    setMultiOutcomes(multiOutcomes.filter((_, i) => i !== index))
  }

  const updateMultiOutcome = (index: number, field: string, value: any) => {
    const newOutcomes = [...multiOutcomes]
    newOutcomes[index] = { ...newOutcomes[index], [field]: value }
    setMultiOutcomes(newOutcomes)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    // Convert closesAt from datetime-local (no timezone) to ISO with timezone
    const closesAtLocal = formData.get('closesAt') as string
    if (closesAtLocal) {
      // Parse as local time, then convert to ISO (which is UTC)
      const localDate = new Date(closesAtLocal)
      const isoDateTime = localDate.toISOString()
      formData.set('closesAt', isoDateTime)
    }
    
    // Construct outcomes based on type
    let finalOutcomes = []
    if (marketType === 'binary') {
      finalOutcomes = [
        { name: "OUI", probability: binaryProb, color: "#10b981" },
        { name: "NON", probability: 100 - binaryProb, color: "#f43f5e" }
      ]
    } else {
      finalOutcomes = multiOutcomes
    }
    
    formData.append('type', marketType)
    formData.append('outcomes', JSON.stringify(finalOutcomes))
    formData.append('seasonId', selectedSeasonId || '')
    formData.append('initialLiquidity', initialLiquidity.toString())
    
    const result = await createMarket(formData)
    
    if (result.error) {
      toast({
        title: "Erreur",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Succès",
        description: result.message,
        variant: "default"
      })
      router.push("/admin")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouvel Event</h1>
        <p className="text-muted-foreground mt-1">
          Configuration de l'événement
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. Type de Marché */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Type d'Event
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMarketType('binary')}
              className={`p-4 rounded-lg border transition-all text-center ${
                marketType === 'binary' 
                  ? 'bg-primary/10 border-primary text-primary font-bold' 
                  : 'bg-white/5 border-transparent hover:bg-white/10'
              }`}
            >
              Binaire (Oui/Non)
            </button>
            <button
              type="button"
              onClick={() => setMarketType('multi')}
              className={`p-4 rounded-lg border transition-all text-center ${
                marketType === 'multi' 
                  ? 'bg-primary/10 border-primary text-primary font-bold' 
                  : 'bg-white/5 border-transparent hover:bg-white/10'
              }`}
            >
              Choix Multiple
            </button>
          </div>
        </div>

        {/* 2. Informations Générales */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            Informations
          </h2>
          
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Question</label>
            <input 
              name="question"
              type="text"
              placeholder="Ex: Squeezie va-t-il gagner ?"
              className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description (Optionnel)</label>
            <textarea 
              name="description"
              placeholder="Détails supplémentaires..."
              className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Catégorie</label>
              <select name="category" className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all">
                {MARKET_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Image URL</label>
              <input 
                name="imageUrl"
                type="url"
                placeholder="https://..."
                className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Date & Heure */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date de fin</label>
            <div className="flex flex-col gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input 
                  id="closesAt"
                  name="closesAt"
                  type="datetime-local"
                  value={closesAtValue}
                  onChange={(e) => {
                    setClosesAtValue(e.target.value)
                    // Reset season selection if the new date makes it invalid
                    if (selectedSeasonId) {
                      const selectedSeason = seasons.find(s => s.id === selectedSeasonId)
                      if (selectedSeason && new Date(selectedSeason.end_date) < new Date(e.target.value)) {
                        setSelectedSeasonId("")
                      }
                    }
                  }}
                  className="w-full bg-white/5 border border-border rounded-lg pl-11 pr-4 py-3 outline-none focus:border-primary/50 transition-all appearance-none text-white scheme-dark"
                  required
                />
              </div>
              {/* Quick Presets */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const date = new Date()
                    date.setHours(date.getHours() + 24)
                    // Format for datetime-local: YYYY-MM-DDTHH:mm (LOCAL time)
                    const localString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' +
                      String(date.getDate()).padStart(2, '0') + 'T' +
                      String(date.getHours()).padStart(2, '0') + ':' +
                      String(date.getMinutes()).padStart(2, '0')
                    setClosesAtValue(localString)
                  }}
                  className="px-3 py-1.5 rounded bg-white/5 border border-border text-xs hover:bg-white/10 transition-all"
                >
                  +24h
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const date = new Date()
                    date.setDate(date.getDate() + 7)
                    const localString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' +
                      String(date.getDate()).padStart(2, '0') + 'T' +
                      String(date.getHours()).padStart(2, '0') + ':' +
                      String(date.getMinutes()).padStart(2, '0')
                    setClosesAtValue(localString)
                  }}
                  className="px-3 py-1.5 rounded bg-white/5 border border-border text-xs hover:bg-white/10 transition-all"
                >
                  +7j
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const date = new Date()
                    date.setDate(date.getDate() + 30)
                    const localString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' +
                      String(date.getDate()).padStart(2, '0') + 'T' +
                      String(date.getHours()).padStart(2, '0') + ':' +
                      String(date.getMinutes()).padStart(2, '0')
                    setClosesAtValue(localString)
                  }}
                  className="px-3 py-1.5 rounded bg-white/5 border border-border text-xs hover:bg-white/10 transition-all"
                >
                  +30j
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Le marché sera automatiquement clôturé à cette date.</p>
          </div>

          {/* Options de mise en avant */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="flex-1">
                <label htmlFor="isFeatured" className="text-sm font-medium cursor-pointer select-none">Trending</label>
                <p className="text-xs text-muted-foreground">Apparaît dans l'onglet "Trending"</p>
              </div>
              <input 
                type="checkbox" 
                id="isFeatured" 
                name="isFeatured"
                className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary/50"
              />
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label htmlFor="isHeadline" className="text-sm font-medium cursor-pointer select-none">A la Une</label>
                <p className="text-xs text-muted-foreground">Grande image en haut de la page</p>
              </div>
              <input 
                type="checkbox" 
                id="isHeadline" 
                name="isHeadline"
                className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* 3. Saison & Liquidité */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Saison & Liquidité
          </h2>

          {/* Season Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Saison (Optionnel)
            </label>
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
            >
              <option value="">Aucune saison (Event global)</option>
              {availableSeasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} (jusqu'au {new Date(season.end_date).toLocaleDateString('fr-FR')})
                </option>
              ))}
            </select>
            {closesAtValue && availableSeasons.length === 0 && seasons.length > 0 && (
              <p className="text-xs text-amber-400">
                ⚠️ Aucune saison disponible - la date de fin de l'event dépasse toutes les saisons actives.
              </p>
            )}
            {!closesAtValue && seasons.length > 0 && (
              <p className="text-xs text-muted-foreground">
                💡 Sélectionnez d'abord une date de fin pour voir les saisons compatibles.
              </p>
            )}
            {seasons.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Aucune saison active. Les events créés ne compteront pas pour un classement saisonnier.
              </p>
            )}
          </div>

          {/* Initial Liquidity */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Coins className="w-3 h-3" />
              Liquidité Initiale (Seed)
            </label>
            
            {/* Preset buttons with descriptions */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setInitialLiquidity(5000)}
                className={`p-3 rounded-lg text-center transition-all border ${
                  initialLiquidity === 5000 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                    : 'bg-white/5 border-border hover:bg-white/10'
                }`}
              >
                <div className="text-lg font-bold font-mono">5K</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Fun</div>
              </button>
              <button
                type="button"
                onClick={() => setInitialLiquidity(10000)}
                className={`p-3 rounded-lg text-center transition-all border ${
                  initialLiquidity === 10000 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                    : 'bg-white/5 border-border hover:bg-white/10'
                }`}
              >
                <div className="text-lg font-bold font-mono">10K</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Équilibré</div>
              </button>
              <button
                type="button"
                onClick={() => setInitialLiquidity(20000)}
                className={`p-3 rounded-lg text-center transition-all border ${
                  initialLiquidity === 20000 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                    : 'bg-white/5 border-border hover:bg-white/10'
                }`}
              >
                <div className="text-lg font-bold font-mono">20K</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Stable</div>
              </button>
              <button
                type="button"
                onClick={() => setInitialLiquidity(50000)}
                className={`p-3 rounded-lg text-center transition-all border ${
                  initialLiquidity === 50000 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' 
                    : 'bg-white/5 border-border hover:bg-white/10'
                }`}
              >
                <div className="text-lg font-bold font-mono">50K</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Pro</div>
              </button>
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Personnalisé:</span>
              <input
                type="number"
                value={initialLiquidity}
                onChange={(e) => setInitialLiquidity(Math.max(100, parseInt(e.target.value) || 1000))}
                min="100"
                className="w-32 bg-white/5 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-all font-mono text-sm"
              />
            </div>

            {/* Dynamic explanation based on selected liquidity */}
            <div className="p-3 rounded-lg bg-white/5 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Volatilité:</span>
                <span className={`font-bold ${
                  initialLiquidity <= 5000 ? 'text-amber-400' :
                  initialLiquidity <= 10000 ? 'text-emerald-400' :
                  initialLiquidity <= 20000 ? 'text-blue-400' : 'text-purple-400'
                }`}>
                  {initialLiquidity <= 5000 ? 'Haute (fun)' :
                   initialLiquidity <= 10000 ? 'Moyenne' :
                   initialLiquidity <= 20000 ? 'Basse' : 'Très basse'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mise max/joueur:</span>
                <span className="font-mono font-bold text-white">
                  ~{Math.floor(initialLiquidity * (marketType === 'binary' ? 0.15 : 0.20) / 0.95).toLocaleString('fr-FR')} Zeny
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mouvement proba (1K bet):</span>
                <span className="font-mono font-bold text-white">
                  ~{marketType === 'binary' 
                    ? Math.round((950 / (initialLiquidity * 2)) * 100)
                    : Math.round((950 / (initialLiquidity * 2.5)) * 100)
                  }%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Binaire:</strong> Liquidité répartie OUI/NON selon proba initiale. 
              <strong> Multi:</strong> Contrôle la volatilité des cotes. 
              <strong> Recommandé pour 30-50 joueurs:</strong> 5K-10K.
            </p>
          </div>
        </div>

        {/* 4. Probabilités & Réponses */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <List className="w-4 h-4 text-primary" />
            {marketType === 'binary' ? 'Probabilité Initiale' : 'Réponses Possibles'}
          </h2>

          {marketType === 'binary' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">OUI : {binaryProb}%</span>
                <span className="font-bold text-rose-400">NON : {100 - binaryProb}%</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="99" 
                value={binaryProb} 
                onChange={(e) => setBinaryProb(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-muted-foreground text-center">
                Ajustez la probabilité de départ. Le NON est calculé automatiquement.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {multiOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input 
                    type="text"
                    value={outcome.name}
                    onChange={(e) => updateMultiOutcome(idx, 'name', e.target.value)}
                    placeholder={`Réponse ${idx + 1}`}
                    className="flex-1 bg-white/5 border border-border rounded-lg px-4 py-2 outline-none focus:border-primary/50 transition-all"
                    required
                  />
                  <div className="w-24 relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    <input 
                      type="number"
                      value={outcome.probability}
                      onChange={(e) => updateMultiOutcome(idx, 'probability', parseFloat(e.target.value))}
                      className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 text-right"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                  <input 
                    type="color"
                    value={outcome.color}
                    onChange={(e) => updateMultiOutcome(idx, 'color', e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border-0 p-0 cursor-pointer shrink-0"
                  />
                  {multiOutcomes.length > 2 && (
                    <button 
                      type="button"
                      onClick={() => removeMultiOutcome(idx)}
                      className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                onClick={addMultiOutcome}
                className="w-full py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Ajouter une réponse
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg font-medium hover:bg-white/5 transition-all"
          >
            Annuler
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Créer l'Event
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
