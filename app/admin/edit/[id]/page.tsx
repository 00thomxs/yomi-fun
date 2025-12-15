"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { updateMarket } from "@/app/admin/actions"
import { 
  Calendar, 
  Type, 
  Image as ImageIcon, 
  Star, 
  PieChart, 
  Coins, 
  ArrowLeft, 
  Save, 
  Loader2,
  Trophy,
  AlertTriangle,
  Lock
} from "lucide-react"
import Link from "next/link"
import { MARKET_CATEGORIES } from "@/lib/constants"

type MarketData = {
  id: string
  question: string
  description: string | null
  category: string
  image_url: string | null
  closes_at: string
  is_featured: boolean
  is_headline: boolean
  is_live: boolean
  status: string
  type: string
  volume: number
  pool_yes: number
  pool_no: number
  season_id: string | null
  season?: { id: string; name: string } | null
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default function EditMarketPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [marketId, setMarketId] = useState<string | null>(null)
  const [market, setMarket] = useState<MarketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [question, setQuestion] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isHeadline, setIsHeadline] = useState(false)
  
  // Load params
  useEffect(() => {
    params.then(p => setMarketId(p.id))
  }, [params])

  // Fetch market data
  useEffect(() => {
    if (!marketId) return
    
    const fetchMarket = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('markets')
        .select(`
          *,
          season:seasons!season_id (id, name)
        `)
        .eq('id', marketId)
        .single()
      
      if (error || !data) {
        toast({
          title: "Erreur",
          description: "Market introuvable",
          variant: "destructive"
        })
        router.push('/admin')
        return
      }
      
      setMarket(data)
      setQuestion(data.question)
      setDescription(data.description || "")
      setCategory(data.category)
      setImageUrl(data.image_url || "")
      setIsFeatured(data.is_featured || false)
      setIsHeadline(data.is_headline || false)
      
      // Format date for datetime-local input
      const date = new Date(data.closes_at)
      const localString = date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + 'T' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0')
      setClosesAt(localString)
      
      setIsLoading(false)
    }
    
    fetchMarket()
  }, [marketId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!market) return
    
    setIsSaving(true)
    
    const formData = new FormData()
    formData.append('id', market.id)
    formData.append('question', question)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('imageUrl', imageUrl)
    formData.append('isFeatured', isFeatured ? 'true' : 'false')
    formData.append('isHeadline', isHeadline ? 'true' : 'false')
    
    // Only update closes_at if not linked to a season
    if (!market.season_id) {
      const localDate = new Date(closesAt)
      formData.append('closesAt', localDate.toISOString())
    }
    
    const result = await updateMarket(formData)
    
    if (result.error) {
      toast({
        title: "Erreur",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Succès",
        description: result.message
      })
      router.push('/admin')
    }
    
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!market) {
    return null
  }

  const isResolved = market.status === 'resolved'
  const hasSeasonLink = !!market.season_id

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2.5 rounded-lg bg-card border border-border hover:border-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier l'Event</h1>
          <p className="text-muted-foreground mt-1">
            ID: {market.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Status Warnings */}
      {isResolved && (
        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-amber-400">Event Résolu</p>
            <p className="text-xs text-muted-foreground">
              Cet event a été résolu. Seules certaines modifications sont autorisées.
            </p>
          </div>
        </div>
      )}

      {hasSeasonLink && (
        <div className="rounded-xl p-4 bg-primary/10 border border-primary/30 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="font-bold text-primary">Lié à une Saison</p>
            <p className="text-xs text-muted-foreground">
              Cet event fait partie de "{market.season?.name}". La date de fin ne peut pas être modifiée.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            Informations
          </h2>
          
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Question
            </label>
            <input 
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Squeezie va-t-il gagner ?"
              className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Description (Optionnel)
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires..."
              className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Catégorie
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
              >
                {MARKET_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Image URL
              </label>
              <input 
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Date de fin */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Date de Fin
            {hasSeasonLink && <Lock className="w-3 h-3 text-muted-foreground" />}
          </h2>
          
          <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input 
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                disabled={hasSeasonLink}
                className={`w-full bg-white/5 border border-border rounded-lg pl-11 pr-4 py-3 outline-none focus:border-primary/50 transition-all appearance-none text-white scheme-dark ${
                  hasSeasonLink ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                required
              />
            </div>
            {hasSeasonLink && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                La date ne peut pas être modifiée car l'event est lié à une saison.
              </p>
            )}
            {!hasSeasonLink && (
              <p className="text-xs text-muted-foreground">
                Modifier cette date mettra à jour la clôture automatique de l'event.
              </p>
            )}
          </div>
        </div>

        {/* Options de mise en avant */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Mise en Avant
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="flex-1">
                <label htmlFor="isFeatured" className="text-sm font-medium cursor-pointer select-none">
                  Trending
                </label>
                <p className="text-xs text-muted-foreground">Onglet "Trending"</p>
              </div>
              <input 
                type="checkbox" 
                id="isFeatured" 
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary/50"
              />
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label htmlFor="isHeadline" className="text-sm font-medium cursor-pointer select-none">
                  A la Une
                </label>
                <p className="text-xs text-muted-foreground">Grande image</p>
              </div>
              <input 
                type="checkbox" 
                id="isHeadline" 
                checked={isHeadline}
                onChange={(e) => setIsHeadline(e.target.checked)}
                className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Informations (lecture seule) */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            Informations (lecture seule)
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
              <p className="font-bold">{market.type === 'binary' ? 'Binaire (Oui/Non)' : 'Choix Multiple'}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
              <p className="font-bold capitalize">{market.status}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volume</p>
              <p className="font-bold font-mono">{market.volume?.toLocaleString() || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Liquidité Pools</p>
              <p className="font-bold font-mono text-sm">
                OUI: {market.pool_yes?.toLocaleString() || 0} / NON: {market.pool_no?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Pour ajuster la liquidité, utilisez le compte admin pour placer des paris sur l'event.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-between gap-4 pt-4">
          <Link 
            href="/admin"
            className="px-6 py-3 rounded-lg font-medium hover:bg-white/5 transition-all"
          >
            Annuler
          </Link>
          <button 
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

