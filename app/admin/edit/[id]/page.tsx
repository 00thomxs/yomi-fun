"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { updateMarket } from "@/app/admin/actions"
import { getAdminMarketTopBets, type AdminMarketTopBet } from "@/app/admin/actions"
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
  Lock,
  Users,
  TrendingUp,
  BarChart3,
  Target
} from "lucide-react"
import Link from "next/link"
import { MARKET_CATEGORIES } from "@/lib/constants"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const CHART_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6']

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
  initial_liquidity: number
  season_id: string | null
  season?: { id: string; name: string } | null
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default function EditMarketPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()

  const WHALE_BET_THRESHOLD = 10000
  
  const [marketId, setMarketId] = useState<string | null>(null)
  const [market, setMarket] = useState<MarketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Admin stats (top bets)
  const [topBets, setTopBets] = useState<AdminMarketTopBet[]>([])
  const [totalBetsCount, setTotalBetsCount] = useState<number>(0)
  const [loadingTopBets, setLoadingTopBets] = useState(false)
  
  // Extended stats
  const [allBets, setAllBets] = useState<any[]>([])
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [loadingExtendedStats, setLoadingExtendedStats] = useState(false)
  
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

  // Fetch top bets (admin)
  useEffect(() => {
    if (!marketId) return
    let isMounted = true

    const fetchTopBets = async () => {
      setLoadingTopBets(true)
      const res = await getAdminMarketTopBets(marketId)
      if (!isMounted) return

      if (res.error) {
        // Silent fail (admin only), but show toast for feedback
        toast({
          title: "Erreur",
          description: res.error,
          variant: "destructive",
        })
      } else {
        setTopBets(res.topBets || [])
        setTotalBetsCount(res.totalBets || 0)
      }
      setLoadingTopBets(false)
    }

    fetchTopBets()
    return () => {
      isMounted = false
    }
  }, [marketId, toast])

  // Fetch extended stats (all bets + outcomes)
  useEffect(() => {
    if (!marketId) return
    let isMounted = true

    const fetchExtendedStats = async () => {
      setLoadingExtendedStats(true)
      const supabase = createClient()
      
      // Fetch all bets for this market
      const { data: betsData } = await supabase
        .from('bets')
        .select('id, user_id, amount, outcome_id, direction, status, created_at')
        .eq('market_id', marketId)
        .order('created_at', { ascending: true })
      
      // Fetch outcomes
      const { data: outcomesData } = await supabase
        .from('outcomes')
        .select('*')
        .eq('market_id', marketId)
      
      if (!isMounted) return
      
      setAllBets(betsData || [])
      setOutcomes(outcomesData || [])
      setLoadingExtendedStats(false)
    }

    fetchExtendedStats()
    return () => { isMounted = false }
  }, [marketId])

  // Computed stats
  const extendedStats = useMemo(() => {
    if (allBets.length === 0) return null

    const uniqueBettors = new Set(allBets.map(b => b.user_id)).size
    const avgBetSize = Math.round(allBets.reduce((sum, b) => sum + b.amount, 0) / allBets.length)
    const medianBetSize = (() => {
      const sorted = [...allBets].sort((a, b) => a.amount - b.amount)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 ? sorted[mid].amount : Math.round((sorted[mid - 1].amount + sorted[mid].amount) / 2)
    })()

    // Whale concentration (top 3 bettors' volume)
    const volumeByUser = allBets.reduce((acc, b) => {
      acc[b.user_id] = (acc[b.user_id] || 0) + b.amount
      return acc
    }, {} as Record<string, number>)
    const sortedUsers = Object.entries(volumeByUser).sort(([, a], [, b]) => (b as number) - (a as number))
    const top3Volume = sortedUsers.slice(0, 3).reduce((sum, [, vol]) => sum + (vol as number), 0)
    const totalVolume = allBets.reduce((sum, b) => sum + b.amount, 0)
    const whaleConcentration = totalVolume > 0 ? Math.round((top3Volume / totalVolume) * 100) : 0

    // Distribution by outcome
    const outcomeDistribution = outcomes.map(o => {
      const outcomeBets = allBets.filter(b => b.outcome_id === o.id)
      return {
        name: o.name,
        value: outcomeBets.reduce((sum, b) => sum + b.amount, 0),
        count: outcomeBets.length
      }
    }).filter(o => o.value > 0)

    // YES/NO distribution for binary
    const yesNoBets = {
      yes: allBets.filter(b => b.direction === 'YES' || (!b.direction && outcomes.find(o => o.id === b.outcome_id)?.name?.toLowerCase() === 'oui')),
      no: allBets.filter(b => b.direction === 'NO' || (!b.direction && outcomes.find(o => o.id === b.outcome_id)?.name?.toLowerCase() === 'non'))
    }
    const yesVolume = yesNoBets.yes.reduce((sum, b) => sum + b.amount, 0)
    const noVolume = yesNoBets.no.reduce((sum, b) => sum + b.amount, 0)

    // Betting timing (by hour)
    const betsByHour = allBets.reduce((acc, b) => {
      const hour = new Date(b.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    const peakHour = Object.entries(betsByHour).sort(([, a], [, b]) => (b as number) - (a as number))[0]

    // Risk/Exposure calculation (payout if each outcome wins)
    const exposureByOutcome = outcomes.map(o => {
      const outcomeBets = topBets.filter(b => b.outcome_id === o.id)
      const totalPayout = outcomeBets.reduce((sum, b) => sum + b.potential_payout, 0)
      return { name: o.name, exposure: totalPayout }
    })

    return {
      uniqueBettors,
      avgBetSize,
      medianBetSize,
      whaleConcentration,
      outcomeDistribution,
      yesVolume,
      noVolume,
      peakHour: peakHour ? { hour: Number(peakHour[0]), count: peakHour[1] as number } : null,
      exposureByOutcome
    }
  }, [allBets, outcomes, topBets])

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

  const getStatusBadge = (status: string) => {
    if (status === 'won') return { label: 'GAGNÉ', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    if (status === 'lost') return { label: 'PERDU', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    if (status === 'cancelled') return { label: 'ANNULÉ', cls: 'bg-white/10 text-white/70 border-white/10' }
    return { label: 'PENDING', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
  }

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
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {market.type === 'binary' ? 'Liquidité Pools' : 'Flux OUI/NON (direction)'}
              </p>
              <p className="font-bold font-mono text-sm">
                OUI: {market.pool_yes?.toLocaleString() || 0} / NON: {market.pool_no?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {market.type === 'binary'
              ? "💡 Pour ajuster la liquidité, utilisez le compte admin pour placer des paris sur l'event."
              : "💡 Multi-choix : ces pools ne pilotent pas le prix, ils servent à suivre le flux OUI/NON (direction) pour détecter un déséquilibre."
            }
          </p>
        </div>

        {/* Extended Stats */}
        {extendedStats && (
          <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Statistiques Avancées
            </h2>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                  <Users className="w-3 h-3" /> Parieurs Uniques
                </div>
                <p className="text-xl font-bold">{extendedStats.uniqueBettors}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                  <Target className="w-3 h-3" /> Mise Moyenne
                </div>
                <p className="text-xl font-bold flex items-center gap-0.5">
                  {extendedStats.avgBetSize.toLocaleString()}<CurrencySymbol className="w-4 h-4" />
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                  <TrendingUp className="w-3 h-3" /> Mise Médiane
                </div>
                <p className="text-xl font-bold flex items-center gap-0.5">
                  {extendedStats.medianBetSize.toLocaleString()}<CurrencySymbol className="w-4 h-4" />
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> Top 3 = Volume
                </div>
                <p className={`text-xl font-bold ${extendedStats.whaleConcentration > 50 ? 'text-amber-400' : ''}`}>
                  {extendedStats.whaleConcentration}%
                </p>
              </div>
            </div>

            {/* Pie Chart + YES/NO Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distribution by Outcome */}
              {extendedStats.outcomeDistribution.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-border">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Volume par Choix</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={extendedStats.outcomeDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {extendedStats.outcomeDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value: number) => [`${value.toLocaleString()} Zeny`, 'Volume']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-3">
                {/* YES/NO Bar for Binary */}
                {market?.type === 'binary' && (extendedStats.yesVolume > 0 || extendedStats.noVolume > 0) && (
                  <div className="p-4 rounded-lg bg-white/5 border border-border">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">OUI vs NON</h4>
                    <div className="flex h-6 rounded-lg overflow-hidden">
                      <div 
                        className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ width: `${(extendedStats.yesVolume / (extendedStats.yesVolume + extendedStats.noVolume)) * 100}%` }}
                      >
                        {extendedStats.yesVolume > 0 && `OUI ${Math.round((extendedStats.yesVolume / (extendedStats.yesVolume + extendedStats.noVolume)) * 100)}%`}
                      </div>
                      <div 
                        className="bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ width: `${(extendedStats.noVolume / (extendedStats.yesVolume + extendedStats.noVolume)) * 100}%` }}
                      >
                        {extendedStats.noVolume > 0 && `NON ${Math.round((extendedStats.noVolume / (extendedStats.yesVolume + extendedStats.noVolume)) * 100)}%`}
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{extendedStats.yesVolume.toLocaleString()} Zeny</span>
                      <span>{extendedStats.noVolume.toLocaleString()} Zeny</span>
                    </div>
                  </div>
                )}

                {/* Peak Hour */}
                {extendedStats.peakHour && (
                  <div className="p-4 rounded-lg bg-white/5 border border-border">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Heure de Pointe</h4>
                    <p className="text-lg font-bold">
                      {extendedStats.peakHour.hour}h00 - {(extendedStats.peakHour.hour + 1) % 24}h00
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {extendedStats.peakHour.count} paris placés à cette heure
                    </p>
                  </div>
                )}

                {/* Whale Alert */}
                {extendedStats.whaleConcentration > 60 && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-bold text-sm">Concentration élevée</span>
                    </div>
                    <p className="text-xs text-amber-400/80 mt-1">
                      Les 3 plus gros parieurs représentent {extendedStats.whaleConcentration}% du volume.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top 10 Biggest Bets */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Top 10 plus gros paris
            </h2>
            <div className="text-xs text-muted-foreground">
              Total bets: <span className="font-mono font-bold text-white/80">{totalBetsCount}</span>
              {totalBetsCount > 0 && (
                <>
                  <span className="text-muted-foreground"> • </span>
                  Moyenne:{" "}
                  <span className="font-mono font-bold text-white/80">
                    {Math.round((market.volume || 0) / Math.max(1, totalBetsCount)).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                Whale
              </span>
              = pari ≥ <span className="font-mono font-bold text-white/80">{WHALE_BET_THRESHOLD.toLocaleString()}</span>
            </span>
          </div>

          {loadingTopBets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : topBets.length === 0 ? (
            <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground italic">
              Aucun pari pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {topBets.map((b, idx) => {
                const dirLabel = b.direction === 'NO' ? 'NON' : 'OUI'
                const choiceLabel = market.type === 'binary'
                  ? b.outcome?.name
                  : `${dirLabel} ${b.outcome?.name}`
                const isWhale = b.amount >= WHALE_BET_THRESHOLD
                const status = getStatusBadge(b.status)

                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">
                        #{idx + 1}
                      </span>
                      <img
                        src={b.user.avatar_url || "/images/default-avatar.svg"}
                        alt={b.user.username || "User"}
                        className="w-8 h-8 rounded-full object-cover bg-white/5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {b.user.username || `User ${b.user.id?.slice(0, 4)}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Choix: <span className="font-mono text-white/80">{choiceLabel}</span> •{" "}
                          {new Date(b.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        {isWhale && (
                          <span className="px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                            Whale
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm font-black font-mono text-amber-400">
                        {b.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        x{Number(b.odds_at_bet).toFixed(2)} → {b.potential_payout.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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

